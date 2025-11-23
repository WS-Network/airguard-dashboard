"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastStyles = {
  success: {
    container: "bg-ag-green/20 border-ag-green/50",
    icon: "text-ag-green",
    title: "text-ag-white",
    message: "text-ag-white/80",
  },
  error: {
    container: "bg-ag-red/20 border-ag-red/50",
    icon: "text-ag-red",
    title: "text-ag-white",
    message: "text-ag-white/80",
  },
  warning: {
    container: "bg-ag-orange/20 border-ag-orange/50",
    icon: "text-ag-orange",
    title: "text-ag-white",
    message: "text-ag-white/80",
  },
  info: {
    container: "bg-ag-neon-blue/20 border-ag-neon-blue/50",
    icon: "text-ag-neon-blue",
    title: "text-ag-white",
    message: "text-ag-white/80",
  },
};

export default function Toast({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const IconComponent = toastIcons[type];
  const styles = toastStyles[type];

  useEffect(() => {
    // Animate in
    const showTimer = setTimeout(() => setIsVisible(true), 50);

    // Auto-close after duration
    const hideTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  return (
    <div
      className={`
        w-80 max-w-sm transform transition-all duration-300 ease-in-out
        ${
          isVisible && !isExiting
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0"
        }
      `}
    >
      <div
        className={`
          ${styles.container}
          border backdrop-blur-sm rounded-xl p-4 shadow-lg
          hover:shadow-xl transition-shadow duration-200
        `}
      >
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            <IconComponent className={`w-5 h-5 ${styles.icon}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-semibold ${styles.title} mb-1`}>
              {title}
            </h4>
            {message && (
              <p className={`text-xs ${styles.message} leading-relaxed`}>
                {message}
              </p>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-ag-white/60 hover:text-ag-white transition-colors duration-200 p-1 hover:bg-ag-white/10 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 w-full bg-ag-white/10 rounded-full h-1">
          <div
            className={`h-1 rounded-full transition-all duration-300 ease-linear ${
              type === 'success' ? 'bg-ag-green' :
              type === 'error' ? 'bg-ag-red' :
              type === 'warning' ? 'bg-ag-orange' :
              'bg-ag-neon-blue'
            }`}
            style={{
              animation: `shrink ${duration}ms linear`,
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}