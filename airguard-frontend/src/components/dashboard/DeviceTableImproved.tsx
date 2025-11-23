"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DeviceData } from "@/data/map-data";
import {
  ChevronUp,
  ChevronDown,
  Plus,
  Search,
  Filter,
  Settings,
  Trash2,
  AlertTriangle,
  X,
  Satellite,
  Loader2,
  MoreVertical,
  ChevronDown as ChevronDownIcon,
} from "lucide-react";

interface DeviceTableImprovedProps {
  devices: DeviceData[];
  onDeleteDevice: (deviceId: string) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (device: DeviceData) => void;
}

type SortField = keyof DeviceData;
type SortDirection = "asc" | "desc";

const statusColors = {
  healthy: "bg-[#bae225]/20 text-[#bae225] border-[#bae225]/30",
  warning: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  critical: "bg-red-500/20 text-red-500 border-red-500/30",
  offline: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export default function DeviceTableImproved({
  devices,
  onDeleteDevice,
  onOpenAddModal,
  onOpenEditModal,
}: DeviceTableImprovedProps) {
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

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<DeviceData | null>(null);
  const [showConfigureModal, setShowConfigureModal] = useState(false);
  const [deviceToConfigure, setDeviceToConfigure] = useState<DeviceData | null>(null);
  const [showGpsSyncModal, setShowGpsSyncModal] = useState(false);
  const [deviceToSync, setDeviceToSync] = useState<DeviceData | null>(null);
  const [sshUsername, setSshUsername] = useState("");
  const [sshPassword, setSshPassword] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  // Dropdown menu state
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      // Global filter
      const matchesGlobal =
        !globalFilterText ||
        device.name.toLowerCase().includes(globalFilterText.toLowerCase()) ||
        device.manufacturer.toLowerCase().includes(globalFilterText.toLowerCase()) ||
        device.ip.toLowerCase().includes(globalFilterText.toLowerCase()) ||
        device.macAddress.toLowerCase().includes(globalFilterText.toLowerCase()) ||
        device.id.toLowerCase().includes(globalFilterText.toLowerCase());

      // Column-specific filters
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

  const handleAddDevice = () => {
    onOpenAddModal();
  };

  const handleDeleteClick = (device: DeviceData) => {
    setDeviceToDelete(device);
    setShowDeleteModal(true);
    setOpenDropdownId(null);
  };

  const handleConfirmDelete = () => {
    if (deviceToDelete) {
      onDeleteDevice(deviceToDelete.id);
      setShowDeleteModal(false);
      setDeviceToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeviceToDelete(null);
  };

  const handleConfigureClick = (device: DeviceData) => {
    setDeviceToConfigure(device);
    setSshUsername("");
    setSshPassword("");
    setShowConfigureModal(true);
    setOpenDropdownId(null);
  };

  const handleConfigureSubmit = () => {
    console.log(`Connecting to ${deviceToConfigure?.ip} via SSH...`);
    console.log(`Username: ${sshUsername}`);
    console.log(`SSH Port: ${deviceToConfigure?.sshPort}`);
    setShowConfigureModal(false);
    setDeviceToConfigure(null);
    setSshUsername("");
    setSshPassword("");
  };

  const handleGpsSyncClick = (device: DeviceData) => {
    setDeviceToSync(device);
    setShowGpsSyncModal(true);
    setIsSyncing(true);
    setOpenDropdownId(null);
    console.log(`Waiting for GPS data from dongle for device: ${device.name}`);
  };

  const handleCancelGpsSync = () => {
    setShowGpsSyncModal(false);
    setDeviceToSync(null);
    setIsSyncing(false);
  };

  const toggleDropdown = (deviceId: string) => {
    setOpenDropdownId(openDropdownId === deviceId ? null : deviceId);
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
            Device Management
          </h3>
          <button
            onClick={handleAddDevice}
            className="flex items-center space-x-2 bg-ag-lime/20 hover:bg-ag-lime/30 text-ag-lime border border-ag-lime/30 px-4 py-2 rounded-lg transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add Device</span>
          </button>
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
                {/* Header Row */}
                <tr className="border-b border-ag-white/10">
                  <th className="text-left py-3 px-4 text-ag-white/80 font-medium w-16">
                    Actions
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
                    {/* Actions Column with Dropdown */}
                    <td className="py-3 px-4 relative">
                      <div ref={openDropdownId === device.id ? dropdownRef : null}>
                        <button
                          onClick={() => toggleDropdown(device.id)}
                          className="p-1 text-ag-white/60 hover:text-ag-lime transition-colors"
                          title="Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openDropdownId === device.id && (
                          <div className="absolute left-0 top-full mt-1 bg-ag-black/95 border border-ag-white/20 rounded-lg shadow-lg z-20 min-w-[160px]">
                            <button
                              onClick={() => handleConfigureClick(device)}
                              className="w-full flex items-center space-x-2 px-4 py-2 text-ag-white/80 hover:bg-ag-lime/20 hover:text-ag-lime transition-colors text-left"
                            >
                              <Settings className="w-4 h-4" />
                              <span>Configure SSH</span>
                            </button>
                            <button
                              onClick={() => handleGpsSyncClick(device)}
                              className="w-full flex items-center space-x-2 px-4 py-2 text-ag-white/80 hover:bg-blue-500/20 hover:text-blue-400 transition-colors text-left"
                            >
                              <Satellite className="w-4 h-4" />
                              <span>GPS Sync</span>
                            </button>
                            <button
                              onClick={() => handleDeleteClick(device)}
                              className="w-full flex items-center space-x-2 px-4 py-2 text-ag-white/80 hover:bg-red-500/20 hover:text-red-400 transition-colors text-left rounded-b-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
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

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && deviceToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCancelDelete}
          >
            <motion.div
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              exit={{ y: 10 }}
              transition={{
                duration: 0.2,
                ease: "easeOut",
              }}
              className="bg-ag-black/95 backdrop-blur-md border border-red-500/30 hover:border-red-500/50 rounded-xl p-6 w-full max-w-md shadow-2xl transition-all duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <h2 className="text-xl font-bold text-ag-white">
                    Delete Device
                  </h2>
                </div>
                <button
                  onClick={handleCancelDelete}
                  className="p-2 rounded-lg hover:bg-ag-white/10 transition-colors"
                >
                  <X className="w-5 h-5 cursor-pointer text-ag-white/60 hover:text-ag-white transition-colors" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-ag-white/80 mb-4">
                  Are you sure you want to delete this device? This action
                  cannot be undone.
                </p>
                <div className="bg-ag-black/40 border border-ag-white/10 rounded-lg p-3">
                  <p className="text-ag-white font-medium">
                    {deviceToDelete.name}
                  </p>
                  <p className="text-ag-white/60 text-sm">
                    {deviceToDelete.ip}
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 text-ag-white/60 hover:text-ag-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-colors duration-200"
                >
                  Delete Device
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Configure SSH Modal */}
      <AnimatePresence>
        {showConfigureModal && deviceToConfigure && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfigureModal(false)}
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
                    <Settings className="w-6 h-6 text-ag-lime" />
                  </div>
                  <h2 className="text-xl font-bold text-ag-white">
                    Configure SSH Access
                  </h2>
                </div>
                <button
                  onClick={() => setShowConfigureModal(false)}
                  className="p-2 rounded-lg hover:bg-ag-white/10 transition-colors"
                >
                  <X className="w-5 h-5 cursor-pointer text-ag-white/60 hover:text-ag-white transition-colors" />
                </button>
              </div>

              <div className="mb-6 space-y-4">
                <div className="bg-ag-black/40 border border-ag-white/10 rounded-lg p-3">
                  <p className="text-ag-white font-medium">
                    {deviceToConfigure.name}
                  </p>
                  <p className="text-ag-white/60 text-sm">
                    {deviceToConfigure.ip}:{deviceToConfigure.sshPort}
                  </p>
                </div>

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
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfigureModal(false)}
                  className="px-4 py-2 text-ag-white/60 hover:text-ag-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfigureSubmit}
                  disabled={!sshUsername || !sshPassword}
                  className="px-4 py-2 bg-ag-lime/20 hover:bg-ag-lime/30 text-ag-lime border border-ag-lime/30 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Connect via SSH
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GPS Sync Modal */}
      <AnimatePresence>
        {showGpsSyncModal && deviceToSync && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCancelGpsSync}
          >
            <motion.div
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              exit={{ y: 10 }}
              transition={{
                duration: 0.2,
                ease: "easeOut",
              }}
              className="bg-ag-black/95 backdrop-blur-md border border-blue-500/30 hover:border-blue-500/50 rounded-xl p-6 w-full max-w-md shadow-2xl transition-all duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Satellite className="w-6 h-6 text-blue-400" />
                  </div>
                  <h2 className="text-xl font-bold text-ag-white">
                    GPS Sync
                  </h2>
                </div>
                <button
                  onClick={handleCancelGpsSync}
                  className="p-2 rounded-lg hover:bg-ag-white/10 transition-colors"
                >
                  <X className="w-5 h-5 cursor-pointer text-ag-white/60 hover:text-ag-white transition-colors" />
                </button>
              </div>

              <div className="mb-6 space-y-4">
                <div className="bg-ag-black/40 border border-ag-white/10 rounded-lg p-3">
                  <p className="text-ag-white font-medium">
                    {deviceToSync.name}
                  </p>
                  <p className="text-ag-white/60 text-sm">
                    {deviceToSync.location}
                  </p>
                </div>

                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="w-12 h-12 text-blue-400 animate-spin mb-4" />
                  <p className="text-ag-white/80 text-center mb-2">
                    Waiting for GPS data from dongle...
                  </p>
                  <p className="text-ag-white/60 text-sm text-center">
                    Press the button on the dongle near the device
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-blue-400 text-sm">
                    <strong>Instructions:</strong> Position the dongle near the device and press the sync button. The system will automatically capture GPS coordinates, orientation data, and device information.
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleCancelGpsSync}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-colors duration-200"
                >
                  Cancel Sync
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
