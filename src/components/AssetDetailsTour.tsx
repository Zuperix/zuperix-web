'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Joyride, STATUS, EVENTS, Step, TooltipRenderProps, EventData, Controls } from 'react-joyride';
import { useFeatureFlag } from '@/providers/LaunchDarklyProvider';
import { FEATURES } from '@/constants/features';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { User, Action } from '@/types/auth';
import { useWorkspace } from '@/context/WorkspaceContext';
import { usePermissions } from '@/hooks/usePermissions';

const TOUR_COMPLETED_KEY = 'asset_details_tour_completed';

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

export default function AssetDetailsTour() {
  const isTourEnabled = useFeatureFlag(FEATURES.ONBOARDING_TOURS.key, false);
  const { user, updateUser } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const permissions = usePermissions();
  const canUpdateAsset = permissions.can(Action.Update, 'Asset', activeWorkspace?.id);

  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const forceShow = process.env.NEXT_PUBLIC_FORCE_DASHBOARD_TOUR === 'true';

  const steps = useMemo(() => {
    const tourSteps: Step[] = [
      {
        target: '[data-tour="asset-title"]',
        title: canUpdateAsset ? 'Rename & Info' : 'Asset Information',
        content: canUpdateAsset
          ? 'Click the asset name to rename the file. You can also monitor the current review status of the asset next to its name.'
          : 'View the asset filename and its current review status next to its name.',
        placement: 'bottom-start',
        skipBeacon: true,
      },
      {
        target: '[data-tour="asset-preview"]',
        title: canUpdateAsset ? 'Preview & Management' : 'Rich Media Preview',
        content: canUpdateAsset
          ? 'Inspect media natively right here in the center of the details page. Scroll down to manage Categories and Collections, or edit Custom Metadata fields in the right sidebar. If you have update permission, you can quickly edit all these related fields directly from this page.'
          : 'Inspect media natively right here in the center of the details page. Scroll down to view its assigned Categories and Collections, or view Custom Metadata specifications in the right sidebar.',
        placement: 'center',
      },
      {
        target: '[data-tour="asset-organization"]',
        title: canUpdateAsset ? 'Categories & Collections' : 'Asset Classification',
        content: canUpdateAsset
          ? 'Assign Categories and Collections below the preview to keep your assets organized. You can also create new categories or collections dynamically from here.'
          : 'View the Categories and Collections assigned to this asset below the preview.',
        placement: 'top',
        floatingOptions: {
          flipOptions: false,
        },
      },
      {
        target: '[data-tour="asset-metadata-section"]',
        title: canUpdateAsset ? 'Edit Custom Metadata' : 'Custom Metadata',
        content: canUpdateAsset
          ? 'Fill in custom schema metadata values. If you have update permission, you can quickly edit these fields directly from this section.'
          : 'View the populated custom schema metadata specifications and values for this asset.',
        placement: 'top',
        floatingOptions: {
          flipOptions: false,
        },
      },
      {
        target: '[data-tour="asset-tabs"]',
        title: 'Specifications & Tools',
        content: canUpdateAsset
          ? 'Access technical specs, run workflows, view audit history, attach external links, manage versions, read comments, or view transcription logs.'
          : 'Access technical specs, inspect workflows, audit history, external links, version history, comments, or transcription logs.',
        placement: 'left',
      },
    ];

    if (canUpdateAsset) {
      tourSteps.push({
        target: '[data-tour="save-metadata-button"]',
        title: 'Save Your Changes',
        content: 'After updating custom metadata, tags, categories, or collections, click here to save and publish your updates.',
        placement: 'bottom-end',
      });
    }

    return tourSteps;
  }, [canUpdateAsset]);

  useEffect(() => {
    if (!isTourEnabled || !user) return;

    const completed = user.onboarding?.asset_details === true || localStorage.getItem(TOUR_COMPLETED_KEY) === 'true';
    if (completed && !forceShow) return;

    const timer = setTimeout(() => {
      setRun(true);
    }, 1200); // Small extra delay to allow full page details rendering (previews, specs, categories, etc.)

    return () => clearTimeout(timer);
  }, [isTourEnabled, user, forceShow]);

  // Ensure scroll container is reset to top when tour starts
  useEffect(() => {
    if (run) {
      const container = document.getElementById('asset-detail-scroll-container');
      if (container) {
        container.scrollTo({ top: 0 });
      }
    }
  }, [run]);

  const handleEvent = useCallback(async (data: EventData, controls: Controls) => {
    const { status, type, index, action } = data;

    if (type === EVENTS.STEP_AFTER) {
      const nextIndex = action === 'next' ? index + 1 : index - 1;
      setStepIndex(nextIndex);

      const container = document.getElementById('asset-detail-scroll-container');
      if (container) {
        if (nextIndex === 1) {
          container.scrollTo({ top: 120, behavior: 'smooth' });
        } else if (nextIndex === 2) {
          container.scrollTo({ top: 460, behavior: 'smooth' });
        } else if (nextIndex === 3) {
          container.scrollTo({ top: 880, behavior: 'smooth' });
        } else {
          container.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }

    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      setRun(false);
      setStepIndex(0);
      localStorage.setItem(TOUR_COMPLETED_KEY, 'true');

      const container = document.getElementById('asset-detail-scroll-container');
      if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      }

      try {
        const updatedOnboarding = {
          ...user?.onboarding,
          asset_details: true,
        };
        const updatedProfile = await apiFetch<User>('/users/me', {
          method: 'PATCH',
          body: JSON.stringify({ onboarding: updatedOnboarding }),
        });
        updateUser(updatedProfile);
      } catch (err) {
        console.error('Failed to save asset details onboarding tour progress:', err);
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
        skipScroll: true,
      }}
    />
  );
}
