"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import AlertsModal from "./AlertsModal";
import { recentAlerts } from "@/data/alerts-data";

export default function RecentAlertsPanel() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Show only the first 3 alerts in the panel
  const displayedAlerts = recentAlerts.slice(0, 3);

  return (
    <>
      <div className="bg-ag-black/50 backdrop-blur-sm border border-ag-green/20 hover:border-ag-green/40 rounded-lg p-6 h-full transition-all duration-200 flex flex-col">
        <h3 className="text-lg font-semibold text-ag-white mb-4">
          Recent Items Panel
        </h3>
        <div className="space-y-4 flex-1 overflow-y-auto">
          {displayedAlerts.map((alert, index) => {
            const IconComponent = alert.icon;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-ag-black/30 border border-ag-green/10 hover:border-ag-green/20 transition-colors"
              >
                <div className={`p-2 rounded-lg ${alert.bgColor}`}>
                  <IconComponent className={`w-4 h-4 ${alert.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-ag-white font-medium text-sm">
                    {alert.title}
                  </p>
                  <p className="text-ag-white/60 text-xs mt-1">
                    {alert.message}
                  </p>
                  <p className="text-ag-white/40 text-xs mt-2">{alert.time}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full mt-4 py-2 text-ag-green text-sm font-medium hover:bg-ag-green/10 rounded-lg transition-colors flex-shrink-0"
        >
          View All Items ({recentAlerts.length})
        </button>
      </div>

      <AlertsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        alerts={recentAlerts}
      />
    </>
  );
}
