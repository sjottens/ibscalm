import { createSerwistRoute } from "@serwist/turbopack";
import { spawnSync } from "node:child_process";

// A new revision per build/commit, so precached HTML is refreshed on every deploy.
const revision =
  process.env.VERCEL_GIT_COMMIT_SHA ??
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ??
  crypto.randomUUID();

const appRoutes = ["/vandaag", "/tijdlijn", "/inzichten", "/instellingen", "/rapport", "/welkom", "/privacy", "/offline"];
const pages = ["/", "/en", ...appRoutes, ...appRoutes.map((r) => `/en${r}`)];

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } = createSerwistRoute({
  additionalPrecacheEntries: pages.map((url) => ({ url, revision: revision || String(Date.now()) })),
  swSrc: "app/sw.ts",
  useNativeEsbuild: true,
});
