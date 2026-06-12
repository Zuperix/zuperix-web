'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Joyride, STATUS, EVENTS, Step, TooltipRenderProps, EventData, Controls } from 'react-joyride';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { User } from '@/types/auth';

const TOUR_COMPLETED_KEY = 'metadata_tour_completed';

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
          {step.content as React.ReactNode}
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

export default function MetadataSettingsTour({ 
  activeTab, 
  setActiveTab 
}: { 
  activeTab: string;
  setActiveTab: (tab: 'fields' | 'templates' | 'bulk' | 'history') => void;
}) {
  const { user, updateUser } = useAuth();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const forceShow = process.env.NEXT_PUBLIC_FORCE_DASHBOARD_TOUR === 'true';

  const steps = useMemo(() => {
    return [
      {
        target: '[data-tour="metadata-tabs"]',
        title: 'Metadata Settings',
        content: 'Manage everything related to your digital asset metadata here. Navigate between fields, templates, bulk imports, and your import history.',
        placement: 'bottom',
        skipBeacon: true,
      },
      {
        target: '[data-tour="metadata-fields-form"]',
        title: 'Custom Fields',
        content: 'Create your own custom schema fields like Photographers, License Keys, or Campaigns. You can choose different types like dates or URLs.',
        placement: 'right',
      },
      {
        target: '[data-tour="metadata-bulk-import"]',
        title: 'Bulk Import',
        content: 'Update thousands of assets at once using our Bulk Import tool. Let\'s explore how it works!',
        placement: 'center',
      },
      {
        target: '[data-tour="bulk-template-selection"]',
        title: 'Step 1: Download Template',
        content: 'First, select a specific template or use the global template. This gives you a formatted CSV file with your custom metadata fields as columns.',
        placement: 'right',
      },
      {
        target: '[data-tour="bulk-upload-zone"]',
        title: 'Step 2: Upload CSV',
        content: 'Fill out the CSV file and drop it here. You map each row to an asset using either the Asset ID or its Filename.',
        placement: 'top',
      },
      {
        target: '[data-tour="bulk-mapping"]',
        title: 'Step 3: Processing',
        content: 'Zuperix automatically maps your rows, highlights any missing fields, and processes the import in the background. You can check the History tab for logs!',
        placement: 'top',
      },
      {
        target: '[data-tour="metadata-history-tab"]',
        title: 'Import History',
        content: 'Track all your previous bulk imports here. You can download detailed audit reports or repair CSVs for any failed rows!',
        placement: 'bottom',
      }
    ] as Step[];
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const completed = user.onboarding?.metadata_settings === true || localStorage.getItem(TOUR_COMPLETED_KEY) === 'true';
    if (completed && !forceShow) return;

    const timer = setTimeout(() => {
      setRun(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, forceShow]);

  const handleEvent = useCallback(async (data: EventData, controls: Controls) => {
    const { status, type, index, action } = data;

    if (type === EVENTS.STEP_AFTER) {
      const nextIndex = action === 'next' ? index + 1 : index - 1;
      
      const isNextBulk = nextIndex >= 2 && nextIndex <= 5;
      const isCurrentBulk = index >= 2 && index <= 5;

      if (isNextBulk && !isCurrentBulk) {
        setActiveTab('bulk');
        setTimeout(() => setStepIndex(nextIndex), 200);
        return;
      }

      const isNextFields = nextIndex === 0 || nextIndex === 1;
      const isCurrentFields = index === 0 || index === 1;

      if (isNextFields && !isCurrentFields) {
        setActiveTab('fields');
        setTimeout(() => setStepIndex(nextIndex), 200);
        return;
      }

      const isNextHistory = nextIndex === 6;
      const isCurrentHistory = index === 6;

      if (isNextHistory && !isCurrentHistory) {
        setActiveTab('history');
        setTimeout(() => setStepIndex(nextIndex), 200);
        return;
      }

      setStepIndex(nextIndex);
    } else if (type === EVENTS.TARGET_NOT_FOUND) {
      const nextIndex = action === 'next' ? index + 1 : index - 1;
      setStepIndex(nextIndex);
    }

    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status as any)) {
      setRun(false);
      setStepIndex(0);
      localStorage.setItem(TOUR_COMPLETED_KEY, 'true');

      try {
        const updatedOnboarding = {
          ...user?.onboarding,
          metadata_settings: true,
        };
        const updatedProfile = await apiFetch<User>('/users/me', {
          method: 'PATCH',
          body: JSON.stringify({ onboarding: updatedOnboarding }),
        });
        updateUser(updatedProfile);
      } catch (err) {
        console.error('Failed to save metadata settings onboarding tour progress:', err);
      }
    }
  }, [user, updateUser, setActiveTab]);

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
