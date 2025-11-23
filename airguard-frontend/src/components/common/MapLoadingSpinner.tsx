import React from "react";

export default function MapLoadingSpinner() {
  return (
    <div className="h-[500px] bg-ag-black/40 border border-ag-white/20 rounded-lg flex items-center justify-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-ag-lime"></div>
    </div>
  );
}
