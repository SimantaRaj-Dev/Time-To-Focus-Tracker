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
  public taskTitle = '';
  public selectedDomains: string[] = [];
  public activeSession: FocusSession | null = null;
  public extensionReady = false;
  public totalTabSwitchCount = 0;
  public elapsedSeconds = 0;

  private timerSubscription?: Subscription;
  private switchSubscription?: Subscription;
  private extSubscription?: Subscription;
  private isBrowser = false;

  constructor(
    private sessionService: FocusSessionService,
    private tracker: TabTrackingService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // Restore selected domains after page reload
    if (this.isBrowser) {
      // Restore selected domains after page reload
      const raw = localStorage.getItem('selectedDomains');
      if (raw) {
        try { this.selectedDomains = JSON.parse(raw); }
        catch { this.selectedDomains = []; }
      }

      // Subscribe to extension-ready flag
      this.extSubscription = this.tracker.extensionReady$
        .subscribe(flag => this.extensionReady = flag);
    }

    // Subscribe to current session
    this.sessionService.currentSession$
      .subscribe(session => {
        this.activeSession = session;
        this.resetTimerAndCount();

        if (session) {
          this.startTimer(session.startTime);
          this.switchSubscription = this.tracker.totalTabSwitches$
            .subscribe(n => this.totalTabSwitchCount = n);
        }
      });
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.switchSubscription?.unsubscribe();
  }

  onDomainsSelectionChange(domains: string[]): void {
    this.selectedDomains = domains;
  }

  get canStart(): boolean {
    return this.taskTitle.trim().length > 0 && this.selectedDomains.length > 0;
  }

  private promptExtensionInstall(): void{
    if (!this.extensionReady && this.isBrowser) {
      const ok = confirm(
        `We are sorry :( , Chrome extension is yet not published for this app. \n
        please visit github repository for this app to get the latest updates.`
      );
      if(ok) {
        window.open(
          'https://github.com/Simanta-Developer/Time-To-Focus-Tracker'
        )
      }
      // TODO: Replace the above snippet with the chrome extension prompt install link.
      // const ok = confirm(
      //   'To track every visited tab, please install our extension.\nInstall now?'
      // );
      // if (ok) {
      //   window.open(
      //     'https://chrome.google.com/webstore/detail/your-extension-id',
      //     '_blank'
      //   );
      // }
    }
  }

  async onStart(): Promise<void> {
    if (!this.canStart) return;
    if (!this.extensionReady) {
      this.promptExtensionInstall();
      return;
    } 
    await this.sessionService.startSession(this.taskTitle.trim(), this.selectedDomains);
  }

  async onEnd(): Promise<void> {
    await this.sessionService.endSession();
    this.router.navigate(['/history']);
  }

  // Expose formatted time as mm:ss or hh:mm:ss
  get elapsedDisplay(): string {
    const sec = this.elapsedSeconds % 60;
    const totalMin = Math.floor(this.elapsedSeconds / 60);
    const min = totalMin % 60;
    const hrs = Math.floor(totalMin / 60);
    const pad = (n: number) => n.toString().padStart(2, '0');

    return hrs > 0
      ? `${pad(hrs)}:${pad(min)}:${pad(sec)}`
      : `${pad(min)}:${pad(sec)}`;
  }

  private startTimer(startTime: Date): void {
    this.stopTimer();
    // initialize elapsedSeconds based on startTime
    this.elapsedSeconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
    // tick every second
    this.timerSubscription = interval(1000).subscribe(() => this.elapsedSeconds++);
  }

  private stopTimer(): void {
    this.timerSubscription?.unsubscribe();
    this.timerSubscription = undefined;
  }

  private resetTimerAndCount(): void {
    this.stopTimer();
    this.switchSubscription?.unsubscribe();
    this.elapsedSeconds = this.totalTabSwitchCount = 0;
  }
}