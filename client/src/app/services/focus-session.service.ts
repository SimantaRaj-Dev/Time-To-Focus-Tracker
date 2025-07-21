import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { FocusDbService } from './focus-db.service';
import { FocusSession, SessionStatus } from '../models/focus-session.model';
import { TabTrackingService } from './tab-tracking.service';

@Injectable({ providedIn: 'root' })
export class FocusSessionService {
  private current$ = new BehaviorSubject<FocusSession | null>(null);
  private history$ = new BehaviorSubject<FocusSession[]>([]);
  currentSession$ = this.current$.asObservable();
  historySessions$ = this.history$.asObservable();

  private isBrowser: boolean;

  constructor(
    private db: FocusDbService,
    private tabs: TabTrackingService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.db.getAllSessions().then(sessions => this.history$.next(sessions));
      const raw = localStorage.getItem('current-session');
      if (raw) {
        const sess = JSON.parse(raw) as FocusSession;
        sess.startTime = new Date(sess.startTime);
        this.current$.next(sess);
      }
    }
  }

  async startSession(taskName: string, focusDomains: string[]): Promise<void> {
    if (!this.isBrowser) return;
    const session: FocusSession = {
      id: Date.now().toString(),
      taskName,
      startTime: new Date(),
      focusDomains,
      status: SessionStatus.ACTIVE
    };
    this.current$.next(session);
    localStorage.setItem('current-session', JSON.stringify(session));
    this.tabs.startTracking();
  }

  async endSession(distractionRating?: number): Promise<void> {
    if (!this.isBrowser) return;
    const session = this.current$.value;
    if (!session) return;

    session.endTime = new Date();
    session.distractionRating = distractionRating;
    session.status = SessionStatus.COMPLETED;

    await this.db.addSession(session);
    this.history$.next([session, ...this.history$.value]);
    this.current$.next(null);
    localStorage.removeItem('current-session');
    this.tabs.stopTracking();
  }
}



