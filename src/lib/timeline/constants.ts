export const DAY_START = 6 * 60;
export const DAY_END = 24 * 60;

export const DEFAULT_SNAP = 15;

export const MIN_BLOCK_DURATION = 15;

export const ZOOM_LEVELS = [
  {
    name: "hour",
    pixelsPerHour: 60,
    snapMinutes: 60,
  },
  {
    name: "half-hour",
    pixelsPerHour: 90,
    snapMinutes: 30,
  },
  {
    name: "quarter-hour",
    pixelsPerHour: 140,
    snapMinutes: 15,
  },
];
