/**
 * App Constants
 * Central location for all app-wide constants
 */

export const COLORS = {
  primary: '#4A90E2',
  secondary: '#50C878',
  danger: '#E74C3C',
  warning: '#F39C12',
  background: '#F5F5F5',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#7F8C8D',
  lightGray: '#BDC3C7',
  darkGray: '#2C3E50',
  success: '#27AE60',
  transparent: 'transparent',
};

export const FONTS = {
  regular: 'System',
  bold: 'System',
  light: 'System',
};

export const SIZES = {
  // Font sizes
  h1: 32,
  h2: 24,
  h3: 20,
  h4: 16,
  body: 14,
  caption: 12,
  
  // Spacing
  padding: 16,
  margin: 16,
  radius: 8,
  
  // Icon sizes
  icon: 24,
  iconLarge: 32,
  iconSmall: 16,
};

export const CALCULATOR_PASSCODE = {
  // Default passcode: 911 (3-digit PIN for demo purposes)
  DEFAULT: '911',
  LENGTH: 3, // Exactly 3 digits required
  NUMERIC_ONLY: true,
};

export const EMERGENCY_CONTACTS = {
  MAX_CONTACTS: 5,
  MIN_CONTACTS: 1,
};

export const RESOURCE_TYPES = {
  POLICE: 'police',
  SHELTER: 'shelter',
  HOSPITAL: 'hospital',
  COUNSELING: 'counseling',
  LEGAL: 'legal',
};

export const ALERT_MESSAGES = {
  DEFAULT_TEMPLATE: `🚨 EMERGENCY ALERT 🚨
{userName} needs IMMEDIATE help!

📞 CALL NOW:
{userPhone}

📍 TAP FOR MAP:
geo:{latitude},{longitude}

Not working? Copy this:
{latitude}, {longitude}
Paste into Google Maps

Or use: https://maps.google.com/?q={latitude},{longitude}

Time: {time}
Date: {date}

PLEASE HURRY!`,
};

export const DATABASE = {
  NAME: 'safepath.db',
  VERSION: 1,
};

export const STORAGE_KEYS = {
  PASSCODE: 'app_passcode',
  EMERGENCY_CONTACTS: 'emergency_contacts',
  USER_PROFILE: 'user_profile',
  FIRST_LAUNCH: 'first_launch',
  USER_NAME: 'user_name',
  USER_PHONE: 'user_phone',
};

export const PERMISSIONS = {
  LOCATION: 'location',
  SMS: 'sms',
  PHONE_STATE: 'phone_state',
};

export const APP_CONFIG = {
  GPS_TIMEOUT: 15000, // 15 seconds
  GPS_MAX_AGE: 10000, // 10 seconds
  GPS_HIGH_ACCURACY: true,
  SMS_MAX_LENGTH: 160, // Standard SMS length
};
