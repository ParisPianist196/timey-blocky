export interface TimeBlock {
  id: string;
  start: number;
  end: number;
  color: string;
  label: string;
}

export interface CreatingBlock {
  start: number;
  end: number;
  top: number;
  height: number;
  color: string;
  label: string;
}

export interface TimelineSelection {
  start: number;
  end: number;
}

export interface TimelineConfig {
  dayStart: number;
  dayEnd: number;
  snapMinutes: number;
  pixelsPerHour: number;
}
