import type { ReactNode } from "react";

// The real root layout (with <html>) lives in app/[locale]/layout.tsx.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
