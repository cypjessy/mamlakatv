"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getEvents } from "@/lib/churchAiData";
import type { EventItem } from "@/lib/churchAdminData";

/**
 * Auto-advancing event carousel that fetches real events from Firestore.
 * Clicking a card opens a full-screen image preview so the user can read
 * the event image content.
 */
export default function EventCarousel() {
  const [previewEvent, setPreviewEvent] = useState<EventItem | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [noTransition, setNoTransition] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch events from Firestore on mount
  useEffect(() => {
    let mounted = true;
    const fetchEvents = async () => {
      try {
        const data = await getEvents();
        if (mounted) {
          const sorted = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          setEvents(sorted);
        }
      } catch {
        // No events or offline
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchEvents();
    return () => { mounted = false; };
  }, []);

  // Auto-advance every 4 seconds — infinite loop via cloned cards
  useEffect(() => {
    if (events.length <= 1 || paused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= events.length) {
          // Teleport back to 0 without transition (infinite loop illusion)
          setNoTransition(true);
          requestAnimationFrame(() => requestAnimationFrame(() => setNoTransition(false)));
          return 0;
        }
        return next;
      });
    }, 4000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [events.length, paused]);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Display events doubled for infinite loop illusion
  const displayEvents = events.length > 1 ? [...events, ...events] : events;
  const safeIndex = currentIndex < events.length ? currentIndex : 0;

  const formatEventDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleString("en-US", { month: "short" });
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    return { day, month, time };
  };

  if (loading) {
    return (
      <section className="feed-section ec-section">
        <div className="ec-header">
          <h2 className="ec-title"><i className="fas fa-calendar-alt"></i> Upcoming Events</h2>
        </div>
        <div className="ec-skeleton">
          <div className="ec-skel-card"></div>
          <div className="ec-skel-card"></div>
          <div className="ec-skel-card"></div>
        </div>
        <style>{`.ec-skeleton { display: flex; gap: 14px; overflow: hidden; }
        .ec-skel-card { width: 320px; height: 220px; border-radius: 20px; background: var(--surface-elevated); flex-shrink: 0; animation: ecPulse 1.5s ease-in-out infinite; }
        @keyframes ecPulse { 0%,100% { opacity:0.5; } 50% { opacity:0.3; } }`}</style>
      </section>
    );
  }

  if (events.length === 0) return null;

  const current = events[safeIndex] || events[0];

  return (
    <section className="feed-section ec-section">
      <div className="ec-header">
        <h2 className="ec-title"><i className="fas fa-calendar-alt"></i> Upcoming Events</h2>
        <button className="ec-see-all" onClick={() => window.dispatchEvent(new CustomEvent("show-toast", { detail: { title: "Events", message: "Opening events page...", type: "info", duration: 1500 } }))}>
          See All <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      <div
        className="ec-carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setTimeout(() => setPaused(false), 3000)}
      >
        <div className="ec-track" style={{ transform: `translateX(-${currentIndex * 350}px)`, transition: noTransition ? 'none' : undefined }}>
          {displayEvents.map((ev, i) => {
            const d = formatEventDate(ev.date);
            const hasImage = !!ev.imageUrl;
            return (
              <div
                key={`${ev.id}-${i >= events.length ? 'dup' : 'orig'}`}
                className={`ec-card ${i === currentIndex ? "active" : ""} ${hasImage ? "has-img" : ""}`}
                onClick={() => hasImage && setPreviewEvent(ev)}
              >
                {/* Glass top accent line */}
                <div className="ec-accent"></div>

                {/* Image section */}
                <div className="ec-img-wrap">
                  {hasImage ? (
                    <>
                      <div className="ec-img-bg" style={{ backgroundImage: `url(${ev.imageUrl})` }} />
                      <div className="ec-img-overlay" />
                    </>
                  ) : (
                    <div className="ec-img-placeholder">
                      <i className="fas fa-calendar-alt"></i>
                    </div>
                  )}
                  {/* Date badge floating on image */}
                  <div className="ec-date-badge">
                    <span className="ec-date-day">{d.day}</span>
                    <span className="ec-date-month">{d.month}</span>
                  </div>
                  {/* Fee badge */}
                  {ev.isPaid && ev.fee > 0 && (
                    <div className="ec-fee-badge">Ksh {ev.fee}</div>
                  )}
                </div>

                {/* Content */}
                <div className="ec-body">
                  <h3 className="ec-name">{ev.name}</h3>
                  <div className="ec-meta-row">
                    <span className="ec-meta">
                      <i className="fas fa-clock"></i> {d.time}
                    </span>
                    {ev.location && (
                      <span className="ec-meta">
                        <i className="fas fa-location-dot"></i> {ev.location}
                      </span>
                    )}
                  </div>
                  {ev.desc && (
                    <div className="ec-desc">{ev.desc}</div>
                  )}
                </div>

                {/* Hover glow */}
                <div className="ec-glow"></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Full-screen image preview ── */}
      {previewEvent && (
        <div className="ec-preview-overlay" onClick={() => setPreviewEvent(null)}>
          <button className="ec-preview-close" onClick={(e) => { e.stopPropagation(); setPreviewEvent(null); }}>
            <i className="fas fa-times"></i>
          </button>
          <div className="ec-preview-card" onClick={(e) => e.stopPropagation()}>
            <img src={previewEvent.imageUrl} alt={previewEvent.name} className="ec-preview-img" />
            <div className="ec-preview-info">
              <h3 className="ec-preview-name">{previewEvent.name}</h3>
              <div className="ec-preview-meta">
                <span><i className="fas fa-clock"></i> {(() => { const d = formatEventDate(previewEvent.date); return `${d.day} ${d.month} · ${d.time}`; })()}</span>
                {previewEvent.location && <span><i className="fas fa-location-dot"></i> {previewEvent.location}</span>}
              </div>
              {previewEvent.desc && <div className="ec-preview-desc">{previewEvent.desc}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Dots */}
      {events.length > 1 && (
        <div className="ec-dots">
          {events.map((_, i) => (
            <button
              key={i}
              className={`ec-dot ${i === safeIndex ? "active" : ""}`}
              onClick={() => goTo(i)}
              aria-label={`Go to event ${i + 1}`}
            />
          ))}
        </div>
      )}

      <style>{`
        .ec-section { margin-top: 2px; }
        .ec-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 12px;
        }
        .ec-title {
          font-size: 15px; font-weight: 700;
          display: flex; align-items: center; gap: 8px;
        }
        .ec-title i { color: var(--primary); font-size: 14px; }
        .ec-see-all {
          font-size: 12px; color: var(--primary); font-weight: 600;
          background: none; border: none; cursor: pointer;
          display: flex; align-items: center; gap: 4px;
          padding: 4px 8px; border-radius: 8px;
          transition: all 0.15s ease;
        }
        .ec-see-all:active { background: rgba(217,119,6,0.1); }

        .ec-carousel {
          overflow: hidden;
          border-radius: var(--radius-lg);
          position: relative;
        }
        .ec-track {
          display: flex; gap: 14px;
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 4px 0;
        }
        .ec-card {
          min-width: 336px;
          background: var(--surface-card);
          border: 1px solid var(--border);
          border-radius: 20px;
          position: relative;
          overflow: hidden;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          flex-shrink: 0;
          cursor: pointer;
        }
        .ec-card:active { transform: scale(0.96); }
        .ec-card.active {
          border-color: rgba(217,119,6,0.25);
          box-shadow: 0 8px 32px rgba(217,119,6,0.08), 0 0 0 1px rgba(217,119,6,0.05);
        }
        .ec-card.has-img.active {
          box-shadow: 0 8px 40px rgba(217,119,6,0.12);
        }

        /* Top accent glow bar */
        .ec-accent {
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, var(--gradient-start), var(--gradient-end));
          opacity: 0;
          transition: opacity 0.3s;
          z-index: 5;
        }
        .ec-card.active .ec-accent { opacity: 1; }

        /* Image section */
        .ec-img-wrap {
          position: relative;
          width: 100%;
          height: 160px;
          overflow: hidden;
          background: var(--surface-elevated);
        }
        .ec-img-bg {
          position: absolute; inset: 0;
          background-size: cover;
          background-position: center;
          transition: transform 0.6s ease;
          z-index: 0;
        }
        .ec-card:hover .ec-img-bg { transform: scale(1.08); }
        .ec-img-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 50%);
          z-index: 1;
        }
        .ec-img-placeholder {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, rgba(217,119,6,0.05), rgba(217,119,6,0.02));
          color: var(--text-tertiary);
          font-size: 48px;
          z-index: 0;
        }

        /* Date badge floating on image */
        .ec-date-badge {
          position: absolute;
          top: 12px; left: 12px;
          z-index: 3;
          display: flex; flex-direction: column; align-items: center;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 6px 12px;
          min-width: 50px;
        }
        .ec-date-day {
          font-size: 20px; font-weight: 800; line-height: 1.2;
          color: #fff;
        }
        .ec-date-month {
          font-size: 9px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.5px; color: rgba(255,255,255,0.7);
        }
        .ec-card:not(.has-img) .ec-date-day { color: var(--primary); }
        .ec-card:not(.has-img) .ec-date-month { color: var(--text-secondary); }
        .ec-card:not(.has-img) .ec-date-badge {
          background: rgba(217,119,6,0.08);
          border: 1px solid rgba(217,119,6,0.15);
          backdrop-filter: none;
        }

        /* Fee badge */
        .ec-fee-badge {
          position: absolute; top: 12px; right: 12px;
          z-index: 3;
          font-size: 11px; font-weight: 700; color: #fff;
          background: rgba(217,119,6,0.85);
          backdrop-filter: blur(4px);
          padding: 4px 10px; border-radius: 8px;
        }

        /* Body */
        .ec-body {
          padding: 14px 16px 16px;
          position: relative;
          z-index: 2;
        }
        .ec-name {
          font-size: 16px; font-weight: 700;
          margin-bottom: 8px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.3;
        }
        .ec-card.has-img .ec-name { color: var(--text-primary); }
        .ec-meta-row {
          display: flex; flex-wrap: wrap; gap: 10px;
          margin-bottom: 6px;
        }
        .ec-meta {
          font-size: 12px; color: var(--text-secondary);
          display: flex; align-items: center; gap: 4px;
        }
        .ec-meta i { font-size: 10px; color: var(--text-tertiary); width: 14px; text-align: center; }
        .ec-desc {
          font-size: 12px; color: var(--text-tertiary);
          margin-top: 6px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.4;
        }

        /* Hover glow */
        .ec-glow {
          position: absolute;
          top: -50%; right: -30%;
          width: 200px; height: 200px;
          background: radial-gradient(circle, rgba(217,119,6,0.06) 0%, transparent 70%);
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.5s ease;
          z-index: 1;
        }
        .ec-card.active .ec-glow { opacity: 1; }

        /* Dots */
        .ec-dots {
          display: flex; align-items: center; justify-content: center;
          gap: 6px; margin-top: 12px;
        }
        .ec-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--border);
          border: none; cursor: pointer; padding: 0;
          transition: all 0.3s ease;
        }
        .ec-dot.active {
          width: 24px; border-radius: 4px;
          background: var(--primary);
          box-shadow: 0 0 8px rgba(217,119,6,0.3);
        }
        .ec-dot:active { transform: scale(0.8); }

        /* ── Full-screen image preview ── */
        .ec-preview-overlay {
          position: fixed; inset: 0; z-index: 20000;
          background: rgba(0,0,0,0.92);
          display: flex; align-items: center; justify-content: center;
          animation: ecFadeIn 0.2s ease;
          padding: 16px;
        }
        @keyframes ecFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .ec-preview-close {
          position: fixed; top: 16px; right: 16px;
          width: 40px; height: 40px; border-radius: 50%;
          background: rgba(255,255,255,0.1);
          border: none; color: #fff; font-size: 18px;
          cursor: pointer; z-index: 20001;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .ec-preview-close:active { transform: scale(0.85); background: rgba(255,255,255,0.2); }
        .ec-preview-card {
          max-width: 100%;
          max-height: 100%;
          display: flex; flex-direction: column;
          border-radius: 16px; overflow: hidden;
          background: var(--surface);
          box-shadow: 0 20px 60px rgba(0,0,0,0.6);
        }
        .ec-preview-img {
          display: block;
          max-width: 100vw;
          max-height: 80vh;
          width: auto;
          height: auto;
          object-fit: contain;
        }
        .ec-preview-info {
          padding: 16px 20px;
          background: var(--surface);
        }
        .ec-preview-name {
          font-size: 18px; font-weight: 700;
          margin-bottom: 8px;
        }
        .ec-preview-meta {
          display: flex; flex-wrap: wrap; gap: 12px;
          font-size: 13px; color: var(--text-secondary);
        }
        .ec-preview-meta i { font-size: 11px; margin-right: 4px; color: var(--primary); }
        .ec-preview-desc {
          font-size: 13px; color: var(--text-tertiary);
          margin-top: 8px; line-height: 1.5;
        }
      `}</style>
    </section>
  );
}
