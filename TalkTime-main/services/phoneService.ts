import { Linking, Platform, PermissionsAndroid } from 'react-native';
import * as Contacts from 'expo-contacts';

type CallTrackingCallback = (durationSeconds: number) => void;

class PhoneService {
  private callStartTime: number | null = null;
  private onCallEndCallback: CallTrackingCallback | null = null;
  private isTracking = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private wasInBackground = false;

  /**
   * Request phone permissions on Android
   */
  async requestPhonePermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      // Request READ_PHONE_STATE permission for call state monitoring
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        {
          title: 'Phone Permission',
          message: 'This app needs access to your phone state to track call duration.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Phone permission error:', err);
      return false;
    }
  }

  /**
   * Check if phone permissions are granted
   */
  async hasPhonePermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    try {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE
      );
      return granted;
    } catch (err) {
      console.warn('Permission check error:', err);
      return false;
    }
  }

  /**
   * Initiate a call and track duration
   */
  async initiateCall(
    phoneNumber: string,
    onCallEnd: CallTrackingCallback,
  ): Promise<{ success: boolean; error?: string }> {
    // Check permissions first
    const hasPermission = await this.hasPhonePermissions();
    if (!hasPermission) {
      const granted = await this.requestPhonePermissions();
      if (!granted) {
        return { 
          success: false, 
          error: 'Phone permission is required to track call duration.' 
        };
      }
    }

    const cleaned = phoneNumber.replace(/\s/g, '');
    const url = `tel:${cleaned}`;

    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      return { success: false, error: 'This device cannot make phone calls.' };
    }

    this.onCallEndCallback = onCallEnd;
    this.startTracking();

    await Linking.openURL(url);
    return { success: true };
  }

  private startTracking() {
    if (this.isTracking) this.stopTracking();
    
    this.isTracking = true;
    this.callStartTime = null; // Will be set when call actually starts
    this.wasInBackground = false;

    // Start monitoring - check every second
    this.checkInterval = setInterval(() => {
      this.checkCallState();
    }, 1000);
  }

  private checkCallState() {
    // On Android, when user makes a call, the app goes to background
    // We detect this and start the timer
    const { AppState } = require('react-native');
    const currentState = AppState.currentState;

    if (currentState === 'background' || currentState === 'inactive') {
      // App is in background - call is likely active
      if (!this.wasInBackground && this.callStartTime === null) {
        // Call just started
        this.callStartTime = Date.now();
        this.wasInBackground = true;
      }
    } else if (currentState === 'active') {
      // App came back to foreground
      if (this.wasInBackground && this.callStartTime !== null) {
        // Call ended, calculate duration
        const elapsed = Math.floor((Date.now() - this.callStartTime) / 1000);
        this.stopTracking();
        
        // Only report if meaningful duration (>3s)
        if (elapsed >= 3 && this.onCallEndCallback) {
          this.onCallEndCallback(elapsed);
        }
      }
    }
  }

  stopTracking() {
    this.isTracking = false;
    this.callStartTime = null;
    this.wasInBackground = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Format seconds into "Xm Ys" or "Xs" string
   */
  static formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
}

export { PhoneService };
export const phoneService = new PhoneService();
