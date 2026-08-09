export interface TimeBlock {
  id: string;
  start: number;
  end: number;
  color: string;
  label: string;
  owner_id: string;
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
