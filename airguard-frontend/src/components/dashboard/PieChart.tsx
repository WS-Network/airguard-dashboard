"use client";

import React, { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { DeviceData } from "@/data/map-data";

interface DeviceStatusChartProps {
  devices?: DeviceData[];
}

export default function DeviceStatusChart({ devices = [] }: DeviceStatusChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Calculate pie chart data from actual device statuses
  const pieChartData = useMemo(() => {
    const healthyCount = devices.filter(d => d.status === "healthy").length;
    const warningCount = devices.filter(d => d.status === "warning").length;
    const criticalCount = devices.filter(d => d.status === "critical").length;
    const offlineCount = devices.filter(d => d.status === "offline").length;

    return [
      { name: "Healthy", value: healthyCount, color: "#bae225" },    // ag-green
      { name: "Warning", value: warningCount, color: "#f59e0b" },    // amber-500
      { name: "Critical", value: criticalCount, color: "#ef4444" },  // red-500
      { name: "Offline", value: offlineCount, color: "#666666" },    // gray
    ].filter(item => item.value > 0); // Only show categories with devices
  }, [devices]);

  const totalDevices = devices.length;

  const onPieEnter = (_: unknown, index: number) => {
    setHoveredIndex(index);
  };

  const onPieLeave = () => {
    setHoveredIndex(null);
  };

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number;
      color: string;
    }>;
  }

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-black border border-ag-green rounded-lg p-3 shadow-lg">
          <p className="text-ag-white font-medium">{data.name}</p>
          <p className="text-ag-lime text-sm">
            <span className="font-semibold">{data.value}</span> devices
          </p>
          <p className="text-ag-white/60 text-xs">
            {totalDevices > 0
              ? ((data.value / totalDevices) * 100).toFixed(1)
              : 0}
            % of total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-ag-black/50 backdrop-blur-sm border border-ag-green/20 hover:border-ag-green/40 rounded-lg p-6 h-full transition-all duration-200 flex flex-col">
      <h3 className="text-lg font-semibold text-ag-white mb-4">
        Device Health Status
      </h3>
      {pieChartData.length > 0 ? (
        <>
          <div className="h-64 flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#000000"
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      style={{
                        filter:
                          hoveredIndex === index
                            ? "brightness(1.1)"
                            : "brightness(1)",
                        cursor: "default",
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{
                    color: "#ffffff",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex-shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <p className="text-2xl font-bold" style={{ color: "#bae225" }}>
                  {devices.filter(d => d.status === "healthy").length}
                </p>
                <p className="text-ag-white/60 text-xs sm:text-sm">Healthy</p>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: "#f59e0b" }}>
                  {devices.filter(d => d.status === "warning").length}
                </p>
                <p className="text-ag-white/60 text-xs sm:text-sm">Warning</p>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: "#ef4444" }}>
                  {devices.filter(d => d.status === "critical").length}
                </p>
                <p className="text-ag-white/60 text-xs sm:text-sm">Critical</p>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: "#666666" }}>
                  {devices.filter(d => d.status === "offline").length}
                </p>
                <p className="text-ag-white/60 text-xs sm:text-sm">Offline</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-grow flex items-center justify-center">
          <p className="text-ag-white/60 text-sm">No devices available</p>
        </div>
      )}
    </div>
  );
}
