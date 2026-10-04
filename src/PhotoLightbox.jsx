import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export default function PhotoLightbox({ images, initialIndex, market, date, language, onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const gesture = useRef({ pointers: new Map(), start: null, last: null, pinchDistance: 0, pinchScale: 1, lastTap: null });
  const closeRef = useRef(null);
  const previousFocus = useRef(null);
  const isFa = language !== "en";
  const image = images[index];

  function setZoom(value) {
    const next = clamp(value, 1, 4);
    scaleRef.current = next;
    setScale(next);
    if (next === 1) {
      offsetRef.current = { x: 0, y: 0 };
      setOffset({ x: 0, y: 0 });
    }
  }
  function setPan(next) {
    offsetRef.current = next;
    setOffset(next);
  }
  function show(next) {
    setIndex((next + images.length) % images.length);
    setZoom(1);
    gesture.current.lastTap = null;
  }

  useEffect(() => {
    previousFocus.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
      if (event.key === "ArrowLeft" && images.length > 1) { event.preventDefault(); show(index + (isFa ? 1 : -1)); }
      if (event.key === "ArrowRight" && images.length > 1) { event.preventDefault(); show(index + (isFa ? -1 : 1)); }
      if (event.key === "Tab") {
        const controls = [...document.querySelectorAll(".photo-viewer button:not(:disabled), .photo-viewer a[href]")];
        if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1)?.focus(); }
        else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0]?.focus(); }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [images.length, index, isFa, onClose]);

  function pointerDown(event) {
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = { x: event.clientX, y: event.clientY };
    const state = gesture.current;
    state.pointers.set(event.pointerId, point);
    if (state.pointers.size === 1) {
      state.start = point;
      state.last = point;
    } else if (state.pointers.size === 2) {
      const [a, b] = [...state.pointers.values()];
      state.pinchDistance = distance(a, b);
      state.pinchScale = scaleRef.current;
      state.start = null;
      state.lastTap = null;
    }
  }
  function pointerMove(event) {
    const state = gesture.current;
    if (!state.pointers.has(event.pointerId)) return;
    const point = { x: event.clientX, y: event.clientY };
    state.pointers.set(event.pointerId, point);
    if (state.pointers.size === 2 && state.pinchDistance) {
      const [a, b] = [...state.pointers.values()];
      setZoom(state.pinchScale * distance(a, b) / state.pinchDistance);
    } else if (state.pointers.size === 1 && scaleRef.current > 1 && state.last) {
      setPan({ x: offsetRef.current.x + point.x - state.last.x, y: offsetRef.current.y + point.y - state.last.y });
    }
    state.last = point;
  }
  function pointerUp(event) {
    const state = gesture.current;
    const start = state.start;
    const end = state.pointers.get(event.pointerId);
    state.pointers.delete(event.pointerId);
    if (!state.pointers.size) {
      if (start && end && scaleRef.current === 1 && images.length > 1) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.35) show(index + (dx < 0 ? 1 : -1));
      }
      if (start && end && Math.abs(end.x - start.x) < 14 && Math.abs(end.y - start.y) < 14) {
        const now = Date.now();
        const lastTap = state.lastTap;
        if (lastTap && now - lastTap.time < 340 && distance(end, lastTap) < 28) {
          setZoom(scaleRef.current === 1 ? 2 : 1);
          state.lastTap = null;
        } else state.lastTap = { ...end, time: now };
      }
      state.start = null;
      state.last = null;
      state.pinchDistance = 0;
    } else if (state.pointers.size === 1) {
      state.last = [...state.pointers.values()][0];
      state.start = null;
      state.pinchDistance = 0;
    }
  }

  if (!image) return null;
  return (
    <div className="photo-viewer" role="dialog" aria-modal="true" aria-label={isFa ? "پیش‌نمایش تمام‌صفحهٔ عکس پوزیشن" : "Full-screen position photo preview"} dir={isFa ? "rtl" : "ltr"}>
      <div className="photo-viewer-top">
        <div className="photo-viewer-title">
          <span>{market || (isFa ? "پوزیشن" : "Position")} <i /> {date}</span>
          <strong>{image.timeframe || (isFa ? "بدون تایم‌فریم" : "No timeframe")}</strong>
          <small>{isFa ? `${index + 1} از ${images.length} عکس` : `${index + 1} of ${images.length} photos`}</small>
        </div>
        <div className="photo-viewer-tools">
          <button type="button" onClick={() => setZoom(scaleRef.current - .5)} disabled={scale <= 1} aria-label={isFa ? "کوچک‌نمایی" : "Zoom out"} title={isFa ? "کوچک‌نمایی" : "Zoom out"}><ZoomOut /></button>
          <button type="button" onClick={() => setZoom(scaleRef.current + .5)} disabled={scale >= 4} aria-label={isFa ? "بزرگ‌نمایی" : "Zoom in"} title={isFa ? "بزرگ‌نمایی" : "Zoom in"}><ZoomIn /></button>
          <button type="button" onClick={() => setZoom(1)} disabled={scale === 1} aria-label={isFa ? "اندازهٔ اصلی" : "Reset zoom"} title={isFa ? "اندازهٔ اصلی" : "Reset zoom"}><RotateCcw /></button>
          <a href={image.src} download={`ETT-${date}-${image.timeframe || index + 1}.jpg`} aria-label={isFa ? "دانلود عکس" : "Download photo"} title={isFa ? "دانلود عکس" : "Download photo"}><Download /></a>
          <button ref={closeRef} type="button" className="photo-viewer-close" onClick={onClose} aria-label={isFa ? "بستن پیش‌نمایش" : "Close preview"} title={isFa ? "بستن" : "Close"}><X /></button>
        </div>
      </div>
      <div className="photo-viewer-main">
        {images.length > 1 && <button type="button" className="photo-viewer-arrow previous" onClick={() => show(index - 1)} aria-label={isFa ? "عکس قبلی" : "Previous photo"}><ChevronRight /></button>}
        <div className="photo-viewer-stage" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={(event) => { gesture.current.start = null; pointerUp(event); }}>
          <img src={image.src} alt={`${market || "Position"} ${image.timeframe || index + 1}`} draggable="false" style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})` }} />
        </div>
        {images.length > 1 && <button type="button" className="photo-viewer-arrow next" onClick={() => show(index + 1)} aria-label={isFa ? "عکس بعدی" : "Next photo"}><ChevronLeft /></button>}
      </div>
      <div className="photo-viewer-bottom">
        {images.length > 1 && <div className="photo-viewer-strip" aria-label={isFa ? "عکس‌های پوزیشن" : "Position photos"}>
          {images.map((item, itemIndex) => <button type="button" key={item.id || itemIndex} className={itemIndex === index ? "active" : ""} onClick={() => show(itemIndex)} aria-label={`${isFa ? "نمایش عکس" : "Show photo"} ${itemIndex + 1} ${item.timeframe || ""}`} aria-current={itemIndex === index ? "true" : undefined}><img src={item.src} alt="" /><span>{item.timeframe || `${itemIndex + 1}`}</span></button>)}
        </div>}
        <span className="photo-viewer-hint">{isFa ? "برای جابه‌جایی بکش · برای زوم، دو بار بزن یا از دکمه‌ها استفاده کن" : "Swipe to navigate · double tap or use the zoom controls"}</span>
      </div>
    </div>
  );
}
