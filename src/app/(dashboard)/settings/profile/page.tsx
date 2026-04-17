'use client';

import { useEffect, useState, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { 
  UserIcon, 
  KeyIcon, 
  EnvelopeIcon, 
  CloudArrowUpIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  CameraIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  system_role: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    oldPassword: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await apiFetch<UserProfile>('/users/me');
      setProfile(data);
      setFormData(prev => ({ ...prev, name: data.name }));
    } catch (err: any) {
      toast.error(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setUpdating(true);
    try {
      const updatePayload: any = { name: formData.name };
      if (formData.password) {
        updatePayload.password = formData.password;
        updatePayload.old_password = formData.oldPassword;
      }

      const updated = await apiFetch<UserProfile>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(updatePayload),
      });

      setProfile(updated);
      setFormData(prev => ({ ...prev, oldPassword: '', password: '', confirmPassword: '' }));
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const processFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar must be less than 5MB');
      return;
    }

    setUploading(true);
    const form = new FormData();
    form.append('avatar', file);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/users/me/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: form,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload avatar');
      }

      const updated = await response.json();
      setProfile(updated);
      toast.success('Avatar updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFileUpload(file);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <ArrowPathIcon className="h-6 w-6 text-gray-500 animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-8 border-b border-gray-800/60 pb-10">
        <div 
          className="relative group shrink-0"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className={`
            h-32 w-32 rounded-2xl bg-gray-900 border-2 transition-all duration-200 flex items-center justify-center overflow-hidden
            ${isDragging ? 'border-blue-500 bg-blue-500/10 scale-105' : 'border-gray-800 group-hover:border-gray-700'}
            ${uploading ? 'opacity-50' : ''}
          `}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} className="h-full w-full object-cover" />
            ) : (
              <UserIcon className={`h-14 w-14 transition-colors ${isDragging ? 'text-blue-500' : 'text-gray-600'}`} />
            )}
            
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <ArrowPathIcon className="h-8 w-8 text-white animate-spin" />
              </div>
            )}

            {/* Drag Overlay */}
            {isDragging && !uploading && (
              <div className="absolute inset-0 bg-blue-600/20 backdrop-blur-sm flex flex-col items-center justify-center animate-pulse">
                <CloudArrowUpIcon className="h-8 w-8 text-white" />
                <span className="text-[10px] font-black text-white uppercase mt-1">Drop to Upload</span>
              </div>
            )}

            {/* Hover Action */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-gray-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1"
            >
              <CameraIcon className="h-7 w-7 text-white" />
              <span className="text-[9px] font-black text-white uppercase tracking-tighter">Change Photo</span>
            </button>
          </div>
          
          {/* Action indicator for first-time users */}
          {!profile.avatar_url && !isDragging && (
            <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center border-2 border-gray-950 shadow-xl">
               <CameraIcon className="h-3 w-3 text-white" />
            </div>
          )}

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarUpload} 
            className="hidden" 
            accept="image/*"
          />
        </div>

        <div className="space-y-4 flex-grow">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-white tracking-tight">{profile.name}</h1>
            <div className="flex items-center gap-3">
               <span className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                 <EnvelopeIcon className="h-4 w-4" />
                 {profile.email}
               </span>
               <span className="h-1 w-1 bg-gray-800 rounded-full" />
               <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                 {profile.system_role?.replace('_', ' ') || 'USER'}
               </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 pt-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2"
            >
              <CloudArrowUpIcon className="h-4 w-4" />
              Update Photo
            </button>
            <p className="text-[10px] text-gray-600 font-medium">Drag and drop or click to upload. Max 5MB.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-10">
          <form onSubmit={handleUpdateProfile} className="space-y-10">
            {/* Personal Info Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">General Information</h2>
                <div className="h-px bg-gray-800 flex-grow" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder="Your legal name"
                  />
                  <p className="text-[10px] text-gray-600">This will be visible to your teammates across all workspaces.</p>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      readOnly
                      value={profile.email}
                      className="w-full bg-gray-900 border border-transparent rounded-lg px-4 py-3 text-sm text-gray-500 outline-none cursor-not-allowed italic"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-600 uppercase tracking-widest">Locked</div>
                  </div>
                  <p className="text-[10px] text-gray-600">Contact admin to change your registered email.</p>
                </div>
              </div>
            </section>

            {/* Security Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">Security & Privacy</h2>
                <div className="h-px bg-gray-800 flex-grow" />
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Password</label>
                    <input
                      type="password"
                      value={formData.oldPassword}
                      onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
                      placeholder="Enter current password"
                      required={!!formData.password}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">New Password</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
                      placeholder="••••••••"
                      minLength={8}
                    />
                  </div>
                  
                  {formData.password && (
                    <div className="space-y-2 animate-in fade-in duration-300">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Confirm Password</label>
                      <input
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 outline-none transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  )}
                </div>
                {!formData.password && (
                  <p className="text-[10px] text-gray-600">Leave the password fields blank if you do not wish to change your current password.</p>
                )}
              </div>
            </section>

            <div className="flex justify-end pt-6 border-t border-gray-800/60">
              <button
                type="submit"
                disabled={updating}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-xl shadow-blue-500/10 active:translate-y-px transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {updating ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircleIcon className="h-4 w-4" />
                )}
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-gray-950 border border-gray-800 rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-4">Account Status</h3>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-gray-500">Profile Completion</span>
                <span className="font-bold text-white">{profile.avatar_url ? '100%' : '75%'}</span>
              </div>
              <div className="h-1 bg-gray-900 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-700 ${profile.avatar_url ? 'bg-blue-500' : 'bg-blue-600/40'}`}
                  style={{ width: profile.avatar_url ? '100%' : '75%' }}
                />
              </div>
            </div>
            
            <div className="space-y-3">
               <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Resources</h3>
               <nav className="flex flex-col gap-2">
                 <a href="/admin/users" className="text-xs text-gray-500 hover:text-blue-500 transition-colors flex items-center gap-2 group">
                   <span className="h-1.5 w-1.5 rounded-full bg-gray-800 group-hover:bg-blue-500 transition-colors" />
                   Organization Management
                 </a>
               </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
