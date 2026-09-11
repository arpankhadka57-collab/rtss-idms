/**
 * OTP Authentication Client Helper
 * Handles OTP dispatching and verification against the RTSS server
 */

export interface SendOtpResponse {
  success: boolean;
  message?: string;
  emailMasked?: string;
  expiresInSeconds?: number;
  sender?: string;
  error?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  verified: boolean;
  message?: string;
  error?: string;
}

/**
 * Safely parses response as JSON, gracefully handling HTML fallbacks or non-JSON errors
 */
async function safeParseJson(res: Response): Promise<any> {
  try {
    const text = await res.text();
    if (!text || text.trim().length === 0) {
      return { success: res.ok, status: res.status };
    }
    try {
      return JSON.parse(text);
    } catch {
      if (text.includes('<html') || text.includes('<!DOCTYPE') || text.includes('<!doctype')) {
        return {
          success: false,
          error: `Server endpoint returned HTTP ${res.status} HTML response instead of JSON. Ensure the backend server is running on port 3000.`
        };
      }
      return {
        success: false,
        error: text.length > 200 ? `Server returned status ${res.status}` : text
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Unable to read response from server.'
    };
  }
}

export async function requestOtpCode(email: string, purpose: string = 'Verification', username?: string): Promise<SendOtpResponse> {
  try {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), purpose, username })
    });

    const data = await safeParseJson(res);
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || data.message || `Failed to dispatch verification code (Status ${res.status}).`
      };
    }
    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error while contacting authentication server.'
    };
  }
}

export async function verifyOtpCodeOnline(email: string, otp: string, purpose: string = 'Verification'): Promise<VerifyOtpResponse> {
  // Test OTP Gatepass: 666666 works unconditionally without requiring email dispatch
  if (otp.trim() === '666666') {
    return {
      success: true,
      verified: true,
      message: 'Verification successful.'
    };
  }

  try {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), otp: otp.trim(), purpose })
    });

    const data = await safeParseJson(res);
    if (!res.ok || !data.verified) {
      return {
        success: false,
        verified: false,
        error: data.error || data.message || 'Invalid or expired verification code.'
      };
    }
    return {
      success: true,
      verified: true,
      message: data.message || 'Verification successful.'
    };
  } catch (err: any) {
    return {
      success: false,
      verified: false,
      error: err.message || 'Network error while verifying code.'
    };
  }
}

export function maskEmailAddress(email: string): string {
  if (!email) return '';
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 3) {
    return `${name.charAt(0)}***@${domain}`;
  }
  return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
}

export async function notifyCustomerOrderStatus(
  customerEmail: string,
  customerName: string,
  orderId: string,
  orderStatus: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!customerEmail || !customerEmail.includes('@')) {
      return { success: false, error: 'No valid customer email available' };
    }
    const res = await fetch('/api/orders/notify-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail: customerEmail.trim(),
        customerName: customerName.trim(),
        orderId: orderId.trim(),
        orderStatus: orderStatus.trim()
      })
    });
    const data = await safeParseJson(res);
    return data;
  } catch (err: any) {
    console.error('Failed to dispatch order status notification:', err);
    return { success: false, error: err.message };
  }
}

export interface EmailAccountQuota {
  email: string;
  name: string;
  maxLimit: number;
  sentToday: number;
  remainingToday: number;
  percentageUsed: number;
  isActive: boolean;
  status: string;
  statusBadge: 'ACTIVE' | 'STANDBY' | 'LIMIT_REACHED';
}

export interface EmailQuotaStatusResponse {
  primaryAccount: EmailAccountQuota;
  secondaryAccount: EmailAccountQuota;
  activeDispatcher: string;
  totalSentToday: number;
  totalRemainingToday: number;
  totalDailyCapacity: number;
  systemStatus: string;
}

export interface EmailDispatchLogItem {
  id: string;
  timestamp: number;
  dateFormatted?: string;
  sender: string;
  recipientEmail: string;
  recipientName: string;
  emailType: string;
  subject: string;
  success: boolean;
  error?: string;
  messageId?: string;
}

export async function fetchEmailQuotaStatus(): Promise<EmailQuotaStatusResponse | null> {
  try {
    const res = await fetch('/api/system/email-quota');
    if (!res.ok) return null;
    const data = await safeParseJson(res);
    return data.primaryAccount ? data : null;
  } catch (err) {
    console.error('Failed to fetch email quota status:', err);
    return null;
  }
}

export async function fetchEmailDispatchLogs(limit: number = 200): Promise<EmailDispatchLogItem[]> {
  try {
    const res = await fetch(`/api/system/email-dispatch-logs?limit=${limit}`);
    if (!res.ok) return [];
    const data = await safeParseJson(res);
    return data.logs || [];
  } catch (err) {
    console.error('Failed to fetch email dispatch logs:', err);
    return [];
  }
}

export async function dispatchSystemTestEmail(
  recipientEmail: string,
  recipientName: string,
  testSubject?: string,
  testMessage?: string
): Promise<{ success: boolean; message?: string; sender?: string; error?: string }> {
  try {
    const res = await fetch('/api/system/send-test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientEmail, recipientName, testSubject, testMessage })
    });
    const data = await safeParseJson(res);
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error sending test email.' };
  }
}

export interface EmailConfigData {
  primaryEmail: string;
  hasPrimaryPass?: boolean;
  secondaryEmail: string;
  hasSecondaryPass?: boolean;
  mode: 'auto' | 'primary' | 'secondary';
}

export interface SendCustomEmailParams {
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  message: string;
  htmlContent?: string;
  emailType?: string;
  senderChoice?: 'auto' | 'primary' | 'secondary' | string;
}

export async function dispatchCustomEmail(params: SendCustomEmailParams): Promise<{ 
  success: boolean; 
  message?: string; 
  sender?: string; 
  recipient?: string; 
  subject?: string; 
  error?: string 
}> {
  try {
    const res = await fetch('/api/system/send-custom-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await safeParseJson(res);
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error dispatching custom email.' };
  }
}

export async function fetchEmailConfig(): Promise<{ success: boolean; config?: EmailConfigData; error?: string }> {
  try {
    const res = await fetch('/api/system/email-config');
    if (!res.ok) return { success: false, error: 'Failed to fetch email configuration' };
    const data = await safeParseJson(res);
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function saveEmailConfigApi(config: Partial<EmailConfigData>): Promise<{ success: boolean; message?: string; config?: EmailConfigData; error?: string; quotaStatus?: EmailQuotaStatusResponse }> {
  try {
    const res = await fetch('/api/system/email-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    const data = await safeParseJson(res);
    return data;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export function validatePasswordPolicy(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 10) {
    errors.push("Must be at least 10 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Must contain at least 1 uppercase letter (A-Z)");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Must contain at least 1 lowercase letter (a-z)");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    errors.push("Must contain at least 1 special symbol (such as @, #, $, %, !, &, *, ?)");
  }
  const digitMatches = password.match(/\d/g) || [];
  if (digitMatches.length < 4) {
    errors.push(`Must contain at least 4 numbers (0-9) (currently ${digitMatches.length}/4)`);
  }
  return {
    valid: errors.length === 0,
    errors
  };
}
