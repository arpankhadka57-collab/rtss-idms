import React, { useState } from 'react';
import { Lock, User, Flashlight, FlashlightOff, Wrench, MapPin, Info, ShieldCheck, ArrowRight, KeyRound, Sparkles, ArrowLeft, ShoppingBag, Mail, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppUser, BusinessProfile } from '../types';
import { OtpVerificationModal } from './OtpVerificationModal';
import { ForgotPasswordModal } from './ForgotPasswordModal';

interface LoginProps {
  users: AppUser[];
  profile: BusinessProfile;
  onLoginSuccess: (user: AppUser) => void;
  onBackToStorefront?: () => void;
  onResetStaffPassword?: (userId: string, newPass: string) => void;
}

export const Login: React.FC<LoginProps> = ({
  users,
  profile,
  onLoginSuccess,
  onBackToStorefront,
  onResetStaffPassword
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  // OTP Verification State
  const [pendingUserForOtp, setPendingUserForOtp] = useState<AppUser | null>(null);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

  // Forgot Password State
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    setTimeout(() => {
      const matchedUser = users.find(
        u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
      );

      if (matchedUser) {
        // Ensure email exists (default to arpankhadka2057@gmail.com for reliableadmin / arpan)
        const isMaster = matchedUser.username.toLowerCase() === 'reliableadmin' || matchedUser.username.toLowerCase() === 'arpan';
        const userEmail = matchedUser.email || (isMaster ? 'arpankhadka2057@gmail.com' : 'arpankhadka2057@gmail.com');
        
        const userWithEmail: AppUser = {
          ...matchedUser,
          email: userEmail
        };

        setPendingUserForOtp(userWithEmail);
        setIsOtpModalOpen(true);
      } else {
        setError('Invalid username or password. Please verify your credentials.');
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans select-none">
      
      {/* Back to Public Storefront Button */}
      {onBackToStorefront && (
        <button
          onClick={onBackToStorefront}
          className="absolute top-4 left-4 z-40 px-3.5 py-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-xl border border-slate-700/60 backdrop-blur-md transition flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
          id="back-to-storefront-button"
        >
          <ArrowLeft size={14} />
          <ShoppingBag size={14} className="text-sky-400" />
          <span>Back to Online Store</span>
        </button>
      )}
      
      {/* Ambient Animated Glowing Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <motion.div 
          animate={{ 
            x: [0, 50, -30, 0],
            y: [0, -40, 30, 0],
            scale: [1, 1.2, 0.95, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-24 -left-24 w-[30rem] h-[30rem] bg-indigo-600/30 rounded-full blur-[100px]"
        />

        <motion.div 
          animate={{ 
            x: [0, -60, 40, 0],
            y: [0, 50, -40, 0],
            scale: [1.1, 0.95, 1.15, 1.1],
            rotate: [360, 180, 0]
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-28 -right-28 w-[32rem] h-[32rem] bg-sky-500/25 rounded-full blur-[110px]"
        />

        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-10"></div>

        {profile.logoUrl && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] select-none">
            <img
              src={profile.logoUrl}
              alt="Watermark Logo"
              className="w-[40rem] h-[40rem] object-contain filter grayscale contrast-125 brightness-150"
            />
          </div>
        )}
      </div>

      {/* Main Login Form Container */}
      <div className="w-full max-w-md shrink-0 z-20 flex flex-col items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full space-y-5"
        >
          {/* Brand Identity Header */}
          <div className="flex flex-col items-center text-center">
            <motion.div 
              whileHover={{ rotate: 8, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-4 bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-500 rounded-3xl text-white shadow-2xl shadow-sky-500/25 mb-3 border border-white/20 relative group cursor-pointer"
            >
              <Wrench size={32} className="relative z-10 drop-shadow-md" />
            </motion.div>

            <h2 className="text-2xl font-black tracking-tight text-white font-display flex items-center gap-2 drop-shadow-sm">
              <span>{profile.name || 'ReliableTech Services & Suppliers'}</span>
            </h2>
            
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs font-semibold text-sky-200/90 bg-sky-950/60 backdrop-blur-md px-3 py-1 rounded-full border border-sky-500/30 flex items-center gap-1.5 shadow-xs">
                <MapPin size={12} className="text-sky-400" />
                <span>{profile.location || 'Fikkal-10, Suryodaya, Ilam'}</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Workstation Online</span>
              </span>
            </div>
          </div>

          {/* Main Glassmorphic Login Card */}
          <motion.div 
            animate={shake ? {
              x: [-12, 12, -8, 8, -4, 4, 0],
              transition: { duration: 0.5 }
            } : {}}
            className="bg-slate-900/85 backdrop-blur-xl py-7 px-6 sm:px-8 shadow-2xl border border-slate-800 rounded-3xl relative overflow-hidden group/card hover:border-sky-500/30 transition-colors"
          >
            {/* Top Light Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400"></div>

            {/* Card Title */}
            <div className="mb-5 flex justify-between items-start">
              <div>
                <h3 className="text-base font-extrabold text-white font-display flex items-center gap-2">
                  <span>Staff &amp; Admin Sign In</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Enter your workstation credentials below</p>
              </div>
              <div className="p-2 bg-slate-800/80 rounded-xl text-sky-400 border border-slate-700/50">
                <KeyRound size={18} />
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Username Field */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono tracking-wider flex justify-between">
                  <span>Username</span>
                  {username && <span className="text-sky-400 font-bold">Entered</span>}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-400 transition-colors">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-2xl text-xs font-medium text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all shadow-inner font-mono"
                    placeholder="e.g. reliableadmin"
                  />
                </div>
              </div>

              {/* Password Field with Spotlight Effect */}
              <div className="space-y-1.5 relative">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase font-mono tracking-wider">
                    Password
                  </label>
                  <div className="flex items-center gap-2">
                    {showPassword && (
                      <motion.span 
                        initial={{ opacity: 0, x: 5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-amber-400 font-bold flex items-center gap-1 font-mono text-[9px]"
                      >
                        <Sparkles size={11} className="text-yellow-300" />
                        <span>Spotlight Active</span>
                      </motion.span>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(true)}
                      className="text-[10px] text-sky-400 hover:text-sky-300 font-bold hover:underline transition cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>

                <div className={`relative group rounded-2xl transition-all duration-300 ${
                  showPassword 
                    ? 'ring-2 ring-amber-400/90 shadow-[0_0_30px_rgba(245,158,11,0.4)]' 
                    : 'focus-within:ring-2 focus-within:ring-sky-500/30'
                }`}>
                  
                  {/* Left Key Lock Icon */}
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-400 transition-colors z-10">
                    <Lock size={16} className={showPassword ? 'text-amber-300' : ''} />
                  </div>

                  {/* Input Field */}
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`block w-full pl-10 pr-12 py-2.5 bg-slate-950/80 border rounded-2xl text-xs font-medium placeholder-slate-500 focus:outline-hidden transition-colors duration-200 shadow-inner font-mono tracking-wider relative z-10 ${
                      showPassword 
                        ? 'border-amber-400/90 text-amber-100 bg-amber-950/40 font-bold' 
                        : 'border-slate-700/80 text-slate-100 focus:border-sky-500'
                    }`}
                    placeholder="••••••••••••"
                  />

                  {/* Spotlight Toggle Button */}
                  <div className="absolute inset-y-0 right-0 pr-2 flex items-center z-20">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowPassword(!showPassword)}
                      className={`p-1.5 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                        showPassword 
                          ? 'bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500 text-slate-950 shadow-md border border-amber-100' 
                          : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800/80'
                      }`}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <Flashlight size={16} className="text-slate-950" />
                      ) : (
                        <FlashlightOff size={16} className="text-slate-400 group-hover:text-amber-200" />
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Animated Error Alert */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-rose-950/60 border border-rose-500/40 rounded-2xl text-rose-300 text-xs font-medium flex items-center gap-2.5 shadow-lg overflow-hidden"
                  >
                    <span className="text-base shrink-0">⚠️</span>
                    <span className="leading-snug">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.015, boxShadow: "0 10px 25px -5px rgba(14, 165, 233, 0.4)" }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl shadow-xl text-xs font-extrabold text-white bg-gradient-to-r from-sky-500 via-indigo-600 to-indigo-700 hover:from-sky-400 hover:to-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-sky-400/50 transition-all cursor-pointer relative overflow-hidden group"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <>
                    <ShieldCheck size={17} className="text-sky-200" />
                    <span className="tracking-wide">Sign In to Workstation</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Security Notice */}
            <div className="mt-5 pt-3 border-t border-slate-800/80 text-center">
              <p className="text-[11px] text-slate-500 font-medium flex items-center justify-center gap-1.5">
                <Info size={13} className="text-slate-400 shrink-0" />
                <span>Authorized RTSS Staff &amp; Administrator Access Only</span>
              </p>
            </div>
          </motion.div>

          {/* Footer Status */}
          <div className="text-center text-[10px] font-mono text-slate-500 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>ReliableTech Enterprise Workstation • Fikkal, Ilam</span>
          </div>
        </motion.div>
      </div>

      {/* 2FA OTP Verification Modal */}
      {pendingUserForOtp && (
        <OtpVerificationModal
          isOpen={isOtpModalOpen}
          email={pendingUserForOtp.email || 'arpankhadka2057@gmail.com'}
          purpose={`Staff Login (@${pendingUserForOtp.username})`}
          userName={pendingUserForOtp.name}
          isDarkTheme={true}
          onSuccess={() => {
            setIsOtpModalOpen(false);
            onLoginSuccess(pendingUserForOtp);
          }}
          onCancel={() => {
            setIsOtpModalOpen(false);
            setPendingUserForOtp(null);
          }}
        />
      )}

      {/* Forgot Password Reset Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        accountType="staff"
        users={users}
        onResetStaffPassword={onResetStaffPassword}
        isDarkTheme={true}
      />

    </div>
  );
};
