"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getVideos } from "@/lib/youtube";
import type { YouTubeVideo } from "@/lib/youtube";

/**
 * TV embed that auto-plays the latest YouTube video from the Firestore database.
 * - Fetches the most recently published non-hidden video from youtube_videos
 * - Shows it as an embedded YouTube player with autoplay
 * - "View All" button navigates to the TV page (navTo prop)
 */

interface Props {
  /** Where the "View All" button navigates to */
  navTo: string;
}

export default function LiveTvEmbed({ navTo }: Props) {
  const router = useRouter();
  const [video, setVideo] = useState<YouTubeVideo | null>(null);
  const [loading, setLoading] = useState(true);

  // ─── Fetch latest video from Firestore ───
  useEffect(() => {
    let mounted = true;
    const fetchLatest = async () => {
      try {
        const allVids = await getVideos({ max: 10, includeHidden: false });
        if (!mounted) return;
        // Sort by publishedAt descending, take the latest
        const sorted = [...allVids].sort((a, b) => {
          const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          return bTime - aTime;
        });
        setVideo(sorted[0] || null);
      } catch {
        // silent
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchLatest();
    return () => { mounted = false; };
  }, []);

  // ─── Loading state ───
  if (loading) {
    return (
      <div className="live-tv-embed-section">
        <div className="live-tv-header">
          <div className="live-tv-header-left">
            <i className="fas fa-tv" />
            <span>Latest Sermon</span>
          </div>
        </div>
        <div className="live-tv-embed-wrap" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200, background: "var(--surface-card, #221819)" }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: 24, color: "var(--primary, #D97706)" }} />
        </div>
      </div>
    );
  }

  // ─── Empty state ───
  if (!video) {
    return (
      <div className="live-tv-embed-section">
        <div className="live-tv-header">
          <div className="live-tv-header-left">
            <i className="fas fa-tv" />
            <span>Latest Sermon</span>
          </div>
        </div>
        <div className="live-tv-embed-wrap" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, minHeight: 140, background: "var(--surface-card, #221819)", color: "var(--text-tertiary, #6B6B6B)" }}>
          <i className="fas fa-video-slash" style={{ fontSize: 32, opacity: 0.4 }} />
          <span style={{ fontSize: 14 }}>No videos available yet</span>
        </div>
      </div>
    );
  }

  // ─── Player ───
  return (
    <div className="live-tv-embed-section">
      {/* Header */}
      <div className="live-tv-header">
        <div className="live-tv-header-left">
          <i className="fas fa-tv" />
          <span>Latest Sermon</span>
        </div>
        <button className="live-tv-manage-btn" onClick={() => router.push(navTo)}>
          View All <i className="fas fa-chevron-right" />
        </button>
      </div>

      {/* YouTube player */}
      <div className="live-tv-embed-wrap">
        <div className="live-tv-player-wrap">
          <iframe
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1&mute=1&controls=1&rel=0&modestbranding=1`}
            className="live-tv-iframe"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            title={video.title}
          />
        </div>
        {/* Video title bar */}
        <div className="live-tv-video-info">
          <div className="live-tv-video-title">{video.title}</div>
          <div className="live-tv-video-meta">
            {video.duration > 0 && (
              <span>{Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, "0")}</span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Inline styles ─── */}
      <style>{`
        .live-tv-embed-section {
          padding: 0;
        }
        .live-tv-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
          padding: 0 16px;
        }
        .live-tv-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 17px;
          font-weight: 700;
        }
        .live-tv-header-left i {
          font-size: 15px;
          color: var(--primary, #D97706);
        }
        .live-tv-manage-btn {
          font-size: 12px;
          color: var(--primary, #D97706);
          font-weight: 600;
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .live-tv-manage-btn i {
          font-size: 10px;
        }
        .live-tv-manage-btn:active {
          opacity: 0.7;
        }

        .live-tv-embed-wrap {
          overflow: hidden;
          background: var(--surface-card, #221819);
        }
        .live-tv-player-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          background: #000;
        }
        .live-tv-iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
        }

        .live-tv-video-info {
          padding: 12px 16px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .live-tv-video-title {
          font-size: 14px;
          font-weight: 600;
          line-height: 1.35;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          min-width: 0;
          color: var(--text-primary, #FFFFFF);
        }
        .live-tv-video-meta {
          font-size: 12px;
          color: var(--text-tertiary, #6B6B6B);
          font-variant-numeric: tabular-nums;
          flex-shrink: 0;
        }

        @media (min-width: 768px) {
          .live-tv-video-title {
            font-size: 15px;
          }
          .live-tv-video-info {
            padding: 14px 24px 16px;
          }
          .live-tv-header {
            padding: 0 24px;
          }
        }
      `}</style>
    </div>
  );
}
