export interface FocusSession {
  id?: string;
  taskName: string;
  startTime: Date;
  endTime?: Date;
  focusDomains: string[];
  status: SessionStatus;
  totalTabSwitches: number;
  focusedToDistractedTabSwitches?: number;
  distractedToFocusedTabSwitches?: number;
  focusedToFocusedTabSwitches?: number;
  distractedToDistractedTabSwitches?: number;
  focusedTimeInSeconds: number;
  distractedTimeInSeconds: number;
}

export enum SessionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Helpers for components
export const toFocusedMinutes   = (s: FocusSession): number => Math.round(s.focusedTimeInSeconds / 60);
export const toDistractedMinutes = (s: FocusSession): number => Math.round(s.distractedTimeInSeconds / 60);


