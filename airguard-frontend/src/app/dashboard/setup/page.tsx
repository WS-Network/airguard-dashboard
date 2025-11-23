"use client";

import React, { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import DeviceSetupMapWrapper from "@/components/dashboard/DeviceSetupMapWrapper";
import {
  Wifi,
  Settings,
  MapPin,
  Shield,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Monitor,
  Antenna,
  Router,
  Cable,
  Info,
  AlertCircle,
  Download,
  Upload,
  Network,
  Lock,
  Satellite,
  Loader2,
  FlaskConical,
  X,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";

const DeviceMap = dynamic(() => import("@/components/dashboard/DeviceMap"), {
  ssr: false,
});

// Safe error message extraction to avoid cyclic object errors
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'An unexpected error occurred';
};

interface DeviceFormData {
  name: string;
  deviceType: string;
  firmwareVersion: string;
  latitude: string;
  longitude: string;
  altitude: string;
  gpsAccuracy: string;
  heading: string;
  locationDescription: string;
  ssid: string;
  password: string;
  channel: string;
  bandwidth: string;
  securityType: string;
  ipAddress: string;
  subnetMask: string;
  gateway: string;
  dns1: string;
  dns2: string;
  // IMU Sensor Fields
  accelerometerX: string;
  accelerometerY: string;
  accelerometerZ: string;
  gyroscopeX: string;
  gyroscopeY: string;
  gyroscopeZ: string;
  temperature: string;
  // Dongle Info
  dongleBatchId: string;
  // GPS Quality
  dongleGpsFix: string;
  dongleSatellites: string;
}

interface GpsData {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
  heading: number;
  timestamp: string;
}

interface ImuData {
  accelerometer: {
    x: number;
    y: number;
    z: number;
  };
  gyroscope: {
    x: number;
    y: number;
    z: number;
  };
  temperature: number;
}

interface DongleData {
  gpsData: GpsData;
  imuData: ImuData;
  dongleBatchId: string;
  gpsQuality: {
    gpsFix: number;
    satellites: number;
  };
}

interface ManagedDevice {
  id: string;
  name: string;
  ip: string;
  manufacturer: string;
  sshConfigured: boolean;
  gpsConfigured: boolean;
}

const DEVICE_TYPES = [
  { id: 'airguard', name: 'Airguard', icon: Shield, description: 'Airguard network security and monitoring device', locked: false },
  { id: 'access_point', name: 'Access Point', icon: Wifi, description: 'Wireless access point for client connectivity', locked: true },
  { id: 'router', name: 'Router', icon: Router, description: 'Network routing and gateway device', locked: true },
  { id: 'repeater', name: 'Repeater/Extender', icon: Antenna, description: 'Signal repeater and range extender', locked: true },
  { id: 'bridge', name: 'Bridge', icon: Cable, description: 'Point-to-point wireless bridge', locked: true },
  { id: 'monitor', name: 'Monitor', icon: Monitor, description: 'Network monitoring device', locked: true }
];

const SECURITY_TYPES = [
  'WPA3-PSK',
  'WPA2-PSK',
  'WPA-PSK',
  'WEP',
  'Open (Not Recommended)'
];

const CHANNELS_2_4GHZ = ['Auto', '1', '6', '11'];
const CHANNELS_5GHZ = ['Auto', '36', '40', '44', '48', '149', '153', '157', '161'];

const BANDWIDTH_OPTIONS = ['20MHz', '40MHz', '80MHz', '160MHz'];

// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function SetupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<DeviceFormData>({
    name: '',
    deviceType: '',
    firmwareVersion: '',
    latitude: '',
    longitude: '',
    altitude: '',
    gpsAccuracy: '',
    heading: '',
    locationDescription: '',
    ssid: '',
    password: '',
    channel: 'Auto',
    bandwidth: '80MHz',
    securityType: 'WPA3-PSK',
    ipAddress: '',
    subnetMask: '255.255.255.0',
    gateway: '',
    dns1: '8.8.8.8',
    dns2: '8.8.4.4',
    // IMU Sensor Fields
    accelerometerX: '',
    accelerometerY: '',
    accelerometerZ: '',
    gyroscopeX: '',
    gyroscopeY: '',
    gyroscopeZ: '',
    temperature: '',
    // Dongle Info
    dongleBatchId: '',
    // GPS Quality
    dongleGpsFix: '',
    dongleSatellites: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // GPS Modal State
  const [showGpsModal, setShowGpsModal] = useState(false);
  const [gpsData, setGpsData] = useState<GpsData | null>(null);
  const [imuData, setImuData] = useState<ImuData | null>(null);
  const [dongleBatchId, setDongleBatchId] = useState<string | null>(null);
  const [gpsQuality, setGpsQuality] = useState<{ gpsFix: number; satellites: number } | null>(null);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [isWaitingForGps, setIsWaitingForGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [pairingSessionId, setPairingSessionId] = useState<string | null>(null);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Map Picker Modal State
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedMapLocation, setSelectedMapLocation] = useState<[number, number] | null>(null);

  // Address Lookup State
  const [addressSearch, setAddressSearch] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Managed Devices State
  const [managedDevices, setManagedDevices] = useState<ManagedDevice[]>([]);
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [currentManagedDevice, setCurrentManagedDevice] = useState<Partial<ManagedDevice> | null>(null);
  const [sshCredentials, setSSHCredentials] = useState({ username: '', password: '' });

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, []);

  const steps = [
    { id: 1, name: 'Device Type', icon: Settings, description: 'Select device type and basic info' },
    { id: 2, name: 'Location', icon: MapPin, description: 'Set device location and placement' },
    { id: 3, name: 'Wireless Config', icon: Wifi, description: 'Configure wireless settings' },
    { id: 4, name: 'Network Config', icon: Shield, description: 'Set network and security parameters' },
    { id: 5, name: 'Add Managed Devices', icon: Network, description: 'Select and manage network devices' },
    { id: 6, name: 'Review', icon: CheckCircle, description: 'Review and deploy configuration' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDeviceTypeSelect = (deviceType: string) => {
    setFormData(prev => ({ ...prev, deviceType }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // TODO: Implement API call to create device
    setTimeout(() => {
      setIsSubmitting(false);
      // Reset form or redirect
    }, 2000);
  };

  // GPS Modal Handlers
  // Poll pairing status
  const pollPairingStatus = async (sessionId: string, accessToken: string) => {
    try {
      const response = await fetch(`${API_URL}/api/devices/pair/status/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check pairing status');
      }

      const data = await response.json();

      if (data.status === 'paired' && data.gpsData) {
        // Success - got GPS data + IMU data
        setGpsData({
          latitude: data.gpsData.latitude,
          longitude: data.gpsData.longitude,
          altitude: data.gpsData.altitude,
          accuracy: data.gpsData.accuracy,
          heading: data.gpsData.heading,
          timestamp: data.gpsData.timestamp
        });

        // Store IMU sensor data if available
        if (data.imuData) {
          setImuData(data.imuData);
        }

        // Store dongle batch ID
        if (data.dongleBatchId) {
          setDongleBatchId(data.dongleBatchId);
        }

        // Store GPS quality if available
        if (data.gpsQuality) {
          setGpsQuality(data.gpsQuality);
        }

        setIsWaitingForGps(false);
        setGpsSuccess(true);

        // Clear polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        if (pollingTimeoutRef.current) {
          clearTimeout(pollingTimeoutRef.current);
          pollingTimeoutRef.current = null;
        }
      } else if (data.status === 'timeout') {
        // Timeout
        setGpsError('GPS pairing timed out. Please try again.');
        setIsWaitingForGps(false);

        // Clear polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        if (pollingTimeoutRef.current) {
          clearTimeout(pollingTimeoutRef.current);
          pollingTimeoutRef.current = null;
        }
      }
      // If status is 'waiting', continue polling
    } catch (error) {
      console.error('Error polling pairing status:', getErrorMessage(error));
      // Don't stop polling on temporary errors - let the timeout handle it
      // This prevents transient network issues from breaking the flow
    }
  };

  // Start GPS pairing
  // Helper function to get access token from httpOnly cookie
  const getAccessToken = async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/auth/token', {
        credentials: 'include'
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.accessToken;
    } catch (error) {
      console.error('Failed to get access token:', getErrorMessage(error));
      return null;
    }
  };

  const handleUseGps = async (deviceId?: string) => {
    setShowGpsModal(true);
    setIsWaitingForGps(true);
    setGpsData(null);
    setGpsError(null);
    setGpsSuccess(false);

    try {
      // Get access token first
      const accessToken = await getAccessToken();

      if (!accessToken) {
        throw new Error('Not authenticated. Please log in again.');
      }

      const body = deviceId ? JSON.stringify({ deviceId }) : undefined;
      const response = await fetch(`${API_URL}/api/devices/pair/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        ...(body && { body })
      });

      if (!response.ok) {
        throw new Error('Failed to start pairing');
      }

      const data = await response.json();
      const sessionId = data.sessionId;
      setPairingSessionId(sessionId);

      // Start polling every 2 seconds
      pollingIntervalRef.current = setInterval(() => {
        pollPairingStatus(sessionId, accessToken);
      }, 2000);

      // Set timeout for 60 seconds
      pollingTimeoutRef.current = setTimeout(() => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setGpsError('GPS pairing timed out after 60 seconds. Please try again.');
        setIsWaitingForGps(false);
      }, 60000);

    } catch (error) {
      console.error('Error starting GPS pairing:', getErrorMessage(error));
      setGpsError(error instanceof Error ? error.message : 'Failed to start GPS pairing. Please check your connection.');
      setIsWaitingForGps(false);
    }
  };

  // Test with dummy data
  const handleTestGpsData = async () => {
    try {
      // Get access token first
      const accessToken = await getAccessToken();

      if (!accessToken) {
        throw new Error('Not authenticated. Please log in again.');
      }

      const response = await fetch(`${API_URL}/api/devices/test-dongle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get test GPS data');
      }

      const data = await response.json();

      // Simulate a delay for realistic experience
      setTimeout(() => {
        setGpsData({
          latitude: data.gpsData.latitude,
          longitude: data.gpsData.longitude,
          altitude: data.gpsData.altitude,
          accuracy: data.gpsData.accuracy,
          heading: data.gpsData.heading,
          timestamp: data.gpsData.timestamp
        });

        // Store IMU sensor data if available
        if (data.imuData) {
          setImuData(data.imuData);
        }

        // Store dongle batch ID
        if (data.dongleBatchId) {
          setDongleBatchId(data.dongleBatchId);
        }

        // Store GPS quality if available
        if (data.gpsQuality) {
          setGpsQuality(data.gpsQuality);
        }

        setIsWaitingForGps(false);
        setGpsSuccess(true);

        // Clear any ongoing polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        if (pollingTimeoutRef.current) {
          clearTimeout(pollingTimeoutRef.current);
          pollingTimeoutRef.current = null;
        }
      }, 2000); // 2-second delay to simulate real dongle
    } catch (error) {
      console.error('Error getting test GPS data:', getErrorMessage(error));
      setGpsError(error instanceof Error ? error.message : 'Failed to get test GPS data');
      setIsWaitingForGps(false);
    }
  };

  // Confirm and use GPS data
  const handleConfirmGps = () => {
    if (gpsData) {
      // If we are in the middle of adding a managed device
      if (currentManagedDevice) {
        setShowGpsModal(false);
        setShowAddDeviceModal(true);
        // Do NOT clear gpsData here, as we need it for the "Finish" step
        setGpsSuccess(false);
        setGpsError(null);
        setPairingSessionId(null);
        return;
      }

      // Normal flow for main device setup
      const updates: Partial<DeviceFormData> = {
        latitude: gpsData.latitude.toFixed(6),
        longitude: gpsData.longitude.toFixed(6),
        altitude: gpsData.altitude.toFixed(2),
        gpsAccuracy: gpsData.accuracy.toFixed(2),
        heading: gpsData.heading.toFixed(2),
      };

      // Add IMU data if available
      if (imuData) {
        updates.accelerometerX = imuData.accelerometer.x.toFixed(2);
        updates.accelerometerY = imuData.accelerometer.y.toFixed(2);
        updates.accelerometerZ = imuData.accelerometer.z.toFixed(2);
        updates.gyroscopeX = imuData.gyroscope.x.toFixed(2);
        updates.gyroscopeY = imuData.gyroscope.y.toFixed(2);
        updates.gyroscopeZ = imuData.gyroscope.z.toFixed(2);
        updates.temperature = imuData.temperature.toFixed(1);
      }

      // Add dongle batch ID if available
      if (dongleBatchId) {
        updates.dongleBatchId = dongleBatchId;
      }

      // Add GPS quality if available
      if (gpsQuality) {
        updates.dongleGpsFix = gpsQuality.gpsFix.toString();
        updates.dongleSatellites = gpsQuality.satellites.toString();
      }

      setFormData(prev => ({ ...prev, ...updates }));
      setShowGpsModal(false);
      setGpsData(null);
      setImuData(null);
      setDongleBatchId(null);
      setGpsQuality(null);
      setGpsSuccess(false);
      setGpsError(null);
      setPairingSessionId(null);
    }
  };

  const handleCloseGpsModal = () => {
    // Clear any ongoing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }

    setShowGpsModal(false);
    setGpsData(null);
    setImuData(null);
    setDongleBatchId(null);
    setGpsQuality(null);
    setGpsSuccess(false);
    setIsWaitingForGps(false);
    setGpsError(null);
    setPairingSessionId(null);
  };

  // Map Picker Handlers
  const handleMapPicker = () => {
    setShowMapModal(true);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedMapLocation([lat, lng]);
  };

  const handleConfirmMapLocation = () => {
    if (selectedMapLocation) {
      setFormData(prev => ({
        ...prev,
        latitude: selectedMapLocation[0].toFixed(6),
        longitude: selectedMapLocation[1].toFixed(6),
      }));
      setShowMapModal(false);
      setSelectedMapLocation(null);
    }
  };

  const handleCloseMapModal = () => {
    setShowMapModal(false);
    setSelectedMapLocation(null);
  };

  // Address Lookup Handler
  const handleAddressSearch = async (query: string) => {
    setAddressSearch(query);
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      // Using Nominatim API (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      setAddressSuggestions(data);
    } catch (error) {
      console.error('Address lookup failed:', getErrorMessage(error));
      setAddressSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectAddress = (suggestion: any) => {
    setFormData(prev => ({
      ...prev,
      latitude: parseFloat(suggestion.lat).toFixed(6),
      longitude: parseFloat(suggestion.lon).toFixed(6),
      locationDescription: suggestion.display_name,
    }));
    setAddressSearch('');
    setAddressSuggestions([]);
  };

  // Managed Device Handlers
  const handleAddManagedDevice = (device: Partial<ManagedDevice>) => {
    setCurrentManagedDevice(device);
    setShowAddDeviceModal(true);
    setSSHCredentials({ username: '', password: '' });
  };

  const handleGpsSyncForManagedDevice = async () => {
    if (!currentManagedDevice) return;

    try {
      // Get access token first
      const accessToken = await getAccessToken();

      if (!accessToken) {
        throw new Error('Not authenticated. Please log in again.');
      }

      // Step 1: Create device in backend with setupComplete=false
      const response = await fetch(`${API_URL}/api/devices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          name: currentManagedDevice.name,
          ipAddress: currentManagedDevice.ip,
          manufacturer: currentManagedDevice.manufacturer,
          deviceType: 'access_point', // Default for managed devices
          sshUsername: sshCredentials.username,
          sshPassword: sshCredentials.password,
          setupComplete: false
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create device');
      }

      const { device } = await response.json();
      setCurrentDeviceId(device.id);

      // Step 2: Close the add device modal and open GPS modal
      setShowAddDeviceModal(false);
      await handleUseGps(device.id);
    } catch (error) {
      console.error('Error creating device:', getErrorMessage(error));
      alert(error instanceof Error ? error.message : 'Failed to create device. Please try again.');
    }
  };

  const handleFinishManagedDevice = () => {
    if (!currentManagedDevice || !gpsData) return;

    // Create the managed device with all data
    const newDevice: ManagedDevice = {
      id: currentDeviceId || `device-${Date.now()}`,
      name: currentManagedDevice.name || 'Unknown Device',
      ip: currentManagedDevice.ip || '',
      manufacturer: currentManagedDevice.manufacturer || '',
      sshConfigured: !!sshCredentials.username && !!sshCredentials.password,
      gpsConfigured: !!gpsData
    };

    setManagedDevices(prev => [...prev, newDevice]);
    setShowAddDeviceModal(false);
    setCurrentManagedDevice(null);
    setCurrentDeviceId(null);
    setSSHCredentials({ username: '', password: '' });
  };

  const handleCloseAddDeviceModal = () => {
    setShowAddDeviceModal(false);
    setCurrentManagedDevice(null);
    setSSHCredentials({ username: '', password: '' });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-ag-white mb-4">Select Device Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DEVICE_TYPES.map((device) => {
                  const IconComponent = device.icon;
                  return (
                    <button
                      key={device.id}
                      onClick={() => !device.locked && handleDeviceTypeSelect(device.id)}
                      disabled={device.locked}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left ${device.locked
                          ? 'border-ag-white/10 bg-ag-black/40 opacity-60 cursor-not-allowed'
                          : formData.deviceType === device.id
                            ? 'border-ag-green bg-ag-green/10 hover:scale-105'
                            : 'border-ag-white/20 bg-ag-black/20 hover:border-ag-green/50 hover:scale-105'
                        }`}
                    >
                      {device.locked && (
                        <div className="absolute top-2 right-2">
                          <Lock className="w-5 h-5 text-ag-white/40" />
                        </div>
                      )}
                      <IconComponent className={`w-8 h-8 mb-3 ${device.locked
                          ? 'text-ag-white/30'
                          : formData.deviceType === device.id
                            ? 'text-ag-green'
                            : 'text-ag-white/70'
                        }`} />
                      <h4 className={`font-medium mb-2 ${device.locked ? 'text-ag-white/40' : 'text-ag-white'}`}>
                        {device.name}
                      </h4>
                      <p className={`text-sm ${device.locked ? 'text-ag-white/30' : 'text-ag-white/60'}`}>
                        {device.description}
                      </p>
                      {device.locked && (
                        <p className="text-xs text-amber-500 mt-2">Coming Soon</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ag-white mb-2">Device Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Office Access Point"
                  className="ag-input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ag-white mb-2">Firmware Version</label>
                <input
                  type="text"
                  name="firmwareVersion"
                  value={formData.firmwareVersion}
                  onChange={handleInputChange}
                  placeholder="e.g., v2.1.3"
                  className="ag-input"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-ag-white mb-4">Device Location</h3>
              <div className="bg-ag-black/20 border border-ag-white/10 rounded-xl p-4 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Info className="w-4 h-4 text-ag-green" />
                  <span className="text-sm text-ag-white/70">Accurate location helps with network planning and coverage optimization</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ag-white mb-2">Latitude</label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  placeholder="e.g., 40.7128"
                  step="any"
                  className="ag-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ag-white mb-2">Longitude</label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  placeholder="e.g., -74.0060"
                  step="any"
                  className="ag-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ag-white mb-2">Location Description</label>
              <textarea
                name="locationDescription"
                value={formData.locationDescription}
                onChange={handleInputChange}
                placeholder="e.g., Main office building, 2nd floor, conference room"
                rows={3}
                className="ag-input resize-none"
              />
            </div>

            <div className="bg-ag-green/5 border border-ag-green/20 rounded-xl p-4">
              <h4 className="font-medium text-ag-green mb-2">Quick Location Options</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button
                  onClick={handleUseGps}
                  className="px-3 py-2 bg-ag-white/5 hover:bg-ag-white/10 border border-ag-white/20 rounded-lg text-sm text-ag-white transition-colors flex items-center justify-center space-x-2"
                >
                  <Satellite className="w-4 h-4" />
                  <span>Use GPS</span>
                </button>
                <button
                  onClick={handleMapPicker}
                  className="px-3 py-2 bg-ag-white/5 hover:bg-ag-white/10 border border-ag-white/20 rounded-lg text-sm text-ag-white transition-colors flex items-center justify-center space-x-2"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Map Picker</span>
                </button>
                <button className="px-3 py-2 bg-ag-white/5 hover:bg-ag-white/10 border border-ag-white/20 rounded-lg text-sm text-ag-white transition-colors">
                  Import KML
                </button>
              </div>
            </div>

            {/* Address Lookup */}
            <div className="bg-ag-black/20 border border-ag-white/10 rounded-xl p-4">
              <h4 className="font-medium text-ag-white mb-3">Address Lookup</h4>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ag-white/40 w-4 h-4" />
                  <input
                    type="text"
                    value={addressSearch}
                    onChange={(e) => handleAddressSearch(e.target.value)}
                    placeholder="Search for an address..."
                    className="w-full pl-10 pr-4 py-2 bg-ag-black/40 border border-ag-white/20 rounded-lg text-ag-white placeholder-ag-white/40 focus:outline-none focus:border-ag-lime/50"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-ag-lime animate-spin" />
                  )}
                </div>
                {addressSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-ag-black/95 border border-ag-white/20 rounded-lg shadow-2xl max-h-60 overflow-y-auto">
                    {addressSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectAddress(suggestion)}
                        className="w-full px-4 py-3 text-left text-sm text-ag-white hover:bg-ag-lime/10 transition-colors border-b border-ag-white/5 last:border-b-0"
                      >
                        <div className="font-medium">{suggestion.display_name}</div>
                        <div className="text-xs text-ag-white/60 mt-1">
                          {suggestion.lat}, {suggestion.lon}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-ag-white mb-4">Wireless Configuration</h3>
              <div className="bg-ag-orange/10 border border-ag-orange/20 rounded-xl p-4 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-ag-orange" />
                  <span className="text-sm text-ag-orange">Configure wireless settings carefully to ensure optimal performance and security</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ag-white mb-2">Network Name (SSID) *</label>
                <input
                  type="text"
                  name="ssid"
                  value={formData.ssid}
                  onChange={handleInputChange}
                  placeholder="e.g., Airguard-Office"
                  className="ag-input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ag-white mb-2">Security Type *</label>
                <select
                  name="securityType"
                  value={formData.securityType}
                  onChange={handleInputChange}
                  className="ag-dropdown"
                  required
                >
                  {SECURITY_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ag-white mb-2">Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter secure password (minimum 8 characters)"
                className="ag-input"
                minLength={8}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ag-white mb-2">Channel</label>
                <select
                  name="channel"
                  value={formData.channel}
                  onChange={handleInputChange}
                  className="ag-dropdown"
                >
                  <optgroup label="2.4GHz Channels">
                    {CHANNELS_2_4GHZ.map(channel => (
                      <option key={`2.4-${channel}`} value={channel}>{channel}</option>
                    ))}
                  </optgroup>
                  <optgroup label="5GHz Channels">
                    {CHANNELS_5GHZ.map(channel => (
                      <option key={`5-${channel}`} value={channel}>{channel}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ag-white mb-2">Bandwidth</label>
                <select
                  name="bandwidth"
                  value={formData.bandwidth}
                  onChange={handleInputChange}
                  className="ag-dropdown"
                >
                  {BANDWIDTH_OPTIONS.map(bw => (
                    <option key={bw} value={bw}>{bw}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-ag-green/5 border border-ag-green/20 rounded-xl p-4">
              <h4 className="font-medium text-ag-green mb-3">Advanced Wireless Options</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="ag-checkbox" />
                  <span className="text-sm text-ag-white">Hide SSID</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="ag-checkbox" defaultChecked />
                  <span className="text-sm text-ag-white">WMM QoS</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="ag-checkbox" defaultChecked />
                  <span className="text-sm text-ag-white">Band Steering</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-ag-white mb-4">Network Configuration</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ag-white mb-2">IP Address</label>
                <input
                  type="text"
                  name="ipAddress"
                  value={formData.ipAddress}
                  onChange={handleInputChange}
                  placeholder="e.g., 192.168.1.100"
                  className="ag-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ag-white mb-2">Subnet Mask</label>
                <input
                  type="text"
                  name="subnetMask"
                  value={formData.subnetMask}
                  onChange={handleInputChange}
                  placeholder="e.g., 255.255.255.0"
                  className="ag-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ag-white mb-2">Gateway</label>
                <input
                  type="text"
                  name="gateway"
                  value={formData.gateway}
                  onChange={handleInputChange}
                  placeholder="e.g., 192.168.1.1"
                  className="ag-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ag-white mb-2">Primary DNS</label>
                <input
                  type="text"
                  name="dns1"
                  value={formData.dns1}
                  onChange={handleInputChange}
                  placeholder="e.g., 8.8.8.8"
                  className="ag-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ag-white mb-2">Secondary DNS</label>
              <input
                type="text"
                name="dns2"
                value={formData.dns2}
                onChange={handleInputChange}
                placeholder="e.g., 8.8.4.4"
                className="ag-input"
              />
            </div>

            <div className="bg-ag-black/20 border border-ag-white/10 rounded-xl p-4">
              <h4 className="font-medium text-ag-white mb-3">Network Configuration Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="px-4 py-2 bg-ag-green/20 hover:bg-ag-green/30 border border-ag-green/50 rounded-lg text-sm text-ag-white transition-colors">
                  Auto Configure (DHCP)
                </button>
                <button className="px-4 py-2 bg-ag-white/5 hover:bg-ag-white/10 border border-ag-white/20 rounded-lg text-sm text-ag-white transition-colors">
                  Static IP Configuration
                </button>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-ag-white mb-4">Add Managed Devices</h3>
              <p className="text-ag-white/60 mb-6">Select devices from the network and configure them with SSH credentials and GPS location data.</p>
            </div>

            {/* Test Button for Managed Device Workflow */}
            <div className="bg-ag-green/5 border border-ag-green/20 rounded-xl p-4">
              <h4 className="font-medium text-ag-green mb-2">Test Managed Device Workflow</h4>
              <p className="text-sm text-ag-white/60 mb-3">
                Port scan integration coming soon. Click below to test the Add Device workflow with sample data.
              </p>
              <button
                onClick={() => handleAddManagedDevice({
                  name: 'Access Point 192.168.1.100',
                  ip: '192.168.1.100',
                  manufacturer: 'Ubiquiti'
                })}
                className="px-4 py-2 bg-ag-green/20 hover:bg-ag-green/30 border border-ag-green/50 rounded-lg text-sm text-ag-white transition-colors flex items-center space-x-2"
              >
                <Network className="w-4 h-4" />
                <span>Test Add Managed Device</span>
              </button>
            </div>

            <DeviceSetupMapWrapper />

            <div className="bg-ag-black/20 border border-ag-white/10 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Info className="w-4 h-4 text-ag-green" />
                <span className="text-sm text-ag-white/70">Click the &quot;Add&quot; button to configure SSH access and sync GPS location data for each device. Port scan integration coming soon.</span>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-ag-white mb-4">Review Configuration</h3>
              <p className="text-ag-white/60 mb-6">Please review all settings before deploying the device configuration.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-ag-black/20 border border-ag-white/10 rounded-xl p-4">
                <h4 className="font-medium text-ag-green mb-3">Device Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ag-white/60">Name:</span>
                    <span className="text-ag-white">{formData.name || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ag-white/60">Type:</span>
                    <span className="text-ag-white">{DEVICE_TYPES.find(d => d.id === formData.deviceType)?.name || 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ag-white/60">Firmware:</span>
                    <span className="text-ag-white">{formData.firmwareVersion || 'Not set'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-ag-black/20 border border-ag-white/10 rounded-xl p-4">
                <h4 className="font-medium text-ag-green mb-3">Location</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ag-white/60">Coordinates:</span>
                    <span className="text-ag-white">{formData.latitude && formData.longitude ? `${formData.latitude}, ${formData.longitude}` : 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ag-white/60">Description:</span>
                    <span className="text-ag-white truncate">{formData.locationDescription || 'Not set'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-ag-black/20 border border-ag-white/10 rounded-xl p-4">
                <h4 className="font-medium text-ag-green mb-3">Wireless Settings</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ag-white/60">SSID:</span>
                    <span className="text-ag-white">{formData.ssid || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ag-white/60">Security:</span>
                    <span className="text-ag-white">{formData.securityType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ag-white/60">Channel:</span>
                    <span className="text-ag-white">{formData.channel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ag-white/60">Bandwidth:</span>
                    <span className="text-ag-white">{formData.bandwidth}</span>
                  </div>
                </div>
              </div>

              <div className="bg-ag-black/20 border border-ag-white/10 rounded-xl p-4">
                <h4 className="font-medium text-ag-green mb-3">Network Settings</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ag-white/60">IP Address:</span>
                    <span className="text-ag-white">{formData.ipAddress || 'DHCP'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ag-white/60">Gateway:</span>
                    <span className="text-ag-white">{formData.gateway || 'Auto'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ag-white/60">DNS:</span>
                    <span className="text-ag-white">{formData.dns1 || 'Auto'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Managed Devices Card */}
            <div className="bg-ag-lime/5 border border-ag-lime/20 rounded-xl p-4">
              <h4 className="font-medium text-ag-lime mb-3 flex items-center justify-between">
                <span>Managed Devices Added to Airguard</span>
                <span className="text-sm text-ag-white/60">{managedDevices.length} device{managedDevices.length !== 1 ? 's' : ''}</span>
              </h4>
              {managedDevices.length > 0 ? (
                <div className="space-y-2">
                  {managedDevices.map((device) => (
                    <div key={device.id} className="bg-ag-black/40 border border-ag-white/10 rounded-lg p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h5 className="font-medium text-ag-white">{device.name}</h5>
                          <span className="text-xs text-ag-white/60">{device.manufacturer}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-ag-white/50 mt-1">
                          <span>{device.ip}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {device.sshConfigured && (
                          <div className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-400">
                            SSH ✓
                          </div>
                        )}
                        {device.gpsConfigured && (
                          <div className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-400">
                            GPS ✓
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-ag-white/40">
                  <Network className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No managed devices added yet</p>
                  <p className="text-xs mt-1">Go to step 5 to add devices to manage</p>
                </div>
              )}
            </div>

            <div className="bg-ag-green/5 border border-ag-green/20 rounded-xl p-4">
              <h4 className="font-medium text-ag-green mb-3">Deployment Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="px-4 py-3 bg-ag-green/20 hover:bg-ag-green/30 border border-ag-green/50 rounded-lg text-sm text-ag-white transition-colors flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Download Config</span>
                </button>
                <button className="px-4 py-3 bg-ag-white/5 hover:bg-ag-white/10 border border-ag-white/20 rounded-lg text-sm text-ag-white transition-colors flex items-center space-x-2">
                  <Upload className="w-4 h-4" />
                  <span>Push to Device</span>
                </button>
                <button className="px-4 py-3 bg-ag-white/5 hover:bg-ag-white/10 border border-ag-white/20 rounded-lg text-sm text-ag-white transition-colors flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Save Template</span>
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Sidebar />
      <div className="ag-main-content min-h-screen bg-gradient-to-br from-ag-black via-ag-black to-ag-black/95 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 mt-4 lg:mt-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-ag-white mb-2">Device Setup</h1>
            <p className="text-ag-white/60 text-sm sm:text-base">Configure and deploy your Airguard networking devices</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            {/* Mobile & Tablet: Vertical stepper */}
            <div className="lg:hidden space-y-4">
              {steps.map((step) => {
                const StepIcon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                  <div key={step.id} className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 flex-shrink-0 ${isCompleted
                        ? 'bg-ag-green border-ag-green shadow-lg shadow-ag-green/50'
                        : isActive
                          ? 'border-ag-green bg-ag-green/10 shadow-lg shadow-ag-green/30'
                          : 'border-ag-white/30 bg-ag-black/20'
                      }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6 text-ag-black" />
                      ) : (
                        <StepIcon className={`w-6 h-6 ${isActive ? 'text-ag-green' : 'text-ag-white/60'
                          }`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-semibold transition-colors duration-300 ${isActive ? 'text-ag-green' : isCompleted ? 'text-ag-white' : 'text-ag-white/60'
                        }`}>
                        {step.name}
                      </div>
                      <div className="text-xs text-ag-white/50 mt-0.5">
                        {step.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: Horizontal stepper with consistent spacing */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="flex items-center w-full max-w-5xl">
                {steps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = currentStep > step.id;

                  return (
                    <React.Fragment key={step.id}>
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isCompleted
                            ? 'bg-ag-green border-ag-green shadow-lg shadow-ag-green/50'
                            : isActive
                              ? 'border-ag-green bg-ag-green/10 shadow-lg shadow-ag-green/30'
                              : 'border-ag-white/30 bg-ag-black/20'
                          }`}>
                          {isCompleted ? (
                            <CheckCircle className="w-7 h-7 text-ag-black" />
                          ) : (
                            <StepIcon className={`w-7 h-7 ${isActive ? 'text-ag-green' : 'text-ag-white/60'
                              }`} />
                          )}
                        </div>
                        <div className="mt-3 text-center px-2">
                          <div className={`text-sm font-semibold transition-colors duration-300 ${isActive ? 'text-ag-green' : isCompleted ? 'text-ag-white' : 'text-ag-white/60'
                            }`}>
                            {step.name}
                          </div>
                          <div className="text-xs text-ag-white/50 mt-1 line-clamp-2">
                            {step.description}
                          </div>
                        </div>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`h-0.5 w-full max-w-[80px] mx-2 transition-all duration-300 ${isCompleted ? 'bg-ag-green shadow-sm shadow-ag-green/50' : 'bg-ag-white/20'
                          }`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-ag-black/40 border border-ag-green/20 rounded-xl backdrop-blur-sm p-6 mb-6">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-3 bg-ag-white/10 hover:bg-ag-white/20 disabled:bg-ag-white/5 disabled:cursor-not-allowed border border-ag-white/20 rounded-lg text-ag-white transition-colors flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="text-sm text-ag-white/60">
              Step {currentStep} of {steps.length}
            </div>

            {currentStep < steps.length ? (
              <button
                onClick={nextStep}
                className="px-6 py-3 bg-ag-green hover:bg-ag-green/90 text-ag-black font-medium rounded-lg transition-colors flex items-center space-x-2"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-3 bg-ag-green hover:bg-ag-green/90 disabled:bg-ag-green/50 disabled:cursor-not-allowed text-ag-black font-medium rounded-lg transition-colors flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-ag-black/30 border-t-ag-black rounded-full animate-spin" />
                    <span>Deploying...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Deploy Device</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* GPS Modal */}
        <AnimatePresence>
          {showGpsModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={handleCloseGpsModal}
            >
              <motion.div
                initial={{ y: 10 }}
                animate={{ y: 0 }}
                exit={{ y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-ag-black/95 backdrop-blur-md border border-blue-500/30 hover:border-blue-500/50 rounded-xl p-6 w-full max-w-md shadow-2xl transition-all duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Satellite className="w-6 h-6 text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold text-ag-white">GPS Synchronization</h2>
                  </div>
                  <button
                    onClick={handleCloseGpsModal}
                    className="p-2 rounded-lg hover:bg-ag-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 cursor-pointer text-ag-white/60 hover:text-ag-white transition-colors" />
                  </button>
                </div>

                <div className="mb-6 space-y-4">
                  {gpsError ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                      <p className="text-red-400 text-center mb-2 font-semibold">
                        Error
                      </p>
                      <p className="text-ag-white/60 text-sm text-center mb-4">
                        {gpsError}
                      </p>
                      <button
                        onClick={() => {
                          setGpsError(null);
                          handleUseGps();
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg transition-colors duration-200"
                      >
                        <Satellite className="w-4 h-4" />
                        <span>Retry</span>
                      </button>
                    </div>
                  ) : !gpsData ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-4" />
                      <p className="text-ag-white/80 text-center mb-2">
                        Waiting for GPS data from dongle...
                      </p>
                      <p className="text-ag-white/60 text-sm text-center mb-4">
                        Press the button on the dongle near the device
                      </p>
                      <button
                        onClick={handleTestGpsData}
                        className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/30 rounded-lg transition-colors duration-200"
                      >
                        <FlaskConical className="w-4 h-4" />
                        <span>Test with Dummy Data</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-col items-center justify-center py-4">
                        <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
                        <p className="text-green-400 font-semibold text-lg mb-2">
                          GPS Data Received!
                        </p>
                      </div>

                      {/* GPS Data */}
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-3">
                        <h4 className="text-green-400 font-semibold text-sm mb-2">📍 GPS Location Data</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-ag-white/60">Latitude:</div>
                          <div className="text-ag-white font-mono">{gpsData.latitude.toFixed(6)}</div>

                          <div className="text-ag-white/60">Longitude:</div>
                          <div className="text-ag-white font-mono">{gpsData.longitude.toFixed(6)}</div>

                          <div className="text-ag-white/60">Altitude:</div>
                          <div className="text-ag-white font-mono">{gpsData.altitude.toFixed(2)} m</div>

                          <div className="text-ag-white/60">Accuracy:</div>
                          <div className="text-ag-white font-mono">{gpsData.accuracy.toFixed(2)} m</div>

                          <div className="text-ag-white/60">Heading:</div>
                          <div className="text-ag-white font-mono">{gpsData.heading.toFixed(2)}°</div>

                          <div className="text-ag-white/60">Timestamp:</div>
                          <div className="text-ag-white font-mono text-xs">{new Date(gpsData.timestamp).toLocaleTimeString()}</div>
                        </div>

                        {/* GPS Quality */}
                        {gpsQuality && (
                          <div className="mt-3 pt-3 border-t border-green-500/20">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="text-ag-white/60">GPS Fix:</div>
                              <div className="text-ag-white">
                                {gpsQuality.gpsFix === 1 ? (
                                  <span className="text-green-400">✓ Active</span>
                                ) : (
                                  <span className="text-red-400">✗ No Fix</span>
                                )}
                              </div>

                              <div className="text-ag-white/60">Satellites:</div>
                              <div className="text-ag-white font-mono">{gpsQuality.satellites}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* IMU Sensor Data */}
                      {imuData && (
                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 space-y-3">
                          <h4 className="text-purple-400 font-semibold text-sm mb-2">🔬 IMU Sensor Data</h4>

                          {/* Accelerometer */}
                          <div>
                            <div className="text-xs text-ag-white/60 mb-1">Accelerometer (m/s²)</div>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div className="bg-ag-black/40 rounded px-2 py-1">
                                <span className="text-ag-white/60">X:</span>
                                <span className="text-ag-white font-mono ml-1">{imuData.accelerometer.x.toFixed(2)}</span>
                              </div>
                              <div className="bg-ag-black/40 rounded px-2 py-1">
                                <span className="text-ag-white/60">Y:</span>
                                <span className="text-ag-white font-mono ml-1">{imuData.accelerometer.y.toFixed(2)}</span>
                              </div>
                              <div className="bg-ag-black/40 rounded px-2 py-1">
                                <span className="text-ag-white/60">Z:</span>
                                <span className="text-ag-white font-mono ml-1">{imuData.accelerometer.z.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Gyroscope */}
                          <div>
                            <div className="text-xs text-ag-white/60 mb-1">Gyroscope (rad/s)</div>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div className="bg-ag-black/40 rounded px-2 py-1">
                                <span className="text-ag-white/60">X:</span>
                                <span className="text-ag-white font-mono ml-1">{imuData.gyroscope.x.toFixed(3)}</span>
                              </div>
                              <div className="bg-ag-black/40 rounded px-2 py-1">
                                <span className="text-ag-white/60">Y:</span>
                                <span className="text-ag-white font-mono ml-1">{imuData.gyroscope.y.toFixed(3)}</span>
                              </div>
                              <div className="bg-ag-black/40 rounded px-2 py-1">
                                <span className="text-ag-white/60">Z:</span>
                                <span className="text-ag-white font-mono ml-1">{imuData.gyroscope.z.toFixed(3)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Temperature */}
                          <div>
                            <div className="text-xs text-ag-white/60 mb-1">Temperature</div>
                            <div className="bg-ag-black/40 rounded px-3 py-2 text-sm">
                              <span className="text-ag-white font-mono">{imuData.temperature.toFixed(2)}°C</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Dongle Batch ID */}
                      {dongleBatchId && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                          <div className="text-xs text-ag-white/60 mb-1">Dongle Batch ID</div>
                          <div className="text-blue-400 font-mono text-sm">{dongleBatchId}</div>
                        </div>
                      )}

                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                        <p className="text-green-400 text-sm">
                          ✓ Device location and sensor data successfully captured
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCloseGpsModal}
                    className="px-4 py-2 text-ag-white/60 hover:text-ag-white transition-colors"
                  >
                    Cancel
                  </button>
                  {gpsData && (
                    <button
                      onClick={handleConfirmGps}
                      className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg transition-colors duration-200"
                    >
                      Use This Location
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Map Picker Modal */}
        <AnimatePresence>
          {showMapModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={handleCloseMapModal}
            >
              <motion.div
                initial={{ y: 10 }}
                animate={{ y: 0 }}
                exit={{ y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-ag-black/95 backdrop-blur-md border border-ag-lime/30 hover:border-ag-lime/50 rounded-xl p-6 w-full max-w-4xl shadow-2xl transition-all duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-ag-lime/20">
                      <MapPin className="w-6 h-6 text-ag-lime" />
                    </div>
                    <h2 className="text-xl font-bold text-ag-white">Select Location on Map</h2>
                  </div>
                  <button
                    onClick={handleCloseMapModal}
                    className="p-2 rounded-lg hover:bg-ag-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 cursor-pointer text-ag-white/60 hover:text-ag-white transition-colors" />
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-ag-white/60 text-sm">Click on the map to select a location for your device</p>
                  {selectedMapLocation && (
                    <p className="text-ag-lime text-sm mt-2">
                      Selected: {selectedMapLocation[0].toFixed(6)}, {selectedMapLocation[1].toFixed(6)}
                    </p>
                  )}
                </div>

                <div className="h-96 rounded-lg overflow-hidden border border-ag-lime/20 mb-4">
                  <div className="w-full h-full bg-ag-black/40 flex items-center justify-center text-ag-white/60">
                    {/* Map component would go here - simplified for now */}
                    <div className="text-center">
                      <MapPin className="w-12 h-12 mx-auto mb-3 opacity-40" />
                      <p className="text-sm">Click to select location</p>
                      <p className="text-xs mt-1 opacity-60">
                        (Map interaction available - click anywhere to set location)
                      </p>
                      <button
                        onClick={() => handleMapClick(33.8938 + (Math.random() * 0.02 - 0.01), 35.5018 + (Math.random() * 0.02 - 0.01))}
                        className="mt-4 px-4 py-2 bg-ag-lime/20 hover:bg-ag-lime/30 text-ag-lime border border-ag-lime/30 rounded-lg transition-colors duration-200"
                      >
                        Simulate Map Click
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCloseMapModal}
                    className="px-4 py-2 text-ag-white/60 hover:text-ag-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmMapLocation}
                    disabled={!selectedMapLocation}
                    className="px-4 py-2 bg-ag-lime/20 hover:bg-ag-lime/30 disabled:bg-ag-lime/10 disabled:cursor-not-allowed text-ag-lime border border-ag-lime/30 rounded-lg transition-colors duration-200"
                  >
                    Confirm Location
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Managed Device Modal */}
        <AnimatePresence>
          {showAddDeviceModal && currentManagedDevice && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={handleCloseAddDeviceModal}
            >
              <motion.div
                initial={{ y: 10 }}
                animate={{ y: 0 }}
                exit={{ y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-ag-black/95 backdrop-blur-md border border-ag-green/30 hover:border-ag-green/50 rounded-xl p-6 w-full max-w-md shadow-2xl transition-all duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-ag-green/20">
                      <Network className="w-6 h-6 text-ag-green" />
                    </div>
                    <h2 className="text-xl font-bold text-ag-white">Add Managed Device</h2>
                  </div>
                  <button
                    onClick={handleCloseAddDeviceModal}
                    className="p-2 rounded-lg hover:bg-ag-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 cursor-pointer text-ag-white/60 hover:text-ag-white transition-colors" />
                  </button>
                </div>

                {/* Device Info */}
                <div className="mb-6 bg-ag-white/5 border border-ag-white/10 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-ag-white mb-2">Device Information</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-ag-white/60">Name:</span>
                      <span className="text-ag-white">{currentManagedDevice.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ag-white/60">IP Address:</span>
                      <span className="text-ag-white font-mono">{currentManagedDevice.ip}</span>
                    </div>
                    {currentManagedDevice.manufacturer && (
                      <div className="flex justify-between">
                        <span className="text-ag-white/60">Manufacturer:</span>
                        <span className="text-ag-white">{currentManagedDevice.manufacturer}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* SSH Credentials */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-ag-white mb-3">SSH Credentials</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-ag-white/60 mb-1">Username</label>
                      <input
                        type="text"
                        value={sshCredentials.username}
                        onChange={(e) => setSSHCredentials(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="root"
                        className="w-full px-3 py-2 bg-ag-black/40 border border-ag-white/20 rounded-lg text-ag-white placeholder-ag-white/40 focus:outline-none focus:border-ag-green/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-ag-white/60 mb-1">Password</label>
                      <input
                        type="password"
                        value={sshCredentials.password}
                        onChange={(e) => setSSHCredentials(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 bg-ag-black/40 border border-ag-white/20 rounded-lg text-ag-white placeholder-ag-white/40 focus:outline-none focus:border-ag-green/50"
                      />
                    </div>
                  </div>
                </div>

                {/* GPS Sync Status */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-ag-white">GPS Location Data</h4>
                    {gpsData && (
                      <span className="text-xs text-green-400">✓ Synced</span>
                    )}
                  </div>
                  {gpsData ? (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-ag-white/60">Position:</div>
                        <div className="text-ag-white font-mono">{gpsData.latitude.toFixed(4)}, {gpsData.longitude.toFixed(4)}</div>
                        {imuData && (
                          <>
                            <div className="text-ag-white/60">Temperature:</div>
                            <div className="text-ag-white font-mono">{imuData.temperature.toFixed(1)}°C</div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleGpsSyncForManagedDevice}
                      disabled={!sshCredentials.username || !sshCredentials.password}
                      className="w-full px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 disabled:bg-blue-500/10 disabled:cursor-not-allowed text-blue-400 disabled:text-blue-400/40 border border-blue-500/30 disabled:border-blue-500/20 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <Satellite className="w-4 h-4" />
                      <span>Sync GPS Location</span>
                    </button>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCloseAddDeviceModal}
                    className="px-4 py-2 text-ag-white/60 hover:text-ag-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFinishManagedDevice}
                    disabled={!sshCredentials.username || !sshCredentials.password || !gpsData}
                    className="px-4 py-2 bg-ag-green/20 hover:bg-ag-green/30 disabled:bg-ag-green/10 disabled:cursor-not-allowed text-ag-green disabled:text-ag-green/40 border border-ag-green/30 disabled:border-ag-green/20 rounded-lg transition-colors duration-200"
                  >
                    Finish
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}