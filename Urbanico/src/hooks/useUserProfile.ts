import { useState, useCallback } from 'react';
import { UserProfile, ActivityDelivery } from '../types';
import { useToast } from '../context/ToastContext';
import { soundService } from '../utils/soundHelper';

export interface UseUserProfileOptions {
  user: UserProfile;
  onUpdateUser: (data: Partial<UserProfile>) => void;
  onLogout: () => void;
}

export function useUserProfile({ user, onUpdateUser, onLogout }: UseUserProfileOptions) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses' | 'settings'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    companyName: user.companyName || '',
    gstin: user.gstin || '',
  });

  const handleSaveProfile = useCallback(() => {
    if (!formData.name.trim()) {
      showToast('Please enter a valid name', 'error');
      return;
    }
    onUpdateUser({
      name: formData.name.trim(),
      email: formData.email.trim(),
      companyName: formData.companyName.trim(),
      gstin: formData.gstin.trim(),
    });
    soundService.playSuccess();
    showToast('Profile updated successfully', 'success');
    setIsEditing(false);
  }, [formData, onUpdateUser, showToast]);

  const handleCancelEdit = useCallback(() => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      companyName: user.companyName || '',
      gstin: user.gstin || '',
    });
    setIsEditing(false);
  }, [user]);

  return {
    activeTab,
    setActiveTab,
    isEditing,
    setIsEditing,
    formData,
    setFormData,
    handleSaveProfile,
    handleCancelEdit,
    onLogout,
  };
}
