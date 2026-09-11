import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Mail, RefreshCw, ArrowLeft, CheckCircle2, Lock, AlertCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { requestOtpCode, verifyOtpCodeOnline, maskEmailAddress } from '../utils/otpAuth';

interface OtpVerificationModalProps {
  isOpen: boolean;
  email: string;
  purpose: string;
  userName?: string;
  onSuccess: () => void;
  onCancel: () => void;
  isDarkTheme?: boolean;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  isOpen,
  email,
  purpose,
  userName,
  onSuccess,
  onCancel,
  isDarkTheme = false
}) => {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [resendCooldown, setResendCooldown] = useState(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [maskedEmail, setMaskedEmail] = useState(maskEmailAddress(email));
  const [hasSentInitial, setHasSentInitial] = useState(false);
  const sentForEmailRef = useRef<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Send initial OTP when opened
  useEffect(() => {
    if (isOpen && email) {
      const emailKey = `${email.trim().toLowerCase()}_${purpose}`;
      if (sentForEmailRef.current === emailKey) {
        return; // Already dispatched for this modal session
      }
      sentForEmailRef.current = emailKey;
      setHasSentInitial(true);
      setTimeLeft(300);
      setResendCooldown(30);
      setDigits(['', '', '', '', '', '']);
      setErrorMsg('');
      setSuccessMsg('');
      setMaskedEmail(maskEmailAddress(email));

      requestOtpCode(email, purpose, userName).then(res => {
        if (res.success) {
          if (res.emailMasked) setMaskedEmail(res.emailMasked);
          setSuccessMsg(`6-digit code dispatched to ${res.emailMasked || email}`);
          setTimeout(() => setSuccessMsg(''), 4000);
        } else {
          setErrorMsg(res.error || 'Failed to dispatch verification code.');
        }
      });
    }
  }, [isOpen, email, purpose, userName]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      sentForEmailRef.current = null;
      setHasSentInitial(false);
      setDigits(['', '', '', '', '', '']);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  // Countdown timer for 5 minutes
  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen]);

  // Resend cooldown timer
  useEffect(() => {
    if (!isOpen || resendCooldown <= 0) return;
    const cooldownInterval = setInterval(() => {
      setResendCooldown(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(cooldownInterval);
  }, [isOpen, resendCooldown]);

  // Focus first input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 200);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, val: string) => {
    // Handle paste of 6 digits
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length > 1) {
      const newDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        if (cleaned[i]) {
          newDigits[i] = cleaned[i];
        }
      }
      setDigits(newDigits);
      const nextIdx = Math.min(cleaned.length, 5);
      inputRefs.current[nextIdx]?.focus();
      if (cleaned.length >= 6) {
        verifyCode(newDigits.join(''));
      }
      return;
    }

    const singleDigit = cleaned.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = singleDigit;
    setDigits(newDigits);

    if (singleDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all 6 digits entered
    if (singleDigit && index === 5 && newDigits.every(d => d.length === 1)) {
      verifyCode(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyCode = async (codeToVerify?: string) => {
    const fullCode = codeToVerify || digits.join('');
    if (fullCode.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the verification code.');
      return;
    }

    if (timeLeft <= 0) {
      setErrorMsg('The verification code has expired. Please click "Resend Code".');
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');

    try {
      const res = await verifyOtpCodeOnline(email, fullCode, purpose);
      if (res.verified) {
        setSuccessMsg('Verification successful! Granting access...');
        setTimeout(() => {
          onSuccess();
        }, 500);
      } else {
        setErrorMsg(res.error || 'Invalid verification code. Please check your email.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setErrorMsg('');
    setSuccessMsg('');
    setDigits(['', '', '', '', '', '']);

    try {
      const res = await requestOtpCode(email, purpose, userName);
      if (res.success) {
        setTimeLeft(300);
        setResendCooldown(30);
        if (res.emailMasked) setMaskedEmail(res.emailMasked);
        setSuccessMsg(`New 6-digit code dispatched to ${res.emailMasked || email}`);
        inputRefs.current[0]?.focus();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(res.error || 'Failed to resend code.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error while resending.');
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isComplete = digits.every(d => d.length === 1);

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
        <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-800 p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="w-14 h-14 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20 shadow-inner">
            <ShieldCheck size={32} className="text-white drop-shadow" />
          </div>

          <h3 className="text-xl font-extrabold tracking-tight">Email OTP Verification</h3>
          <p className="text-xs text-sky-100/90 mt-1 font-medium">
            {purpose} • RTSS Secure Authentication
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Email Info Banner */}
          <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
            isDarkTheme 
              ? 'bg-slate-800/80 border-slate-700/80 text-slate-300' 
              : 'bg-sky-50 border-sky-200/80 text-sky-950'
          }`}>
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-600 shrink-0">
              <Mail size={18} />
            </div>
            <div className="text-xs min-w-0">
              <div className="font-semibold text-slate-500 text-[11px]">Verification code sent to:</div>
              <div className="font-bold font-mono text-xs truncate text-sky-700 dark:text-sky-400">
                {maskedEmail || email}
              </div>
            </div>
          </div>

          {/* 6 Digit Input Group */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label className={`text-xs font-bold font-mono uppercase tracking-wider ${
                isDarkTheme ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Enter 6-Digit Code
              </label>
              <div className={`flex items-center gap-1 text-xs font-mono font-bold ${
                timeLeft < 60 ? 'text-rose-500 animate-pulse' : (isDarkTheme ? 'text-sky-400' : 'text-sky-600')
              }`}>
                <Clock size={13} />
                <span>{formatTime(timeLeft)}</span>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-2 sm:gap-3">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={el => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={digit}
                  onChange={e => handleDigitChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  className={`w-full h-13 sm:h-14 text-center font-mono font-black text-xl rounded-2xl border transition-all duration-200 shadow-inner focus:outline-hidden ${
                    isDarkTheme
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-sky-600 focus:ring-2 focus:ring-sky-500/20'
                  } ${digit ? 'border-sky-500 bg-sky-50/30' : ''}`}
                />
              ))}
            </div>
          </div>

          {/* Feedback messages */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-medium flex items-center gap-2"
              >
                <AlertCircle size={15} className="shrink-0 text-rose-500" />
                <span className="leading-snug">{errorMsg}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-medium flex items-center gap-2"
              >
                <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                <span className="leading-snug">{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => verifyCode()}
              disabled={!isComplete || isVerifying || timeLeft <= 0}
              className={`w-full py-3.5 px-4 rounded-2xl text-xs font-black uppercase tracking-wider text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98 ${
                isComplete && timeLeft > 0
                  ? 'bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-700 hover:from-sky-500 hover:to-indigo-600 shadow-sky-500/25'
                  : 'bg-slate-400 opacity-60 cursor-not-allowed'
              }`}
            >
              {isVerifying ? (
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
                onClick={handleResend}
                disabled={resendCooldown > 0 || isResending}
                className={`text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  resendCooldown > 0 || isResending
                    ? 'text-slate-400 cursor-not-allowed'
                    : 'text-sky-600 hover:text-sky-700 hover:underline'
                }`}
              >
                <RefreshCw size={13} className={isResending ? 'animate-spin' : ''} />
                <span>
                  {isResending
                    ? 'Sending new code...'
                    : resendCooldown > 0
                    ? `Resend Code in ${resendCooldown}s`
                    : 'Resend Code'}
                </span>
              </button>

              <button
                type="button"
                onClick={onCancel}
                className={`text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                  isDarkTheme ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ArrowLeft size={13} />
                <span>Back</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security Footer Notice */}
        <div className={`py-3 px-6 text-center text-[10px] border-t font-medium ${
          isDarkTheme ? 'bg-slate-950/60 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-100 text-slate-500'
        }`}>
          🔒 System generated code valid for 5 minutes. Do not share this OTP with anyone.
        </div>
      </motion.div>
    </div>
  );
};
