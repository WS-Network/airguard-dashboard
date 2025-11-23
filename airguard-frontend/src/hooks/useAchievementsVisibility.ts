"use client";

import { useState, useEffect } from "react";

export const useAchievementsVisibility = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== "undefined") {
      // Load visibility state from localStorage
      const savedVisibility = localStorage.getItem("achievements-visibility");
      if (savedVisibility !== null) {
        setIsVisible(JSON.parse(savedVisibility));
      }
    }
    setIsLoading(false);
  }, []);

  const toggleVisibility = () => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);

    // Only access localStorage on client side
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "achievements-visibility",
        JSON.stringify(newVisibility)
      );
    }
  };

  return {
    isVisible,
    toggleVisibility,
    isLoading,
  };
};
