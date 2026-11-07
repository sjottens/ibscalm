"use client";

import { MotionConfig } from "motion/react";
import { SerwistProvider } from "@serwist/turbopack/react";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    // Respect "reduce motion": springs become instant, layout animations are skipped.
    <MotionConfig reducedMotion="user">
      <SerwistProvider swUrl="/serwist/sw.js" disable={process.env.NODE_ENV !== "production"} cacheOnNavigation reloadOnOnline={false}>
        {children}
      </SerwistProvider>
    </MotionConfig>
  );
}
