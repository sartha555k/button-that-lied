"use client";

export default function CursorLayer({ x, y, visible, rippleKey }: { x: number; y: number; visible: boolean; rippleKey: number }) {
  return (
    <>
      {rippleKey > 0 && <span key={rippleKey} className="click-ripple" style={{ left: x, top: y }} />}
      <svg
        className={`cursor ${visible ? "cursor--on" : ""}`}
        style={{ transform: `translate(${x}px, ${y}px)` }}
        width="26"
        height="26"
        viewBox="0 0 24 24"
      >
        <path d="M4 2 L20 12 L12.5 13.5 L9 22 Z" fill="#f5f3ff" stroke="#1e1b4b" strokeWidth="1.2" />
      </svg>
    </>
  );
}
