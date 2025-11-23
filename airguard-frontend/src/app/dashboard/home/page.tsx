"use client";

import Sidebar from "@/components/sidebar/Sidebar";
import MetricCard from "@/components/dashboard/MetricCard";
import MetricsInfoModal from "@/components/dashboard/MetricsInfoModal";
import ThroughputPerformanceChart from "@/components/dashboard/LineChart";
import NetworkOptimizationChart from "@/components/dashboard/BarChart";
import DeviceStatusChart from "@/components/dashboard/PieChart";
import RecentAlertsPanel from "@/components/dashboard/RecentAlertsPanel";
import DeviceMapWrapper from "@/components/dashboard/DeviceMapWrapper";
import AchievementsPanel from "@/components/dashboard/AchievementsPanel";
import { placeholderDevices } from "@/data/map-data";
import { Shield, Activity, Gauge, Radio, TrendingUp } from "lucide-react";
import React, { useState } from "react";

export default function Homepage() {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<
    "health" | "throughput" | "qos" | "interference" | "load" | null
  >(null);

  const handleInfoClick = (
    metricType: "health" | "throughput" | "qos" | "interference" | "load"
  ) => {
    setSelectedMetric(metricType);
    setIsInfoModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsInfoModalOpen(false);
    setSelectedMetric(null);
  };
  return (
    <>
      <Sidebar />
      <div className="ag-main-content min-h-screen bg-gradient-to-br from-ag-black via-ag-black to-ag-black/95 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8 mt-4 lg:mt-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-ag-white mb-2">
              Airguard Control Center
            </h1>
            <p className="text-ag-white/60 text-sm sm:text-base">
              Monitor your device&apos;s data and performance metrics
            </p>
          </div>

          {/* Environmental Achievements Section - Desktop (top) */}
          <div className="hidden lg:block mb-8">
            <AchievementsPanel />
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
            <MetricCard
              title="Overall Network Health Index"
              value="98.2%"
              change="Optimal"
              changeType="increase"
              icon={Shield}
              variant="lime"
              onInfoClick={() => handleInfoClick("health")}
            />
            <MetricCard
              title="Average Network Throughput"
              value="875 Mbps"
              change="High Flow"
              changeType="increase"
              icon={Activity}
              variant="neon-green"
              onInfoClick={() => handleInfoClick("throughput")}
            />
            <MetricCard
              title="Network-Wide QoS Score"
              value="99.1%"
              change="Quality"
              changeType="increase"
              icon={Gauge}
              variant="neon-blue"
              onInfoClick={() => handleInfoClick("qos")}
            />
            <MetricCard
              title="Overall Interference Level"
              value="-92 dBm"
              change="Low"
              changeType="decrease"
              icon={Radio}
              variant="orange"
              onInfoClick={() => handleInfoClick("interference")}
            />
            <MetricCard
              title="Predicted Network Load"
              value="+5%"
              change="Next 24 Hrs"
              changeType="increase"
              icon={TrendingUp}
              variant="green"
              onInfoClick={() => handleInfoClick("load")}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <ThroughputPerformanceChart />
            <NetworkOptimizationChart />
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-1">
              <DeviceStatusChart devices={placeholderDevices} />
            </div>
            <div className="lg:col-span-2">
              <RecentAlertsPanel />
            </div>
          </div>

          {/* Device Map Section */}
          <div className="mb-8">
            <DeviceMapWrapper devices={placeholderDevices} />
          </div>

          {/* Environmental Achievements Section - Mobile (bottom) */}
          <div className="lg:hidden mb-8">
            <AchievementsPanel />
          </div>
        </div>

        {/* Metrics Info Modal */}
        <MetricsInfoModal
          isOpen={isInfoModalOpen}
          onClose={handleCloseModal}
          metricType={selectedMetric}
        />
      </div>
    </>
  );
}
