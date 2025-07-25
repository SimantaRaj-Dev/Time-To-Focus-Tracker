import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { DbService } from './db.service';
import { TabTrackingService } from './tab-tracking.service';
import { FocusSession, SessionStatus } from '../models/focus-session.model';
import { TabEvent } from '../models/tab-event.model';

@Injectable({ providedIn: 'root' })
export class FocusSessionService {
  private _current = new BehaviorSubject<FocusSession | null>(null);
  public currentSession$ = this._current.asObservable();
  public history$ = this.dbService.sessions$;
  private isBrowser: boolean;
  tabEvents?: TabEvent[];

  constructor(
    private dbService: DbService,
    private tabService: TabTrackingService,
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
    if (!this.isBrowser) return;

    this.tabService.start();

    const session: FocusSession = {
      id: Date.now().toString(),
      taskName,
      startTime: new Date(),
      focusDomains: domains,
      status: SessionStatus.ACTIVE,
      focusedTimeInSeconds: 0,
      distractedTimeInSeconds: 0,
      focusedToDistractedTabSwitches: 0,
      distractedToFocusedTabSwitches: 0,
      focusedToFocusedTabSwitches: 0,
      distractedToDistractedTabSwitches: 0,
      totalTabSwitches: 0,
      tabEvents: []
    };
    this._current.next(session);
    localStorage.setItem('current-session', JSON.stringify(session));
  }

  async endSession(): Promise<void> {
    if (!this.isBrowser) return;
    const session = this._current.value!;
    
    this.tabService.stop();

    session.endTime = new Date();
    session.status  = SessionStatus.COMPLETED;
    session.totalTabSwitches = this.tabService.totalTabSwitches$.value;
    session.focusedTimeInSeconds   = this.tabService.getFocusedTimeInSeconds();
    session.distractedTimeInSeconds = this.tabService.getDistractedTimeInSeconds();
    session.focusedToDistractedTabSwitches = this.tabService.getFocusedToDistractedTabSwitches();
    session.distractedToFocusedTabSwitches = this.tabService.getDistractedToFocusedTabSwitches();
    session.focusedToFocusedTabSwitches   = this.tabService.getFocusedToFocusedTabSwitches();
    session.distractedToDistractedTabSwitches = this.tabService.getDistractedToDistractedTabSwitches();
    session.tabEvents = this.tabService.getEvents();

    await this.dbService.put(session);
    localStorage.removeItem('current-session');
    this._current.next(null);
  }
}









