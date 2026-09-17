import React from 'react';
import { LEAVE_WAVE, LEAVE_WAVE_TOP_FILL, LEAVE_WAVE_BOTTOM_FILL } from '../utils/calendarVisuals';

// Only the fill is masked; the stroke and the parent's focus outline stay intact.
export function LeaveWave() {
  return <span className="leave-wave-surface" aria-hidden="true" style={{
    '--wave-stroke': LEAVE_WAVE,
    '--wave-top-fill': LEAVE_WAVE_TOP_FILL,
    '--wave-bottom-fill': LEAVE_WAVE_BOTTOM_FILL,
  } as React.CSSProperties}>
    <span className="leave-wave-fill" />
    <span className="leave-wave-edge leave-wave-top" />
    <span className="leave-wave-edge leave-wave-bottom" />
  </span>;
}
