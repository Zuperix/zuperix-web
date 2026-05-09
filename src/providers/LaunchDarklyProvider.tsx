"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { initialize, LDFlagSet } from "launchdarkly-js-client-sdk";

import { useAuth } from "@/context/AuthContext";

type LaunchDarklyContextValue = {
  flags: LDFlagSet;
  isReady: boolean;
};

const LaunchDarklyContext = createContext<LaunchDarklyContextValue>({
  flags: {},
  isReady: false,
});

export function LaunchDarklyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [flags, setFlags] = useState<LDFlagSet>({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const clientSideId = process.env.NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_SIDE_ID;
    if (!clientSideId) {
      setFlags({});
      setIsReady(false);
      return;
    }

    const context = {
      kind: "user",
      key: user?.customer_id || "anonymous",
      name: user?.name,
      email: user?.email,
      customer_id: user?.customer_id,
      user_id: user?.id,
    };

    const client = initialize(clientSideId, context);

    const syncFlags = () => {
      setFlags(client.allFlags());
      setIsReady(true);
    };

    void client
      .waitForInitialization(5)
      .then(syncFlags)
      .catch(() => {
        setFlags({});
        setIsReady(false);
      });

    client.on("change", syncFlags);

    return () => {
      client.off("change", syncFlags);
      void client.close();
    };
  }, [user?.customer_id, user?.email, user?.id, user?.name]);

  const value = useMemo(() => ({ flags, isReady }), [flags, isReady]);

  return (
    <LaunchDarklyContext.Provider value={value}>
      {children}
    </LaunchDarklyContext.Provider>
  );
}

export function useFeatureFlag(key: string, defaultValue = false): boolean {
  const { flags } = useContext(LaunchDarklyContext);
  const raw = flags[key];

  if (typeof raw === "boolean") {
    return raw;
  }

  return defaultValue;
}

export function useFeatureFlagJson<T>(key: string, defaultValue: T): T {
  const { flags } = useContext(LaunchDarklyContext);
  const raw = flags[key];

  if (raw !== undefined) {
    return raw as T;
  }

  return defaultValue;
}
