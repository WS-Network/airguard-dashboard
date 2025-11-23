// Theme colors and constants for the application

// Neon colors for the theme
export const THEME_COLORS = {
  healthy: "#bae225",  // Airguard green
  warning: "#f59e0b",  // Amber
  critical: "#ef4444", // Red
  offline: "#666666",  // Gray
} as const;

// Status type definition
export type DeviceStatus = "healthy" | "warning" | "critical" | "offline";
export type ColorStatus = keyof typeof THEME_COLORS;
