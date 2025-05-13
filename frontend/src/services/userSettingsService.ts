import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

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
  testId: string,
  testName: string,
  score: number,
  totalQuestions: number
): Promise<void> => {
  try {
    // Get user settings to find notification emails
    const settings = await getUserSettings(userId);
    
    if (!settings.notificationEmails || settings.notificationEmails.length === 0) {
      console.log('No notification emails configured, skipping notifications');
      return;
    }
    
    // This would be where you'd call a serverless function to send the emails
    // For now, we'll just log the notification
    console.log(`Would send test completion notification to: ${settings.notificationEmails.join(', ')}`);
    console.log(`Test: ${testName}, Score: ${score}/${totalQuestions}`);
    
    // In a real implementation, you might do:
    // await callServerlessFunction('sendTestNotifications', {
    //   emails: settings.notificationEmails,
    //   testName,
    //   score,
    //   totalQuestions,
    //   userId
    // });
  } catch (error) {
    console.error('Error sending test notifications:', error);
  }
};