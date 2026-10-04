import { useEffect, useRef, useState, type RefObject } from 'react';

export interface MarqueeRect { left: number; top: number; width: number; height: number }

const scrollParent = (el: HTMLElement) => {
  for (let node = el.parentElement; node; node = node.parentElement) if (/(auto|scroll)/.test(getComputedStyle(node).overflowY)) return node;
  return document.documentElement;
};

/**
 * Rubber-band selection over the `[data-file-id]` elements inside `area`.
 * Starts only from empty space (never from a row, button, link or input), ignores touch so scrolling still works,
 * auto-scrolls the nearest scroll container, and clamps the drawn rectangle to that container's bounds.
 * Holding Cmd/Ctrl/Shift adds to `getSelection()` instead of replacing it. A plain click on empty space calls `onBlankClick`.
 */
export function useMarquee(area: RefObject<HTMLElement | null>, getSelection: () => Set<string>, onSelect: (ids: Set<string>) => void, onBlankClick: (additive: boolean) => void) {
  const [rect, setRect] = useState<MarqueeRect | null>(null);
  const latest = useRef({ getSelection, onSelect, onBlankClick });
  latest.current = { getSelection, onSelect, onBlankClick };

  useEffect(() => {
    const el = area.current;
    if (!el) return;
    const scroller = scrollParent(el);
    let cleanup: (() => void) | null = null;

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || e.pointerType === 'touch' || cleanup) return;
      if ((e.target as HTMLElement).closest('.file-row, button, a, input, textarea, select, [role="menu"]')) return;
      const additive = e.metaKey || e.ctrlKey || e.shiftKey;
      const base = additive ? new Set(latest.current.getSelection()) : new Set<string>();
      const startX = e.clientX, startY = e.clientY, startScroll = scroller.scrollTop;
      let x = startX, y = startY, active = false, frame = 0;
      el.focus({ preventScroll: true });

      const update = () => {
        const bounds = scroller === document.documentElement ? { left: 0, top: 0, right: innerWidth, bottom: innerHeight } : scroller.getBoundingClientRect();
        // The anchor moves with the content as the container scrolls.
        const ay = startY - (scroller.scrollTop - startScroll);
        const x1 = Math.min(startX, x), x2 = Math.max(startX, x), y1 = Math.min(ay, y), y2 = Math.max(ay, y);
        const hit = new Set(base);
        el.querySelectorAll<HTMLElement>('[data-file-id]').forEach(row => {
          const r = row.getBoundingClientRect();
          if (r.right >= x1 && r.left <= x2 && r.bottom >= y1 && r.top <= y2) hit.add(row.dataset.fileId!);
        });
        latest.current.onSelect(hit);
        const cl = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
        const left = cl(x1, bounds.left, bounds.right), right = cl(x2, bounds.left, bounds.right), top = cl(y1, bounds.top, bounds.bottom), bottom = cl(y2, bounds.top, bounds.bottom);
        setRect({ left, top, width: right - left, height: bottom - top });
      };
      const tick = () => {
        const bounds = scroller === document.documentElement ? { top: 0, bottom: innerHeight } : scroller.getBoundingClientRect();
        const edge = 36, speed = y < bounds.top + edge ? -Math.ceil((bounds.top + edge - y) / 3) : y > bounds.bottom - edge ? Math.ceil((y - (bounds.bottom - edge)) / 3) : 0;
        if (speed) { scroller.scrollBy({ top: speed, behavior: 'instant' }); update(); }
        frame = requestAnimationFrame(tick);
      };
      const onMove = (ev: PointerEvent) => {
        x = ev.clientX; y = ev.clientY;
        if (!active) {
          if (Math.hypot(x - startX, y - startY) < 4) return;
          active = true;
          el.setPointerCapture(e.pointerId);
          el.classList.add('marquee-active');
          frame = requestAnimationFrame(tick);
        }
        update();
      };
      const finish = (ev: PointerEvent) => {
        if (!active && ev.type === 'pointerup') latest.current.onBlankClick(additive);
        end();
      };
      const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') { ev.stopPropagation(); latest.current.onSelect(base); end(); } };
      const end = () => {
        cancelAnimationFrame(frame);
        el.classList.remove('marquee-active');
        if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerup', finish);
        el.removeEventListener('pointercancel', finish);
        document.removeEventListener('keydown', onKey, true);
        setRect(null);
        cleanup = null;
      };
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerup', finish);
      el.addEventListener('pointercancel', finish);
      document.addEventListener('keydown', onKey, true);
      cleanup = end;
    };

    el.addEventListener('pointerdown', onDown);
    return () => { el.removeEventListener('pointerdown', onDown); cleanup?.(); };
  }, [area]);

  return rect;
}
