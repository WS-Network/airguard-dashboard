import Sidebar from "@/components/sidebar/Sidebar";
import React from "react";

export default function UnlockPage() {
  return (
    <>
      <Sidebar />
      <div className="w-full min-h-svh flex justify-center items-center lg:pl-20">
        <div className="p-8 text-center">
          <h1 className="text-4xl font-bold text-ag-green mb-4">Unlock</h1>
          <p className="text-ag-white/80 text-lg">
            Unlock and access your Airguard system.
          </p>
        </div>
      </div>
    </>
  );
}
