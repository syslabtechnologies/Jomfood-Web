import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';

/**
 * Hook to manage notification permission state
 * Shows modal on every page until permission is granted
 */
export const useNotificationPermission = () => {
  const [showModal, setShowModal] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const location = useLocation();
  const { user } = useUser();

  useEffect(() => {
    const checkPermission = async () => {
      setIsChecking(true);
      
      // Priority 1: If user is logged in without phone, let phone modal show first
      const phoneModalDismissed = sessionStorage.getItem('phoneModalDismissed');
      if (user && !user.phone && !phoneModalDismissed) {
        console.log('Phone number needs to be added first, skipping notification modal');
        setIsChecking(false);
        return;
      }
      
      // Check if browser supports notifications
      if (!('Notification' in window)) {
        console.log('Notifications not supported in this browser');
        setIsChecking(false);
        return;
      }

      // Check current permission status
      const currentPermission = Notification.permission;
      
      // If permission is already granted, don't show modal
      if (currentPermission === 'granted') {
        console.log('Notification permission already granted');
        localStorage.setItem('notificationPermissionRequested', 'granted');
        setIsChecking(false);
        return;
      }

      // Check if we've stored a "granted" status in localStorage
      // OR if permission was explicitly denied
      const storedStatus = localStorage.getItem('notificationPermissionRequested');
      if (storedStatus === 'granted') {
        console.log('Notification permission was previously granted');
        setIsChecking(false);
        return;
      }
      
      // If permission was explicitly denied by user, respect that
      if (currentPermission === 'denied') {
        console.log('Notification permission was denied');
        localStorage.setItem('notificationPermissionRequested', 'denied');
        setIsChecking(false);
        return;
      }

      // Only show modal if permission is still in 'default' state
      // Don't show if user has explicitly denied or if it's been dismissed recently
      if (currentPermission === 'default' && storedStatus !== 'denied') {
        const wasDismissed = storedStatus === 'dismissed';
        const delay = wasDismissed ? 2000 : 1000; // Longer delay if just dismissed

        // Show modal on every page visit until permission is granted or denied
        setTimeout(() => {
          setShowModal(true);
          setIsChecking(false);
        }, delay);
      } else {
        setIsChecking(false);
      }
    };

    checkPermission();
  }, [user]); // Re-check when user changes

  const handleClose = () => {
    setShowModal(false);
    // Don't store dismissed status - we want to show again on next page
    // Only store if permission was actually granted or denied
  };

  return {
    showModal,
    isChecking,
    handleClose,
  };
};

