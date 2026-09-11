import React, { useState, useEffect } from 'react';
import { User, Lock, Save, X, Key, CheckCircle2, Phone, MapPin, CreditCard, LogOut, Camera, Upload, Trash2, Mail, ShieldAlert } from 'lucide-react';
import { AppUser } from '../types';

export type TabInterfaceMode = 'sidebar' | 'topbar';
export type AppTheme = 'golden' | 'blue' | 'light' | 'dark';

interface UserProfileModalProps {
  currentUser: AppUser;
  isOpen: boolean;
  onClose: () => void;
  onUpdateUser: (updatedUser: AppUser) => void;
  onLogout: () => void;
  tabMode?: TabInterfaceMode;
  onTabModeChange?: (mode: TabInterfaceMode) => void;
  theme?: AppTheme;
  onThemeChange?: (theme: AppTheme) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onUpdateUser,
  onLogout
}) => {
  const isMasterAdmin = currentUser.username.toLowerCase() === 'reliableadmin' || currentUser.username.toLowerCase() === 'arpan';
  const defaultEmail = currentUser.email || (isMasterAdmin ? 'arpankhadka2057@gmail.com' : '');

  // Personal Info State
  const [name, setName] = useState(currentUser.name || '');
  const [nameNepali, setNameNepali] = useState(currentUser.nameNepali || '');
  const [post, setPost] = useState(currentUser.post || '');
  const [designationNepali, setDesignationNepali] = useState(currentUser.designationNepali || '');
  const [contactNumber, setContactNumber] = useState(currentUser.contactNumber || '');
  const [email, setEmail] = useState(defaultEmail);
  const [address, setAddress] = useState(currentUser.address || '');
  const [citizenshipNumber, setCitizenshipNumber] = useState(currentUser.citizenshipNumber || '');
  const [issueDate, setIssueDate] = useState(currentUser.issueDate || '');
  const [issueDistrictAndOffice, setIssueDistrictAndOffice] = useState(currentUser.issueDistrictAndOffice || '');
  const [fatherName, setFatherName] = useState(currentUser.fatherName || '');
  const [motherName, setMotherName] = useState(currentUser.motherName || '');
  const [dateOfBirth, setDateOfBirth] = useState(currentUser.dateOfBirth || '');
  const [bloodGroup, setBloodGroup] = useState(currentUser.bloodGroup || '');
  const [profilePhoto, setProfilePhoto] = useState(currentUser.profilePhoto || '');
  const [photoApproved, setPhotoApproved] = useState<boolean>(currentUser.photoApproved ?? true);
  const [staffId, setStaffId] = useState(currentUser.staffId || '');

  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setNameNepali(currentUser.nameNepali || '');
      setPost(currentUser.post || '');
      setDesignationNepali(currentUser.designationNepali || '');
      setContactNumber(currentUser.contactNumber || '');
      setEmail(currentUser.email || (currentUser.username.toLowerCase() === 'reliableadmin' || currentUser.username.toLowerCase() === 'arpan' ? 'arpankhadka2057@gmail.com' : ''));
      setAddress(currentUser.address || '');
      setCitizenshipNumber(currentUser.citizenshipNumber || '');
      setIssueDate(currentUser.issueDate || '');
      setIssueDistrictAndOffice(currentUser.issueDistrictAndOffice || '');
      setFatherName(currentUser.fatherName || '');
      setMotherName(currentUser.motherName || '');
      setDateOfBirth(currentUser.dateOfBirth || '');
      setBloodGroup(currentUser.bloodGroup || '');
      setProfilePhoto(currentUser.profilePhoto || '');
      setPhotoApproved(currentUser.photoApproved ?? true);
      setStaffId(currentUser.staffId || '');
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setErrorMsg('Image size should be less than 3MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
        // If master admin uploads, auto approve. Otherwise mark as false (needs master admin approval)
        setPhotoApproved(isMasterAdmin);
        setErrorMsg('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setProfilePhoto('');
    setPhotoApproved(true);
  };

  const handleApprovePhotoDirectly = () => {
    setPhotoApproved(true);
    const updatedUser: AppUser = {
      ...currentUser,
      profilePhoto,
      photoApproved: true
    };
    onUpdateUser(updatedUser);
  };

  const handleRejectPhotoDirectly = () => {
    setProfilePhoto('');
    setPhotoApproved(false);
    const updatedUser: AppUser = {
      ...currentUser,
      profilePhoto: '',
      photoApproved: false
    };
    onUpdateUser(updatedUser);
  };

  const handleSavePersonalInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }

    const isNewPhoto = profilePhoto && profilePhoto !== currentUser.profilePhoto;
    const finalPhotoApproved = isMasterAdmin ? true : (isNewPhoto ? false : (currentUser.photoApproved ?? true));

    const updatedUser: AppUser = {
      ...currentUser,
      name: name.trim(),
      nameNepali: nameNepali.trim(),
      post: post.trim(),
      designationNepali: designationNepali.trim(),
      contactNumber: contactNumber.trim(),
      email: email.trim() || (isMasterAdmin ? 'arpankhadka2057@gmail.com' : undefined),
      address: address.trim(),
      citizenshipNumber: citizenshipNumber.trim(),
      issueDate: issueDate.trim(),
      issueDistrictAndOffice: issueDistrictAndOffice.trim(),
      fatherName: fatherName.trim(),
      motherName: motherName.trim(),
      dateOfBirth: dateOfBirth.trim(),
      bloodGroup: bloodGroup.trim(),
      profilePhoto: profilePhoto,
      photoApproved: finalPhotoApproved,
      staffId: staffId.trim()
    };

    onUpdateUser(updatedUser);
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newPassword.trim()) {
      setErrorMsg('Please enter a new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }

    const updatedUser: AppUser = {
      ...currentUser,
      password: newPassword.trim()
    };

    onUpdateUser(updatedUser);
    setPasswordSuccess(true);
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 max-h-[calc(100dvh-2rem)] overflow-y-auto my-auto space-y-5 relative scrollbar-thin">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 sticky top-0 bg-white z-10 pt-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center shrink-0">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800 font-display">My Profile & Security Settings</h3>
              <p className="text-xs text-slate-500">Manage your PP size photo, personal information, designation, and login password.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Badge Banner with Passport Photo Display */}
        <div className="bg-gradient-to-r from-sky-50 via-slate-50 to-blue-50 border border-sky-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-4">
            {/* PP Size Photo Box */}
            <div className="relative group shrink-0">
              <div className="w-16 h-20 rounded-xl overflow-hidden border-2 border-sky-400 shadow-xs bg-slate-100 flex items-center justify-center">
                {profilePhoto ? (
                  <img src={profilePhoto} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 p-1">
                    <User size={28} className="text-slate-300" />
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">No Photo</span>
                  </div>
                )}
              </div>
              <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 text-[8px] font-mono font-black bg-sky-700 text-white px-1.5 py-0.2 rounded-full shadow-xs whitespace-nowrap">
                PP SIZE
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-slate-900 text-base">{currentUser.name}</span>
                <span className="text-xs font-mono font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md">
                  @{currentUser.username}
                </span>
                {currentUser.staffId && (
                  <span className="text-xs font-mono font-black bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-md">
                    ID: {currentUser.staffId}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-2">
                <span>Role: <strong className="text-sky-700 font-bold">{currentUser.role}</strong></span>
                {currentUser.post && <span>• Post: <strong className="text-slate-800">{currentUser.post}</strong></span>}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer shrink-0"
          >
            <LogOut size={14} />
            <span>Logout Account</span>
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold p-3 rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Section 1: Personal Information */}
        <form onSubmit={handleSavePersonalInfo} className="space-y-4 border border-slate-150 rounded-xl p-4 bg-slate-50/50">
          <div className="flex items-center justify-between border-b border-slate-150 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 font-mono">
              <User size={14} className="text-indigo-600" />
              <span>Personal & Citizenship Details</span>
            </h4>
            {profileSuccess && (
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={12} />
                <span>Profile Saved</span>
              </span>
            )}
          </div>

          {/* PP Size Photo Uploader Card */}
          <div className="bg-sky-50/60 border border-sky-200/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-sky-950 flex items-center gap-1.5 font-mono uppercase tracking-wider">
                <Camera size={14} className="text-sky-600" />
                <span>Passport Size Photo (PP Size Image / फोटो)</span>
              </label>
              {profilePhoto && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded-md border border-rose-200"
                >
                  <Trash2 size={12} />
                  <span>Remove Photo</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-20 rounded-xl border-2 border-dashed border-sky-300 bg-white flex flex-col items-center justify-center shrink-0 overflow-hidden shadow-2xs relative">
                {profilePhoto ? (
                  <>
                    <img src={profilePhoto} alt="PP Size Preview" className="w-full h-full object-cover" />
                    {photoApproved === false && (
                      <span className="absolute top-0 right-0 bg-amber-500 text-white text-[7px] font-black uppercase px-1 py-0.2 rounded-bl-md shadow-2xs">
                        PENDING
                      </span>
                    )}
                  </>
                ) : (
                  <div className="text-center p-1 text-slate-400">
                    <User size={24} className="mx-auto text-slate-300" />
                    <span className="text-[8px] font-extrabold text-slate-400 uppercase">PP Size</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 bg-white hover:bg-sky-50 text-sky-900 border border-sky-300 text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer shadow-2xs">
                    <Upload size={13} className="text-sky-600" />
                    <span>{profilePhoto ? 'Change PP Photo' : 'Upload PP Size Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>

                  {profilePhoto && photoApproved === false && (
                    <div className="flex items-center gap-1.5 bg-amber-100/90 border border-amber-300 text-amber-900 px-2.5 py-1 rounded-xl text-[10px] font-bold">
                      <span>⏳ Photo Pending @reliableadmin Approval</span>
                      {isMasterAdmin && (
                        <div className="flex items-center gap-1 ml-1">
                          <button
                            type="button"
                            onClick={handleApprovePhotoDirectly}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded-md font-bold text-[9px] cursor-pointer shadow-2xs"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={handleRejectPhotoDirectly}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-2 py-0.5 rounded-md font-bold text-[9px] cursor-pointer shadow-2xs"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {profilePhoto && photoApproved !== false && (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-xl">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      <span>Photo Approved</span>
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-slate-500 leading-tight">
                  Upload a standard passport size photo. Photos uploaded by users require approval from <strong>@reliableadmin</strong> before being displayed system-wide. Max size: 3MB.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Staff ID Number */}
            <div className="space-y-1 sm:col-span-2 bg-amber-50/70 border border-amber-200 p-2.5 rounded-xl">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-amber-950 block font-mono uppercase tracking-wider">
                  Staff ID Number (कर्मचारी परिचय पत्र नं.)
                </label>
                {isMasterAdmin ? (
                  <span className="text-[9px] font-mono text-emerald-700 font-extrabold bg-emerald-100 px-1.5 py-0.2 rounded-md">
                    Editable by @reliableadmin
                  </span>
                ) : (
                  <span className="text-[9px] font-mono text-amber-700 font-extrabold bg-amber-100 px-1.5 py-0.2 rounded-md">
                    🔒 Editable only by @reliableadmin
                  </span>
                )}
              </div>
              <input 
                type="text"
                value={staffId}
                disabled={!isMasterAdmin}
                onChange={(e) => setStaffId(e.target.value)}
                placeholder="e.g. RT-EMP-001"
                className={`w-full border rounded-lg p-2 text-xs font-mono font-bold transition-colors ${
                  isMasterAdmin 
                    ? 'bg-white border-amber-300 text-amber-900 focus:outline-hidden focus:border-amber-500 shadow-2xs' 
                    : 'bg-slate-100/90 border-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-600 block">Full Name (English) *</label>
              <input 
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-hidden focus:border-indigo-500 font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-600 block">Name in Nepali (नाम नेपालीमा)</label>
              <input 
                type="text"
                value={nameNepali}
                onChange={(e) => setNameNepali(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-hidden text-slate-800 font-semibold"
                placeholder="e.g. श्री अर्पण खड्का"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-600 block">Post / Designation (English)</label>
              <input 
                type="text"
                value={post}
                onChange={(e) => setPost(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-hidden"
                placeholder="e.g. Accountant, Senior Tech"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-600 block">Designation in Nepali (पद नेपालीमा)</label>
              <input 
                type="text"
                value={designationNepali}
                onChange={(e) => setDesignationNepali(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-hidden text-slate-800"
                placeholder="e.g. अध्यक्ष (प्रबन्ध निर्देशक)"
              />
            </div>

            {/* Email Address for OTP & System Verification */}
            <div className="space-y-1 sm:col-span-2 bg-sky-50/50 border border-sky-200/80 p-2.5 rounded-xl">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-sky-950 block font-mono uppercase tracking-wider flex items-center gap-1.5">
                  <Mail size={12} className="text-sky-600" />
                  <span>Email Address (for Login OTP & System Verification) *</span>
                </label>
                {isMasterAdmin ? (
                  <span className="text-[9px] font-mono text-sky-800 font-extrabold bg-sky-100 border border-sky-300 px-1.5 py-0.2 rounded-md">
                    Default: arpankhadka2057@gmail.com
                  </span>
                ) : (
                  <span className="text-[9px] font-mono text-slate-600 font-bold bg-white border border-slate-200 px-1.5 py-0.2 rounded-md">
                    Compulsory for 2FA OTP
                  </span>
                )}
              </div>
              <div className="relative">
                <Mail size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sky-500" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-sky-200 rounded-lg pl-8 pr-2 py-2 text-xs bg-white text-slate-900 font-semibold focus:outline-hidden focus:border-sky-500 shadow-2xs"
                  placeholder="e.g. yourname@gmail.com"
                />
              </div>
              <p className="text-[9px] text-sky-900/70 font-medium leading-tight">
                🔒 A 6-digit one-time password (OTP) will be dispatched to this email address whenever logging into your account.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-600 block">Contact Number</label>
              <div className="relative">
                <Phone size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg pl-8 pr-2 py-2 text-xs bg-white focus:outline-hidden font-mono"
                  placeholder="+977-98..."
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-600 block">Residential Address</label>
              <div className="relative">
                <MapPin size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg pl-8 pr-2 py-2 text-xs bg-white focus:outline-hidden"
                  placeholder="e.g. Fikkal Bazar, Ilam"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-600 block">Citizenship Number</label>
              <div className="relative">
                <CreditCard size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  value={citizenshipNumber}
                  onChange={(e) => setCitizenshipNumber(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg pl-8 pr-2 py-2 text-xs bg-white focus:outline-hidden font-mono"
                  placeholder="e.g. 10-01-78-1234"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-600 block">Issue Date (B.S.) & District</label>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-hidden font-mono"
                  placeholder="YYYY-MM-DD"
                />
                <input 
                  type="text"
                  value={issueDistrictAndOffice}
                  onChange={(e) => setIssueDistrictAndOffice(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-hidden"
                  placeholder="e.g. DAO Ilam"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
            >
              <Save size={13} />
              <span>Save Personal Information</span>
            </button>
          </div>
        </form>

        {/* Section 2: Change Password */}
        <form onSubmit={handleChangePassword} className="space-y-4 border border-slate-150 rounded-xl p-4 bg-slate-50/50">
          <div className="flex items-center justify-between border-b border-slate-150 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 font-mono">
              <Lock size={14} className="text-indigo-600" />
              <span>Change Password</span>
            </h4>
            {passwordSuccess && (
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={12} />
                <span>Password Updated</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-600 block">New Password *</label>
              <input 
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-hidden font-mono"
                placeholder="Enter new password"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-slate-600 block">Confirm New Password *</label>
              <input 
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2 text-xs bg-white focus:outline-hidden font-mono"
                placeholder="Re-enter new password"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer"
            >
              <Key size={13} />
              <span>Update Password</span>
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>System User ID: <strong className="font-mono text-slate-600">{currentUser.id}</strong></span>
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
