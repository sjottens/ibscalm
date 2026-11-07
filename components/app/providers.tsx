"use client";

import { SerwistProvider } from "@serwist/turbopack/react";
import type { ReactNode } from "react";

/** Global providers. Kept tiny so the landing page ships little JavaScript; Motion lives in the app shell. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <SerwistProvider swUrl="/serwist/sw.js" disable={process.env.NODE_ENV !== "production"} cacheOnNavigation reloadOnOnline={false}>
      {children}
    </SerwistProvider>
  );
}
