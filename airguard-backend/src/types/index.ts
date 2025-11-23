// User Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  country: string | null;
  phoneNumber: string | null;
  companyName: string | null;
  industry: string | null;
  businessType: string | null;
  hearAboutUs: string | null;
  nonGovernmentEndUser: boolean;
  acceptTerms: boolean;
  newsPromotions: boolean;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string | null;
}

// User Settings Types
export interface UserSettings {
  id: string;
  userId: string;
  openaiApiKey: string | null;
  anthropicApiKey: string | null;
  theme: string;
  language: string;
  notifications: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserSettingsData {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  theme?: string;
  language?: string;
  notifications?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: string;
}

export interface UpdateUserSettingsData {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  theme?: string;
  language?: string;
  notifications?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  country?: string;
  phoneNumber?: string;
  companyName?: string;
  industry?: string;
  businessType?: string;
  hearAboutUs?: string;
  nonGovernmentEndUser?: boolean;
  acceptTerms: boolean;
  newsPromotions?: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

// Organization Types
export interface Organization {
  id: string;
  name: string;
  createdAt: Date;
  ownerId: string;
}

export interface CreateOrganizationData {
  name: string;
  ownerId: string;
}

// Device Types
export interface Device {
  id: string;
  name: string;
  deviceType: string | null;
  firmwareVersion: string | null;
  latitude: any | null; // Prisma Decimal type
  longitude: any | null; // Prisma Decimal type
  locationDescription: string | null;
  status: string;
  batteryLevel: number | null;
  lastSeen: Date | null;
  // IMU Sensor Data
  accelerometerX: number | null;
  accelerometerY: number | null;
  accelerometerZ: number | null;
  gyroscopeX: number | null;
  gyroscopeY: number | null;
  gyroscopeZ: number | null;
  temperature: number | null;
  // Dongle Session Info
  dongleBatchId: string | null;
  dongleSessionMs: number | null;
  dongleSampleCount: number | null;
  // Dongle Timestamp Info
  dongleDateYMD: number | null;
  dongleTimeHMS: number | null;
  dongleMsec: number | null;
  // Dongle GPS Info
  dongleGpsFix: number | null;
  dongleSatellites: number | null;
  setupComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
}

export interface CreateDeviceData {
  name: string;
  deviceType?: string | null;
  firmwareVersion?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  locationDescription?: string | null;
  organizationId: string;
}

export interface UpdateDeviceData {
  name?: string;
  deviceType?: string;
  firmwareVersion?: string;
  latitude?: number;
  longitude?: number;
  locationDescription?: string;
  status?: 'online' | 'offline' | 'warning';
  batteryLevel?: number;
  // IMU Sensor Data
  accelerometerX?: number;
  accelerometerY?: number;
  accelerometerZ?: number;
  gyroscopeX?: number;
  gyroscopeY?: number;
  gyroscopeZ?: number;
  temperature?: number;
  // Dongle Session Info
  dongleBatchId?: string;
  dongleSessionMs?: number;
  dongleSampleCount?: number;
  // Dongle Timestamp Info
  dongleDateYMD?: number;
  dongleTimeHMS?: number;
  dongleMsec?: number;
  // Dongle GPS Info
  dongleGpsFix?: number;
  dongleSatellites?: number;
  setupComplete?: boolean;
}

// Device Metrics Types
export interface DeviceMetric {
  id: string;
  metricType: string;
  value: any; // Prisma Decimal type
  unit: string | null;
  timestamp: Date;
  deviceId: string;
}

export interface CreateMetricData {
  metricType: string;
  value: number;
  unit?: string | null;
  deviceId: string;
}

// Network Health Types
export interface NetworkHealth {
  id: string;
  healthIndex?: number;
  throughputMbps?: number;
  qosScore?: number;
  interferenceDbm?: number;
  predictedLoadPercent?: number;
  timestamp: Date;
  organizationId: string;
}

export interface CreateNetworkHealthData {
  healthIndex?: number;
  throughputMbps?: number;
  qosScore?: number;
  interferenceDbm?: number;
  predictedLoadPercent?: number;
  organizationId: string;
}

// Alert Types
export interface Alert {
  id: string;
  alertType: 'warning' | 'success' | 'error' | 'info';
  title: string;
  message?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isResolved: boolean;
  createdAt: Date;
  resolvedAt?: Date;
  organizationId: string;
  deviceId?: string;
}

export interface CreateAlertData {
  alertType: 'warning' | 'success' | 'error' | 'info';
  title: string;
  message?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  organizationId: string;
  deviceId?: string;
}

// Achievement Types
export interface Achievement {
  id: string;
  achievementType: 'electricity' | 'carbon' | 'esg';
  title: string;
  description?: string;
  currentValue: number;
  unit?: string;
  progressPercent: number;
  currentLevel: number;
  maxLevel: number;
  nextLevelTarget?: number;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
}

export interface CreateAchievementData {
  achievementType: 'electricity' | 'carbon' | 'esg';
  title: string;
  description?: string;
  currentValue: number;
  unit?: string;
  organizationId: string;
}

// Authentication Types
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  organizationId?: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Time Range Types
export interface TimeRange {
  start: Date;
  end: Date;
}

// Dashboard Types
export interface DashboardMetrics {
  networkHealth: NetworkHealth;
  deviceCount: number;
  onlineDevices: number;
  recentAlerts: Alert[];
  achievements: Achievement[];
}

// Real-time Types
export interface DeviceUpdate {
  deviceId: string;
  status: 'online' | 'offline' | 'warning';
  batteryLevel?: number;
  lastSeen: Date;
  metrics?: DeviceMetric[];
}

export interface NetworkUpdate {
  organizationId: string;
  health: NetworkHealth;
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Dongle & ESP32 Types
export interface DongleData {
  batchId: string;
  sessionMs: number;
  samples: number;
  dateYMD: number;
  timeHMS: number;
  msec: number;
  lat: number;
  lon: number;
  alt: number;
  gpsFix: number;
  sats: number;
  ax: number;
  ay: number;
  az: number;
  gx: number;
  gy: number;
  gz: number;
  tempC: number;
}

export interface GpsData {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
  heading: number;
  timestamp: Date;
  syncMethod: 'dongle' | 'manual' | 'api';
}

export interface PairingSession {
  id: string;
  sessionId: string;
  status: 'waiting' | 'paired' | 'timeout';
  deviceId: string | null;
  dongleId: string | null;
  expiresAt: Date;
  createdAt: Date;
}

export interface CreatePairingSessionData {
  sessionId: string;
  expiresAt: Date;
}

export interface GpsLog {
  id: string;
  deviceId: string;
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
  heading: number;
  syncMethod: string;
  timestamp: Date;
} 