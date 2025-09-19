"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./Sidebar.css";

interface SidebarItem {
  href: string;
  label: string;
  icon: string;
}

const sidebarItems: SidebarItem[] = [
  {
    href: "/",
    label: "Current Lessons",
    icon: "📚",
  },
  {
    href: "/create",
    label: "Create Lesson",
    icon: "➕",
  },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const pathname = usePathname();

  return (
    <aside className={`sidebar ${isCollapsed ? "sidebar--collapsed" : ""}`}>
      <div className="sidebar__header">
        <button
          className="sidebar__toggle"
          onClick={onToggle}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? "→" : "←"}
        </button>
        {!isCollapsed && <h2 className="sidebar__title">Navigation</h2>}
      </div>

      <nav className="sidebar__nav">
        <ul className="sidebar__list">
          {sidebarItems.map((item) => (
            <li key={item.href} className="sidebar__item">
              <Link
                href={item.href}
                className={`sidebar__link ${
                  pathname === item.href ? "sidebar__link--active" : ""
                }`}
              >
                <span className="sidebar__icon">{item.icon}</span>
                {!isCollapsed && (
                  <span className="sidebar__label">{item.label}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};
