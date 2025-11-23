import { useState, useCallback } from "react";

export const useAchievementsExpansion = () => {
  const [areAllExpanded, setAreAllExpanded] = useState(false);

  const toggleAllCards = useCallback(() => {
    setAreAllExpanded((prev) => !prev);
  }, []);

  const collapseAll = useCallback(() => {
    setAreAllExpanded(false);
  }, []);

  const expandAll = useCallback(() => {
    setAreAllExpanded(true);
  }, []);

  return {
    areAllExpanded,
    toggleAllCards,
    collapseAll,
    expandAll,
  };
};
