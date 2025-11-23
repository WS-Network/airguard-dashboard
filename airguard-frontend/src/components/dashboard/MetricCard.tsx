import React from "react";
import { LucideIcon, Info } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease" | "neutral";
  icon: LucideIcon;
  variant?: "lime" | "green" | "neon-green" | "neon-blue" | "orange";
  onInfoClick?: () => void;
}

export default function MetricCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  variant = "green",
  onInfoClick,
}: MetricCardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case "increase":
        return "text-ag-neon-green";
      case "decrease":
        return "text-ag-red";
      default:
        return "text-ag-white/60";
    }
  };

  const getVariantColors = () => {
    switch (variant) {
      case "lime":
        return {
          iconBg: "bg-ag-lime/20",
          iconColor: "text-ag-lime",
          border: "border-ag-lime/20 hover:border-ag-lime/40",
        };
      case "neon-green":
        return {
          iconBg: "bg-ag-neon-green/20",
          iconColor: "text-ag-neon-green",
          border: "border-ag-neon-green/20 hover:border-ag-neon-green/40",
        };
      case "neon-blue":
        return {
          iconBg: "bg-ag-neon-blue/20",
          iconColor: "text-ag-neon-blue",
          border: "border-ag-neon-blue/20 hover:border-ag-neon-blue/40",
        };
      case "orange":
        return {
          iconBg: "bg-ag-orange/20",
          iconColor: "text-ag-orange",
          border: "border-ag-orange/20 hover:border-ag-orange/40",
        };
      default: // green
        return {
          iconBg: "bg-ag-green/20",
          iconColor: "text-ag-green",
          border: "border-ag-green/20 hover:border-ag-green/40",
        };
    }
  };

  const getChangeSymbol = () => {
    switch (changeType) {
      case "increase":
        return "↗";
      case "decrease":
        return "↘";
      default:
        return "→";
    }
  };

  const colors = getVariantColors();

  return (
    <div
      className={`bg-ag-black/50 backdrop-blur-sm border rounded-lg p-6 transition-all duration-200 ${colors.border}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${colors.iconBg}`}>
          <Icon className={`w-6 h-6 ${colors.iconColor}`} />
        </div>
        <div className="flex items-center gap-2">
          {onInfoClick && (
            <button
              onClick={onInfoClick}
              className="p-1.5 rounded-lg hover:bg-ag-white/10 transition-colors"
              title="Information"
            >
              <Info className="w-4 h-4 text-ag-white/60 hover:text-ag-white transition-colors" />
            </button>
          )}
          <span className={`text-sm font-medium ${getChangeColor()}`}>
            {getChangeSymbol()} {change}
          </span>
        </div>
      </div>
      <div>
        <h3 className="text-ag-white/60 text-sm font-medium mb-1">{title}</h3>
        <p className="text-2xl font-bold text-ag-white">{value}</p>
      </div>
    </div>
  );
}
