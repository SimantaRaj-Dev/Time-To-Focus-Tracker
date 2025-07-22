import {
  Component,
  OnInit,
  OnDestroy,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { FocusSessionService } from '../../services/focus-session.service';
import { TabTrackingService } from '../../services/tab-tracking.service';
import { FocusSession } from '../../models/focus-session.model';
import { FocusDomainSelectorComponent } from './focus-domain-selector/focus-domain-selector/focus-domain-selector.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, FocusDomainSelectorComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  task = '';
  selectedDomains: string[] = [];
  session: FocusSession | null = null;
  elapsedMinutes = 0;
  tabSwitches = 0;
  private timerSub?: Subscription;
  private tabSub?: Subscription;
  private isBrowser: boolean;

  constructor(
    private sessionSvc: FocusSessionService,
    private tabSvc: TabTrackingService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.sessionSvc.currentSession$
      .subscribe((s: FocusSession | null) => {
        this.session = s;
        if (s && this.isBrowser) {
          this.startTimer(s.startTime);
          this.tabSub = this.tabSvc.tabSwitches$
            .subscribe((n: number) => this.tabSwitches = n);
        } else {
          this.stopTimer();
          this.tabSub?.unsubscribe();
          this.elapsedMinutes = this.tabSwitches = 0;
        }
      });
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.tabSub?.unsubscribe();
  }

  onDomainsSelected(domains: string[]): void {
    this.selectedDomains = domains;
  }

  async onStart(): Promise<void> {
    if (!this.task.trim() || this.selectedDomains.length === 0) return;
    await this.sessionSvc.startSession(this.task, this.selectedDomains);
    this.router.navigate(['/insights']);
  }

  async onEnd(): Promise<void> {
    await this.sessionSvc.endSession();
    this.router.navigate(['/history']);
  }

  private startTimer(start: Date): void {
    this.stopTimer();
    this.elapsedMinutes = Math.floor((Date.now() - start.getTime()) / 60000);
    this.timerSub = interval(60000).subscribe(() => this.elapsedMinutes++);
  }

  private stopTimer(): void {
    this.timerSub?.unsubscribe();
    this.timerSub = undefined;
  }
}









