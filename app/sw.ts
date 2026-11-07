/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Offline-first: the app shell, every app route (both languages) and static assets are
 * precached at install. The service worker never touches health data — that lives in
 * IndexedDB and is never sent anywhere.
 */
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  precacheOptions: { cleanupOutdatedCaches: true, ignoreURLParametersMatching: [/.*/] },
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  // Payment API calls must always hit the network; everything else uses the Next.js defaults.
  runtimeCaching: [{ matcher: ({ url }) => url.pathname.startsWith("/api/"), handler: new NetworkOnly() }, ...defaultCache],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
