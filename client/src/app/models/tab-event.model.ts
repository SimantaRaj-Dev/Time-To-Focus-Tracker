// src/app/models/tab-event.model.ts

export enum TabEventType {
  SESSION_START  = 'session_start',
  SESSION_END    = 'session_end',
  TAB_FOCUS      = 'tab_focus',
  TAB_BLUR       = 'tab_blur',
  WINDOW_FOCUS   = 'window_focus',
  WINDOW_BLUR    = 'window_blur',
  DOMAIN_SWITCH  = 'domain_switch'
}

export interface TabEvent {
  /** Unique identifier for this event */
  id: string;

  /** Type of event (start/end or focus/blur) */
  type: TabEventType;

  /** When the event occurred */
  timestamp: Date;

  /** Full URL of the active tab when event fired */
  url: string;

  /** Domain portion of the URL (e.g. "github.com") */
  domain: string;

  /** Page title at the time of event */
  title: string;

  /** Whether the tab was visible (document.visibilityState==='visible') */
  isVisible: boolean;

  /** Optional: link back to a FocusSession record */
  sessionId?: string;
}
