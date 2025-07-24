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
  private focusedInSeconds = 0;
  private distractedInSeconds = 0;
  private lastTime: Date | null = null;
  private isFocused = true;
  private events: TabEvent[] = [];
  private focusedToDistractedTabSwitches = 0;
  private distractedToFocusedTabSwitches = 0;
  private focusedToFocusedTabSwitches = 0;
  private distractedToDistractedTabSwitches = 0;
  private totalTabSwitches = 0;
  private previousDomain: string | null = null;
  private destroy$ = new Subject<void>();

  public tabEvents$ = new BehaviorSubject<TabEvent[]>([]);
  public isTracking$ = new BehaviorSubject<boolean>(false);
  public extensionReady$ = new BehaviorSubject<boolean>(false);

  public totalTabSwitches$ = new BehaviorSubject<number>(0);

  constructor(
    private domainsSvc: FocusDomainsService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      // 1) Register message listener immediately
      this.handleExtensionMessages = this.handleExtensionMessages.bind(this);
      window.addEventListener('message', this.handleExtensionMessages);

      // 2) Initialize native listeners
      this.initListeners();

      // 3) Delayed ping to extension
      setTimeout(() => {
        console.log('[TabTrackingService] sending PING_EXTENSION');
        window.postMessage({ type: 'PING_EXTENSION' }, '*');
      }, 200);
    }
  }

  private initListeners(): void {
    fromEvent(document, 'visibilitychange')
      .pipe(filter(() => this.tracking), takeUntil(this.destroy$))
      .subscribe(() => {
        const type = document.hidden ? TabEventType.TAB_BLUR : TabEventType.TAB_FOCUS;
        this.handleEvent(type, window.location.hostname);
      });

    fromEvent(window, 'focus')
      .pipe(filter(() => this.tracking), takeUntil(this.destroy$))
      .subscribe(() => {
        this.handleEvent(TabEventType.WINDOW_FOCUS, window.location.hostname);
      });

    fromEvent(window, 'blur')
      .pipe(filter(() => this.tracking), takeUntil(this.destroy$))
      .subscribe(() => {
        this.handleEvent(TabEventType.WINDOW_BLUR, window.location.hostname);
      });
  }

  private handleExtensionMessages(evt: MessageEvent): void {
    const msg = evt.data;
    if (msg?.type === 'PING_EXTENSION') return;

    if (msg?.type === 'EXTENSION_INVALIDATED') {
      console.error('[TabTrackingService] Extension context invalidated. Reloading page...');
      // Optional: Alert user or auto-reload.
      location.reload();
    }

    if (msg?.type === 'EXTENSION_READY') {
      console.log('[TabTrackingService] EXTENSION_READY received');
      this.extensionReady$.next(true);
    }
    if (msg?.type === 'EXTENSION_TAB_EVENT' && this.tracking) {
      this.processExtensionEvent(msg.detail);
    }
  }

  private processExtensionEvent(detail: any): void {
    const comingFromFocusedTab = this.domainsSvc.isWhitelisted(detail.fromDomain);
    const goingToFocusedTab   = this.domainsSvc.isWhitelisted(detail.toDomain);

    if (detail.type === 'TAB_SWITCH') {
      this.totalTabSwitches++;
      this.totalTabSwitches$.next(this.totalTabSwitches);

      if (comingFromFocusedTab && !goingToFocusedTab) {
        this.focusedToDistractedTabSwitches++;
      } else if (!comingFromFocusedTab && goingToFocusedTab) {
        this.distractedToFocusedTabSwitches++;
      } else if (comingFromFocusedTab && goingToFocusedTab) {
        this.focusedToFocusedTabSwitches++;
      } else {
        this.distractedToDistractedTabSwitches++;
      }
    }

    let eventType: TabEventType;

    if (goingToFocusedTab) {
      eventType = detail.type === 'WINDOW_FOCUS'
        ? TabEventType.WINDOW_FOCUS
        : TabEventType.TAB_FOCUS;
    } else {
      eventType = TabEventType.TAB_BLUR;
    }

    this.handleEvent(eventType, detail.toDomain, detail.timestamp);
  }

  private handleEvent(eventType: TabEventType, domain?: string, timestamp?: number): void {
    const currentTimestamp = timestamp ? new Date(timestamp) : new Date();
    const activeDomain = domain || window.location.hostname;
    const isCurrentTabFocused = this.domainsSvc.isWhitelisted(activeDomain);
    const isPreviousTabFocused = this.domainsSvc.isWhitelisted(this.previousDomain || activeDomain);

    if (this.lastTime) {
      const elapsedSeconds = (currentTimestamp.getTime() - this.lastTime.getTime()) / 1000;
      this.updateFocusDurations(elapsedSeconds, isCurrentTabFocused, isPreviousTabFocused);
    }
  
    // Determine new focus state *after* processing previous delta
    this.isFocused = (
      eventType === TabEventType.TAB_FOCUS ||
      eventType === TabEventType.WINDOW_FOCUS ||
      eventType === TabEventType.SESSION_START
    ) && isCurrentTabFocused;

    const tabEvent: TabEvent = {
      id: `${currentTimestamp.getTime()}-${eventType}`,
      type: eventType,
      timestamp: currentTimestamp,
      url: activeDomain.startsWith('http') ? activeDomain : `https://${activeDomain}`,
      domain: activeDomain,
      title: document.title,
      isVisible: document.visibilityState === 'visible',
    };

    this.events.push(tabEvent);
    this.tabEvents$.next([...this.events]);
    this.lastTime = currentTimestamp;
    this.previousDomain = activeDomain;
  }

  private updateFocusDurations(timeElapsed: number, isCurrentTabFocused: boolean, isPreviousTabFocused: boolean): void {
    if (isCurrentTabFocused === isPreviousTabFocused) {
      if (isCurrentTabFocused) {
        this.focusedInSeconds += timeElapsed;
      } else {
        this.distractedInSeconds += timeElapsed;
      }
    } else {
      if (!isCurrentTabFocused && isPreviousTabFocused) {
        this.focusedInSeconds += timeElapsed;
      } else {
        this.distractedInSeconds += timeElapsed;
      }
    }
  }


  private reset(): void {
    this.lastTime = null;
    this.isFocused = true;
    this.totalTabSwitches = 0;
    this.focusedToDistractedTabSwitches = 0;
    this.distractedToFocusedTabSwitches = 0;
    this.focusedToFocusedTabSwitches = 0;
    this.distractedToDistractedTabSwitches = 0;
    this.focusedInSeconds = 0;
    this.distractedInSeconds = 0;
    this.events = [];
    this.totalTabSwitches$.next(0);
    this.tabEvents$.next([]);
    console.log('[TabTrackingService] reset state');
  }

  public start(): void {
    if (!this.isBrowser) return;

    this.reset();
    this.tracking = true;
    this.isTracking$.next(true);

    if (this.extensionReady$.value) {
      console.log('[TabTrackingService] sending START_TRACKING');
      window.postMessage({ 
        type: 'START_TRACKING',
        payload: {
          currentDomain: window.location.hostname
        }
      }, '*');
    } else {
      console.warn('[TabTrackingService] extension not ready');
    }

    this.handleEvent(TabEventType.SESSION_START, window.location.hostname);
  }

  public stop(): void {
    if (!this.isBrowser) return;

    this.handleEvent(TabEventType.SESSION_END, window.location.hostname);
    this.tracking = false;
    this.isTracking$.next(false);

    if (this.extensionReady$.value) {
      console.log('[TabTrackingService] sending STOP_TRACKING');
      window.postMessage({ type: 'STOP_TRACKING' }, '*');
    }
  }

  public getEvents(): TabEvent[] {
    return [...this.events];
  }

  public getFocusedTimeInSeconds(): number {
    return this.focusedInSeconds;
  }

  public getDistractedTimeInSeconds(): number {
    return this.distractedInSeconds;
  }

  public getTotalTabSwitches(): number {
    return this.totalTabSwitches;
  }

  public getFocusedToDistractedTabSwitches(): number {
    return this.focusedToDistractedTabSwitches;
  }

  public getDistractedToFocusedTabSwitches(): number {
    return this.distractedToFocusedTabSwitches;
  }

  public getFocusedToFocusedTabSwitches(): number {
    return this.focusedToFocusedTabSwitches;
  }

  public getDistractedToDistractedTabSwitches(): number {
    return this.distractedToDistractedTabSwitches;
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      window.removeEventListener('message', this.handleExtensionMessages);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}







