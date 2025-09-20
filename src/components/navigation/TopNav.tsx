"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./TopNav.css";

interface TopNavProps {
  sidebarCollapsed: boolean;
  onSidebarToggle: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  sidebarCollapsed,
  onSidebarToggle,
}) => {
  const pathname = usePathname();

  const getPageTitle = () => {
    switch (pathname) {
      case "/":
        return "Current Lessons";
      case "/create":
        return "Create New Lesson";
      case "/lesson":
        return "Lesson Details";
      default:
        if (pathname.startsWith("/lesson/")) {
          return "Lesson Details";
        }
        return "Learning App";
    }
  };

  return (
    <header
      className={`topnav ${
        sidebarCollapsed ? "topnav--sidebar-collapsed" : ""
      }`}
    >
      <div className="topnav__left">
        <button
          className="topnav__sidebar-toggle"
          onClick={onSidebarToggle}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <Link href="/" className="topnav__logo">
          <span className="topnav__logo-icon">🎓</span>
          <span className="topnav__logo-text">LearnAI</span>
        </Link>
      </div>

      <div className="topnav__center">
        <h1 className="topnav__title">{getPageTitle()}</h1>
      </div>

      <div className="topnav__right">
        <nav className="topnav__nav">
          <Link
            href="/"
            className={`topnav__link ${
              pathname === "/" ? "topnav__link--active" : ""
            }`}
          >
            Lessons
          </Link>
          <Link
            href="/create"
            className={`topnav__link ${
              pathname === "/create" ? "topnav__link--active" : ""
            }`}
          >
            Create
          </Link>
        </nav>
      </div>
    </header>
  );
};
