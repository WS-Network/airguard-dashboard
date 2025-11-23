import { z } from 'zod';
import type { ValidationResult, ValidationError } from '@/types';

// User validation schemas
export const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  country: z.string().optional(),
  phoneNumber: z.string().optional(),
  companyName: z.string().optional(),
  industry: z.string().optional(),
  businessType: z.string().optional(),
  hearAboutUs: z.string().optional(),
  nonGovernmentEndUser: z.boolean().default(false),
  acceptTerms: z.boolean().refine((val: boolean) => val === true, 'Terms must be accepted'),
  newsPromotions: z.boolean().default(false),
});

// Settings validation schemas
export const settingsUpdateSchema = z.object({
  openaiApiKey: z.string().optional(),
  anthropicApiKey: z.string().optional(),
  theme: z.enum(['dark', 'light', 'auto']).optional(),
  language: z.string().min(2).max(5).optional(),
  notifications: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  timeFormat: z.enum(['12h', '24h']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Device validation schemas
export const createDeviceSchema = z.object({
  name: z.string().min(1, 'Device name is required').max(255),
  deviceType: z.string().optional(),
  firmwareVersion: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  locationDescription: z.string().optional(),
  organizationId: z.string().min(1, 'Organization ID is required'),
});

export const updateDeviceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  deviceType: z.string().optional(),
  firmwareVersion: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  locationDescription: z.string().optional(),
  status: z.enum(['online', 'offline', 'warning']).optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
});

// Metric validation schemas
export const createMetricSchema = z.object({
  metricType: z.string().min(1, 'Metric type is required'),
  value: z.number(),
  unit: z.string().optional(),
  deviceId: z.string().min(1, 'Device ID is required'),
});

// Alert validation schemas
export const createAlertSchema = z.object({
  alertType: z.enum(['warning', 'success', 'error', 'info']),
  title: z.string().min(1, 'Alert title is required').max(255),
  message: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  organizationId: z.string().min(1, 'Organization ID is required'),
  deviceId: z.string().optional(),
});

// Achievement validation schemas
export const createAchievementSchema = z.object({
  achievementType: z.enum(['electricity', 'carbon', 'esg']),
  title: z.string().min(1, 'Achievement title is required').max(255),
  description: z.string().optional(),
  currentValue: z.number(),
  unit: z.string().optional(),
  organizationId: z.string().min(1, 'Organization ID is required'),
});

// Generic validation function
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult {
  try {
    schema.parse(data);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map((err: z.ZodIssue) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return { isValid: false, errors };
    }
    return { 
      isValid: false, 
      errors: [{ field: 'unknown', message: 'Validation failed' }] 
    };
  }
}

// Type-safe validation function
export function validateAndParse<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

// Settings validation function
export const validateSettingsUpdate = (data: any): ValidationResult => {
  try {
    settingsUpdateSchema.parse(data);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map((err: z.ZodIssue) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return { isValid: false, errors };
    }
    return { 
      isValid: false, 
      errors: [{ field: 'unknown', message: 'Validation failed' }] 
    };
  }
}; 