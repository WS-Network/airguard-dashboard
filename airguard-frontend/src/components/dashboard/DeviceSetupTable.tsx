"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DeviceData } from "@/data/map-data";
import {
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
  Settings,
  X,
  Satellite,
  Loader2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
} from "lucide-react";

interface DeviceSetupTableProps {
  devices: DeviceData[];
  onAddDevice: (deviceId: string, sshConfig: { username: string; password: string }, gpsData: any) => void;
}

type SortField = keyof DeviceData;
type SortDirection = "asc" | "desc";

const statusColors = {
  healthy: "bg-[#bae225]/20 text-[#bae225] border-[#bae225]/30",
  warning: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  critical: "bg-red-500/20 text-red-500 border-red-500/30",
  offline: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

interface GpsData {
  latitude: number;
  longitude: number;
  altitude: number;
  accuracy: number;
  heading: number;
  timestamp: string;
}

export default function DeviceSetupTable({
  devices,
  onAddDevice,
}: DeviceSetupTableProps) {
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [globalFilterText, setGlobalFilterText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Column-specific filters
  const [nameFilter, setNameFilter] = useState("");
  const [manufacturerFilter, setManufacturerFilter] = useState("");
  const [ipFilter, setIpFilter] = useState("");
  const [macFilter, setMacFilter] = useState("");
  const [portsFilter, setPortsFilter] = useState("");
  const [sshPortFilter, setSshPortFilter] = useState("");

  // Add popup state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceData | null>(null);
  const [currentStep, setCurrentStep] = useState(1); // 1 = SSH, 2 = GPS
  const [sshUsername, setSshUsername] = useState("");
  const [sshPassword, setSshPassword] = useState("");
  const [isWaitingForGps, setIsWaitingForGps] = useState(false);
  const [gpsData, setGpsData] = useState<GpsData | null>(null);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedDevices = useMemo(() => {
    const filtered = devices.filter((device) => {
      const matchesGlobal =
        !globalFilterText ||
        device.name.toLowerCase().includes(globalFilterText.toLowerCase()) ||
        device.manufacturer.toLowerCase().includes(globalFilterText.toLowerCase()) ||
        device.ip.toLowerCase().includes(globalFilterText.toLowerCase()) ||
        device.macAddress.toLowerCase().includes(globalFilterText.toLowerCase());

      const matchesName = !nameFilter || device.name.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesManufacturer = !manufacturerFilter || device.manufacturer.toLowerCase().includes(manufacturerFilter.toLowerCase());
      const matchesIp = !ipFilter || device.ip.toLowerCase().includes(ipFilter.toLowerCase());
      const matchesMac = !macFilter || device.macAddress.toLowerCase().includes(macFilter.toLowerCase());
      const matchesPorts = !portsFilter || device.openPorts.toLowerCase().includes(portsFilter.toLowerCase());
      const matchesSshPort = !sshPortFilter || device.sshPort.toLowerCase().includes(sshPortFilter.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || device.status === statusFilter;

      return matchesGlobal && matchesName && matchesManufacturer && matchesIp &&
             matchesMac && matchesPorts && matchesSshPort && matchesStatus;
    });

    return filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return sortDirection === "asc" ? 1 : -1;
      if (bValue === undefined) return sortDirection === "asc" ? -1 : 1;

      let aCompare = aValue;
      let bCompare = bValue;

      if (typeof aValue === "string") {
        aCompare = aValue.toLowerCase();
        bCompare = (bValue as string).toLowerCase();
      }

      if (aCompare < bCompare) return sortDirection === "asc" ? -1 : 1;
      if (aCompare > bCompare) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [devices, sortField, sortDirection, globalFilterText, nameFilter, manufacturerFilter,
      ipFilter, macFilter, portsFilter, sshPortFilter, statusFilter]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const handleAddClick = (device: DeviceData) => {
    setSelectedDevice(device);
    setShowAddModal(true);
    setCurrentStep(1);
    setSshUsername("");
    setSshPassword("");
    setGpsData(null);
    setIsWaitingForGps(false);
  };

  const handleNextStep = () => {
    setCurrentStep(2);
    setIsWaitingForGps(true);
  };

  const handlePreviousStep = () => {
    setCurrentStep(1);
    setIsWaitingForGps(false);
  };

  const handleTestGpsData = () => {
    // Simulate receiving GPS data
    const dummyGpsData: GpsData = {
      latitude: 33.8938 + (Math.random() * 0.01),
      longitude: 35.5018 + (Math.random() * 0.01),
      altitude: 100 + (Math.random() * 50),
      accuracy: 5 + (Math.random() * 5),
      heading: Math.random() * 360,
      timestamp: new Date().toISOString(),
    };
    setGpsData(dummyGpsData);
    setIsWaitingForGps(false);
  };

  const handleFinish = () => {
    if (selectedDevice && gpsData) {
      onAddDevice(selectedDevice.id, { username: sshUsername, password: sshPassword }, gpsData);
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setSelectedDevice(null);
    setCurrentStep(1);
    setSshUsername("");
    setSshPassword("");
    setGpsData(null);
    setIsWaitingForGps(false);
  };

  const clearAllFilters = () => {
    setGlobalFilterText("");
    setNameFilter("");
    setManufacturerFilter("");
    setIpFilter("");
    setMacFilter("");
    setPortsFilter("");
    setSshPortFilter("");
    setStatusFilter("all");
  };

  const hasActiveFilters = globalFilterText || nameFilter || manufacturerFilter || ipFilter ||
                           macFilter || portsFilter || sshPortFilter || statusFilter !== "all";

  return (
    <>
      <div className="bg-ag-black/60 backdrop-blur-sm border border-ag-lime/20 rounded-xl p-6 hover:border-ag-lime/40 transition-colors duration-300 h-[700px] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-ag-white">
            Available Devices
          </h3>
        </div>

        {/* Global Search and Status Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ag-white/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search all fields..."
              value={globalFilterText}
              onChange={(e) => setGlobalFilterText(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-ag-black/40 border border-ag-white/20 rounded-lg text-ag-white placeholder-ag-white/40 focus:outline-none focus:border-ag-lime/50"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="text-ag-white/40 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-ag-black/40 border border-ag-white/20 rounded-lg text-ag-white px-3 py-2 focus:outline-none focus:border-ag-lime/50 cursor-pointer"
              style={{
                appearance: "auto",
                WebkitAppearance: "menulist",
                MozAppearance: "menulist",
              }}
            >
              <option value="all" style={{ backgroundColor: "#1a1a1a", color: "#ffffff" }}>
                All Status
              </option>
              <option value="healthy" style={{ backgroundColor: "#1a1a1a", color: "#ffffff" }}>
                Healthy
              </option>
              <option value="warning" style={{ backgroundColor: "#1a1a1a", color: "#ffffff" }}>
                Warning
              </option>
              <option value="critical" style={{ backgroundColor: "#1a1a1a", color: "#ffffff" }}>
                Critical
              </option>
              <option value="offline" style={{ backgroundColor: "#1a1a1a", color: "#ffffff" }}>
                Offline
              </option>
            </select>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-colors duration-200 text-sm"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-ag-black/90 backdrop-blur-sm z-10">
                <tr className="border-b border-ag-white/10">
                  <th className="text-left py-3 px-4 text-ag-white/80 font-medium w-24">
                    Add
                  </th>
                  <th className="text-left py-3 px-4 text-ag-white/80 font-medium w-16">
                    #
                  </th>
                  <th
                    className="text-left py-3 px-4 text-ag-white/80 font-medium cursor-pointer hover:text-ag-lime transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center space-x-2">
                      <span>Device Name</span>
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th
                    className="text-left py-3 px-4 text-ag-white/80 font-medium cursor-pointer hover:text-ag-lime transition-colors"
                    onClick={() => handleSort("manufacturer")}
                  >
                    <div className="flex items-center space-x-2">
                      <span>Manufacturer</span>
                      <SortIcon field="manufacturer" />
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-ag-white/80 font-medium">
                    IP Address
                  </th>
                  <th className="text-left py-3 px-4 text-ag-white/80 font-medium">
                    MAC Address
                  </th>
                  <th className="text-left py-3 px-4 text-ag-white/80 font-medium">
                    Open Ports
                  </th>
                  <th className="text-left py-3 px-4 text-ag-white/80 font-medium">
                    SSH Port
                  </th>
                  <th className="text-left py-3 px-4 text-ag-white/80 font-medium">
                    Status
                  </th>
                </tr>
                {/* Filter Row */}
                <tr className="border-b border-ag-white/10">
                  <th className="py-2 px-4"></th>
                  <th className="py-2 px-4"></th>
                  <th className="py-2 px-4">
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={nameFilter}
                      onChange={(e) => setNameFilter(e.target.value)}
                      className="w-full px-2 py-1 bg-ag-black/40 border border-ag-white/10 rounded text-ag-white text-sm placeholder-ag-white/30 focus:outline-none focus:border-ag-lime/50"
                    />
                  </th>
                  <th className="py-2 px-4">
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={manufacturerFilter}
                      onChange={(e) => setManufacturerFilter(e.target.value)}
                      className="w-full px-2 py-1 bg-ag-black/40 border border-ag-white/10 rounded text-ag-white text-sm placeholder-ag-white/30 focus:outline-none focus:border-ag-lime/50"
                    />
                  </th>
                  <th className="py-2 px-4">
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={ipFilter}
                      onChange={(e) => setIpFilter(e.target.value)}
                      className="w-full px-2 py-1 bg-ag-black/40 border border-ag-white/10 rounded text-ag-white text-sm placeholder-ag-white/30 focus:outline-none focus:border-ag-lime/50"
                    />
                  </th>
                  <th className="py-2 px-4">
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={macFilter}
                      onChange={(e) => setMacFilter(e.target.value)}
                      className="w-full px-2 py-1 bg-ag-black/40 border border-ag-white/10 rounded text-ag-white text-sm placeholder-ag-white/30 focus:outline-none focus:border-ag-lime/50"
                    />
                  </th>
                  <th className="py-2 px-4">
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={portsFilter}
                      onChange={(e) => setPortsFilter(e.target.value)}
                      className="w-full px-2 py-1 bg-ag-black/40 border border-ag-white/10 rounded text-ag-white text-sm placeholder-ag-white/30 focus:outline-none focus:border-ag-lime/50"
                    />
                  </th>
                  <th className="py-2 px-4">
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={sshPortFilter}
                      onChange={(e) => setSshPortFilter(e.target.value)}
                      className="w-full px-2 py-1 bg-ag-black/40 border border-ag-white/10 rounded text-ag-white text-sm placeholder-ag-white/30 focus:outline-none focus:border-ag-lime/50"
                    />
                  </th>
                  <th className="py-2 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedDevices.map((device, index) => (
                  <tr
                    key={device.id}
                    className="border-b border-ag-white/5 hover:bg-ag-white/5 transition-colors"
                  >
                    {/* Add Button Column */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleAddClick(device)}
                        className="px-3 py-1.5 bg-ag-lime/20 hover:bg-ag-lime/30 text-ag-lime border border-ag-lime/30 rounded-lg transition-colors duration-200 text-sm font-medium"
                      >
                        Add
                      </button>
                    </td>
                    {/* Numbering Column */}
                    <td className="py-3 px-4 text-ag-white/60 text-sm">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4 text-ag-white">{device.name}</td>
                    <td className="py-3 px-4 text-ag-white/80">
                      {device.manufacturer}
                    </td>
                    <td className="py-3 px-4 text-ag-white/80 font-mono text-sm">
                      {device.ip}
                    </td>
                    <td className="py-3 px-4 text-ag-white/60 font-mono text-xs">
                      {device.macAddress}
                    </td>
                    <td className="py-3 px-4 text-ag-white/60 text-sm">
                      {device.openPorts}
                    </td>
                    <td className="py-3 px-4 text-ag-white/80 font-mono text-sm">
                      {device.sshPort}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${
                          statusColors[device.status]
                        }`}
                      >
                        {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAndSortedDevices.length === 0 && (
              <div className="text-center py-8 text-ag-white/60">
                No devices found matching your criteria.
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-ag-white/10 text-sm text-ag-white/60">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span>
              Showing: {filteredAndSortedDevices.length} of {devices.length}{" "}
              devices
            </span>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              <span className="text-[#bae225]">
                Healthy: {filteredAndSortedDevices.filter((d) => d.status === "healthy").length}
              </span>
              <span className="text-ag-white/40">|</span>
              <span className="text-amber-500">
                Warning: {filteredAndSortedDevices.filter((d) => d.status === "warning").length}
              </span>
              <span className="text-ag-white/40">|</span>
              <span className="text-red-500">
                Critical: {filteredAndSortedDevices.filter((d) => d.status === "critical").length}
              </span>
              <span className="text-ag-white/40">|</span>
              <span className="text-gray-400">
                Offline: {filteredAndSortedDevices.filter((d) => d.status === "offline").length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Step Add Device Modal */}
      <AnimatePresence>
        {showAddModal && selectedDevice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCloseModal();
              }
            }}
          >
            <motion.div
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              exit={{ y: 10 }}
              transition={{
                duration: 0.2,
                ease: "easeOut",
              }}
              className="bg-ag-black/95 backdrop-blur-md border border-ag-lime/30 hover:border-ag-lime/50 rounded-xl p-6 w-full max-w-md shadow-2xl transition-all duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-ag-lime/20">
                    {currentStep === 1 ? (
                      <Settings className="w-6 h-6 text-ag-lime" />
                    ) : (
                      <Satellite className="w-6 h-6 text-blue-400" />
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-ag-white">
                    {currentStep === 1 ? "SSH Configuration" : "GPS Synchronization"}
                  </h2>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-lg hover:bg-ag-white/10 transition-colors"
                >
                  <X className="w-5 h-5 cursor-pointer text-ag-white/60 hover:text-ag-white transition-colors" />
                </button>
              </div>

              {/* Step Indicator */}
              <div className="flex items-center justify-center mb-6 space-x-2">
                <div className={`w-3 h-3 rounded-full ${currentStep === 1 ? 'bg-ag-lime' : 'bg-ag-white/20'}`} />
                <div className="w-12 h-0.5 bg-ag-white/20" />
                <div className={`w-3 h-3 rounded-full ${currentStep === 2 ? 'bg-blue-400' : 'bg-ag-white/20'}`} />
              </div>

              <div className="mb-6 space-y-4">
                <div className="bg-ag-black/40 border border-ag-white/10 rounded-lg p-3">
                  <p className="text-ag-white font-medium">
                    {selectedDevice.name}
                  </p>
                  <p className="text-ag-white/60 text-sm">
                    {selectedDevice.ip}
                  </p>
                </div>

                {currentStep === 1 ? (
                  // SSH Configuration Step
                  <>
                    <div>
                      <label className="block text-sm font-medium text-ag-white mb-2">
                        SSH Username
                      </label>
                      <input
                        type="text"
                        value={sshUsername}
                        onChange={(e) => setSshUsername(e.target.value)}
                        placeholder="root"
                        className="w-full px-4 py-2 bg-ag-black/40 border border-ag-white/20 rounded-lg text-ag-white placeholder-ag-white/40 focus:outline-none focus:border-ag-lime/50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-ag-white mb-2">
                        SSH Password
                      </label>
                      <input
                        type="password"
                        value={sshPassword}
                        onChange={(e) => setSshPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2 bg-ag-black/40 border border-ag-white/20 rounded-lg text-ag-white placeholder-ag-white/40 focus:outline-none focus:border-ag-lime/50"
                      />
                    </div>
                  </>
                ) : (
                  // GPS Sync Step
                  <>
                    {!gpsData ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-4" />
                        <p className="text-ag-white/80 text-center mb-2">
                          Waiting for GPS data from dongle...
                        </p>
                        <p className="text-ag-white/60 text-sm text-center mb-4">
                          Press the button on the dongle near the device
                        </p>
                        {/* Test Button */}
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

                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-2">
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
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                          <p className="text-blue-400 text-sm">
                            ✓ Device location and orientation data successfully captured
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between">
                {currentStep === 1 ? (
                  <>
                    <button
                      onClick={handleCloseModal}
                      className="px-4 py-2 text-ag-white/60 hover:text-ag-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleNextStep}
                      disabled={!sshUsername || !sshPassword}
                      className="flex items-center space-x-2 px-4 py-2 bg-ag-lime/20 hover:bg-ag-lime/30 text-ag-lime border border-ag-lime/30 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handlePreviousStep}
                      className="flex items-center space-x-2 px-4 py-2 text-ag-white/60 hover:text-ag-white transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>
                    <button
                      onClick={handleFinish}
                      disabled={!gpsData}
                      className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
                    >
                      Finish
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
