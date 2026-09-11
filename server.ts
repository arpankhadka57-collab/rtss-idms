import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { getSQLiteDatabase, isDatabaseConnected, loadFullDatabaseFromSQLite, saveFullDatabaseToSQLite, uploadDatabaseBuffer, saveDatabaseToDisk, getEmailsFromDB, updateEmailInDB, deleteEmailFromDB, saveEmailToDB } from "./server/database";
import { 
  generateAndSendOtp, 
  verifyOtpCode, 
  getEmailQuotaStatus, 
  getEmailDispatchLogs,
  sendOrderStatusNotification, 
  sendCustomerPasswordResetEmail,
  sendSystemTestEmail,
  sendCustomEmail,
  getActiveEmailConfig,
  saveEmailConfiguration
} from "./server/emailService";
import { syncAllConfiguredGmailAccounts, getLastSyncStatus } from "./server/emailSync";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// OTP Verification & Email Dispatch Endpoints
app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { email, purpose, username, name } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email address is required to send OTP." });
    }

    const recipientName = name || username || (email.includes('@') ? email.split('@')[0] : 'User');
    const result = await generateAndSendOtp(email, purpose || 'Login', recipientName);
    res.json({
      success: true,
      message: `Verification code sent to ${result.emailMasked}. Valid for 5 minutes.`,
      emailMasked: result.emailMasked,
      expiresInSeconds: result.expiresInSeconds,
      sender: result.sender
    });
  } catch (err: any) {
    console.error("[API] Failed to send OTP:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message || "Failed to dispatch verification OTP to email." 
    });
  }
});

app.post("/api/auth/verify-otp", (req, res) => {
  try {
    const { email, otp, purpose } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required." });
    }

    const result = verifyOtpCode(email, otp);
    if (result.verified) {
      res.json({ success: true, verified: true, message: result.message });
    } else {
      res.status(400).json({ success: false, verified: false, error: result.message });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || "Error verifying OTP" });
  }
});

app.get("/api/auth/email-quota", (req, res) => {
  try {
    const status = getEmailQuotaStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to get email quota status" });
  }
});

app.get("/api/system/email-quota", (req, res) => {
  try {
    const status = getEmailQuotaStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to get email quota status" });
  }
});

