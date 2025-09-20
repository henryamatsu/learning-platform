"use client";

import React, { useState, useEffect } from 'react';

const themes = [
  { id: 'light', name: 'Light' },
  { id: 'dark', name: 'Dark' },
  { id: 'blue', name: 'Blue' },
];

export function ThemeToggle() {
  const [currentTheme, setCurrentTheme] = useState('light');

  useEffect(() => {
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

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const themeId = e.target.value;
    setCurrentTheme(themeId);
    applyTheme(themeId);
    localStorage.setItem('theme', themeId);
  };

  return (
    <select 
      value={currentTheme} 
      onChange={handleThemeChange}
      style={{
        padding: '4px 8px',
        fontSize: '14px',
        border: '1px solid var(--border-primary)',
        borderRadius: '4px',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}
    >
      {themes.map((theme) => (
        <option key={theme.id} value={theme.id}>
          {theme.name}
        </option>
      ))}
    </select>
  );
}
