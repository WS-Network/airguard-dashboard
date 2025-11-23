import L from "leaflet";
import { THEME_COLORS, DeviceStatus } from "@/data/theme-constants";

export const createDeviceIcon = (status: DeviceStatus) => {
  const color = THEME_COLORS[status];

  return L.divIcon({
    html: `
      <div class="neon-device-marker" data-status="${status}" style="
        width: 32px;
        height: 32px;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
        <!-- Outer hexagonal ring -->
        <div style="
          position: absolute;
          width: 30px;
          height: 30px;
          background: transparent;
          border: 2px solid ${color};
          clip-path: polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%);
          box-shadow: 
            0 0 15px ${color}60,
            0 0 25px ${color}30,
            inset 0 0 10px ${color}20;
          animation: pulse-ring 3s infinite ease-in-out;
        "></div>
        
        <!-- Inner core -->
        <div style="
          width: 16px;
          height: 16px;
          background: ${color};
          border: 2px solid #ffffff;
          border-radius: 50%;
          box-shadow: 
            0 0 10px ${color}80,
            0 0 20px ${color}40,
            inset 0 0 5px rgba(255,255,255,0.3);
          position: relative;
          z-index: 2;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 6px;
            height: 6px;
            background: #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 5px ${color}ff;
          "></div>
        </div>
        
        <!-- Animated corner accents -->
        <div style="
          position: absolute;
          top: -2px;
          left: -2px;
          width: 8px;
          height: 8px;
          border-left: 2px solid ${color};
          border-top: 2px solid ${color};
          opacity: 0.8;
          animation: corner-glow 4s infinite ease-in-out;
        "></div>
        <div style="
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          border-right: 2px solid ${color};
          border-top: 2px solid ${color};
          opacity: 0.8;
          animation: corner-glow 4s infinite ease-in-out 0.5s;
        "></div>
        <div style="
          position: absolute;
          bottom: -2px;
          left: -2px;
          width: 8px;
          height: 8px;
          border-left: 2px solid ${color};
          border-bottom: 2px solid ${color};
          opacity: 0.8;
          animation: corner-glow 4s infinite ease-in-out 1s;
        "></div>
        <div style="
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          border-right: 2px solid ${color};
          border-bottom: 2px solid ${color};
          opacity: 0.8;
          animation: corner-glow 4s infinite ease-in-out 1.5s;
        "></div>
      </div>
      
      <style>
        @keyframes pulse-ring {
          0%, 100% { 
            transform: scale(1); 
            opacity: 1; 
          }
          50% { 
            transform: scale(1.08); 
            opacity: 0.8; 
          }
        }
        
        @keyframes corner-glow {
          0%, 100% { 
            opacity: 0.4; 
            filter: brightness(1); 
          }
          50% { 
            opacity: 1; 
            filter: brightness(1.4) drop-shadow(0 0 4px ${color}); 
          }
        }
      </style>
    `,
    className: "neon-device-marker-container",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};
