import React, { useEffect, useMemo, useRef, useState } from 'react';
import { LEAVE_WAVE, LEAVE_WAVE_TOP_FILL, LEAVE_WAVE_BOTTOM_FILL } from '../utils/calendarVisuals';
import { leaveWaveFrames, type WaveSize } from '../utils/leaveWaveFrames';

// Only the fill is masked; the stroke and the parent's focus outline stay intact.
export function LeaveWave({ animated = false }: { animated?: boolean }) {
  const surface = useRef<HTMLSpanElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState<WaveSize | null>(null);
  const frames = useMemo(() => size ? leaveWaveFrames(size) : [], [size]);

  useEffect(() => {
    if (!animated || !surface.current) return;
    const element = surface.current;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (!width || !height) return;
      const css = getComputedStyle(element);
      const next = { width, height, waveWidth: parseFloat(css.getPropertyValue('--wave-width')), waveHeight: parseFloat(css.getPropertyValue('--wave-height')) };
      setSize(current => current && Object.keys(next).every(key => current[key] === next[key]) ? current : next);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [animated]);

  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const print = matchMedia('print');
    let visible = false;
    const sync = () => {
      if (motion.matches || print.matches) {
        element.pauseAnimations();
        element.setCurrentTime(0);
      } else if (!visible || document.hidden) element.pauseAnimations();
      else element.unpauseAnimations();
    };
    sync();
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= .6;
      sync();
    }, { threshold: .6 });
    observer.observe(surface.current!);
    motion.addEventListener('change', sync);
    print.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      element.pauseAnimations();
      observer.disconnect();
      motion.removeEventListener('change', sync);
      print.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [size]);

  return <span ref={surface} className={`leave-wave-surface${size ? ' has-live-wave' : ''}`} aria-hidden="true" style={{
    '--wave-stroke': LEAVE_WAVE,
    '--wave-top-fill': LEAVE_WAVE_TOP_FILL,
    '--wave-bottom-fill': LEAVE_WAVE_BOTTOM_FILL,
  } as React.CSSProperties}>
    <span className="leave-wave-fill" />
    <span className="leave-wave-edge leave-wave-top" />
    <span className="leave-wave-edge leave-wave-bottom" />
    {size && <svg ref={svg} className="leave-wave-svg" viewBox={`0 0 ${size.width} ${size.height}`} preserveAspectRatio="none">
      <path className="leave-wave-svg-fill" d={frames[0].fill}>
        <animate attributeName="d" values={frames.map(frame => frame.fill).join(';')} dur="3.2s" repeatCount="indefinite" />
      </path>
      <path className="leave-wave-svg-edge" d={frames[0].edge} strokeWidth={size.waveHeight / 4}>
        <animate attributeName="d" values={frames.map(frame => frame.edge).join(';')} dur="3.2s" repeatCount="indefinite" />
      </path>
    </svg>}
  </span>;
}
