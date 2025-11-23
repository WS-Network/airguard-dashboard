"use client";

import React, { ReactNode, useEffect, useState } from "react";
import { useLoading } from "@/contexts/LoadingContext";
import LoadingScreen from "@/components/common/LoadingScreen";

interface LoadingWrapperProps {
  children: ReactNode;
}

export default function LoadingWrapper({ children }: LoadingWrapperProps) {
  const { isLoading } = useLoading();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      <div
        className={`prevent-flash loading-transition ${
          isMounted ? "mounted" : ""
        } ${isLoading ? "!opacity-0 pointer-events-none" : ""}`}
      >
        {children}
      </div>
      {isLoading && <LoadingScreen />}
    </>
  );
}
