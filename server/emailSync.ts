import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import dotenv from 'dotenv';
import { saveEmailToDB, getSQLiteDatabase, EmailRecord } from './database';

dotenv.config();

export interface AccountSyncResult {
  account: string;
  success: boolean;
  fetchedCount: number;
  newCount: number;
  error?: string;
}

export interface DirectSyncSummary {
  success: boolean;
  timestamp: string;
  totalNew: number;
  accounts: AccountSyncResult[];
  message: string;
}

let lastSyncTime: string = 'Never';
let isSyncInProgress = false;

/**
 * Connects directly to Gmail IMAP server (imap.gmail.com:993) using secure SSL
 * and retrieves inbox messages for the specified account.
 */
export async function syncGmailAccount(
  accountEmail: string,
  appPassword?: string
): Promise<AccountSyncResult> {
  const cleanEmail = (accountEmail || '').trim();
  const cleanPass = (appPassword || '').trim().replace(/\s+/g, '');

  if (!cleanEmail) {
    return { account: accountEmail, success: false, fetchedCount: 0, newCount: 0, error: 'Email address is missing' };
  }

  if (!cleanPass) {
    console.warn(`[GmailSync] Missing App Password for ${cleanEmail}. Skipping IMAP connection.`);
    return { account: cleanEmail, success: false, fetchedCount: 0, newCount: 0, error: 'App Password not configured' };
  }

  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: cleanEmail,
      pass: cleanPass
    },
    logger: false,
    emitLogs: false,
    clientInfo: {
      name: 'ReliableTech IMAP Client',
      version: '1.0.0'
    }
  });

  let fetchedCount = 0;
  let newCount = 0;

  try {
    // 1. Connect
    await client.connect();

    // 2. Open INBOX in read-only mode so we don't accidentally alter unread flags unless desired
    const lock = await client.getMailboxLock('INBOX');

    try {
      const mailbox = client.mailbox;
      const totalMessages = (mailbox && typeof mailbox === 'object' && 'exists' in mailbox) ? Number(mailbox.exists) : 0;

      if (totalMessages > 0) {
        // Fetch up to the last 30 messages
        const fetchRangeStart = Math.max(1, totalMessages - 29);
        const fetchRange = `${fetchRangeStart}:*`;

        const messagesGenerator = client.fetch(fetchRange, {
          uid: true,
          flags: true,
          envelope: true,
          source: true
        });

        for await (const msg of messagesGenerator) {
          fetchedCount++;
          try {
            if (!msg.source) continue;

            const parsed = await simpleParser(msg.source);
            const msgId = parsed.messageId || `msg_${cleanEmail}_${msg.uid || msg.seq}`;
            const internalId = `eml_imap_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}_${msg.uid || msg.seq}`;

            // Check if already in SQLite DB
            const db = await getSQLiteDatabase();
            const existingStmt = db.prepare("SELECT id FROM emails WHERE id = ? OR messageId = ? LIMIT 1");
            existingStmt.bind([internalId, msgId]);
            const exists = existingStmt.step();
            existingStmt.free();

            if (exists) {
              continue;
            }

            // Extract senders and recipients
            const fromAddr = parsed.from?.value?.[0]?.address || cleanEmail;
            const fromName = parsed.from?.value?.[0]?.name || parsed.from?.text || fromAddr;
            const toAddr = parsed.to ? (Array.isArray(parsed.to) ? parsed.to[0]?.value?.[0]?.address : parsed.to.value?.[0]?.address) : cleanEmail;
            const toName = parsed.to ? (Array.isArray(parsed.to) ? parsed.to[0]?.value?.[0]?.name : parsed.to.value?.[0]?.name) : (cleanEmail.includes('donotreply') ? 'RTSS System' : 'ReliableTech');

            // Format attachments
            const fileAttachments = (parsed.attachments || []).map((att, attIdx) => {
              const base64Data = att.content ? `data:${att.contentType};base64,${att.content.toString('base64')}` : '';
              return {
                id: `att_${internalId}_${attIdx}`,
                name: att.filename || `Attachment_${attIdx + 1}`,
                size: att.size || (att.content ? att.content.length : 0),
                type: att.contentType || 'application/octet-stream',
                url: base64Data,
                uploadedAt: new Date().toLocaleDateString()
              };
            });

            const emailRecord: EmailRecord = {
              id: internalId,
              threadId: internalId,
              account: cleanEmail,
              sender: `"${fromName}" <${fromAddr}>`,
              senderEmail: fromAddr,
              senderName: fromName,
              recipientEmail: toAddr || cleanEmail,
              recipientName: toName || 'ReliableTech Admin',
              subject: parsed.subject || '(No Subject)',
              snippet: (parsed.text || parsed.subject || '').substring(0, 160).replace(/\s+/g, ' ').trim(),
              body: parsed.text || '',
              html: typeof parsed.html === 'string' ? parsed.html : undefined,
              date: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
              dateFormatted: parsed.date
                ? parsed.date.toLocaleString('en-US', { timeZone: 'Asia/Kathmandu' })
                : new Date().toLocaleString('en-US', { timeZone: 'Asia/Kathmandu' }),
              folder: 'inbox',
              isRead: msg.flags?.has('\\Seen') ?? false,
              isStarred: msg.flags?.has('\\Flagged') ?? false,
              tags: '["Inbox", "Gmail Direct Sync"]',
              fileAttachments: fileAttachments,
              systemReports: [],
              messageId: msgId
            };

            await saveEmailToDB(emailRecord);
            newCount++;
          } catch (parseErr) {
            console.error(`[GmailSync] Error parsing message ${msg.seq} for ${cleanEmail}:`, parseErr);
          }
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
    return {
      account: cleanEmail,
      success: true,
      fetchedCount,
      newCount
    };
  } catch (err: any) {
    console.error(`[GmailSync] IMAP sync failed for ${cleanEmail}:`, err.message || err);
    try {
      await client.logout();
    } catch (_) {}
    return {
      account: cleanEmail,
      success: false,
      fetchedCount,
      newCount,
      error: err.message || 'IMAP connection error'
    };
  }
}

/**
 * Synchronizes BOTH accounts with Gmail directly:
 * Account 1: donotreply.rtss@gmail.com
 * Account 2: reliabletechss.fikkal@gmail.com
 */
export async function syncAllConfiguredGmailAccounts(): Promise<DirectSyncSummary> {
  if (isSyncInProgress) {
    return {
      success: true,
      timestamp: lastSyncTime,
      totalNew: 0,
      accounts: [],
      message: 'Sync is currently in progress. Please wait.'
    };
  }

  isSyncInProgress = true;
  const accountsResult: AccountSyncResult[] = [];
  let totalNew = 0;

  try {
    const primaryEmail = (process.env.EMAIL_USER_2 || 'donotreply.rtss@gmail.com').trim();
    const primaryPass = (process.env.EMAIL_APP_PASS_2 || process.env.EMAIL_APP_PASS_1 || process.env.EMAIL_APP_PASS || '').trim();

    const secondaryEmail = (process.env.EMAIL_USER_1 || 'reliabletechss.fikkal@gmail.com').trim();
    const secondaryPass = (process.env.EMAIL_APP_PASS_1 || process.env.EMAIL_APP_PASS_2 || process.env.EMAIL_APP_PASS || '').trim();

    // 1. Sync Primary Account
    const resPrimary = await syncGmailAccount(primaryEmail, primaryPass);
    accountsResult.push(resPrimary);
    totalNew += resPrimary.newCount;

    // 2. Sync Secondary Account
    const resSecondary = await syncGmailAccount(secondaryEmail, secondaryPass);
    accountsResult.push(resSecondary);
    totalNew += resSecondary.newCount;

    lastSyncTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kathmandu' });

    return {
      success: true,
      timestamp: lastSyncTime,
      totalNew,
      accounts: accountsResult,
      message: `Direct Gmail Sync Completed. ${totalNew} new emails received into inbox.`
    };
  } catch (err: any) {
    console.error('[GmailSync] Overall sync failed:', err);
    return {
      success: false,
      timestamp: lastSyncTime,
      totalNew,
      accounts: accountsResult,
      message: err.message || 'Gmail sync encountered an error'
    };
  } finally {
    isSyncInProgress = false;
  }
}

export function getLastSyncStatus() {
  return {
    lastSyncTime,
    isSyncInProgress
  };
}
