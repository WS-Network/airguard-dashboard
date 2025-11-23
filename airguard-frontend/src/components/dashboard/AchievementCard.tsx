"use client";

import React from "react";
import { Star } from "lucide-react";
import { Achievement } from "@/data/achievements-data";

interface AchievementCardProps {
  achievement: Achievement;
  isExpanded: boolean;
  onToggle: () => void;
}

const getVariantStyles = (variant: Achievement["variant"]) => {
  switch (variant) {
    case "electricity":
      return {
        cardBg: "bg-gradient-to-br from-ag-neon-blue/10 to-ag-neon-blue/5",
        border: "border-ag-neon-blue/30",
        iconBg: "bg-ag-neon-blue/20",
        iconColor: "text-ag-neon-blue",
        progressBg: "bg-ag-neon-blue/20",
        progressFill: "bg-ag-neon-blue",
        shimmer: "from-ag-neon-blue/20 via-ag-neon-blue/40 to-ag-neon-blue/20",
      };
    case "carbon":
      return {
        cardBg: "bg-gradient-to-br from-ag-neon-green/10 to-ag-neon-green/5",
        border: "border-ag-neon-green/30",
        iconBg: "bg-ag-neon-green/20",
        iconColor: "text-ag-neon-green",
        progressBg: "bg-ag-neon-green/20",
        progressFill: "bg-ag-neon-green",
        shimmer:
          "from-ag-neon-green/20 via-ag-neon-green/40 to-ag-neon-green/20",
      };
    case "esg":
      return {
        cardBg: "bg-gradient-to-br from-ag-lime/10 to-ag-lime/5",
        border: "border-ag-lime/30",
        iconBg: "bg-ag-lime/20",
        iconColor: "text-ag-lime",
        progressBg: "bg-ag-lime/20",
        progressFill: "bg-ag-lime",
        shimmer: "from-ag-lime/20 via-ag-lime/40 to-ag-lime/20",
      };
    default: // placeholder
      return {
        cardBg: "bg-gradient-to-br from-ag-white/5 to-ag-white/2",
        border: "border-ag-white/20",
        iconBg: "bg-ag-white/10",
        iconColor: "text-ag-white/60",
        progressBg: "bg-ag-white/10",
        progressFill: "bg-gradient-to-r from-ag-lime to-ag-neon-green",
        shimmer: "from-ag-white/10 via-ag-white/30 to-ag-white/10",
      };
  }
};

