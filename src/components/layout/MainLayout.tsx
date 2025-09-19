"use client";

import React, { useState } from "react";
import { Sidebar } from "../navigation/Sidebar";
import { TopNav } from "../navigation/TopNav";
import "./MainLayout.css";

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="main-layout">
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <TopNav
        sidebarCollapsed={sidebarCollapsed}
        onSidebarToggle={toggleSidebar}
      />
      <main
        className={`main-content ${
          sidebarCollapsed ? "main-content--sidebar-collapsed" : ""
        }`}
      >
        <div className="main-content__inner">{children}</div>
      </main>
    </div>
  );
};
