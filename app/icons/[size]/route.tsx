import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const dynamicParams = false;

const SIZES: Record<string, { size: number; pad: number }> = {
  "180": { size: 180, pad: 0 },
  "192": { size: 192, pad: 0 },
  "512": { size: 512, pad: 0 },
  // Maskable icons need ~10% safe zone on each side.
  maskable: { size: 512, pad: 0.14 },
};

export function generateStaticParams() {
  return Object.keys(SIZES).map((size) => ({ size }));
}

/** App icon: a pink belly over a yellow offset print, with an ink wave, on warm paper. */
export async function GET(_: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: key } = await params;
  const { size, pad } = SIZES[key] ?? SIZES["512"];
  const inner = size * (1 - pad * 2);
  const r = inner * 0.3;
  const c = size / 2;
  return new ImageResponse(
    (
      <div style={{ width: size, height: size, display: "flex", background: "#f6f1e7", position: "relative" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={c + r * 0.12} cy={c + r * 0.12} r={r} fill="#f5c84b" />
          <circle cx={c - r * 0.06} cy={c - r * 0.06} r={r} fill="#f2668b" />
          <path
            d={`M${c - r * 0.55} ${c + r * 0.05} q ${r * 0.275} ${-r * 0.32} ${r * 0.55} 0 t ${r * 0.55} 0`}
            stroke="#1d2340"
            strokeWidth={r * 0.13}
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
