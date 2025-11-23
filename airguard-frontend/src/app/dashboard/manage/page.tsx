import Sidebar from "@/components/sidebar/Sidebar";
import SettingsPanel from "@/components/dashboard/SettingsPanel";
import React from "react";

export default function ManagePage() {
  return (
    <>
      <Sidebar />
      <div className="w-full min-h-svh lg:pl-20">
        <div className="p-8">
          <h1 className="text-4xl font-bold text-ag-green mb-6">Settings</h1>
          <p className="text-ag-white/80 text-lg mb-8">
            Manage your API keys and preferences.
          </p>
          <SettingsPanel />
        </div>
      </div>
    </>
  );
}