app.get("/api/system/email-config", (req, res) => {
  try {
    const config = getActiveEmailConfig();
    const hasPrimaryEnvPass = Boolean(process.env.EMAIL_APP_PASS_2 || process.env.EMAIL_APP_PASS_1 || process.env.EMAIL_APP_PASS || process.env.GMAIL_APP_PASSWORD);
    const hasSecondaryEnvPass = Boolean(process.env.EMAIL_APP_PASS_1 || process.env.EMAIL_APP_PASS_2 || process.env.EMAIL_APP_PASS || process.env.GMAIL_APP_PASSWORD);
    res.json({
      success: true,
      config: {
        primaryEmail: config.primaryEmail,
        hasPrimaryPass: hasPrimaryEnvPass,
        secondaryEmail: config.secondaryEmail,
        hasSecondaryPass: hasSecondaryEnvPass,
        mode: config.mode
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to get email config" });
  }
});

app.post("/api/system/email-config", async (req, res) => {
  try {
    const { primaryEmail, secondaryEmail, mode } = req.body;
    const updated = await saveEmailConfiguration({
      primaryEmail,
      secondaryEmail,
      mode
    });
    const quotaStatus = getEmailQuotaStatus();
    res.json({
      success: true,
      message: "Email dispatcher routing saved successfully",
      config: {
        primaryEmail: updated.primaryEmail,
        secondaryEmail: updated.secondaryEmail,
        mode: updated.mode,
        hasPrimaryPass: Boolean(process.env.EMAIL_APP_PASS_2 || process.env.EMAIL_APP_PASS || process.env.GMAIL_APP_PASSWORD),
        hasSecondaryPass: Boolean(process.env.EMAIL_APP_PASS_1 || process.env.EMAIL_APP_PASS || process.env.GMAIL_APP_PASSWORD)
      },
      quotaStatus
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to save email config" });
  }
});

app.post("/api/system/send-custom-email", async (req, res) => {
  try {
    const { recipientEmail, recipientName, subject, message, htmlContent, emailType, senderChoice } = req.body;
    if (!recipientEmail || !recipientEmail.includes('@')) {
      return res.status(400).json({ error: "Valid recipient email address is required." });
    }
    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: "Email subject line is required." });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Email message body is required." });
    }

    const result = await sendCustomEmail({
      recipientEmail,
      recipientName: recipientName || 'Valued Recipient',
      subject: subject.trim(),
      message: message.trim(),
      htmlContent,
      emailType: emailType || 'Custom Dispatch',
      senderChoice: senderChoice || 'auto'
    });

    res.json({
      success: true,
      message: `Email successfully sent to ${result.recipient} via ${result.sender}`,
      sender: result.sender,
      recipient: result.recipient,
      subject: result.subject,
      messageId: result.messageId
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to dispatch custom email" });
  }
});

app.get("/api/system/email-dispatch-logs", (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 200;
    const logs = getEmailDispatchLogs(limit);
    res.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to get email dispatch logs" });
  }
});

app.post("/api/system/send-test-email", async (req, res) => {
  try {
    const { recipientEmail, recipientName, testSubject, testMessage } = req.body;
    if (!recipientEmail || !recipientEmail.includes('@')) {
      return res.status(400).json({ error: "Valid recipient email is required." });
    }

    const result = await sendSystemTestEmail(
      recipientEmail, 
      recipientName || 'System Administrator', 
      testSubject, 
      testMessage
    );

    res.json({
      success: true,
      sender: result.sender,
      recipient: result.recipient,
      subject: result.subject,
      body: result.body,
      message: `Test email dispatched to ${result.recipient} via ${result.sender}`,
      messageId: result.messageId
    });
  } catch (err: any) {
    console.error("[API] Test email dispatch error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to send test email" });
  }
});

// ==========================================
// GMAIL & MULTI-ACCOUNT WEBMAIL API ROUTES
// ==========================================

app.get("/api/emails", async (req, res) => {
  try {
    const { account, folder, starred, search, limit } = req.query;
    const emails = await getEmailsFromDB({
      account: account as string,
      folder: folder as string,
      isStarred: starred === 'true',
      search: search as string,
      limit: limit ? parseInt(limit as string, 10) : 300
    });

    const allEmails = await getEmailsFromDB({ limit: 500 });
    const counts = {
      total: allEmails.length,
      primary: allEmails.filter(e => e.account.toLowerCase().includes('donotreply')).length,
      secondary: allEmails.filter(e => e.account.toLowerCase().includes('reliabletechss')).length,
      inbox: allEmails.filter(e => e.folder === 'inbox').length,
      sent: allEmails.filter(e => e.folder === 'sent').length,
      starred: allEmails.filter(e => e.isStarred).length,
      unreadPrimary: allEmails.filter(e => !e.isRead && e.account.toLowerCase().includes('donotreply')).length,
      unreadSecondary: allEmails.filter(e => !e.isRead && e.account.toLowerCase().includes('reliabletechss')).length,
      unreadTotal: allEmails.filter(e => !e.isRead).length
    };

    res.json({ success: true, emails, counts });
  } catch (err: any) {
    console.error("[API] Error fetching emails:", err);
    res.status(500).json({ error: err.message || "Failed to fetch emails" });
  }
});

app.post("/api/emails/sync", async (req, res) => {
  try {
    const summary = await syncAllConfiguredGmailAccounts();
    res.json(summary);
  } catch (err: any) {
    console.error("[API] Error syncing with Gmail:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to sync with Gmail" });
  }
});

app.get("/api/emails/sync-status", (req, res) => {
  res.json(getLastSyncStatus());
});

app.post("/api/emails/send", async (req, res) => {
  try {
    const {
      recipientEmail,
      recipientName,
      cc,
      bcc,
      subject,
      message,
      htmlContent,
      emailType,
      senderChoice,
      fileAttachments,
      systemReports,
      bsDate
    } = req.body;

    if (!recipientEmail || !recipientEmail.includes('@')) {
      return res.status(400).json({ error: "Valid recipient email is required." });
    }
    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: "Subject is required." });
    }

    const result = await sendCustomEmail({
      recipientEmail,
      recipientName: recipientName || (recipientEmail.split('@')[0]),
      cc,
      bcc,
      subject: subject.trim(),
      message: (message || '').trim(),
      htmlContent,
      emailType: emailType || 'Custom Communication',
      senderChoice: senderChoice || 'auto',
      fileAttachments: fileAttachments || [],
      systemReports: systemReports || [],
      bsDate
    });

    res.json({
      success: true,
      message: `Email dispatched to ${result.recipient} via ${result.sender}`,
      email: result
    });
  } catch (err: any) {
    console.error("[API] Error sending email:", err);
    res.status(500).json({ error: err.message || "Failed to send email" });
  }
});

