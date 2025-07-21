// client/src/app/services/tab-tracking.service.ts
import { Injectable, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, fromEvent, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class TabTrackingService implements OnDestroy {
  private isTracking = new BehaviorSubject<boolean>(false);
  private tabSwitches = new BehaviorSubject<number>(0);
  private currentTabVisible = new BehaviorSubject<boolean>(true);
  private destroy$ = new Subject<void>();
  private isBrowser: boolean;

  isTracking$ = this.isTracking.asObservable();
  tabSwitches$ = this.tabSwitches.asObservable();
  currentTabVisible$ = this.currentTabVisible.asObservable();

  constructor(
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      this.listenVisibility();
      this.listenFocusBlur();
    }
  }

  startTracking() {
    if (!this.isBrowser) return;
    this.tabSwitches.next(0);
    this.isTracking.next(true);
  }

  stopTracking() {
    if (!this.isBrowser) return;
    this.isTracking.next(false);
  }

  private listenVisibility() {
    fromEvent(document, 'visibilitychange')
      .pipe(
        filter(() => this.isTracking.value),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        const visible = document.visibilityState === 'visible';
        this.currentTabVisible.next(visible);
        if (!visible) this.incrementSwitch();
      });
  }

  private listenFocusBlur() {
    fromEvent(window, 'blur')
      .pipe(
        filter(() => this.isTracking.value),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.incrementSwitch());

    fromEvent(window, 'focus')
      .pipe(
        filter(() => this.isTracking.value),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.currentTabVisible.next(true));
  }

  private incrementSwitch() {
    this.tabSwitches.next(this.tabSwitches.value + 1);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

