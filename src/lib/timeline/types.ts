export interface TimeBlock {
  id: string;
  start: number;
  end: number;
  color: string;
  label: string;
  top?: number;
  height?: number;
}

export interface TimelineConfig {
  dayStart: number;
  dayEnd: number;
  snapMinutes: number;
  pixelsPerHour: number;
}

export type TimelineViewport = {
  top: number;
  scrollTop: number;
};

export const defaultConfig: TimelineConfig = {
  dayStart: 600,
  dayEnd: 1440,
  snapMinutes: 15,
  pixelsPerHour: 80,
};

export type DragSelection = {
  start: number;
  end: number;
};

export type EdgeHandle = "start" | "end";
