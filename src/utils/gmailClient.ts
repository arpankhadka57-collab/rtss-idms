import { EmailMessage, EmailFileAttachment, SystemReportAttachment } from '../types';

export interface EmailCounts {
  total: number;
  primary: number;
  secondary: number;
  inbox: number;
  sent: number;
  starred: number;
  unreadPrimary: number;
  unreadSecondary: number;
  unreadTotal: number;
}

export interface FetchEmailsResponse {
  success: boolean;
  emails: EmailMessage[];
  counts: EmailCounts;
  error?: string;
}

export interface SendEmailPayload {
  recipientEmail: string;
  recipientName?: string;
  cc?: string;
  bcc?: string;
  subject: string;
  message: string;
  htmlContent?: string;
  emailType?: string;
  senderChoice?: 'auto' | 'primary' | 'secondary' | string;
  fileAttachments?: EmailFileAttachment[];
  systemReports?: SystemReportAttachment[];
  bsDate?: string;
}

export async function fetchEmailsApi(params?: {
  account?: string;
  folder?: string;
  starred?: boolean;
  search?: string;
}): Promise<FetchEmailsResponse> {
  try {
    const query = new URLSearchParams();
    if (params?.account && params.account !== 'all') {
      query.set('account', params.account);
    }
    if (params?.folder && params.folder !== 'all') {
      query.set('folder', params.folder);
    }
    if (params?.starred) {
      query.set('starred', 'true');
    }
    if (params?.search) {
      query.set('search', params.search);
    }

    const res = await fetch(`/api/emails?${query.toString()}`);
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('Error in fetchEmailsApi:', err);
    return {
      success: false,
      emails: [],
      counts: {
        total: 0,
        primary: 0,
        secondary: 0,
        inbox: 0,
        sent: 0,
        starred: 0,
        unreadPrimary: 0,
        unreadSecondary: 0,
        unreadTotal: 0
      },
      error: err.message || 'Failed to fetch emails'
    };
  }
}

export async function sendEmailApi(payload: SendEmailPayload): Promise<{
  success: boolean;
  message?: string;
  email?: any;
  error?: string;
}> {
  try {
    const res = await fetch('/api/emails/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP error ${res.status}`);
    }
    return data;
  } catch (err: any) {
    console.error('Error in sendEmailApi:', err);
    return { success: false, error: err.message || 'Failed to dispatch email' };
  }
}

export async function updateEmailApi(id: string, updates: {
  isRead?: boolean;
  isStarred?: boolean;
  folder?: string;
}): Promise<boolean> {
  try {
    const res = await fetch(`/api/emails/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.error('Error in updateEmailApi:', err);
    return false;
  }
}

export async function deleteEmailApi(id: string, permanent: boolean = false): Promise<boolean> {
  try {
    const res = await fetch(`/api/emails/${encodeURIComponent(id)}?permanent=${permanent ? 'true' : 'false'}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.error('Error in deleteEmailApi:', err);
    return false;
  }
}

export interface SyncApiResponse {
  success: boolean;
  timestamp?: string;
  totalNew?: number;
  accounts?: Array<{
    account: string;
    success: boolean;
    fetchedCount: number;
    newCount: number;
    error?: string;
  }>;
  message?: string;
  error?: string;
}

export async function syncEmailsApi(): Promise<SyncApiResponse> {
  try {
    const res = await fetch('/api/emails/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('Error in syncEmailsApi:', err);
    return {
      success: false,
      message: err.message || 'Direct Gmail sync failed'
    };
  }
}

export async function getSyncStatusApi(): Promise<{ lastSyncTime: string; isSyncInProgress: boolean }> {
  try {
    const res = await fetch('/api/emails/sync-status');
    return await res.json();
  } catch (err) {
    return { lastSyncTime: 'Unknown', isSyncInProgress: false };
  }
}

