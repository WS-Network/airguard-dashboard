"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";

interface DeviceTableProps {
  devices: DeviceData[];
  onDeleteDevice: (deviceId: string) => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (device: DeviceData) => void;
}

type SortField = keyof DeviceData;
type SortDirection = "asc" | "desc";

const statusColors = {
  up: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  down: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function DeviceTable({
  devices,
  onDeleteDevice,
  onOpenAddModal,
  onOpenEditModal,
}: DeviceTableProps) {
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filterText, setFilterText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<DeviceData | null>(null);
  const [showConfigureModal, setShowConfigureModal] = useState(false);
  const [deviceToConfigure, setDeviceToConfigure] = useState<DeviceData | null>(null);
  const [showGpsSyncModal, setShowGpsSyncModal] = useState(false);
  const [deviceToSync, setDeviceToSync] = useState<DeviceData | null>(null);
  const [sshUsername, setSshUsername] = useState("");
  const [sshPassword, setSshPassword] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

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
      const matchesText =
        device.name.toLowerCase().includes(filterText.toLowerCase()) ||
        device.manufacturer.toLowerCase().includes(filterText.toLowerCase()) ||
        device.ip.toLowerCase().includes(filterText.toLowerCase()) ||
        device.macAddress.toLowerCase().includes(filterText.toLowerCase()) ||
        device.id.toLowerCase().includes(filterText.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || device.status === statusFilter;

      return matchesText && matchesStatus;
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
  }, [devices, sortField, sortDirection, filterText, statusFilter]);

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
  };

  const handleConfigureSubmit = () => {
    // TODO: Implement SSH connection logic
    console.log(`Connecting to ${deviceToConfigure?.ip} via SSH...`);
    console.log(`Username: ${sshUsername}`);
    console.log(`SSH Port: ${deviceToConfigure?.sshPort}`);
    // For now, just close the modal
    setShowConfigureModal(false);
    setDeviceToConfigure(null);
    setSshUsername("");
    setSshPassword("");
  };

  const handleGpsSyncClick = (device: DeviceData) => {
    setDeviceToSync(device);
    setShowGpsSyncModal(true);
    setIsSyncing(true);

    // TODO: Implement actual GPS sync logic with dongle
    // For now, simulate waiting for dongle data
    console.log(`Waiting for GPS data from dongle for device: ${device.name}`);
  };

  const handleCancelGpsSync = () => {
    setShowGpsSyncModal(false);
    setDeviceToSync(null);
    setIsSyncing(false);
  };

  return (
    <>
      <div className="bg-ag-black/60 backdrop-blur-sm border border-ag-lime/20 rounded-xl p-6 hover:border-ag-lime/40 transition-colors duration-300 h-[600px] flex flex-col">
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

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ag-white/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search devices..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
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
              <option
                value="all"
                style={{ backgroundColor: "#1a1a1a", color: "#ffffff" }}
              >
                All Status
              </option>
              <option
                value="up"
                style={{ backgroundColor: "#1a1a1a", color: "#ffffff" }}
              >
                Up
              </option>
              <option
                value="down"
                style={{ backgroundColor: "#1a1a1a", color: "#ffffff" }}
              >
                Down
              </option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-ag-black/80 backdrop-blur-sm">
                <tr className="border-b border-ag-white/10">
                  <th
                    className="text-left py-3 px-4 text-ag-white/80 font-medium cursor-pointer hover:text-ag-lime transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center space-x-2">
                      <span>Device Name</span>
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-ag-white/80 font-medium">
                    Manufacturer
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
                  <th className="text-left py-3 px-4 text-ag-white/80 font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedDevices.map((device) => (
                  <tr
                    key={device.id}
                    className="border-b border-ag-white/5 hover:bg-ag-white/5 transition-colors"
                  >
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
                        {device.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleConfigureClick(device)}
                          className="p-1 text-ag-white/60 hover:text-ag-lime transition-colors"
                          title="Configure SSH"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleGpsSyncClick(device)}
                          className="p-1 text-ag-white/60 hover:text-blue-400 transition-colors"
                          title="GPS Sync"
                        >
                          <Satellite className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(device)}
                          className="p-1 text-ag-white/60 hover:text-red-400 transition-colors"
                          title="Delete Device"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
          <div className="flex items-center justify-between">
            <span>
              Total: {filteredAndSortedDevices.length} of {devices.length}{" "}
              devices
            </span>
            <span>
              Up:{" "}
              {
                filteredAndSortedDevices.filter((d) => d.status === "up")
                  .length
              }{" "}
              | Down:{" "}
              {
                filteredAndSortedDevices.filter((d) => d.status === "down")
                  .length
              }
            </span>
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
