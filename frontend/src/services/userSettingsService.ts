import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import api, { WrongAnswer } from './api';

export interface UserSettings {
  defaultQuestionCount: number;
  secondsPerQuestion: number;
  notificationEmails: string[];
}

// Default settings values
export const DEFAULT_SETTINGS: UserSettings = {
  defaultQuestionCount: 10,
  secondsPerQuestion: 60,
  notificationEmails: []
};

/**
 * Get user settings from Firestore
 */
export const getUserSettings = async (userId: string): Promise<UserSettings> => {
  try {
    const userDocRef = doc(db, 'userSettings', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as UserSettings;
      return {
        defaultQuestionCount: userData.defaultQuestionCount || DEFAULT_SETTINGS.defaultQuestionCount,
        secondsPerQuestion: userData.secondsPerQuestion || DEFAULT_SETTINGS.secondsPerQuestion,
        notificationEmails: userData.notificationEmails || []
      };
    }

    // Return default settings if no settings found
    return { ...DEFAULT_SETTINGS };
  } catch (error) {
    console.error('Error getting user settings:', error);
    // Return default settings in case of error
    return { ...DEFAULT_SETTINGS };
  }
};

/**
 * Save user settings to Firestore
 */
export const saveUserSettings = async (userId: string, settings: UserSettings): Promise<void> => {
  try {
    const userDocRef = doc(db, 'userSettings', userId);
    await setDoc(userDocRef, settings);
    console.log('User settings saved successfully');
  } catch (error) {
    console.error('Error saving user settings:', error);
    throw error;
  }
};

/**
 * Send test attempt notifications to the specified email addresses
 */
export const sendTestAttemptNotifications = async (
  userId: string,
  attemptId: string,
  testId: string,
  testName: string,
  score: number,
  totalQuestions: number,
  allocatedTime: number,
  timeTaken: number,
  wrongAnswers?: WrongAnswer[],
  userName?: string
): Promise<boolean> => {
  try {
    console.log('[userSettingsService] Sending test attempt notification email');
    
    // Call the backend API endpoint to send the email
    const response = await api.sendTestAttemptEmail(
      userId,
      attemptId,
      testId,
      testName,
      score,
      totalQuestions,
      allocatedTime,
      timeTaken,
      wrongAnswers,
      userName
    );
    
    if (response.error) {
      console.error('[userSettingsService] Error sending test attempt email:', response.error);
      return false;
    }
    
    console.log('[userSettingsService] Test attempt email sent successfully');
    return true;
  } catch (error) {
    console.error('[userSettingsService] Error sending test attempt email:', error);
    return false;
  }
};