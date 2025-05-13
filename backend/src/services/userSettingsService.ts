import { getFirebaseAdmin } from '../config/firebase';

// Define default user settings
export const DEFAULT_SETTINGS = {
  defaultQuestionCount: 10,
  notificationEmails: [],
  darkMode: false,
};

// Define UserSettings interface
export interface UserSettings {
  defaultQuestionCount: number;
  notificationEmails: string[];
  email?: string;
  darkMode: boolean;
}

/**
 * User Settings Service
 * Handles reading and managing user settings
 */
export default {
  /**
   * Get user settings from Firestore
   * @param userId User ID
   * @returns Promise<UserSettings> User settings object
   */
  async getUserSettings(userId: string): Promise<UserSettings> {
    try {
      const db = getFirebaseAdmin().firestore();
      const settingsDoc = await db.collection('userSettings').doc(userId).get();
      
      if (settingsDoc.exists) {
        const data = settingsDoc.data() as UserSettings;
        return {
          ...DEFAULT_SETTINGS,
          ...data,
        };
      } else {
        // Return default settings if none exist yet
        return DEFAULT_SETTINGS;
      }
    } catch (error) {
      console.error('Error getting user settings:', error);
      // Return default settings in case of error
      return DEFAULT_SETTINGS;
    }
  },
  
  /**
   * Get user's email and notification preferences
   * @param userId User ID
   * @returns Promise<{email?: string, notificationEmails: string[]}> User email preferences
   */
  async getUserEmailInfo(userId: string): Promise<{email?: string, notificationEmails: string[]}> {
    try {
      // Get user settings which may include email and notification preferences
      const settings = await this.getUserSettings(userId);
      
      // If email isn't in settings, try to get it from Firebase Auth
      if (!settings.email) {
        try {
          const auth = getFirebaseAdmin().auth();
          const userRecord = await auth.getUser(userId);
          
          if (userRecord.email) {
            settings.email = userRecord.email;
            
            // Update settings with email from Auth
            const db = getFirebaseAdmin().firestore();
            await db.collection('userSettings').doc(userId).set(
              { email: userRecord.email },
              { merge: true }
            );
          }
        } catch (authError) {
          console.error('Error getting user email from Auth:', authError);
        }
      }
      
      return {
        email: settings.email,
        notificationEmails: settings.notificationEmails || [],
      };
    } catch (error) {
      console.error('Error getting user email info:', error);
      return { notificationEmails: [] };
    }
  },
};