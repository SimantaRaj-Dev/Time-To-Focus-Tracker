// src/app/services/tab-tracking.service.ts

import { Injectable, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, fromEvent, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { TabEvent, TabEventType } from '../models/tab-event.model';
import { FocusDomainsService } from './focus-domains.service';

@Injectable({ providedIn: 'root' })
export class TabTrackingService implements OnDestroy {
  private isBrowser: boolean;
  private tracking = false;
  private lastTime: Date | null = null;
  private isFocused = true;
  private switchCount = 0;
  private events: TabEvent[] = [];
  private destroy$ = new Subject<void>();

  /** Emits the current number of tab switches */
  public tabSwitches$ = new BehaviorSubject<number>(0);
  /** Emits the array of detailed tab events */
  public tabEvents$   = new BehaviorSubject<TabEvent[]>([]);
  /** Emits whether tracking is active */
  public isTracking$  = new BehaviorSubject<boolean>(false);

  constructor(
    private domainsSvc: FocusDomainsService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.initListeners();
    }
  }

  private initListeners(): void {
    // Tab loses/gains visibility
    fromEvent(document, 'visibilitychange')
      .pipe(filter(() => this.tracking), takeUntil(this.destroy$))
      .subscribe(() => {
        const type = document.hidden
          ? TabEventType.TAB_BLUR
          : TabEventType.TAB_FOCUS;
        this.handleEvent(type);
      });

    // Window-level focus/blur remain, for window‐level events
    fromEvent(window, 'focus')
      .pipe(filter(() => this.tracking), takeUntil(this.destroy$))
      .subscribe(() => this.handleEvent(TabEventType.WINDOW_FOCUS));

    fromEvent(window, 'blur')
      .pipe(filter(() => this.tracking), takeUntil(this.destroy$))
      .subscribe(() => this.handleEvent(TabEventType.WINDOW_BLUR));
  }

  /** Start a new tracking session */
  public start(): void {
    if (!this.isBrowser) return;
    this.reset();
    this.tracking = true;
    this.isTracking$.next(true);
    this.handleEvent(TabEventType.SESSION_START);
  }

  /** Stop the current tracking session */
  public stop(): void {
    if (!this.isBrowser) return;
    this.tracking = false;
    this.isTracking$.next(false);
    this.handleEvent(TabEventType.SESSION_END);
  }

  /** Return a copy of all recorded events */
  public getEvents(): TabEvent[] {
    return [...this.events];
  }

  /** Internal handler for all event types */
  private handleEvent(type: TabEventType): void {
    const now = new Date();
    const domain = window.location.hostname;
    const isWhite = this.domainsSvc.isWhitelisted(domain);

    // Count a tab switch whenever you go from focused → blurred on the tab
    if (type === TabEventType.TAB_BLUR && this.isFocused) {
      this.switchCount++;
      this.tabSwitches$.next(this.switchCount);
    }

    // Update focus flag on any blur/focus event
    this.isFocused = (type === TabEventType.TAB_FOCUS);

    const ev: TabEvent = {
      id: `${now.getTime()}-${type}`,
      type,
      timestamp: now,
      url: window.location.href,
      domain,
      title: document.title,
      isVisible: !document.hidden,
      sessionId: undefined
    };

    this.events.push(ev);
    this.tabEvents$.next([...this.events]);
    this.lastTime = now;
  }

  /** Reset tracking counters and buffers */
  private reset(): void {
    this.lastTime     = null;
    this.isFocused    = true;
    this.switchCount  = 0;
    this.events       = [];
    this.tabSwitches$.next(0);
    this.tabEvents$.next([]);
  }

  /** Clean up RxJS subscriptions */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}







