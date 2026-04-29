import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import PhoneRequiredModal from './PhoneRequiredModal';

const PhoneNumberCheck = () => {
  const { user, updateProfile } = useUser();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Check if user dismissed the modal in this session
    const dismissed = sessionStorage.getItem('phoneModalDismissed');
    
    // Check if user is logged in and doesn't have a phone number
    if (user && !user.phone && !dismissed) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [user]);

  const handlePhoneSubmit = async (phone) => {
    try {
      await updateProfile({ phone });
      setShowModal(false);
      // Clear dismissal flag since phone was added
      sessionStorage.removeItem('phoneModalDismissed');
    } catch (error) {
      throw error;
    }
  };

  const handleClose = () => {
    // Remember that user dismissed the modal for this session
    sessionStorage.setItem('phoneModalDismissed', 'true');
    setShowModal(false);
  };

  return (
    <PhoneRequiredModal
      isOpen={showModal}
      onClose={handleClose}
      onSubmit={handlePhoneSubmit}
      userName={user?.name}
    />
  );
};

export default PhoneNumberCheck;

