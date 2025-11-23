"use client";

import React from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { barChartData } from "@/data/chart-data";

export default function NetworkOptimizationChart() {
  const totalValue = barChartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-ag-black/50 backdrop-blur-sm border border-ag-green/20 hover:border-ag-green/40 rounded-lg p-6 transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-ag-white mb-1">
            Network Optimization Status
          </h3>
          <p className="text-ag-white/60 text-sm">
            Real-time congestion reduction analytics
          </p>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-ag-lime rounded-full animate-pulse"></div>
          <span className="text-ag-white/70 text-sm">Live</span>
        </div>
      </div>

      {/* Chart Container */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barChartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#bae225"
              opacity={0.1}
            />
            <XAxis
              dataKey="name"
              stroke="#bae225"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="#bae225"
              fontSize={12}
              tickLine={false}
              label={{
                value: "Connections",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fill: "#bae225" },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#000000",
                border: "1px solid #d8ff43",
                borderRadius: "8px",
                color: "#ffffff",
              }}
              labelStyle={{ color: "#d8ff43" }}
              formatter={(value: number) => [`${value} connections`, "Count"]}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {barChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-4 flex-wrap">
        {barChartData.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            ></div>
            <span className="text-ag-white/70 text-sm">{entry.name}</span>
          </div>
        ))}
      </div>

      {/* Summary Statistics */}
      <div className="mt-4 pt-4 border-t border-ag-green/20">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-ag-white/60 text-xs">Total Connections</p>
            <p className="text-ag-lime text-lg font-semibold">
              {totalValue.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-ag-white/60 text-xs">Optimization Rate</p>
            <p className="text-ag-lime text-lg font-semibold">
              {Math.round(
                ((barChartData.find((item) => item.name === "Optimized")
                  ?.value || 0) /
                  totalValue) *
                  100
              )}
              %
            </p>
          </div>
          <div className="text-center">
            <p className="text-ag-white/60 text-xs">Congestion Issues</p>
            <p className="text-orange-400 text-lg font-semibold">
              {(barChartData.find((item) => item.name === "Congested")?.value ||
                0) +
                (barChartData.find((item) => item.name === "Interference")
                  ?.value || 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