app.patch("/api/emails/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { isRead, isStarred, folder } = req.body;
    const success = await updateEmailInDB(id, { isRead, isStarred, folder });
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update email" });
  }
});

app.delete("/api/emails/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const permanent = req.query.permanent === 'true';
    const success = await deleteEmailFromDB(id, permanent);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete email" });
  }
});


app.post("/api/orders/notify-status", async (req, res) => {
  try {
    const { customerEmail, customerName, orderId, orderStatus } = req.body;
    if (!customerEmail || !orderId || !orderStatus) {
      return res.status(400).json({ error: "customerEmail, orderId, and orderStatus are required." });
    }

    const result = await sendOrderStatusNotification(customerEmail, customerName || 'Valued Customer', orderId, orderStatus);
    res.json({ success: true, message: `Notification dispatched for order ${orderId}`, result });
  } catch (err: any) {
    console.error("[API] Order notification error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to send order status notification." });
  }
});

app.post("/api/auth/send-customer-reset-email", async (req, res) => {
  try {
    const { customerEmail, customerName, resetUrl } = req.body;
    if (!customerEmail) {
      return res.status(400).json({ error: "customerEmail is required." });
    }

    const appOrigin = req.headers.origin || `http://localhost:${PORT}`;
    const targetResetUrl = resetUrl || `${appOrigin}/?action=reset_password&email=${encodeURIComponent(customerEmail)}`;

    const result = await sendCustomerPasswordResetEmail(customerEmail, customerName || 'Valued Customer', targetResetUrl);
    res.json({
      success: true,
      message: `Password reset email dispatched to ${customerEmail}`,
      sender: result.sender,
      resetUrl: targetResetUrl
    });
  } catch (err: any) {
    console.error("[API] Customer reset email error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to dispatch password reset email." });
  }
});

