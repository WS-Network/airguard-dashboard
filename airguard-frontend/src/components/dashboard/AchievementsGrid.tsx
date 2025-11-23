"use client";

import React from "react";
import { achievements } from "@/data/achievements-data";
import AchievementCard from "./AchievementCard";

interface AchievementsGridProps {
  areAllExpanded: boolean;
  onToggleAll: () => void;
}

const AchievementsGrid: React.FC<AchievementsGridProps> = ({
  areAllExpanded,
  onToggleAll,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {achievements.map((achievement) => (
        <AchievementCard
          key={achievement.id}
          achievement={achievement}
          isExpanded={areAllExpanded}
          onToggle={onToggleAll}
        />
      ))}
    </div>
  );
};

export default AchievementsGrid;
