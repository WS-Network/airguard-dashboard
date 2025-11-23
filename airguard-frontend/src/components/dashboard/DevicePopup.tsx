import React from "react";
import { Popup } from "react-leaflet";
import { DeviceData } from "@/data/map-data";
import { useMap } from "react-leaflet";

interface DevicePopupProps {
  device: DeviceData;
  onAlertClick?: () => void;
}

export default function DevicePopup({
  device,
  onAlertClick,
}: DevicePopupProps) {
  const map = useMap();
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-emerald-400";
      case "warning":
        return "text-yellow-400";
      case "offline":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-emerald-400/20 border-emerald-400/40";
      case "warning":
        return "bg-yellow-400/20 border-yellow-400/40";
      case "offline":
        return "bg-red-400/20 border-red-400/40";
      default:
        return "bg-gray-400/20 border-gray-400/40";
    }
  };

  const getBorderColor = (status: string) => {
    switch (status) {
      case "online":
        return "border-emerald-400/60";
      case "warning":
        return "border-yellow-400/60";
      case "offline":
        return "border-red-400/60";
      default:
        return "border-gray-400/60";
    }
  };

  const getShadowColor = (status: string) => {
    switch (status) {
      case "online":
        return "shadow-emerald-400/30";
      case "warning":
        return "shadow-yellow-400/30";
      case "offline":
        return "shadow-red-400/30";
      default:
        return "shadow-gray-400/30";
    }
  };

  const handleStatusClick = () => {
    if (
      (device.status === "warning" || device.status === "offline") &&
      onAlertClick
    ) {
      onAlertClick();
    }
  };

  const handleClosePopup = () => {
    map.closePopup();
  };

  return (
    <Popup
      closeOnClick={false}
      autoClose={false}
      autoPan={true}
      closeButton={false}
      className={`device-popup device-popup-${device.status}`}
      minWidth={280}
      maxWidth={280}
      offset={[0, -8]}
    >
      <div
        className={`bg-gray-900/95 text-white p-3 rounded-lg border ${getBorderColor(
          device.status
        )} backdrop-blur-sm shadow-xl ${getShadowColor(
          device.status
        )} min-w-[280px] w-[280px]`}
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          lineHeight: "1.4",
          letterSpacing: "0.01em",
        }}
      >
        {/* Device name */}
        <div className="mb-2">
          <h4
            className={`text-sm font-bold ${getStatusColor(
              device.status
            )} truncate`}
          >
            {device.name}
          </h4>
        </div>

        {/* Location */}
        <div className="mb-2">
          <p className="text-xs text-gray-200 truncate font-medium">
            {device.location}
          </p>
        </div>

        {/* Status */}
        <div
          className={`px-2 py-1 rounded-md text-center border ${getStatusBgColor(
            device.status
          )} ${
            device.status === "warning" || device.status === "offline"
              ? "cursor-pointer"
              : ""
          }`}
          onClick={handleStatusClick}
        >
          <span
            className={`text-xs font-semibold ${getStatusColor(device.status)}`}
          >
            ● {device.status.toUpperCase()}
            {(device.status === "warning" || device.status === "offline") && (
              <span className="ml-1 text-xs text-gray-200 font-normal">
                (Click for alerts)
              </span>
            )}
          </span>
        </div>

        {/* Close Button */}
        <div className="mt-2">
          <button
            onClick={handleClosePopup}
            className="w-full px-2 py-1 text-xs font-semibold text-gray-200 bg-gray-800/90 hover:bg-red-500/90 border border-gray-600/50 hover:border-red-400/70 rounded-md transition-colors duration-200 cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </Popup>
  );
}
