import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const dynamicParams = false;

const SIZES: Record<string, { size: number; pad: number }> = {
  "180": { size: 180, pad: 0 },
  "192": { size: 192, pad: 0 },
  "512": { size: 512, pad: 0 },
  // Maskable icons need a safe zone; the wave stays well inside it.
  maskable: { size: 512, pad: 0.12 },
};

export function generateStaticParams() {
  return Object.keys(SIZES).map((size) => ({ size }));
}

/** App icon: navy square with the yellow "calm wave". */
export async function GET(_: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: key } = await params;
  const { size, pad } = SIZES[key] ?? SIZES["512"];
  const s = (size * (1 - pad * 2)) / 48;
  const off = size * pad;
  return new ImageResponse(
    (
      <div style={{ width: size, height: size, display: "flex", background: "#1b2b48" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <g transform={`translate(${off} ${off}) scale(${s})`}>
            <path d="M10 26c3.5-6 7-6 10 0s5.5 4.5 8 0 5-3 10-1" stroke="#f5d33d" strokeWidth="4" fill="none" strokeLinecap="round" />
          </g>
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
