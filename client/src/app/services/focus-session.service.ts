// src/app/services/focus-session.service.ts

import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { DbService } from './db.service';
import { TabTrackingService } from './tab-tracking.service';
import { FocusDomainsService } from './focus-domains.service';
import { FocusSession, SessionStatus } from '../models/focus-session.model';
import { TabEvent, TabEventType } from '../models/tab-event.model';

@Injectable({ providedIn: 'root' })
export class FocusSessionService {
  private _current = new BehaviorSubject<FocusSession | null>(null);
  public currentSession$ = this._current.asObservable();
  public history$ = this.db.sessions$;
  private isBrowser: boolean;

  constructor(
    private db: DbService,
    private tabs: TabTrackingService,
    private domainsSvc: FocusDomainsService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      const raw = localStorage.getItem('current-session');
      if (raw) {
        const s = JSON.parse(raw) as FocusSession;
        s.startTime = new Date(s.startTime);
        this._current.next(s);
      }
    }
  }

  /**
   * Start a new focus session.
   * @param taskName Name of the task.
   * @param domains Array of whitelisted domains.
   */
  async startSession(taskName: string, domains: string[]): Promise<void> {
    if (!this.isBrowser) return;
    this.tabs.start();  // begin tracking tab events
    const session: FocusSession = {
      id: Date.now().toString(),
      taskName,
      startTime: new Date(),
      focusDomains: domains,
      status: SessionStatus.ACTIVE,
      tabSwitches: 0,
      focusedTimeSeconds: 0,
      distractedTimeSeconds: 0
    };
    this._current.next(session);
    localStorage.setItem('current-session', JSON.stringify(session));
  }

  /**
   * End the current focus session.
   * @param distractionRating Optional user rating of distraction.
   */
  async endSession(distractionRating?: number): Promise<void> {
    if (!this.isBrowser) return;
    const session = this._current.value;
    if (!session) return;

    session.endTime = new Date();
    session.status = SessionStatus.COMPLETED;

    // Capture tab switch count and events
    session.tabSwitches = this.tabs.tabSwitches$.value;
    const events: TabEvent[] = this.tabs.getEvents();

    // Calculate focused time based on whitelisted domains
    session.focusedTimeSeconds = this.calculateFocusedTime(events, session.startTime, session.endTime);
    const totalSec = (session.endTime.getTime() - session.startTime.getTime()) / 1000;
    session.distractedTimeSeconds = Math.max(0, Math.round(totalSec - session.focusedTimeSeconds));

    if (distractionRating != null) {
      session.distractionRating = distractionRating;
    }

    this.tabs.stop();  // end tracking
    await this.db.put(session);  // upsert to IndexedDB
    localStorage.removeItem('current-session');
    this._current.next(null);
  }

    private calculateFocusedTime(events: TabEvent[], start: Date, end: Date): number {
    let focused = 0;
    let prev = start;
    let currentlyFocused = true;  // assume start in focus

    for (const ev of events) {
      const span = (ev.timestamp.getTime() - prev.getTime()) / 1000;
      // Whitelist check at calculation time
      if (this.domainsSvc.isWhitelisted(ev.domain)) {
        focused += span;
      }
      // flip focus state on TAB_BLUR / TAB_FOCUS
      if (ev.type === TabEventType.TAB_BLUR) currentlyFocused = false;
      else if (ev.type === TabEventType.TAB_FOCUS) currentlyFocused = true;

      prev = ev.timestamp;
    }

    // final segment
    const lastSpan = (end.getTime() - prev.getTime()) / 1000;
    if (currentlyFocused) {
      focused += lastSpan;
    }
    return Math.round(focused);
  }

}