// Master Admin & User Daily Data Routes
app.post("/api/admin/login", async (req, res) => {
  try {
    const { password } = req.body;
    const db = await getSQLiteDatabase();
    const stmt = db.prepare("SELECT admin_password_hash FROM admin_settings WHERE id = 1");
    let validPass = 'admin123';
    if (stmt.step()) {
      const row = stmt.getAsObject();
      if (row.admin_password_hash) validPass = row.admin_password_hash as string;
    }
    stmt.free();

    if (password === validPass) {
      res.json({ success: true, message: "Admin login successful" });
    } else {
      res.status(401).json({ error: "Invalid admin password" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed admin login" });
  }
});

app.post("/api/user/daily-data", async (req, res) => {
  try {
    const { user_id, entry_content, date_submitted } = req.body;
    if (!user_id || !entry_content) {
      return res.status(400).json({ error: "user_id and entry_content are required" });
    }
    const dateStr = date_submitted || new Date().toISOString().split('T')[0];
    const db = await getSQLiteDatabase();
    const stmt = db.prepare("INSERT INTO user_daily_data (user_id, entry_content, date_submitted) VALUES (?, ?, ?)");
    stmt.run([user_id, entry_content, dateStr]);
    stmt.free();
    saveDatabaseToDisk(db);
    res.json({ success: true, message: "Daily data entry recorded successfully into rtssdatabase.db" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to save daily data entry" });
  }
});

app.get("/api/user/daily-data", async (req, res) => {
  try {
    const { user_id } = req.query;
    const db = await getSQLiteDatabase();
    const entries: any[] = [];
    let stmt;
    if (user_id) {
      stmt = db.prepare("SELECT * FROM user_daily_data WHERE user_id = ? ORDER BY id DESC");
      stmt.bind([user_id as string]);
    } else {
      stmt = db.prepare("SELECT * FROM user_daily_data ORDER BY id DESC");
    }
    while (stmt.step()) {
      entries.push(stmt.getAsObject());
    }
    stmt.free();
    res.json({ entries });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch daily data entries" });
  }
});

// SQLite Database API Endpoints
app.get("/api/db/status", async (req, res) => {
  try {
    const connected = await isDatabaseConnected();
    if (connected) {
      res.json({
        status: "ok",
        connected: true,
        file: "rtssdatabase.db",
        dbType: "SQLite 3",
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(200).json({
        status: "disconnected",
        connected: false,
        file: "rtssdatabase.db",
        error: "Database file rtssdatabase.db is not connected"
      });
    }
  } catch (err: any) {
    res.status(500).json({ connected: false, error: err.message || "Failed to query SQLite database status" });
  }
});

app.get("/api/db/load", async (req, res) => {
  try {
    const data = await loadFullDatabaseFromSQLite();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to load database from SQLite" });
  }
});

app.get("/api/db/download", async (req, res) => {
  try {
    const db = await getSQLiteDatabase();
    saveDatabaseToDisk(db);
    const dbFilePath = path.join(process.cwd(), 'rtssdatabase.db');
    if (fs.existsSync(dbFilePath)) {
      res.setHeader('Content-Type', 'application/x-sqlite3');
      res.setHeader('Content-Disposition', 'attachment; filename="rtssdatabase.db"');
      res.download(dbFilePath, 'rtssdatabase.db');
    } else {
      res.status(404).json({ error: "rtssdatabase.db file not found on server" });
    }
  } catch (err: any) {
    console.error("[SQLite API] Error downloading database file:", err);
    res.status(500).json({ error: err.message || "Failed to download rtssdatabase.db" });
  }
});

app.post("/api/db/upload", async (req, res) => {
  try {
    const { fileBase64, fileName } = req.body;
    if (!fileBase64) {
      return res.status(400).json({ error: "Missing file payload" });
    }
    const buffer = Buffer.from(fileBase64, 'base64');
    const loadedData = await uploadDatabaseBuffer(buffer);
    res.json({
      success: true,
      file: "rtssdatabase.db",
      loadedData,
      message: `Successfully connected and mounted ${fileName || 'rtssdatabase.db'} into SQLite 3`
    });
  } catch (err: any) {
    console.error("[SQLite API] Error uploading database file:", err);
    res.status(500).json({ error: err.message || "Failed to mount database file into rtssdatabase.db" });
  }
});

app.post("/api/db/save", async (req, res) => {
  try {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: "Invalid data payload" });
    }
    await saveFullDatabaseToSQLite(data);
    res.json({
      success: true,
      file: "rtssdatabase.db",
      savedAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("[SQLite API] Error saving database:", err);
    res.status(500).json({ error: err.message || "Failed to write database to rtssdatabase.db" });
  }
});

// Initialize GoogleGenAI client lazily & safely
let aiClient: GoogleGenAI | null = null;
function getAi() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Help Desk Chat API Endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, role, userName } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    
    // Check if Gemini API Key is available
    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({ 
        text: "⚠️ **Gemini API Key is missing.** Please configure your `GEMINI_API_KEY` under the Settings > Secrets menu in AI Studio to activate the Help Desk AI assistant." 
      });
    }

    const ai = getAi();
    
    // Setup strict system instructions based on the user's role
    let systemInstruction = `You are the Reliabletech Enterprise Help Desk AI Assistant.
You help staff and administrators navigate and operate the Reliabletech CRM and Audit System located in Fikkal, Ilam, Nepal. This system was developed by Mr. Arpan Khadka.

User Context:
- Active User Name: ${userName || 'User'}
- Security Clearance Role: ${role || 'User'}

CRITICAL SECURITY GATEWAYS BY ROLE:

1. IF Security Clearance Role is 'User' (Standard Staff / Cashier):
- **STRICT RESTRICTION**: You are STRICTLY FORBIDDEN from answering questions about, showing formulas for, or discussing:
  * Financial audits, P&L margins, corporate balance sheets, or ledger matrices.
  * The Periodic Closing Board, draft computation formulas, or monthly/annual closings.
  * Bank statements, credit union statements (Sahakari), mobile gateway details (eSewa), or physical cash ledger mismatch/OCR discrepancies.
  * Legal board metadata (Decision Numbers, Meeting Numbers, Meeting Dates).
  * Administrative configurations or database backup/restore operations.
- If the staff user asks any question about these topics (e.g. "how do I do a periodic closing", "show me bank balance mismatches", "where are the audit reports", "what is the decision number"), you MUST refuse immediately and politely in both English and Nepali: 
  "Access Denied: Financial auditing and periodic closing operations are restricted to Master Administrators. Staff users are unauthorized to view or query financial ledgers. / पहुँच अस्वीकृत: वित्तीय लेखापरीक्षण र आवधिक बन्द गर्ने कार्यहरू मास्टर प्रशासकहरूमा मात्र सीमित छन्। कर्मचारीहरूलाई वित्तीय लेजरहरू हेर्न वा सोधपुछ गर्न अनुमति छैन।"
- Keep your help strictly focused on allowed staff operations: Client Invoicing, service bookings/tracking, looking up supplier contacts, creating basic sales records, updating stock counts, and submitting staff requests (like advances).

2. IF Security Clearance Role is 'Admin' (Administrator):
- **FULL CLEARANCE**: You are fully authorized to guide the Administrator on ALL modules:
  * The Periodic Closing Board (Monthly, 3-Monthly, 6-Monthly, Annual).
  * The 5-account balance matrix: RBB, Cash, eSewa, Sahakari, and Due.
  * Visual Statement OCR verification, mismatch indicators, and resolving ledger issues.
  * Revision editing request system (Pending Admin Consensus) and recording consensus signoffs.
  * Locking the closing with Legal Metadata (Meeting Date, Meeting Number, Decision Number).
  * System Operations Manuals and Export Center outputs.
  * Creating database backups, importing rtssdatabase.db, and full configurations.

MULTILINGUAL LANGUAGE & COMMAND REQUIREMENT:
- Understand commands and queries in both English and Nepali (including traditional Nepali Unicode and Romanized/English-alphabet Nepali like "invoice kasari banaune", "daily closing banda", "closing process").
- Detect the user's preferred language and script. If the user writes in traditional Nepali Unicode, you MUST answer in beautiful, polite, traditional Nepali Unicode. If they write in Romanized Nepali (e.g. typing Nepali in English characters), you MUST respond in clean Romanized Nepali or bilingual Nepali/English as the user wants.

DEVELOPER & OUT-OF-SCOPE INQUIRY ROUTING:
- You MUST let all users know that this system was developed by Mr. Arpan Khadka (श्री अर्पण खड्का).
- If a user asks about the development of the system or asks "who developed this?", "who made this?", "who is the developer?", tell them: "This system was developed by Mr. Arpan Khadka. / यो प्रणाली श्री अर्पण खड्काद्वारा विकास गरिएको हो।"
- If the user asks questions unrelated to the Reliabletech system or beyond the scope of this Help Desk (e.g., general programming, unrelated topics, non-business inquiries), you MUST politely refuse and say: "For more and other info which is out of help desk scope, please consult the developer Mr. Arpan Khadka. / थप जानकारी र सहयोगका लागि कृपया विकासकर्ता श्री अर्पण खड्कासँग परामर्श गर्नुहोस्।"
- Always include this signoff footer at the end of every response:
  "---
  👨‍💻 **Developed by / विकासकर्ता:** Mr. Arpan Khadka (अर्पण खड्का)
  *For more and other info which is out of help desk scope, please consult the developer **Mr. Arpan Khadka**.*"
`;

    // Map history to the correct structure expected by GoogleGenAI
    const contents = [];
    if (history && Array.isArray(history)) {
      for (const h of history) {
        contents.push({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.text }]
        });
      }
    }
    
    // Add active message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.3, // Lower temperature for more consistent constraint adherence
      },
    });

    const text = response.text || "I was unable to compile a response. Please try again.";
    res.json({ text });

  } catch (err: any) {
    console.error("Gemini Chat API Error:", err);
    res.status(500).json({ error: err.message || "An error occurred during chat processing." });
  }
});

// 404 JSON fallback for all unhandled /api/* routes to prevent returning HTML index.html
app.all("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

// Vite Middleware & SPA Static fallback configuration
async function initializeServer() {
  try {
    await getSQLiteDatabase();
    console.log("[SQLite] Engine initialized successfully: rtssdatabase.db");
  } catch (dbErr) {
    console.error("[SQLite] Engine startup warning:", dbErr);
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Reliabletech Server is listening on http://localhost:${PORT}`);
  });
}

initializeServer();
