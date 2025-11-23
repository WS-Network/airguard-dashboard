"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin } from "lucide-react";
import { DeviceData } from "@/data/map-data";
import dynamic from "next/dynamic";
import MapLoadingSpinner from "../common/MapLoadingSpinner";

const MapLocationPicker = dynamic(() => import("./MapLocationPicker"), {
  ssr: false,
  loading: () => <MapLoadingSpinner />,
});

interface DeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "add" | "edit";
  device?: DeviceData;
  onSave: (device: DeviceData | Omit<DeviceData, "id">) => void;
}

export default function DeviceModal({
  isOpen,
  onClose,
  mode,
  device,
  onSave,
}: DeviceModalProps) {
  const [formData, setFormData] = React.useState({
    name: "",
    location: "",
    lat: 33.8938,
    lng: 35.5018,
    status: "online" as DeviceData["status"],
    firmwareVersion: "v1.0.0",
  });

  const [showMapPicker, setShowMapPicker] = useState(false);

  // Initialize form data when device changes or modal opens
  useEffect(() => {
    if (mode === "edit" && device) {
      setFormData({
        name: device.name,
        location: device.location,
        lat: device.lat,
        lng: device.lng,
        status: device.status,
        firmwareVersion: device.firmwareVersion || "v1.0.0",
      });
    } else if (mode === "add") {
      setFormData({
        name: "",
        location: "",
        lat: 33.8938,
        lng: 35.5018,
        status: "online",
        firmwareVersion: "v1.0.0",
      });
    }
  }, [mode, device, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleSave = () => {
    if (formData.name && formData.location) {
      if (mode === "edit" && device) {
        onSave({ ...device, ...formData });
      } else {
        onSave(formData);
      }
      onClose();
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData({ ...formData, lat, lng });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              exit={{ y: 10 }}
              transition={{
                duration: 0.2,
                ease: "easeOut",
              }}
              className="bg-ag-black/95 backdrop-blur-md border border-ag-lime/30 hover:border-ag-lime/50 rounded-xl p-6 w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl transition-all duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-ag-white">
                  {mode === "add" ? "Add New Device" : "Edit Device"}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-ag-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-ag-white/60 hover:text-ag-white transition-colors" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
                <div>
                  <label className="block text-ag-white/80 text-sm font-medium mb-2">
                    Device Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-ag-black/40 border border-ag-white/20 rounded-lg text-ag-white placeholder-ag-white/40 focus:outline-none focus:border-ag-lime/50"
                    placeholder="Enter device name"
                  />
                </div>

                <div>
                  <label className="block text-ag-white/80 text-sm font-medium mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-ag-black/40 border border-ag-white/20 rounded-lg text-ag-white placeholder-ag-white/40 focus:outline-none focus:border-ag-lime/50"
                    placeholder="Enter location"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-ag-white/80 text-sm font-medium mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      value={formData.lat}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lat: parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-ag-black/40 border border-ag-white/20 rounded-lg text-ag-white placeholder-ag-white/40 focus:outline-none focus:border-ag-lime/50"
                      step="0.0001"
                    />
                  </div>
                  <div>
                    <label className="block text-ag-white/80 text-sm font-medium mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      value={formData.lng}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lng: parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-ag-black/40 border border-ag-white/20 rounded-lg text-ag-white placeholder-ag-white/40 focus:outline-none focus:border-ag-lime/50"
                      step="0.0001"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-ag-white/80 text-sm font-medium">
                      Select Location on Map
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowMapPicker(!showMapPicker)}
                      className="flex items-center space-x-1 text-ag-lime hover:text-ag-lime/80 transition-colors text-sm"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>{showMapPicker ? "Hide Map" : "Show Map"}</span>
                    </button>
                  </div>

                  {showMapPicker && (
                    <div className="mb-4">
                      <MapLocationPicker
                        position={[formData.lat, formData.lng]}
                        onLocationSelect={handleLocationSelect}
                      />
                      <p className="text-xs text-ag-white/60 mt-1">
                        Click on the map to select coordinates
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-ag-white/80 text-sm font-medium mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as DeviceData["status"],
                      })
                    }
                    className="w-full px-3 py-2 bg-ag-black/40 border border-ag-white/20 rounded-lg text-ag-white focus:outline-none focus:border-ag-lime/50 [&>option]:bg-ag-black [&>option]:text-ag-white"
                  >
                    <option value="online">Online</option>
                    <option value="warning">Warning</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>

                <div>
                  <label className="block text-ag-white/80 text-sm font-medium mb-2">
                    Firmware Version
                  </label>
                  <input
                    type="text"
                    value={formData.firmwareVersion}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        firmwareVersion: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-ag-black/40 border border-ag-white/20 rounded-lg text-ag-white placeholder-ag-white/40 focus:outline-none focus:border-ag-lime/50"
                    placeholder="e.g., v2.1.3"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-ag-white/10">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-ag-white/60 hover:text-ag-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.name || !formData.location}
                  className="px-4 py-2 bg-ag-lime/20 hover:bg-ag-lime/30 text-ag-lime border border-ag-lime/30 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {mode === "add" ? "Add Device" : "Update Device"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
