"use client";

import React, { useState, useEffect } from 'react';
import './ThemeSelector.css';

const themes = [
  { id: 'light', name: 'Light', icon: '☀️' },
  { id: 'dark', name: 'Dark', icon: '🌙' },
  { id: 'blue', name: 'Ocean Blue', icon: '🌊' },
  { id: 'green', name: 'Nature Green', icon: '🌿' },
  { id: 'purple', name: 'Purple', icon: '💜' },
  { id: 'orange', name: 'Sunset', icon: '🌅' },
  { id: 'high-contrast', name: 'High Contrast', icon: '⚫' },
];

export function ThemeSelector() {
  const [currentTheme, setCurrentTheme] = useState('light');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (themeId: string) => {
    if (themeId === 'light') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', themeId);
    }
  };

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    applyTheme(themeId);
    localStorage.setItem('theme', themeId);
    setIsOpen(false);
  };

  const currentThemeData = themes.find(t => t.id === currentTheme) || themes[0];

  return (
    <div className="theme-selector">
      <button 
        className="theme-selector__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select theme"
      >
        <span className="theme-selector__icon">{currentThemeData.icon}</span>
        <span className="theme-selector__text">{currentThemeData.name}</span>
        <span className="theme-selector__arrow">{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <div className="theme-selector__dropdown">
          {themes.map((theme) => (
            <button
              key={theme.id}
              className={`theme-selector__option ${
                theme.id === currentTheme ? 'theme-selector__option--active' : ''
              }`}
              onClick={() => handleThemeChange(theme.id)}
            >
              <span className="theme-selector__option-icon">{theme.icon}</span>
              <span className="theme-selector__option-text">{theme.name}</span>
              {theme.id === currentTheme && (
                <span className="theme-selector__check">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
