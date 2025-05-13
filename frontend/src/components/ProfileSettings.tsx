import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthProvider';
import {
  getUserSettings,
  saveUserSettings,
  DEFAULT_SETTINGS,
  UserSettings,
} from "../services/userSettingsService";
import eventBus, { EVENTS } from '../services/eventBus';
import './ProfileSettings.css';

// Use UserSettings interface from userSettingsService.ts

// Generate a consistent color based on a string
const getAvatarColor = (str: string): string => {
  // List of nice colors
  const colors = [
    '#3498db', '#2ecc71', '#9b59b6', '#e74c3c', '#f1c40f',
    '#1abc9c', '#34495e', '#e67e22', '#7f8c8d', '#27ae60',
    '#2980b9', '#8e44ad', '#c0392b', '#d35400', '#16a085'
  ];

  // Simple hash function
  let hash = 0;
  if (str.length === 0) return colors[0];
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }

  // Use the hash to pick a color
  return colors[Math.abs(hash) % colors.length];
};

const ProfileSettings: React.FC = () => {
  const { currentUser, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [newEmail, setNewEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Calculate avatar color based on email
  const avatarColor = currentUser?.email ? getAvatarColor(currentUser.email) : '#3498db';

  // Debug logging
  useEffect(() => {
    if (currentUser) {
      console.log('Current user info:', {
        displayName: currentUser.displayName,
        email: currentUser.email,
        photoURL: currentUser.photoURL,
        uid: currentUser.uid
      });
    }
  }, [currentUser]);

  // Load user settings when component mounts
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!currentUser) return;

      try {
        const userSettings = await getUserSettings(currentUser.uid);
        setSettings(userSettings);
      } catch (error) {
        console.error('Error loading user settings:', error);
      }
    };

    loadUserSettings();
  }, [currentUser]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Save user settings
  const saveSettings = async () => {
    if (!currentUser) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Save settings using the service
      await saveUserSettings(currentUser.uid, settings);
      
      // Emit an event to notify other components
      eventBus.emit(EVENTS.USER_SETTINGS_UPDATED, settings);
      
      setSaveMessage({ text: 'Settings saved successfully!', type: 'success' });
      
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage({ text: 'Failed to save settings.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Add email to notification list
  const addEmail = () => {
    if (!newEmail || !newEmail.includes('@') || settings.notificationEmails.includes(newEmail)) {
      return;
    }

    setSettings({
      ...settings,
      notificationEmails: [...settings.notificationEmails, newEmail]
    });
    setNewEmail('');
  };

  // Remove email from notification list
  const removeEmail = (email: string) => {
    setSettings({
      ...settings,
      notificationEmails: settings.notificationEmails.filter(
        (e: string) => e !== email
      ),
    });
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="profile-settings-container">
      <button
        className="profile-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Profile Settings"
      >
        <div
          className="profile-avatar"
          style={{ backgroundColor: avatarColor }}
        >
          {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : "?"}
        </div>
      </button>

      {isOpen && (
        <div className="profile-popup" ref={popupRef}>
          <div className="profile-header">
            <h3>Profile Settings</h3>
            <div className="user-info">
              <div
                className="profile-avatar-large"
                style={{ backgroundColor: avatarColor }}
              >
                {currentUser.email
                  ? currentUser.email.charAt(0).toUpperCase()
                  : "?"}
              </div>
              <div className="user-details">
                <p className="user-name">{currentUser.displayName}</p>
                <p className="user-email">{currentUser.email}</p>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h4>Test Settings</h4>

            <div className="setting-item">
              <label htmlFor="questionCount">Default Questions Per Test:</label>
              <input
                id="questionCount"
                type="number"
                min="1"
                max="50"
                value={settings.defaultQuestionCount}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultQuestionCount: Math.max(
                      1,
                      Math.min(50, parseInt(e.target.value) || 10)
                    ),
                  })
                }
              />
            </div>

            <div className="setting-item">
              <label htmlFor="timePerQuestion">Seconds Per Question:</label>
              <input
                id="timePerQuestion"
                type="number"
                min="10"
                max="300"
                value={settings.secondsPerQuestion}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    secondsPerQuestion: Math.max(
                      10,
                      Math.min(300, parseInt(e.target.value) || 60)
                    ),
                  })
                }
              />
            </div>
          </div>

          <div className="settings-section">
            <h4>Notification Emails</h4>
            <p className="notification-description">
              Test results will be sent to these email addresses
            </p>

            <div className="email-input-container">
              <input
                type="email"
                placeholder="Add email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addEmail()}
              />
              <button className="add-email-button" onClick={addEmail}>
                Add
              </button>
            </div>

            <div className="email-list">
              {settings.notificationEmails.length === 0 ? (
                <p className="no-emails">No notification emails added</p>
              ) : (
                settings.notificationEmails.map((email: string) => (
                  <div key={email} className="email-item">
                    <span>{email}</span>
                    <button
                      className="remove-email-button"
                      onClick={() => removeEmail(email)}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="profile-actions">
            {saveMessage && (
              <p className={`save-message ${saveMessage.type}`}>
                {saveMessage.text}
              </p>
            )}
            <button
              className="save-settings-button"
              onClick={saveSettings}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
            <button className="sign-out-button" onClick={signOut}>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;