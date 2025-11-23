"use client";

// TODO: Connect to real-time device location API
// TODO: Implement WebSocket for live device status updates
// TODO: Add geofencing and location-based alerts
// TODO: Integrate with device management backend

import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@/styles/map.css";
import {
  DeviceData,
  placeholderDevices,
  BEIRUT_COORDINATES,
} from "@/data/map-data";
import { deviceAlerts } from "@/data/alerts-data";
import { createDeviceIcon } from "./MapIcons";
import DevicePopup from "./DevicePopup";
import AlertsModal from "./AlertsModal";
import MapLoadingSpinner from "../common/MapLoadingSpinner";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface DeviceMapProps {
  devices?: DeviceData[];
}

export default function DeviceMap({ devices = [] }: DeviceMapProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [currentOpenPopup, setCurrentOpenPopup] = useState<string | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  const displayDevices = devices.length > 0 ? devices : placeholderDevices;

  const closeAllPopups = () => {
    markersRef.current.forEach((marker) => {
      marker.closePopup();
    });
    setCurrentOpenPopup(null);
  };

  const handleMarkerHover = (markerId: string, marker: L.Marker) => {
    if (currentOpenPopup !== markerId) {
      // Only close other popups and open this one if it's a different node
      closeAllPopups();
      setCurrentOpenPopup(markerId);
      marker.openPopup();
    }
    // If hovering on the same node, do nothing (keep popup open)
  };

  const handleOpenAlerts = () => {
    setIsAlertsModalOpen(true);
  };

  const handleCloseAlerts = () => {
    setIsAlertsModalOpen(false);
  };

  useEffect(() => {
    // Simply use Beirut coordinates as the map center
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-ag-black/60 backdrop-blur-sm border border-ag-white/10 hover:border-ag-lime/40 rounded-xl p-6 map-loading transition-colors duration-300">
        <h3 className="text-xl font-semibold text-ag-white mb-4">
          Device Locations
        </h3>
        <MapLoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-ag-black/60 backdrop-blur-sm border border-ag-lime/20 rounded-xl p-6 hover:border-ag-lime/40 transition-colors duration-300 h-[600px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-ag-white">
          Device Locations
        </h3>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-ag-white/60">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2 shadow-sm" style={{ backgroundColor: "#bae225", boxShadow: "0 0 4px #bae22580" }}></div>
            Healthy
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2 shadow-sm" style={{ backgroundColor: "#f59e0b", boxShadow: "0 0 4px #f59e0b80" }}></div>
            Warning
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2 shadow-sm" style={{ backgroundColor: "#ef4444", boxShadow: "0 0 4px #ef444480" }}></div>
            Critical
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2 shadow-sm" style={{ backgroundColor: "#666666", boxShadow: "0 0 4px #66666680" }}></div>
            Offline
          </div>
        </div>
      </div>

      <div className="flex-1 rounded-lg overflow-hidden border border-ag-lime/20">
        <MapContainer
          center={BEIRUT_COORDINATES}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Device markers */}
          {displayDevices.map((device) => (
            <Marker
              key={device.id}
              position={[device.lat, device.lng]}
              icon={createDeviceIcon(device.status)}
              ref={(ref) => {
                if (ref) markersRef.current.set(device.id, ref);
              }}
              eventHandlers={{
                mouseover: (e) => {
                  handleMarkerHover(device.id, e.target);
                },
                popupclose: () => {
                  if (currentOpenPopup === device.id) {
                    setCurrentOpenPopup(null);
                  }
                },
              }}
            >
              <DevicePopup device={device} onAlertClick={handleOpenAlerts} />
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-ag-white/10 text-sm text-ag-white/60">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span>Total Devices: {displayDevices.length}</span>
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <span className="text-[#bae225]">
              Healthy: {displayDevices.filter((d) => d.status === "healthy").length}
            </span>
            <span className="text-ag-white/40">|</span>
            <span className="text-amber-500">
              Warning: {displayDevices.filter((d) => d.status === "warning").length}
            </span>
            <span className="text-ag-white/40">|</span>
            <span className="text-red-500">
              Critical: {displayDevices.filter((d) => d.status === "critical").length}
            </span>
            <span className="text-ag-white/40">|</span>
            <span className="text-gray-400">
              Offline: {displayDevices.filter((d) => d.status === "offline").length}
            </span>
          </div>
        </div>
      </div>

      {/* Alerts Modal */}
      <AlertsModal
        isOpen={isAlertsModalOpen}
        onClose={handleCloseAlerts}
        alerts={deviceAlerts}
      />
    </div>
  );
}