const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  isExpanded,
  onToggle,
}) => {
  const styles = getVariantStyles(achievement.variant);
  const isMaxLevel = achievement.currentLevel >= achievement.maxLevel;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`
        relative overflow-hidden rounded-xl border backdrop-blur-sm cursor-pointer group
        transition-all duration-300 ease-out
        ${
          isExpanded
            ? "scale-105 shadow-2xl"
            : "hover:scale-[1.02] hover:shadow-lg"
        }
        ${styles.cardBg} ${styles.border}
      `}
    >
      {/* Simple hover shimmer */}
      <div
        className={`
        absolute inset-0 -translate-x-full bg-gradient-to-r opacity-0
        hover:translate-x-full hover:opacity-20 transition-all duration-700
        ${styles.shimmer}
      `}
      />

      {/* Shine effect for non-expanded cards */}
      {!isExpanded && (
        <div className="absolute inset-0 overflow-hidden">
          <div
            className={`
            absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent
            transform -translate-x-full -skew-x-12 group-hover:translate-x-[200%]
            transition-transform duration-1000 ease-out
          `}
          />
        </div>
      )}

      <div
        className={`relative p-4 transition-all duration-300 ${
          isExpanded ? "p-6" : ""
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between mb-3 transition-all duration-300 ${
            isExpanded ? "mb-4" : ""
          }`}
        >
          <div
            className={`relative rounded-lg ${styles.iconBg} ${
              isExpanded ? "p-3" : "p-2"
            } transition-all duration-300`}
          >
            <achievement.icon
              className={`${isExpanded ? "w-6 h-6" : "w-4 h-4"} ${
                styles.iconColor
              } transition-all duration-300`}
            />
            <div className="absolute -top-1 -right-1">
              <div
                className={`
                ${isExpanded ? "w-5 h-5" : "w-4 h-4"} 
                rounded-full ${styles.iconColor.replace(
                  "text-",
                  "bg-"
                )} bg-opacity-90 
                flex items-center justify-center transition-all duration-300
              `}
              >
                <span
                  className={`${
                    isExpanded ? "text-xs" : "text-[10px]"
                  } font-bold text-ag-black leading-none`}
                >
                  {achievement.currentLevel}
                </span>
              </div>
            </div>
          </div>

          {/* Level indicator */}
          <div
            className={`
            flex items-center space-x-1 transition-all duration-300
            ${
              isExpanded
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-4"
            }
          `}
          >
            <Star className={`w-4 h-4 ${styles.iconColor} fill-current`} />
            <span className={`text-xs ${styles.iconColor} font-semibold`}>
              LEVEL {achievement.currentLevel}/{achievement.maxLevel}
            </span>
          </div>
        </div>

        {/* Title and Description */}
        <div
          className={`mb-3 transition-all duration-300 ${
            isExpanded ? "mb-4" : ""
          }`}
        >
          <h3
            className={`font-bold mb-1 text-ag-white transition-all duration-300 ${
              isExpanded ? "text-lg" : "text-sm"
            }`}
          >
            {achievement.title}
          </h3>
          <div
            className={`
            overflow-hidden transition-all duration-300
            ${isExpanded ? "max-h-20 opacity-100" : "max-h-0 opacity-0"}
          `}
          >
            <p className="text-sm text-ag-white/60 leading-relaxed">
              {achievement.description}
            </p>
          </div>
        </div>

        {/* Value Display */}
        <div
          className={`mb-3 transition-all duration-300 ${
            isExpanded ? "mb-4" : ""
          }`}
        >
          <div className="flex items-baseline space-x-1">
            <span
              className={`font-bold text-ag-white transition-all duration-300 ${
                isExpanded ? "text-3xl" : "text-xl"
              }`}
            >
              {achievement.value}
            </span>
            {achievement.unit && (
              <span
                className={`text-ag-white/60 font-medium transition-all duration-300 ${
                  isExpanded ? "text-sm" : "text-xs"
                }`}
              >
                {achievement.unit}
              </span>
            )}
          </div>

          {/* Simple progress bar for collapsed state */}
          <div
            className={`
            overflow-hidden transition-all duration-300 mt-1
            ${!isExpanded ? "max-h-4 opacity-100" : "max-h-0 opacity-0"}
          `}
          >
            <div className={`w-full h-1 rounded-full ${styles.progressBg}`}>
              <div
                className={`h-full rounded-full ${styles.progressFill} transition-all duration-500`}
                style={{ width: `${achievement.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Expanded Progress Bar */}
        <div
          className={`
          overflow-hidden transition-all duration-300
          ${isExpanded ? "max-h-20 opacity-100 mb-3" : "max-h-0 opacity-0"}
        `}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-ag-white/60 font-medium">
              Progress to Level {achievement.currentLevel + 1}
            </span>
            <span className="text-xs text-ag-white/80 font-semibold">
              {achievement.progress}%
            </span>
          </div>
          <div className={`w-full h-2 rounded-full ${styles.progressBg}`}>
            <div
              className={`h-full rounded-full ${styles.progressFill} transition-all duration-500`}
              style={{ width: `${achievement.progress}%` }}
            />
          </div>
        </div>

        {/* Next Level Target */}
        <div
          className={`
          overflow-hidden transition-all duration-300
          ${
            isExpanded && achievement.nextLevelTarget && !isMaxLevel
              ? "max-h-8 opacity-100"
              : "max-h-0 opacity-0"
          }
        `}
        >
          <div className="text-xs text-ag-white/50 font-medium">
            {achievement.nextLevelTarget}
          </div>
        </div>

        {/* Max Level Indicator */}
        <div
          className={`
          overflow-hidden transition-all duration-300
          ${
            isExpanded && isMaxLevel
              ? "max-h-8 opacity-100"
              : "max-h-0 opacity-0"
          }
        `}
        >
          <div className={`text-xs font-medium ${styles.iconColor}`}>
            🏆 Maximum level achieved!
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementCard;
