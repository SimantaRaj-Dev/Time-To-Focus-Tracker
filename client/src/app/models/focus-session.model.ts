import { TabEvent } from './tab-event.model';
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
  tabEvents?: TabEvent[];
}

export enum SessionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}
