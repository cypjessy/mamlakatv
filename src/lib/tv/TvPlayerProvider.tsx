"use client";

import { createContext, useContext, useRef, useState, useCallback, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import PlyrPlayer from "@/components/tv/PlyrPlayer";
import type { LiveStatus } from "@/lib/youtube";

/* ─── Types ──────────────────────────────────────────────────── */

export interface TvPlayerCallbacks {
  onEnded?: () => void;
  onTimeUpdate?: (time: number) => void;
}

export interface BumperConfig {
  r2VideoUrl: string;
  r2VideoTitle: string;
}

interface TvPlayerContextValue {
  /** Register a DOM element for the player to render into (via portal). */
  registerTarget: (el: HTMLElement | null) => void;
  /** Start/resume playing a YouTube video. */
  play: (videoId: string, seek?: number) => void;
  /** Hide the player. */
  hide: () => void;
  /** Update callbacks (onEnded, onTimeUpdate) without calling play again. */
  setCallbacks: (cbs: TvPlayerCallbacks) => void;
  /** Whether the player is currently shown. */
  visible: boolean;
  /** The current YouTube video ID. */
  currentVideoId: string | null;
  /** Current live stream status (auto-detected from Firestore). */
  liveStatus: LiveStatus | null;
  /** True when a live stream is active. */
  isLive: boolean;
  // ─── Bumper animation ───
  /** The bumper config (null = no bumper set). */
  bumperConfig: BumperConfig | null;
  /** Whether the bumper is currently playing. */
  isBumperPlaying: boolean;
  /** Manually trigger the bumper (interrupts current video). */
  triggerBumper: () => void;

}

const TvPlayerContext = createContext<TvPlayerContextValue | null>(null);

export function useTvPlayer() {
  const ctx = useContext(TvPlayerContext);
  if (!ctx) throw new Error("useTvPlayer must be used within TvPlayerProvider");
  return ctx;
}

/* ─── Provider ───────────────────────────────────────────────── */

export function TvPlayerProvider({ children }: { children: React.ReactNode }) {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [seek, setSeek] = useState<number | undefined>(undefined);
  const [visible, setVisible] = useState(false);
  const callbacksRef = useRef<TvPlayerCallbacks>({});

  // ─── Bumper state ───
  const [bumperConfig, setBumperConfig] = useState<BumperConfig | null>(null);
  const [isBumperPlaying, setIsBumperPlaying] = useState(false);
  // When bumper triggers, we save the video to resume
  const resumeVideoRef = useRef<{ videoId: string; seek: number } | null>(null);
  // Track cumulative playback time for 15-min bumper interrupt
  const playbackSecondsRef = useRef(0);
  const lastTimeUpdateRef = useRef(0);
  const BUMPER_INTERVAL = 15 * 60; // 15 minutes in seconds
  // Load bumper config from Firestore on mount
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "tv_config", "bumper"));
        if (snap.exists()) {
          const data = snap.data() as { r2VideoUrl: string; r2VideoTitle: string };
          setBumperConfig({ r2VideoUrl: data.r2VideoUrl, r2VideoTitle: data.r2VideoTitle });
        }
      } catch {}
    })();
  }, []);

  // ─── Live stream status (listens to tv_live_status/main globally) ───
  const [liveStatus, setLiveStatus] = useState<LiveStatus | null>(null);
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "tv_live_status", "main"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setLiveStatus({
          isLive: data.isLive || false,
          liveVideoId: data.liveVideoId || null,
          liveTitle: data.liveTitle || null,
          startedBy: data.startedBy || null,
          startedAt: data.startedAt?.toDate?.() || null,
        } as LiveStatus);
      } else {
        setLiveStatus(null);
      }
    });
    return () => unsub();
  }, []);

  // Portal target — use ref + ready flag instead of direct state to avoid
  // callback-ref cascades (registerTarget is fully stable, never changes identity).
  const portalTargetRef = useRef<HTMLElement | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  // Synced ref so registerTarget can read videoId without depending on it
  const videoIdRef = useRef<string | null>(null);
  useEffect(() => { videoIdRef.current = videoId; }, [videoId]);

  // Guard against re-applying the same seek value
  const lastAppliedSeekRef = useRef<number | undefined>(undefined);

  // Stable — zero deps. Never changes identity, so callback refs that depend on
  // this never force React to call old-ref(null) + new-ref(el) on unrelated renders.
  const registerTarget = useCallback((el: HTMLElement | null) => {
    if (el === portalTargetRef.current && el !== null) return;
    portalTargetRef.current = el;
    setPortalReady(Boolean(el));
    if (el && videoIdRef.current && latestSeekRef.current !== undefined &&
        latestSeekRef.current !== lastAppliedSeekRef.current) {
      lastAppliedSeekRef.current = latestSeekRef.current;
      setSeek(latestSeekRef.current);
    }
  }, []);

  const [playerKey, setPlayerKey] = useState(0);
  // Track the latest seek time so it's preserved when portal target changes between pages
  const latestSeekRef = useRef<number | undefined>(undefined);

  const play = useCallback((id: string, seekTime?: number) => {
    // Exit bumper mode if active
    if (isBumperPlaying) {
      setIsBumperPlaying(false);
      resumeVideoRef.current = null;
    }
    // Reset playback timer when starting a new video
    playbackSecondsRef.current = 0;
    lastTimeUpdateRef.current = 0;
    setVideoId((prev) => {
      if (prev !== id) setPlayerKey((k) => k + 1);
      return id;
    });
    setSeek(seekTime);
    if (seekTime !== undefined) latestSeekRef.current = seekTime;
    setVisible(true);
  }, [isBumperPlaying]);

  const hide = useCallback(() => {
    setVisible(false);
    setIsBumperPlaying(false);
    resumeVideoRef.current = null;
    playbackSecondsRef.current = 0;
    lastTimeUpdateRef.current = 0;
  }, []);

  const setCallbacks = useCallback((cbs: TvPlayerCallbacks) => {
    callbacksRef.current = cbs;
  }, []);

  // ─── Bumper trigger ───
  const triggerBumper = useCallback(() => {
    if (!bumperConfig) return;
    if (isBumperPlaying) return; // prevent double-trigger
    // Save current video state before switching to bumper
    const currentId = videoIdRef.current;
    if (currentId && typeof latestSeekRef.current === "number") {
      resumeVideoRef.current = {
        videoId: currentId,
        seek: latestSeekRef.current,
      };
    }
    // Reset playback timer for 15-min counter
    playbackSecondsRef.current = 0;
    lastTimeUpdateRef.current = 0;
    // Switch to bumper mode (triggers re-render with HTML5 provider)
    setIsBumperPlaying(true);
  }, [bumperConfig, isBumperPlaying]);

  // ─── Bumper ended — restore main video ───
  const handleBumperEnded = useCallback(() => {
    setIsBumperPlaying(false);
    const resume = resumeVideoRef.current;
    resumeVideoRef.current = null;
    if (resume) {
      setVideoId(resume.videoId);
      setPlayerKey((k) => k + 1);
      setSeek(resume.seek);
      latestSeekRef.current = resume.seek;
    }
  }, []);

  // Get border-radius from portal target for matching styling
  const [borderRadius, setBorderRadius] = useState("0");
  useEffect(() => {
    const target = portalTargetRef.current;
    if (!target) return;
    const updateBorderRadius = () => {
      setBorderRadius(window.getComputedStyle(target).borderRadius);
    };
    updateBorderRadius();
    const observer = new ResizeObserver(updateBorderRadius);
    observer.observe(target);
    return () => observer.disconnect();
  }, [portalReady]);

  // Stable context value
  const ctxValue = useMemo<TvPlayerContextValue>(() => ({
    registerTarget, play, hide, setCallbacks, visible, currentVideoId: videoId,
    liveStatus,
    isLive: liveStatus?.isLive ?? false,
    bumperConfig,
    isBumperPlaying,
    triggerBumper,
  }), [registerTarget, play, hide, setCallbacks, visible, videoId, liveStatus,
      bumperConfig, isBumperPlaying, triggerBumper]);

  const currentPortalTarget = portalTargetRef.current;

  return (
    <TvPlayerContext.Provider value={ctxValue}>
      {/* Portal — renders PlyrPlayer into the page's target element */}
      {visible && currentPortalTarget && createPortal(
        <div
          key={playerKey + (isBumperPlaying ? "-bumper" : "")}
          style={{
            width: "100%",
            height: "100%",
            overflow: "hidden",
            borderRadius,
          }}
        >
          {isBumperPlaying && bumperConfig ? (
            <PlyrPlayer
              sourceUrl={bumperConfig.r2VideoUrl}
              provider="html5"
              onEnded={handleBumperEnded}
              onTimeUpdate={() => {}}
            />
          ) : videoId ? (
            <PlyrPlayer
              videoId={videoId}
              initialSeek={seek}
              onEnded={() => {
                // Reset playback timer on video end
                playbackSecondsRef.current = 0;
                lastTimeUpdateRef.current = 0;
                callbacksRef.current.onEnded?.();
              }}
              onTimeUpdate={(t) => {
                latestSeekRef.current = t;
                // Track cumulative playback time for bumper interrupt
                if (lastTimeUpdateRef.current > 0 && t > lastTimeUpdateRef.current) {
                  const delta = t - lastTimeUpdateRef.current;
                  playbackSecondsRef.current += delta;
                  // Check if 15 minutes of playback has elapsed
                  if (bumperConfig && playbackSecondsRef.current >= BUMPER_INTERVAL) {
                    // Trigger bumper on next tick to avoid setState during render
                    setTimeout(() => triggerBumper(), 0);
                  }
                }
                lastTimeUpdateRef.current = t;
                callbacksRef.current.onTimeUpdate?.(t);
              }}
            />
          ) : null}
        </div>,
        currentPortalTarget
      )}
      {children}
    </TvPlayerContext.Provider>
  );
}
