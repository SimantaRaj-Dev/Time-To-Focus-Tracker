import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { FocusSessionService } from '../../services/focus-session.service';
import { TabTrackingService } from '../../services/tab-tracking.service';
import { FocusSession } from '../../models/focus-session.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-insight',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './insight.component.html',
  styleUrls: ['./insight.component.scss']
})
export class InsightComponent implements OnInit, OnDestroy {
  session: FocusSession | null = null;
  duration = 0;
  switches = 0;
  visible = true;
  private destroy$ = new Subject<void>();

  constructor(
    private fs: FocusSessionService,
    private tabs: TabTrackingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fs.currentSession$
      .pipe(takeUntil(this.destroy$))
      .subscribe(s => {
        if (!s) this.router.navigate(['/']);
        this.session = s;
      });

    this.tabs.tabSwitches$
      .pipe(takeUntil(this.destroy$))
      .subscribe(n => (this.switches = n));

    this.tabs.currentTabVisible$
      .pipe(takeUntil(this.destroy$))
      .subscribe(v => (this.visible = v));

    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.session) {
          this.duration = Math.floor(
            (Date.now() - new Date(this.session.startTime).getTime()) / 60000
          );
        }
      });
  }

  async onEnd(): Promise<void> {
    await this.fs.endSession();
    this.router.navigate(['/history']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

