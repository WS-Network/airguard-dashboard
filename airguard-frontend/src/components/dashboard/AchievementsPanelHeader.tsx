"use client";

import React from "react";
import { Trophy, EyeOff, Eye } from "lucide-react";

interface AchievementsPanelHeaderProps {
  isVisible: boolean;
  onToggleVisibility: () => void;
}

const AchievementsPanelHeader: React.FC<AchievementsPanelHeaderProps> = ({
  isVisible,
  onToggleVisibility,
}) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-ag-lime/20">
          <Trophy className="w-5 h-5 text-ag-lime" />
        </div>
        <h2 className="text-xl font-bold text-ag-white">
          Environmental Achievements
        </h2>
      </div>

      <button
        onClick={onToggleVisibility}
        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-ag-white/10 hover:bg-ag-white/20 border border-ag-white/20 hover:border-ag-lime/40 transition-all duration-200 text-ag-white/80 hover:text-ag-white"
      >
        {isVisible ? (
          <>
            <EyeOff className="w-4 h-4" />
            <span className="text-sm font-medium">Hide</span>
          </>
        ) : (
          <>
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">Show</span>
          </>
        )}
      </button>
    </div>
  );
};

export default AchievementsPanelHeader;
