"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLoading } from "@/contexts/LoadingContext";
import Image from "next/image";
import AirguardLogo from "@/assets/airguard.svg";
import { MenuIcon, XIcon, LogOutIcon } from "lucide-react";
import { sidebarItems } from "@/data/navigation-data";
import { apiService } from "@/services/api";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { showPageTransition } = useLoading();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleNavigation = (href: string) => {
    // Close mobile menu
    setIsMobileMenuOpen(false);

    // Navigate directly - Next.js handles transitions
    if (pathname !== href) {
      router.replace(href);
    }
  };

  const handleLogout = async () => {
    try {
      setIsMobileMenuOpen(false);

      // Call logout API to clear cookies and session
      await apiService.logout();

      // Redirect to signup page
      router.replace("/signup");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if API fails, redirect to signup (cookies might be cleared anyway)
      router.replace("/signup");
    }
  };

  const isActive = (href: string) => {
    return pathname === href;
  };

  const handleMouseEnter = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    const timeout = setTimeout(() => setIsExpanded(true), 100);
    setHoverTimeout(timeout);
  };

  const handleMouseLeave = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setIsExpanded(false);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeout) clearTimeout(hoverTimeout);
    };
  }, [hoverTimeout]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-[30] ag-mobile-menu-button shadow-lg"
      >
        {isMobileMenuOpen ? (
          <XIcon className="w-6 h-6" />
        ) : (
          <MenuIcon className="w-6 h-6" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 backdrop-blur-md z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 h-full bg-ag-black/60 border-r border-ag-green/20 backdrop-blur-xl z-30 transition-all duration-250 ease-out ${
          isExpanded ? "w-64" : "w-20"
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex flex-col w-full">
          {/* Logo */}
          <div className="flex items-center justify-center py-6 px-4 border-b border-ag-green/20">
            <Image
              src={AirguardLogo}
              alt="Airguard Logo"
              width={isExpanded ? 48 : 36}
              height={isExpanded ? 48 : 36}
              className="transition-all duration-250 ease-out"
            />
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 py-6">
            <ul className="space-y-2 px-4">
              {sidebarItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleNavigation(item.href)}
                      className={`ag-sidebar-item ${
                        isExpanded ? "expanded" : "collapsed"
                      } ${isActive(item.href) ? "active" : ""}`}
                    >
                      <IconComponent className="w-6 h-6 flex-shrink-0 ag-sidebar-icon" />
                      <span
                        className={`ag-sidebar-text ${
                          isExpanded ? "visible" : "hidden"
                        }`}
                      >
                        {item.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout Section */}
          <div className="border-t border-ag-green/20 p-4">
            <button
              onClick={handleLogout}
              className={`ag-sidebar-item ag-logout-button ${
                isExpanded ? "expanded" : "collapsed"
              }`}
            >
              <LogOutIcon className="w-6 h-6 flex-shrink-0 ag-sidebar-icon" />
              <span
                className={`ag-sid  ebar-text ${
                  isExpanded ? "visible" : "hidden"
                }`}
              >
                Logout
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-full w-64 bg-ag-black border-r border-ag-green/20 z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col w-full h-full">
          {/* Logo */}
          <div className="flex items-center justify-center py-6 px-4 border-b border-ag-green/20">
            <Image
              src={AirguardLogo}
              alt="Airguard Logo"
              width={48}
              height={48}
            />
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 py-6">
            <ul className="space-y-2 px-4">
              {sidebarItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleNavigation(item.href)}
                      className={`ag-sidebar-item expanded ${
                        isActive(item.href) ? "active" : ""
                      }`}
                    >
                      <IconComponent className="w-6 h-6 flex-shrink-0 ag-sidebar-icon" />
                      <span className="ag-sidebar-text visible">
                        {item.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout Section */}
          <div className="border-t border-ag-green/20 p-4">
            <button
              onClick={handleLogout}
              className="ag-sidebar-item ag-logout-button expanded"
            >
              <LogOutIcon className="w-6 h-6 flex-shrink-0 ag-sidebar-icon" />
              <span className="ag-sidebar-text visible">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
