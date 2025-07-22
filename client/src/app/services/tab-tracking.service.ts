import { Injectable, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, fromEvent, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class TabTrackingService implements OnDestroy {
  private isTracking = new BehaviorSubject<boolean>(false);
  private tabSwitches = new BehaviorSubject<number>(0);
  private currentVisible = new BehaviorSubject<boolean>(true);
  private destroy$ = new Subject<void>();
  private isBrowser: boolean;

  isTracking$ = this.isTracking.asObservable();
  tabSwitches$ = this.tabSwitches.asObservable();
  currentTabVisible$ = this.currentVisible.asObservable();

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      fromEvent(document, 'visibilitychange')
        .pipe(filter(() => this.isTracking.value), takeUntil(this.destroy$))
        .subscribe(() => {
          const vis = document.visibilityState === 'visible';
          this.currentVisible.next(vis);
          if (!vis) this.switchIncrement();
        });
      fromEvent(window, 'blur')
        .pipe(filter(() => this.isTracking.value), takeUntil(this.destroy$))
        .subscribe(() => this.switchIncrement());
      fromEvent(window, 'focus')
        .pipe(filter(() => this.isTracking.value), takeUntil(this.destroy$))
        .subscribe(() => this.currentVisible.next(true));
    }
  }

  startTracking(): void {
    if (!this.isBrowser) return;
    this.tabSwitches.next(0);
    this.isTracking.next(true);
  }

  stopTracking(): void {
    if (!this.isBrowser) return;
    this.isTracking.next(false);
  }

  private switchIncrement(): void {
    this.tabSwitches.next(this.tabSwitches.value + 1);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}


