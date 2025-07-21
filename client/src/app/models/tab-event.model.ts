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