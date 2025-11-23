"use client";

import React from "react";
import Image from "next/image";
import AirguardLogo from "@/assets/airguard.svg";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-ag-black flex items-center justify-center z-[9999] backdrop-blur-sm">
      <div className="relative">
        <div className="absolute inset-0 bg-ag-green/20 rounded-full animate-ping"></div>
        <Image
          src={AirguardLogo}
          alt="Airguard Logo"
          width={80}
          height={80}
          className="relative z-10 animate-pulse"
        />
      </div>
    </div>
  );
}
