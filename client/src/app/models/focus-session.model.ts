export interface FocusSession {
  id?: number;
  taskName: string;
  startTime: Date;
  focusConfirmedAt?: Date;
  endTime?: Date;
  tabSwitches?: number;
  idleTimeMinutes?: number;
  distractionRating?: number;
  notes?: string;
}
