// client/src/app/services/focus-session.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { DbService } from './db.service';
import { FocusSession, SessionStatus } from '../models/focus-session.model';
import { TabTrackingService } from './tab-tracking.service';

@Injectable({ providedIn: 'root' })
export class FocusSessionService {
  current$ = new BehaviorSubject<FocusSession | null>(null);
  history$ = this.db.sessions$;  // RxJS Observable<FocusSession[]>
  currentSession$ = this.current$.asObservable();
  private isBrowser: boolean;

  constructor(
    private db: DbService,
    private tabs: TabTrackingService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      const raw = localStorage.getItem('current-session');
      if (raw) {
        const session = JSON.parse(raw) as FocusSession;
        session.startTime = new Date(session.startTime);
        this.current$.next(session);
      }
    }
  }

  /** Starts a new focus session */
  async startSession(task: string, focusDomains: string[]): Promise<void> {
    if (!this.isBrowser) return;

    const session: FocusSession = {
      id: Date.now().toString(),
      taskName: task,
      startTime: new Date(),
      focusDomains,
      status: SessionStatus.ACTIVE
    };

    this.current$.next(session);
    localStorage.setItem('current-session', JSON.stringify(session));
    this.tabs.startTracking();
  }

  /** Ends the current focus session and saves it to IndexedDB */
  async endSession(distractionRating?: number): Promise<void> {
    if (!this.isBrowser) return;

    const session = this.current$.value;
    if (!session) return;

    session.endTime = new Date();
    session.distractionRating = distractionRating;
    session.status = SessionStatus.COMPLETED;

    // Persist session to IndexedDB, ignore the returned key
    await this.db.add(session);

    // Update history stream
    this.current$.next(null);
    localStorage.removeItem('current-session');
    this.tabs.stopTracking();
  }
}






