"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface Alert {
  id: number;
  type: string;
  title: string;
  message: string;
  time: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

interface AlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: Alert[];
}

export default function AlertsModal({
  isOpen,
  onClose,
  alerts,
}: AlertsModalProps) {
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
              className="bg-ag-black/95 backdrop-blur-md border border-ag-green/30 hover:border-ag-green/50 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl transition-all duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-ag-white">All Alerts</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-ag-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-ag-white/60 hover:text-ag-white transition-colors" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
                {alerts.map((alert, index) => {
                  const IconComponent = alert.icon;
                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ y: 10 }}
                      animate={{ y: 0 }}
                      transition={{
                        delay: index * 0.05,
                        duration: 0.3,
                        ease: "easeOut",
                      }}
                      className="flex items-start gap-4 p-4 rounded-lg bg-ag-black/40 border border-ag-green/10 hover:border-ag-green/30 hover:bg-ag-black/60 transition-all duration-200"
                    >
                      <div
                        className={`p-3 rounded-lg ${alert.bgColor} flex-shrink-0`}
                      >
                        <IconComponent className={`w-5 h-5 ${alert.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-ag-white font-semibold text-base mb-1">
                          {alert.title}
                        </h3>
                        <p className="text-ag-white/70 text-sm leading-relaxed mb-2">
                          {alert.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-ag-white/50 text-xs">
                            {alert.time}
                          </p>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              alert.type === "error"
                                ? "bg-ag-red/20 text-ag-red"
                                : alert.type === "warning"
                                ? "bg-ag-orange/20 text-ag-orange"
                                : alert.type === "success"
                                ? "bg-ag-neon-green/20 text-ag-neon-green"
                                : "bg-ag-neon-blue/20 text-ag-neon-blue"
                            }`}
                          >
                            {alert.type}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-ag-green/20">
                <div className="flex justify-between items-center">
                  <p className="text-ag-white/60 text-sm">
                    {alerts.length} total alerts
                  </p>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-ag-green/20 hover:bg-ag-green/30 text-ag-green font-medium rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
