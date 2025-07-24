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
  private focusedSeconds = 0;
  private distractedSeconds = 0;
  private lastTime: Date | null = null;
  private isFocused = true;
  private switchCount = 0;
  private events: TabEvent[] = [];
  private destroy$ = new Subject<void>();

  /** Emits the current number of tab switches */
  public tabSwitches$    = new BehaviorSubject<number>(0);
  /** Emits the current tab events */
  public tabEvents$      = new BehaviorSubject<TabEvent[]>([]);
  /** Emits the current tracking status */
  public isTracking$     = new BehaviorSubject<boolean>(false);
  /** Emits the current extension readiness status */
  public extensionReady$ = new BehaviorSubject<boolean>(false);

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
    console.log('[TabTrackingService] <<EVENT>>', msg);
    if (msg?.type === 'EXTENSION_TAB_EVENT') {
      console.log('[TabTrackingService] EXTENSION_TAB_EVENT received:', msg.detail);
    }
    if (msg?.type === 'PING_EXTENSION') return; // ignore self-ping

    console.log('[TabTrackingService] window.message →', msg);
    if (msg?.type === 'EXTENSION_READY') {
      console.log('[TabTrackingService] EXTENSION_READY received');
      this.extensionReady$.next(true);
    }
    if (msg?.type === 'EXTENSION_TAB_EVENT' && this.tracking) {
      console.log('[TabTrackingService] EXTENSION_TAB_EVENT →', msg.detail);
      this.processExtensionEvent(msg.detail);
    }
    if (msg?.type === 'EXTENSION_RESPONSE') {
      console.log('[TabTrackingService] EXTENSION_RESPONSE →', msg.detail);
    }
  }

  private processExtensionEvent(detail: any): void {
    console.log('[TabTrackingService] processExtensionEvent start', detail);
    const from = detail.fromDomain;
    const to   = detail.toDomain;
    const isFromWhite = this.domainsSvc.isWhitelisted(from);
    const isToWhite   = this.domainsSvc.isWhitelisted(to);
    console.log('[TabTrackingService] fromWhite?', isFromWhite, 'toWhite?', isToWhite);

    let eventType: TabEventType;

    if (detail.type === 'TAB_SWITCH') {
      // Count this as a switch if either domain is whitelisted
      if (isFromWhite || isToWhite) {
        this.switchCount++;
        console.log('[TabTrackingService] counted switch →', this.switchCount);
        this.tabSwitches$.next(this.switchCount);
      }

      // Map to focus or blur relative to your PWA tab
      if (to === window.location.hostname && isToWhite) {
        eventType = TabEventType.TAB_FOCUS;
      } else if (from === window.location.hostname && isFromWhite) {
        eventType = TabEventType.TAB_BLUR;
      } else {
        // A switch between two other whitelisted domains:
        // treat landing on the new domain as a focus event
        eventType = isToWhite
          ? TabEventType.TAB_FOCUS
          : TabEventType.TAB_BLUR;
      }
    } else {
      // leave existing handling for DOMAIN_CHANGE and WINDOW_FOCUS
      switch (detail.type) {
        case 'DOMAIN_CHANGE':
          eventType = TabEventType.DOMAIN_SWITCH;
          break;
        case 'WINDOW_FOCUS':
          eventType = TabEventType.WINDOW_FOCUS;
          break;
        default:
          console.warn('[TabTrackingService] Unknown event type', detail.type);
          return;
      }
    }

    console.log('[TabTrackingService] Mapped to', eventType);
    this.handleEvent(eventType, detail.toDomain, detail.timestamp);
  }



  public start(): void {
    console.log('[TabTrackingService] start()');
    if (!this.isBrowser) return;
    this.reset();
    this.tracking = true;
    this.isTracking$.next(true);
    if (this.extensionReady$.value) {
      console.log('[TabTrackingService] sending START_TRACKING');
      window.postMessage({ type: 'START_TRACKING' }, '*');
    } else {
      console.warn('[TabTrackingService] extension not ready');
    }
    this.handleEvent(TabEventType.SESSION_START, window.location.hostname);
  }

  public stop(): void {
    console.log('[TabTrackingService] stop()');
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

  public getFocusedSeconds(): number {
    return this.focusedSeconds;
  }

  public getDistractedSeconds(): number {
    return this.distractedSeconds;
  }

  private handleEvent(type: TabEventType, domain?: string, timestamp?: number): void {
  console.log('[TabTrackingService] handleEvent()', { type, domain, timestamp });
  const now = timestamp ? new Date(timestamp) : new Date();
  const evDomain = domain || window.location.hostname;
  const isWhite = this.domainsSvc.isWhitelisted(evDomain);
  console.log('[TabTrackingService] Domain check:', evDomain, 'whitelisted?', isWhite);

  // Calculate elapsed time since last event
  if (this.lastTime) {
    const delta = (now.getTime() - this.lastTime.getTime()) / 1000; // seconds
    if (this.isFocused && isWhite) {
      this.focusedSeconds += delta;
    } else {
      this.distractedSeconds += delta;
    }
  }

  // Update focus state
  this.isFocused = (type === TabEventType.TAB_FOCUS || type === TabEventType.WINDOW_FOCUS);

  // Record the event
  const ev: TabEvent = {
    id: `${now.getTime()}-${type}`,
    type,
    timestamp: now,
    url: evDomain.startsWith('http') ? evDomain : `https://${evDomain}`,
    domain: evDomain,
    title: document.title,
    isVisible: document.visibilityState === 'visible',
    sessionId: undefined
  };
  this.events.push(ev);
  this.tabEvents$.next([...this.events]);
  this.lastTime = now;

  console.log('[TabTrackingService] updated times → focused:', this.focusedSeconds, 'distracted:', this.distractedSeconds);
}

  private reset(): void {
    this.lastTime = null;
    this.isFocused = true;
    this.switchCount = 0;
    this.events = [];
    this.tabSwitches$.next(0);
    this.tabEvents$.next([]);
    console.log('[TabTrackingService] reset state');
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      window.removeEventListener('message', this.handleExtensionMessages);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
}







