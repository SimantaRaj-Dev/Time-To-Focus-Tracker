import { Injectable } from '@angular/core';
import { TabTrackingService } from './tab-tracking.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly THRESHOLD = 30 * 60 * 1000;
  private intervalId?: number;

  constructor(private tabs: TabTrackingService) {}

  startMonitoring() {
    this.requestPermission();
    this.intervalId = window.setInterval(() => {
      if (document.visibilityState==='visible' && this.tabs.isTracking$.value) {
        // no direct inactivity API: omitted for brevity MVP
      }
    }, 60000);
  }

  stopMonitoring() {
    if (this.intervalId) window.clearInterval(this.intervalId);
  }

  private async requestPermission() {
    if ('Notification' in window && Notification.permission==='default') {
      await Notification.requestPermission();
    }
  }
}

