// client/src/app/models/focus-session.model.ts
export interface FocusSession {
  id?: string;
  taskName: string;
  startTime: Date;
  endTime?: Date;
  focusDomains: string[];
  status: SessionStatus;
  tabSwitches: number;
  focusedTimeSeconds: number;
  distractedTimeSeconds: number;
  distractionRating?: number;
}

export enum SessionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Helpers for components
export const toFocusedMinutes   = (s: FocusSession): number => Math.round(s.focusedTimeSeconds / 60);
export const toDistractedMinutes = (s: FocusSession): number => Math.round(s.distractedTimeSeconds / 60);


