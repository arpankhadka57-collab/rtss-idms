import React, { useState, useEffect, useRef } from 'react';
import { KeyRound, Mail, Lock, ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff, RefreshCw, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppUser, CustomerAccount } from '../types';
import { requestOtpCode, verifyOtpCodeOnline, maskEmailAddress, validatePasswordPolicy } from '../utils/otpAuth';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountType: 'staff' | 'customer';
  users?: AppUser[];
  customerAccounts?: CustomerAccount[];
  onResetStaffPassword?: (userId: string, newPass: string) => void;
  onResetCustomerPassword?: (customerId: string, newPass: string) => void;
  isDarkTheme?: boolean;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  accountType,
  users = [],
  customerAccounts = [],
  onResetStaffPassword,
  onResetCustomerPassword,
  isDarkTheme = false
}) => {
  // Step: 1 = Enter Email, 2 = Verify OTP, 3 = Reset Password, 4 = Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Email input state
  const [emailInput, setEmailInput] = useState('');
  const [targetUser, setTargetUser] = useState<AppUser | null>(null);
  const [targetCustomer, setTargetCustomer] = useState<CustomerAccount | null>(null);

  // OTP state
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Password reset state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  // Feedback messages
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpSentRef = useRef<string | null>(null);

  // Reset all state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setEmailInput('');
      setTargetUser(null);
      setTargetCustomer(null);
      setDigits(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg('');
      setSuccessMsg('');
      otpSentRef.current = null;
    }
  }, [isOpen]);

  // 5 minute countdown for Step 2
  useEffect(() => {
    if (step !== 2) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step]);

  // Resend cooldown timer for Step 2
  useEffect(() => {
    if (step !== 2 || resendCooldown <= 0) return;
    const cooldownInterval = setInterval(() => {
      setResendCooldown(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(cooldownInterval);
  }, [step, resendCooldown]);

  if (!isOpen) return null;

  // Step 1: Submit Email
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const query = emailInput.trim().toLowerCase();
    if (!query || !query.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (accountType === 'staff') {
      // Find matching staff user
      const matched = users.find(u => {
        const uEmail = (u.email || '').trim().toLowerCase();
        if (uEmail && uEmail === query) return true;
        // Default superadmin/admin fallback
        if ((u.username.toLowerCase() === 'arpan' || u.username.toLowerCase() === 'reliableadmin') && query === 'arpankhadka2057@gmail.com') {
          return true;
        }
        return false;
      });

      if (!matched) {
        setErrorMsg('No staff account found matching this email address. Please contact your system administrator.');
        return;
      }

      setTargetUser(matched);
      setTargetCustomer(null);
      sendOtpForReset(query, matched.name);
    } else {
      // Find matching customer account
      const matched = customerAccounts.find(c => {
        const cEmail = (c.email || '').trim().toLowerCase();
        return cEmail === query;
      });

      if (!matched) {
        setErrorMsg('No customer account found with this email. Please check the email address or create a new account.');
        return;
      }

      setTargetCustomer(matched);
      setTargetUser(null);
      sendOtpForReset(query, matched.full_name || matched.name);
    }
  };

  const sendOtpForReset = async (email: string, name?: string) => {
    setIsResending(true);
    setErrorMsg('');
    try {
      const res = await requestOtpCode(email, 'Password Reset', name);
      if (res.success) {
        otpSentRef.current = email;
        setStep(2);
        setTimeLeft(300);
        setResendCooldown(30);
        setDigits(['', '', '', '', '', '']);
        setSuccessMsg(`6-digit reset code sent to ${res.emailMasked || email}`);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(res.error || 'Failed to dispatch verification code to email.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error while contacting authentication server.');
    } finally {
      setIsResending(false);
    }
  };

  // Step 2: Handle OTP input
  const handleDigitChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length > 1) {
      const newDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        if (cleaned[i]) newDigits[i] = cleaned[i];
      }
      setDigits(newDigits);
      const nextIdx = Math.min(cleaned.length, 5);
      otpRefs.current[nextIdx]?.focus();
      if (cleaned.length >= 6) {
        verifyOtp(newDigits.join(''));
      }
      return;
    }

    const singleDigit = cleaned.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = singleDigit;
    setDigits(newDigits);

    if (singleDigit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (singleDigit && index === 5 && newDigits.every(d => d.length === 1)) {
      verifyOtp(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || digits.join('');
    if (code.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    if (timeLeft <= 0) {
      setErrorMsg('The verification code has expired. Please click "Resend Code".');
      return;
    }

    setIsVerifyingOtp(true);
    setErrorMsg('');

    try {
      const res = await verifyOtpCodeOnline(emailInput.trim().toLowerCase(), code, 'Password Reset');
      if (res.verified) {
        setStep(3);
        setErrorMsg('');
        setSuccessMsg('OTP verified successfully! Please enter your new password.');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(res.error || 'Invalid verification code. Please check your email.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = () => {
    if (resendCooldown > 0 || isResending) return;
    const name = targetUser?.name || targetCustomer?.full_name || targetCustomer?.name || '';
    sendOtpForReset(emailInput.trim().toLowerCase(), name);
  };

  // Step 3: Handle Password Reset Submission
  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Check policy requirements
    const policyResult = validatePasswordPolicy(newPassword);
    if (!policyResult.valid) {
      setErrorMsg(policyResult.errors[0]);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please ensure both passwords are identical.');
      return;
    }

    setIsSubmittingReset(true);

    try {
      if (accountType === 'staff' && targetUser && onResetStaffPassword) {
        onResetStaffPassword(targetUser.id, newPassword.trim());
      } else if (accountType === 'customer' && targetCustomer && onResetCustomerPassword) {
        onResetCustomerPassword(targetCustomer.customer_id, newPassword.trim());
      }
      setStep(4);
      setErrorMsg('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setIsSubmittingReset(false);
    }
  };

  // Policy validation breakdown for real-time visual checklist
  const hasMinLength = newPassword.length >= 10;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newPassword);
  const digitCount = (newPassword.match(/\d/g) || []).length;
  const hasMinDigits = digitCount >= 4;
  const isPolicySatisfied = hasMinLength && hasUppercase && hasLowercase && hasSymbol && hasMinDigits;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border ${
          isDarkTheme 
            ? 'bg-slate-900 border-slate-800 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-700 p-6 text-white text-center relative overflow-hidden">
          <div className="w-14 h-14 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20 shadow-inner">
            <KeyRound size={30} className="text-white drop-shadow" />
          </div>

          <h3 className="text-xl font-black tracking-tight">Reset Account Password</h3>
          <p className="text-xs text-amber-100/90 mt-1 font-medium">
            {accountType === 'staff' ? 'Staff & Administration Portal' : 'Customer E-Commerce Account'}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {/* Step 1: Input Email */}
          {step === 1 && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="text-sm font-bold">Enter Registered Email</h4>
                <p className="text-xs text-slate-500">
                  Enter your email address to receive a secure 6-digit verification code.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono flex items-center gap-1.5">
                  <Mail size={13} className="text-sky-600" />
                  <span>Email Address</span>
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    placeholder="e.g. yourname@gmail.com"
                    className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-xs font-semibold focus:outline-hidden transition shadow-xs ${
                      isDarkTheme
                        ? 'bg-slate-950 border-slate-700 text-white focus:border-sky-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-sky-600'
                    }`}
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="pt-2 space-y-2.5">
                <button
                  type="submit"
                  disabled={isResending}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 cursor-pointer transition active:scale-98"
                >
                  {isResending ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      <span>Send Verification Code</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center gap-1 cursor-pointer transition"
                >
                  <ArrowLeft size={13} />
                  <span>Cancel &amp; Return to Login</span>
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Enter 6-digit OTP */}
          {step === 2 && (
            <div className="space-y-5">
              <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                isDarkTheme ? 'bg-slate-800/80 border-slate-700 text-slate-300' : 'bg-sky-50 border-sky-200/80 text-sky-950'
              }`}>
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-600 shrink-0">
                  <Mail size={18} />
                </div>
                <div className="text-xs min-w-0">
                  <div className="font-semibold text-slate-500 text-[10px]">Verification code sent to:</div>
                  <div className="font-bold font-mono text-xs truncate text-sky-700 dark:text-sky-400">
                    {maskEmailAddress(emailInput)}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Enter 6-Digit Code
                  </label>
                  <div className={`flex items-center gap-1 text-xs font-mono font-bold ${
                    timeLeft < 60 ? 'text-rose-500 animate-pulse' : 'text-sky-600'
                  }`}>
                    <Clock size={13} />
                    <span>{formatTime(timeLeft)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {digits.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => (otpRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={digit}
                      onChange={e => handleDigitChange(index, e.target.value)}
                      onKeyDown={e => handleKeyDown(index, e)}
                      className={`w-full h-13 text-center font-mono font-black text-xl rounded-2xl border transition shadow-inner focus:outline-hidden ${
                        isDarkTheme
                          ? 'bg-slate-950 border-slate-700 text-white focus:border-sky-400'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-sky-600'
                      } ${digit ? 'border-sky-500 bg-sky-50/30' : ''}`}
                    />
                  ))}
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => verifyOtp()}
                  disabled={digits.some(d => !d) || isVerifyingOtp || timeLeft <= 0}
                  className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider text-white flex items-center justify-center gap-2 transition cursor-pointer shadow-lg active:scale-98 ${
                    digits.every(d => d.length === 1) && timeLeft > 0
                      ? 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500'
                      : 'bg-slate-400 opacity-60 cursor-not-allowed'
                  }`}
                >
                  {isVerifyingOtp ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      <span>Verify Code &amp; Continue</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || isResending}
                    className={`text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      resendCooldown > 0 || isResending ? 'text-slate-400 cursor-not-allowed' : 'text-sky-600 hover:underline'
                    }`}
                  >
                    <RefreshCw size={13} className={isResending ? 'animate-spin' : ''} />
                    <span>
                      {isResending
                        ? 'Sending...'
                        : resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : 'Resend Code'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft size={13} />
                    <span>Change Email</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Enter New Password */}
          {step === 3 && (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="text-sm font-bold">Set New Secure Password</h4>
                <p className="text-xs text-slate-500">
                  Please create a strong password conforming to the security criteria below.
                </p>
              </div>

              <div className="space-y-3">
                {/* New Password */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className={`w-full pl-10 pr-10 py-2.5 rounded-2xl border text-xs font-semibold focus:outline-hidden transition ${
                        isDarkTheme
                          ? 'bg-slate-950 border-slate-700 text-white focus:border-sky-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-sky-600'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className={`w-full pl-10 pr-10 py-2.5 rounded-2xl border text-xs font-semibold focus:outline-hidden transition ${
                        isDarkTheme
                          ? 'bg-slate-950 border-slate-700 text-white focus:border-sky-500'
                          : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-sky-600'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Requirement Badges */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-[11px]">
                <div className="font-bold text-slate-700 dark:text-slate-300">Password Requirements:</div>
                <div className="grid grid-cols-1 gap-1 font-medium">
                  <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>
                    <CheckCircle2 size={13} className={hasMinLength ? 'text-emerald-600' : 'text-slate-400 opacity-40'} />
                    <span>10 characters minimum total length</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>
                    <CheckCircle2 size={13} className={hasUppercase ? 'text-emerald-600' : 'text-slate-400 opacity-40'} />
                    <span>1 uppercase letter minimum (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>
                    <CheckCircle2 size={13} className={hasLowercase ? 'text-emerald-600' : 'text-slate-400 opacity-40'} />
                    <span>1 lowercase letter minimum (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasSymbol ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>
                    <CheckCircle2 size={13} className={hasSymbol ? 'text-emerald-600' : 'text-slate-400 opacity-40'} />
                    <span>1 symbol minimum (@, #, $, %, !, &, *, ?)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasMinDigits ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>
                    <CheckCircle2 size={13} className={hasMinDigits ? 'text-emerald-600' : 'text-slate-400 opacity-40'} />
                    <span>4 numbers minimum (0-9) ({digitCount}/4 entered)</span>
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!isPolicySatisfied || newPassword !== confirmPassword || isSubmittingReset}
                className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-wider text-white flex items-center justify-center gap-2 transition cursor-pointer shadow-lg active:scale-98 ${
                  isPolicySatisfied && newPassword === confirmPassword
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20'
                    : 'bg-slate-400 opacity-60 cursor-not-allowed'
                }`}
              >
                {isSubmittingReset ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Saving Password...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Save &amp; Update Password</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 4: Success Message */}
          {step === 4 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-black text-slate-800 dark:text-slate-100">Password Reset Successful!</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Your password has been successfully updated. You can now login with your new credentials.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md"
              >
                Return to Login
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
