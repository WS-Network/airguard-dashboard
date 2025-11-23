"use client";

import React from "react";
import { useAchievementsVisibility } from "@/hooks/useAchievementsVisibility";
import { useAchievementsExpansion } from "@/hooks/useAchievementsExpansion";
import AchievementsPanelHeader from "./AchievementsPanelHeader";
import AchievementsGrid from "./AchievementsGrid";

const AchievementsPanel: React.FC = () => {
  const { isVisible, toggleVisibility, isLoading } =
    useAchievementsVisibility();

  const { areAllExpanded, toggleAllCards } = useAchievementsExpansion();

  if (isLoading) {
    return null; // Prevent flash of content while loading
  }

  return (
    <div className="w-full">
      <AchievementsPanelHeader
        isVisible={isVisible}
        onToggleVisibility={toggleVisibility}
      />

      {/* Collapsible Content */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isVisible ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mb-4">
          <div className="flex-1 h-px bg-gradient-to-r from-ag-lime/50 to-transparent mb-2" />
          <p className="text-ag-white/60 text-sm">
            Track your environmental impact and unlock new milestones
          </p>
        </div>

        <AchievementsGrid
          areAllExpanded={areAllExpanded}
          onToggleAll={toggleAllCards}
        />
      </div>
    </div>
  );
};

export default AchievementsPanel;
