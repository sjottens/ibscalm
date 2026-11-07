import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip Next internals, the service worker, generated icons and any file with an extension.
  matcher: ["/((?!api|serwist|icons|_next|_vercel|.*\\..*).*)"],
};
