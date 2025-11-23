export interface DeviceData {
  id: string;
  name: string;
  manufacturer: string;
  ip: string;
  macAddress: string;
  openPorts: string;
  sshPort: string;
  lat: number;
  lng: number;
  status: "healthy" | "warning" | "critical" | "offline";
  location: string;
  lastSeen?: string;
  batteryLevel?: number;
  deviceType?: string;
  firmwareVersion?: string;
}

export const BEIRUT_COORDINATES: [number, number] = [33.8938, 35.5018];

export const placeholderDevices: DeviceData[] = [
  {
    id: "1",
    name: "AP-Office-01",
    manufacturer: "Ubiquiti",
    ip: "192.168.1.10",
    macAddress: "AA:BB:CC:DD:EE:01",
    openPorts: "22, 80, 443",
    sshPort: "22",
    location: "Main Office - Floor 1",
    lat: 33.8938 + 0.01,
    lng: 35.5018 + 0.01,
    status: "healthy",
    firmwareVersion: "v2.4.1",
  },
  {
    id: "2",
    name: "AP-Conference-02",
    manufacturer: "Cisco",
    ip: "192.168.1.11",
    macAddress: "AA:BB:CC:DD:EE:02",
    openPorts: "22, 80, 443, 8080",
    sshPort: "22",
    location: "Conference Room A",
    lat: 33.8938 + 0.015,
    lng: 35.5018 + 0.015,
    status: "healthy",
    firmwareVersion: "v3.1.0",
  },
  {
    id: "3",
    name: "AP-Warehouse-03",
    manufacturer: "TP-Link",
    ip: "192.168.1.12",
    macAddress: "AA:BB:CC:DD:EE:03",
    openPorts: "22, 80",
    sshPort: "2222",
    location: "Warehouse Building",
    lat: 33.8938 - 0.01,
    lng: 35.5018 + 0.02,
    status: "offline",
    firmwareVersion: "v1.8.5",
  },
  {
    id: "4",
    name: "AP-Lobby-04",
    manufacturer: "Ubiquiti",
    ip: "192.168.1.13",
    macAddress: "AA:BB:CC:DD:EE:04",
    openPorts: "22, 80, 443",
    sshPort: "22",
    location: "Main Lobby",
    lat: 33.8938 + 0.02,
    lng: 35.5018 - 0.01,
    status: "warning",
    firmwareVersion: "v2.4.1",
  },
  {
    id: "5",
    name: "AP-Parking-05",
    manufacturer: "Aruba",
    ip: "192.168.1.14",
    macAddress: "AA:BB:CC:DD:EE:05",
    openPorts: "22, 80, 443, 8443",
    sshPort: "22",
    location: "Parking Lot - North",
    lat: 33.8938 - 0.015,
    lng: 35.5018 - 0.015,
    status: "healthy",
    firmwareVersion: "v4.2.3",
  },
  {
    id: "6",
    name: "AP-Cafeteria-06",
    manufacturer: "Cisco",
    ip: "192.168.1.15",
    macAddress: "AA:BB:CC:DD:EE:06",
    openPorts: "22, 80, 443",
    sshPort: "22",
    location: "Employee Cafeteria",
    lat: 33.8938 + 0.005,
    lng: 35.5018 + 0.025,
    status: "critical",
    firmwareVersion: "v3.0.8",
  },
];
