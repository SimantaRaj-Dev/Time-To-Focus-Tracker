// client/src/app/models/focus-session.model.ts
export interface FocusSession {
  id?: string;
  userId?: string;
  taskName: string;
  startTime: Date;
  endTime?: Date;
  pausedAt?: Date;
  resumedAt?: Date;
  focusDomains: string[];
  status: SessionStatus;
  tabSwitches?: number;
  focusedTimeMinutes?: number;
  distractedTimeMinutes?: number;
  durationMinutes?: number;
  focusPercentage?: number;
  distractionRating?: number;
  lastUpdated?: Date;
  notes?: string;
}

export enum SessionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// client/src/app/models/tab-event.model.ts
export interface TabEvent {
  id: string;
  type: TabEventType;
  timestamp: Date;
  url: string;
  domain: string;
  title: string;
  isVisible: boolean;
  sessionId?: string;
}

export enum TabEventType {
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  TAB_FOCUS = 'tab_focus',
  TAB_BLUR = 'tab_blur',
  WINDOW_FOCUS = 'window_focus',
  WINDOW_BLUR = 'window_blur',
  DOMAIN_SWITCH = 'domain_switch'
}

// client/src/app/models/focus-domain.model.ts
export interface FocusDomain {
  id: string;
  domain: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  color?: string;
  category?: string;
}
