'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Joyride, STATUS, EVENTS, Step, TooltipRenderProps, EventData, Controls } from 'react-joyride';
import { useFeatureFlag } from '@/providers/LaunchDarklyProvider';
import { FEATURES } from '@/constants/features';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { User } from '@/types/auth';

const TOUR_COMPLETED_KEY = 'dashboard_tour_completed';
const AI_TOGGLE_TARGET = '[data-tour="ai-toggle"]';



function TourTooltip({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  size,
  isLastStep,
}: TooltipRenderProps) {
  const progress = ((index + 1) / size) * 100;

  return (
    <div
      {...tooltipProps}
      className="relative max-w-sm w-[340px] rounded-2xl border border-white/[0.08] bg-[#121420]/95 backdrop-blur-2xl shadow-[0_32px_96px_-16px_rgba(0,0,0,0.5)] text-white overflow-hidden animate-in fade-in zoom-in-95 duration-300"
    >
      {/* Progress bar */}
      <div className="h-1 w-full bg-white/[0.04]">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-5 space-y-3">
        {/* Step counter */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.15em]">
            Step {index + 1} of {size}
          </span>
          <button
            {...skipProps}
            className="text-[10px] font-semibold text-gray-500 hover:text-gray-300 transition-colors uppercase tracking-wider"
          >
            Skip tour
          </button>
        </div>

        {/* Title */}
        {step.title && (
          <h3 className="text-base font-extrabold text-white tracking-tight leading-snug">
            {step.title as string}
          </h3>
        )}

        {/* Content */}
        <p className="text-sm text-gray-400 leading-relaxed font-medium">
          {step.content}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          {index > 0 ? (
            <button
              {...backProps}
              className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl transition-all duration-200"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            {...primaryProps}
            className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200"
          >
            {isLastStep ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardTour() {
  const isTourEnabled = useFeatureFlag(FEATURES.DASHBOARD_ONBOARDING_TOUR.key, true);
  const { user, updateUser } = useAuth();
  const isGoldPlan = user?.customer?.plan?.toLowerCase() === 'gold';

  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const steps = useMemo(() => {
    const tourSteps: Step[] = [
      {
        target: '[data-tour="page-title"]',
        title: 'Welcome to your Dashboard',
        content: 'This is your central hub for managing all your digital assets. Everything you upload, organize, and share lives here.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '[data-tour="search-bar"]',
        title: 'Powerful Search',
        content: 'Search across file names, metadata, tags, and even text extracted from your documents via OCR.',
        placement: 'bottom',
      },
      // placeholder for AI toggle
      {
        target: isDesktop ? '[data-tour="filter-sidebar-desktop"]' : '[data-tour="filter-sidebar"]',
        title: 'Smart Filters',
        content: 'Narrow down assets by file type, orientation, tags, categories, colors, and more. Combine multiple filters for precision.',
        placement: isDesktop ? 'right-start' : 'bottom',
      },
      {
        target: '[data-tour="upload-button"]',
        title: 'Upload Assets',
        content: 'Click here to upload files, generate guest upload links for external contributors, or check your upload status.',
        placement: 'bottom-end',
      },
      {
        target: '[data-tour="sort-dropdown"]',
        title: 'Sort Your View',
        content: 'Sort assets by date, name, size, or relevance to quickly find what you need.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="select-all"]',
        title: 'Bulk Actions',
        content: 'Select multiple assets at once to perform bulk operations like tagging, moving to collections, or deleting.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="sidebar-nav"]',
        title: 'Navigation',
        content: 'Explore Categories, Collections, Portals, Vaults, Integrations and Settings from the sidebar.',
        placement: 'right',
      },
    ];

    if (isGoldPlan) {
      tourSteps.splice(2, 0, {
        target: '[data-tour="ai-toggle"]',
        title: 'AI-Powered Search',
        content: 'Toggle this on to use natural language and semantic search. Describe what you\'re looking for in plain words and let Zuperix AI find it.',
        placement: 'bottom',
      });
    }

    return tourSteps;
  }, [isGoldPlan, isDesktop]);

  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const forceShow = process.env.NEXT_PUBLIC_FORCE_DASHBOARD_TOUR === 'true';

  useEffect(() => {
    if (!isTourEnabled || !user) return;

    const completed = user.onboarding?.dashboard === true || localStorage.getItem(TOUR_COMPLETED_KEY) === 'true';
    if (completed && !forceShow) return;

    const timer = setTimeout(() => {
      setRun(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isTourEnabled, user, forceShow]);

  const handleEvent = useCallback(async (data: EventData, controls: Controls) => {
    const { status, type, index, action } = data;

    if (type === EVENTS.STEP_AFTER) {
      if (action === 'next') {
        setStepIndex(index + 1);
      } else if (action === 'prev') {
        setStepIndex(index - 1);
      }
    }

    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      setRun(false);
      setStepIndex(0);
      localStorage.setItem(TOUR_COMPLETED_KEY, 'true');

      try {
        const updatedOnboarding = {
          ...user?.onboarding,
          dashboard: true,
        };
        const updatedProfile = await apiFetch<User>('/users/me', {
          method: 'PATCH',
          body: JSON.stringify({ onboarding: updatedOnboarding }),
        });
        updateUser(updatedProfile);
      } catch (err) {
        console.error('Failed to save onboarding tour progress:', err);
      }
    }
  }, [user, updateUser]);

  if (!isTourEnabled) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      scrollToFirstStep
      onEvent={handleEvent}
      tooltipComponent={TourTooltip}
      options={{
        overlayClickAction: false,
        blockTargetInteraction: true,
        buttons: ['back', 'close', 'primary', 'skip'],
        overlayColor: 'rgba(0, 0, 0, 0.6)',
        spotlightRadius: 16,
        zIndex: 10000,
        arrowColor: '#121420',
      }}
    />
  );
}
