"use client";

import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { throughputData } from "@/data/chart-data";
import { ChevronLeft, ChevronRight, TrendingUp, Activity } from "lucide-react";

type TimePeriod = "today" | "lastHour" | "last15Minutes";

interface TimePeriodOption {
  key: TimePeriod;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const timePeriodOptions: TimePeriodOption[] = [
  {
    key: "today",
    label: "Today",
    description: "24-hour view",
    icon: <TrendingUp className="w-4 h-4" />,
  },
  {
    key: "lastHour",
    label: "Last Hour",
    description: "60-minute view",
    icon: <Activity className="w-4 h-4" />,
  },
  {
    key: "last15Minutes",
    label: "Last 15 Min",
    description: "Real-time view",
    icon: <Activity className="w-4 h-4" />,
  },
];

export default function ThroughputPerformanceChart() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("today");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentData = throughputData[selectedPeriod];
  const currentIndex = timePeriodOptions.findIndex(
    (option) => option.key === selectedPeriod
  );

  const handlePeriodChange = (newPeriod: TimePeriod) => {
    if (newPeriod === selectedPeriod) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedPeriod(newPeriod);
      setIsTransitioning(false);
    }, 150);
  };

  const navigateCarousel = (direction: "prev" | "next") => {
    const newIndex =
      direction === "prev"
        ? (currentIndex - 1 + timePeriodOptions.length) %
          timePeriodOptions.length
        : (currentIndex + 1) % timePeriodOptions.length;

    handlePeriodChange(timePeriodOptions[newIndex].key);
  };

  return (
    <div className="bg-ag-black/50 backdrop-blur-sm border border-ag-green/20 hover:border-ag-green/40 rounded-lg p-6 transition-all duration-200">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-semibold text-ag-white mb-1">
              Throughput Performance
            </h3>
            <p className="text-ag-white/60 text-sm">
              {
                timePeriodOptions.find(
                  (option) => option.key === selectedPeriod
                )?.description
              }
            </p>
          </div>

          {/* Carousel Navigation */}
          <div className="w-full">
            {/* Mobile Layout */}
            <div className="block sm:hidden">
              <div className="flex items-center justify-center gap-1 px-2 py-2 overflow-x-auto scrollbar-thin scrollbar-thumb-ag-green/30 scrollbar-track-transparent">
                <div className="flex items-center gap-1 min-w-max px-2">
                  <button
                    onClick={() => navigateCarousel("prev")}
                    className="p-1.5 rounded-md bg-ag-black/30 text-ag-white/70 hover:bg-ag-green/20 hover:text-ag-white border border-ag-green/20 transition-all duration-200 flex-shrink-0"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>

                  {timePeriodOptions.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => handlePeriodChange(option.key)}
                      className={`w-16 h-8 rounded-md text-xs font-medium transition-all duration-200 flex items-center justify-center flex-shrink-0 ${
                        selectedPeriod === option.key
                          ? "bg-ag-lime text-ag-black"
                          : "bg-ag-black/30 text-ag-white/70 hover:bg-ag-green/20 hover:text-ag-white border border-ag-green/20"
                      }`}
                    >
                      <span className="truncate">
                        {option.label.split(" ")[0]}
                      </span>
                    </button>
                  ))}

                  <button
                    onClick={() => navigateCarousel("next")}
                    className="p-1.5 rounded-md bg-ag-black/30 text-ag-white/70 hover:bg-ag-green/20 hover:text-ag-white border border-ag-green/20 transition-all duration-200 flex-shrink-0"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center justify-start gap-2">
              <button
                onClick={() => navigateCarousel("prev")}
                className="p-2 rounded-lg bg-ag-black/30 text-ag-white/70 hover:bg-ag-green/20 hover:text-ag-white border border-ag-green/20 transition-all duration-200 flex-shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {timePeriodOptions.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => handlePeriodChange(option.key)}
                    className={`w-24 h-10 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 flex-shrink-0 ${
                      selectedPeriod === option.key
                        ? "bg-ag-lime text-ag-black"
                        : "bg-ag-black/30 text-ag-white/70 hover:bg-ag-green/20 hover:text-ag-white border border-ag-green/20"
                    }`}
                  >
                    {option.icon}
                    <span className="truncate">{option.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => navigateCarousel("next")}
                className="p-2 rounded-lg bg-ag-black/30 text-ag-white/70 hover:bg-ag-green/20 hover:text-ag-white border border-ag-green/20 transition-all duration-200 flex-shrink-0"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Container with Transition */}
      <div
        className={`h-64 transition-opacity duration-300 ${
          isTransitioning ? "opacity-50" : "opacity-100"
        }`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={currentData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#bae225"
              opacity={0.1}
            />
            <XAxis
              dataKey="time"
              stroke="#bae225"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="#bae225"
              fontSize={12}
              tickLine={false}
              domain={[60, 100]}
              label={{
                value: "Throughput (%)",
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
              formatter={(value: number, name: string) => [
                `${value}%`,
                name === "actual" ? "Actual" : "Predicted",
              ]}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#43ffd6"
              strokeWidth={3}
              dot={{ fill: "#43ffd6", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: "#43ffd6" }}
            />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#d8ff43"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: "#d8ff43", strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, fill: "#d8ff43" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-ag-neon-blue rounded-full"></div>
          <span className="text-ag-white/70 text-sm">Actual Throughput</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-1 bg-ag-lime"
            style={{ borderStyle: "dashed", borderWidth: "1px 0" }}
          ></div>
          <span className="text-ag-white/70 text-sm">Predicted Throughput</span>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="mt-4 pt-4 border-t border-ag-green/20">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-ag-white/60 text-xs">Avg Actual</p>
            <p className="text-ag-lime text-lg font-semibold">
              {Math.round(
                currentData.reduce((sum, item) => sum + item.actual, 0) /
                  currentData.length
              )}
              %
            </p>
          </div>
          <div className="text-center">
            <p className="text-ag-white/60 text-xs">Avg Predicted</p>
            <p className="text-ag-lime text-lg font-semibold">
              {Math.round(
                currentData.reduce((sum, item) => sum + item.predicted, 0) /
                  currentData.length
              )}
              %
            </p>
          </div>
          <div className="text-center">
            <p className="text-ag-white/60 text-xs">Accuracy</p>
            <p className="text-ag-lime text-lg font-semibold">
              {Math.round(
                100 -
                  Math.abs(
                    currentData.reduce((sum, item) => sum + item.actual, 0) /
                      currentData.length -
                      currentData.reduce(
                        (sum, item) => sum + item.predicted,
                        0
                      ) /
                        currentData.length
                  )
              )}
              %
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
