'use client'

import { useState, useEffect } from 'react'
import posthog from 'posthog-js'

export function ConsentBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if PostHog is disabled globally
    if (process.env.NEXT_PUBLIC_USE_POSTHOG === 'false') {
      setShowBanner(false)
      return
    }

    // Check if user has already made a choice
    const consent = localStorage.getItem('posthog-consent')
    if (!consent) {
      setShowBanner(true)
    } else if (consent === 'accepted') {
      posthog.opt_in_capturing()
    } else {
      posthog.opt_out_capturing()
    }
  }, [])

  const acceptCookies = () => {
    posthog.opt_in_capturing()
    localStorage.setItem('posthog-consent', 'accepted')
    setShowBanner(false)
  }

  const declineCookies = () => {
    posthog.opt_out_capturing()
    localStorage.setItem('posthog-consent', 'declined')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-5 duration-700 ease-out">
      <div className="bg-white/80 dark:bg-zinc-900/90 backdrop-blur-2xl border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
            <svg 
              className="w-5 h-5 text-indigo-600 dark:text-indigo-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
              />
            </svg>
          </div>
          <div>
            <h3 className="text-[17px] font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              Cookie Preferences
            </h3>
            <p className="text-[14px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              We use analytics to improve your experience. Your data remains secure and private.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={acceptCookies}
            className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/20"
          >
            Accept
          </button>
          <button
            onClick={declineCookies}
            className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-200 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  )
}
