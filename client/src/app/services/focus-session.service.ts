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
  }


  /**
   * Start a new focus session.
   * @param taskName Name of the task.
   * @param domains Array of whitelisted domains.
   */
  async startSession(taskName: string, domains: string[]): Promise<void> {
    console.log('[FocusSessionService] startSession()', { taskName, domains });
    if (!this.isBrowser) return;
    this.tabs.start();
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
   * End the current focus session
   * @param distractionRating Optional user rating of distraction.
   */
  async endSession(distractionRating?: number): Promise<void> {
    if (!this.isBrowser) return;
    const session = this._current.value!;
    
    // 1) Stop tracking to record SESSION_END and finalize timers
    this.tabs.stop();

    session.endTime = new Date();
    session.status  = SessionStatus.COMPLETED;
    session.tabSwitches = this.tabs.tabSwitches$.value;
    session.focusedTimeSeconds   = this.tabs.getFocusedSeconds();
    session.distractedTimeSeconds = this.tabs.getDistractedSeconds();

    if (distractionRating != null) {
      session.distractionRating = distractionRating;
    }

    // 3) Persist and clean up
    await this.db.put(session);
    localStorage.removeItem('current-session');
    this._current.next(null);
  }
}









