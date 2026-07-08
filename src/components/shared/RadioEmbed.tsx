"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const phrases = [
  "Fetching radio stream...",
  "Synchronizing broadcast...",
  "Preparing audio player...",
  "Tuning into frequency...",
  "Establishing connection...",
  "Loading broadcast...",
  "Connecting to studio...",
  "Initializing player...",
];

export default function RadioEmbed({ src, title }: { src: string; title: string }) {
  const [loaded, setLoaded] = useState(false);
  const [phrase, setPhrase] = useState(phrases[0]);
  const loadedRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleLoad = useCallback(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    setLoaded(true);
  }, []);

  return (
    <>
      <style>{`
        .re-wrap {
          position: relative;
          width: 100%;
          min-height: 150px;
          height: 150px;
          border-radius: var(--radius-lg, 20px);
          overflow: hidden;
          background: var(--surface-card, #1E1E1E);
          border: 1px solid var(--border, #2A2A2A);
        }
        .re-loading {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--surface-card, #1E1E1E);
          transition: opacity 0.5s ease;
          z-index: 2;
          gap: 10px;
        }
        .re-loading.hidden {
          opacity: 0;
          pointer-events: none;
        }
        .re-ring {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 3px solid rgba(232,168,56,0.08);
          border-top-color: #E8A838;
          border-right-color: #D4762A;
          animation: re-spin 0.9s cubic-bezier(0.4,0,0.2,1) infinite;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .re-ring-inner {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid rgba(232,168,56,0.06);
          border-bottom-color: #E8A838;
          border-left-color: #D4762A;
          animation: re-spin 1.4s cubic-bezier(0.4,0,0.2,1) infinite reverse;
        }
        .re-icon {
          position: absolute;
          font-size: 16px;
          color: #E8A838;
          animation: re-pulse 1.6s ease-in-out infinite;
        }
        .re-text {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary, #A0A0A0);
          letter-spacing: 0.2px;
          min-height: 18px;
          transition: opacity 0.3s ease;
        }
        .re-dots {
          display: flex;
          gap: 5px;
        }
        .re-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: rgba(232,168,56,0.6);
          animation: re-bounce 1.2s ease-in-out infinite;
        }
        .re-dot:nth-child(2) { animation-delay: 0.2s; }
        .re-dot:nth-child(3) { animation-delay: 0.4s; }
        .re-iframe {
          width: 100%;
          height: 100%;
          border: 0;
          display: block;
          opacity: 0;
          transition: opacity 0.5s ease 0.15s;
        }
        .re-iframe.visible { opacity: 1; }
        @keyframes re-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes re-pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes re-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
      <div className="re-wrap">
        <div className={`re-loading${loaded ? " hidden" : ""}`}>
          <div className="re-ring">
            <div className="re-ring-inner"></div>
            <i className="fas fa-radio re-icon"></i>
          </div>
          <div className="re-text">{phrase}</div>
          <div className="re-dots">
            <div className="re-dot"></div>
            <div className="re-dot"></div>
            <div className="re-dot"></div>
          </div>
        </div>
        <iframe
          src={src}
          className={`re-iframe${loaded ? " visible" : ""}`}
          frameBorder="0"
          allow="autoplay; encrypted-media; fullscreen"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          title={title}
          onLoad={handleLoad}
        />
      </div>
    </>
  );
}
