"use client";

import React from "react";
import { Button } from "../ui/Button";

export interface SectionNavigationProps {
  currentSection: number;
  totalSections: number;
  onSectionChange: (sectionIndex: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  canNavigateNext?: boolean;
  sectionTitles?: string[];
  completedSections?: number[];
}

export function SectionNavigation({
  currentSection,
  totalSections,
  onSectionChange,
  onPrevious,
  onNext,
  canNavigateNext = true,
  sectionTitles = [],
  completedSections = []
}: SectionNavigationProps) {
  const sections = Array.from({ length: totalSections }, (_, index) => index);

  const getSectionStatus = (sectionIndex: number) => {
    if (completedSections.includes(sectionIndex)) {
      return 'completed';
    } else if (sectionIndex === currentSection) {
      return 'current';
    } else if (sectionIndex < currentSection) {
      return 'available';
    } else {
      return 'locked';
    }
  };

  const getSectionIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'current': return '📍';
      case 'available': return '⭕';
      case 'locked': return '🔒';
      default: return '⭕';
    }
  };

  const canNavigateToSection = (sectionIndex: number) => {
    // Can navigate to completed sections, current section, or next available section
    return sectionIndex <= currentSection || completedSections.includes(sectionIndex);
  };

  const canNavigateToPrevious = () => {
    return currentSection > 0;
  };

  const canNavigateToNext = () => {
    const nextSection = currentSection + 1;
    return nextSection < totalSections && canNavigateToSection(nextSection) && canNavigateNext;
  };

  return (
    <div className="section-navigation">
      <div className="section-navigation__header">
        <h3 className="section-navigation__title">Course Progress</h3>
        <div className="section-navigation__progress">
          {completedSections.length} of {totalSections} sections completed
        </div>
      </div>

      <div className="section-navigation__sections">
        {sections.map((sectionIndex) => {
          const status = getSectionStatus(sectionIndex);
          const canNavigate = canNavigateToSection(sectionIndex);
          const sectionTitle = sectionTitles[sectionIndex] || `Section ${sectionIndex + 1}`;

          return (
            <button
              key={sectionIndex}
              className={`section-navigation__item section-navigation__item--${status}`}
              onClick={() => canNavigate && onSectionChange(sectionIndex)}
              disabled={!canNavigate}
              title={canNavigate ? `Go to ${sectionTitle}` : 'Complete previous sections to unlock'}
            >
              <div className="section-navigation__item-icon">
                {getSectionIcon(status)}
              </div>
              <div className="section-navigation__item-content">
                <div className="section-navigation__item-title">
                  {sectionTitle}
                </div>
                <div className="section-navigation__item-status">
                  {status === 'completed' && 'Completed'}
                  {status === 'current' && 'Current'}
                  {status === 'available' && 'Available'}
                  {status === 'locked' && 'Locked'}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="section-navigation__controls">
        <Button
          variant="secondary"
          onClick={onPrevious}
          disabled={!canNavigateToPrevious() || !onPrevious}
          className="section-navigation__button"
        >
          ← Previous Section
        </Button>
        
        <div className="section-navigation__current">
          Section {currentSection + 1} of {totalSections}
        </div>
        
        <Button
          onClick={onNext}
          disabled={!canNavigateToNext() || !onNext}
          className="section-navigation__button"
        >
          Next Section →
        </Button>
      </div>
    </div>
  );
}
