"use client";

import dynamic from "next/dynamic";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Map, Table } from "lucide-react";
import DeviceSetupTable from "./DeviceSetupTable";
import { DeviceData, placeholderDevices } from "@/data/map-data";
import MapLoadingSpinner from "../common/MapLoadingSpinner";

const DeviceMap = dynamic(() => import("./DeviceMap"), {
  ssr: false,
  loading: () => (
    <div className="bg-ag-black/60 backdrop-blur-sm border border-ag-lime/20 rounded-xl p-4 sm:p-6 hover:border-ag-lime/40 transition-colors duration-300 h-[400px] sm:h-[600px] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 sm:gap-0">
        <h3 className="text-lg sm:text-xl font-semibold text-ag-white">
          Device Locations
        </h3>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-ag-white/60">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2 shadow-sm shadow-emerald-400/50"></div>
            Online
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2 shadow-sm shadow-yellow-400/50"></div>
            Warning
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2 shadow-sm shadow-red-400/50"></div>
            Offline
          </div>
        </div>
      </div>
      <MapLoadingSpinner />
      <div className="mt-4 pt-4 border-t border-ag-white/10 text-sm text-ag-white/60">
        <div className="flex items-center justify-between">
          <span>Initializing map...</span>
          <span className="animate-pulse">Please wait...</span>
        </div>
      </div>
    </div>
  ),
});

interface DeviceSetupMapWrapperProps {
  devices?: DeviceData[];
  onAddDevice?: (deviceId: string, sshConfig: { username: string; password: string }, gpsData: any) => void;
}

export default function DeviceSetupMapWrapper({ devices, onAddDevice }: DeviceSetupMapWrapperProps) {
  const [viewMode, setViewMode] = useState<"map" | "table">("table");
  const [deviceList] = useState<DeviceData[]>(
    devices && devices.length > 0 ? devices : placeholderDevices
  );

  const handleAddDevice = (deviceId: string, sshConfig: { username: string; password: string }, gpsData: any) => {
    console.log('Device added:', deviceId, sshConfig, gpsData);
    // TODO: Implement API call to add device to managed list
    if (onAddDevice) {
      onAddDevice(deviceId, sshConfig, gpsData);
    }
  };

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center sm:flex-row sm:items-center justify-between bg-ag-black/40 backdrop-blur-sm border border-ag-white/10 hover:border-ag-lime/40 rounded-xl p-4 sm:p-6 gap-4 sm:gap-0 transition-all duration-300"
      >
        <div className="flex flex-col items-center sm:flex-row sm:items-center gap-2 sm:gap-4">
          <h2 className="text-lg sm:text-xl font-semibold text-ag-white text-center sm:text-left">
            Available Devices
          </h2>
          <span className="text-ag-white/60 text-xs sm:text-sm">
            {deviceList.length} devices discovered
          </span>
        </div>

        <div className="flex items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
          <div
            className={`flex items-center space-x-2 text-xs sm:text-sm transition-colors duration-300 ${
              viewMode === "map" ? "text-ag-lime" : "text-ag-white/60"
            }`}
          >
            <Map className="w-4 h-4" />
            <span className="hidden sm:inline">Map</span>
          </div>

          <motion.button
            onClick={() => setViewMode(viewMode === "map" ? "table" : "map")}
            className="relative flex items-center justify-between w-20 h-10 p-1 rounded-full bg-ag-black/40 border border-ag-lime/30 transition-all duration-200 hover:border-ag-lime/50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              className="absolute top-1 left-1 w-8 h-8 bg-gradient-to-r from-ag-lime to-ag-lime/80 rounded-full shadow-lg flex items-center justify-center"
              animate={{
                x: viewMode === "table" ? 40 : 0,
                rotate: viewMode === "table" ? 180 : 0,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            >
              {viewMode === "map" ? (
                <Map className="w-4 h-4 text-ag-black" />
              ) : (
                <Table className="w-4 h-4 text-ag-black" />
              )}
            </motion.div>
          </motion.button>

          <div
            className={`flex items-center space-x-2 text-xs sm:text-sm transition-colors duration-300 ${
              viewMode === "table" ? "text-ag-lime" : "text-ag-white/60"
            }`}
          >
            <Table className="w-4 h-4" />
            <span className="hidden sm:inline">Table</span>
          </div>
        </div>
      </motion.div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait">
          {viewMode === "map" ? (
            <motion.div
              key="map"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <DeviceMap devices={deviceList} />
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <DeviceSetupTable
                devices={deviceList}
                onAddDevice={handleAddDevice}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
