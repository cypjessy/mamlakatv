"use client";

import { useRouter } from "next/navigation";

/**
 * Live TV embed that:
 *  - On web (Vercel, HTTPS): embeds Odysee directly.
 *  - On Capacitor native (APK, file://): loads the Vercel-hosted
 *    /live-tv-embed page in an iframe, so the Odysee iframe's
 *    parent is HTTPS, not file://.
 *
 * The admin/member nav button pushes to the TV management page
 * (/admin/tv or /tv) as before.
 */

function isCapacitorNative(): boolean {
  if (typeof window === "undefined") return false;
  return (
    typeof (window as any).Capacitor?.isNativePlatform === "function" &&
    (window as any).Capacitor.isNativePlatform()
  );
}

function getVercelBase(): string {
  if (typeof window === "undefined") return "";
  // NEXT_PUBLIC_VERCEL_URL is baked into the JS bundle at build time — works on APK too
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL || "";
  if (vercelUrl) return vercelUrl.replace(/\/+$/, "");
  // Fall back to window.location.origin for local dev / preview deployments
  // On Capacitor APK this will be file:// which we can't use for iframes
  if (window.location.origin.startsWith("file://")) return "";
  return window.location.origin.replace(/\/+$/, "");
}

const ODYSEE_SRC = "https://odysee.com/$/embed/@otvlive:a/gib254:2?autoplay=true";

interface Props {
  /** Where the "Watch" button navigates to */
  navTo: string;
}

export default function LiveTvEmbed({ navTo }: Props) {
  const router = useRouter();
  const isNative = isCapacitorNative();
  const vercelBase = getVercelBase();

  if (isNative && !vercelBase) {
    // Capacitor native but Vercel URL not configured — show fallback
    return (
      <div className="live-tv-embed-section">
        <LiveTvHeader navTo={navTo} router={router} />
        <div className="live-tv-embed-fallback">
          <i className="fas fa-tv" style={{ fontSize: 32, opacity: 0.3 }} />
          <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
            Live TV is available on the web version
          </span>
        </div>
      </div>
    );
  }

  // APK: Load the Vercel-hosted embed page in an iframe
  // Web: Embed Odysee directly
  const iframeSrc = isNative ? `${vercelBase}/live-tv-embed` : ODYSEE_SRC;

  return (
    <div className="live-tv-embed-section">
      <LiveTvHeader navTo={navTo} router={router} />
      <div className="live-tv-embed-wrap">
        <iframe
          src={iframeSrc}
          className="live-tv-iframe"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title="Live TV"
        />
      </div>
    </div>
  );
}

function LiveTvHeader({
  navTo,
  router,
}: {
  navTo: string;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div className="live-tv-header">
      <div className="live-tv-header-left">
        <i className="fas fa-tv" />
        <span>Live TV</span>
      </div>
      <button
        className="live-tv-manage-btn"
        onClick={() => router.push(navTo)}
      >
        Watch <i className="fas fa-chevron-right" />
      </button>
    </div>
  );
}
