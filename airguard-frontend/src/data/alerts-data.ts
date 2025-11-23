import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  LucideIcon,
} from "lucide-react";

// Alert types interface
export interface Alert {
  id: number;
  type: "warning" | "success" | "error" | "info";
  title: string;
  message: string;
  time: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

// Helper function to generate a random id
function getRandomId() {
  return Math.floor(Math.random() * 1000000);
}

// Alert templates for reuse
export const alertTemplates = {
  warning: {
    id: getRandomId(),
    type: "warning" as const,
    icon: AlertTriangle,
    color: "text-ag-orange",
    bgColor: "bg-ag-orange/10",
  },
  success: {
    id: getRandomId(),
    type: "success" as const,
    icon: CheckCircle,
    color: "text-ag-neon-green",
    bgColor: "bg-ag-neon-green/10",
  },
  error: {
    id: getRandomId(),
    type: "error" as const,
    icon: XCircle,
    color: "text-ag-red",
    bgColor: "bg-ag-red/10",
  },
  info: {
    id: getRandomId(),
    type: "info" as const,
    icon: Clock,
    color: "text-ag-neon-blue",
    bgColor: "bg-ag-neon-blue/10",
  },
};

// Recent alerts data for the dashboard panel
export const recentAlerts: Alert[] = [
  {
    ...alertTemplates.warning,
    title: "Network Congestion Detected",
    message:
      "High congestion levels detected in Zone 3 - performance may be impacted",
    time: "2 minutes ago",
  },
  {
    ...alertTemplates.success,
    title: "Optimization Complete",
    message:
      "Network optimization applied successfully - throughput improved by 12%",
    time: "15 minutes ago",
  },
  {
    ...alertTemplates.error,
    title: "Critical Interference Alert",
    message:
      "Severe interference detected causing packet loss - immediate attention required",
    time: "3 hours ago",
  },
  {
    ...alertTemplates.info,
    title: "Maintenance Window Scheduled",
    message:
      "Planned network maintenance scheduled for tonight 2:00-4:00 AM EST",
    time: "1 day ago",
  },
];

// Device-specific alerts for the map component
export const deviceAlerts: Alert[] = [
  {
    ...alertTemplates.error,
    title: "Device Offline",
    message:
      "Device has not reported status for over 2 hours. Check connectivity.",
    time: "2 hours ago",
  },
  {
    ...alertTemplates.warning,
    title: "Sensor Malfunction Detected",
    message:
      "A sensor on this device is reporting abnormal values. Please inspect the device for possible hardware issues.",
    time: "30 minutes ago",
  },
  {
    ...alertTemplates.info,
    title: "Firmware Update Available",
    message:
      "A new firmware version is available for this device. Update soon to ensure optimal performance and security.",
    time: "5 minutes ago",
  },
];
