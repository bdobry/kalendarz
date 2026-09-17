// One marker for leave days in the calendar, legend and strategy timeline.
export const LEAVE_WAVE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='4' viewBox='0 0 6 4' preserveAspectRatio='none'%3E%3Cpath d='M0 2 Q1.5 0.5 3 2 T6 2' fill='none' stroke='%23596928' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`;

// Fill masks follow the same curve as the stroke, below the top edge and above the bottom edge.
const waveFillMask = (edge: 'top' | 'bottom') => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="6" height="4" viewBox="0 0 6 4" preserveAspectRatio="none"><path d="M0 2 Q1.5 0.5 3 2 T6 2 V${edge === 'top' ? 4 : 0} H0 Z" fill="white"/></svg>`)}")`;
export const LEAVE_WAVE_TOP_FILL = waveFillMask('top');
export const LEAVE_WAVE_BOTTOM_FILL = waveFillMask('bottom');
