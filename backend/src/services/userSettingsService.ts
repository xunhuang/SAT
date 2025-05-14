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
   * Check if a user is new (doesn't have settings yet)
   * @param userId User ID
   * @returns Promise<boolean> True if user is new, false otherwise
   */
  async isNewUser(userId: string): Promise<boolean> {
    try {
      const db = getFirebaseAdmin().firestore();
      const settingsDoc = await db.collection('userSettings').doc(userId).get();
      
      // User is new if they don't have settings yet
      return !settingsDoc.exists;
    } catch (error) {
      console.error('Error checking if user is new:', error);
      // Default to false in case of error
      return false;
    }
  },

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

  /**
   * Initialize a new user's settings
   * @param userId User ID
   * @returns Promise<UserSettings> The initialized user settings
   */
  async initializeNewUser(userId: string): Promise<UserSettings> {
    try {
      // Check if user already has settings
      const isNew = await this.isNewUser(userId);
      
      if (!isNew) {
        // User already has settings, just return them
        return this.getUserSettings(userId);
      }
      
      // Get user's email from Firebase Auth
      let email: string | undefined;
      try {
        const auth = getFirebaseAdmin().auth();
        const userRecord = await auth.getUser(userId);
        email = userRecord.email;
      } catch (authError) {
        console.error('Error getting user email from Auth:', authError);
      }
      
      // Create initial settings with email if available
      const initialSettings: UserSettings = {
        ...DEFAULT_SETTINGS,
        notificationEmails: email ? [email] : [],
        email: email,
      };
      
      // Save settings to Firestore
      const db = getFirebaseAdmin().firestore();
      await db.collection('userSettings').doc(userId).set(initialSettings);
      
      console.log(`Initialized settings for new user: ${userId}`);
      return initialSettings;
    } catch (error) {
      console.error('Error initializing new user:', error);
      // Return default settings in case of error
      return DEFAULT_SETTINGS;
    }
  },
};