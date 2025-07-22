// src/app/pages/insight/insight.component.ts

import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { FocusSessionService } from '../../services/focus-session.service';
import {
  FocusSession,
  toFocusedMinutes,
  toDistractedMinutes
} from '../../models/focus-session.model';
import { ChartOptions, ChartData } from 'chart.js';

@Component({
  selector: 'app-insight',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './insight.component.html',
  styleUrls: ['./insight.component.scss']
})
export class InsightComponent implements OnInit {
  sessions: FocusSession[] = [];
  lineData?: ChartData<'line'>;
  pieData?: ChartData<'pie'>;
  chartOpts: ChartOptions = { responsive: true };
  isBrowser: boolean;

  constructor(
    private fs: FocusSessionService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.fs.history$.subscribe((list: FocusSession[]) => {
      // filter only completed sessions
      const completed = list.filter(s => s.status === 'completed');
      // take last 7 or fewer
      this.sessions = completed.slice(-7);

      if (this.isBrowser && this.sessions.length > 0) {
        this.initializeCharts();
      } else {
        // clear chart data if no sessions
        this.lineData = undefined;
        this.pieData = undefined;
      }
    });
  }

  private initializeCharts(): void {
    const labels = this.sessions.map(s =>
      s.startTime.toLocaleDateString()
    );
    const focused = this.sessions.map(s => toFocusedMinutes(s));
    const distracted = this.sessions.map(s => toDistractedMinutes(s));

    this.lineData = {
      labels,
      datasets: [
        {
          data: focused,
          label: 'Focused (min)',
          borderColor: 'green',
          fill: false,
          tension: 0.3
        },
        {
          data: distracted,
          label: 'Distracted (min)',
          borderColor: 'red',
          fill: false,
          tension: 0.3
        }
      ]
    };

    const totalF = focused.reduce((sum, v) => sum + v, 0);
    const totalD = distracted.reduce((sum, v) => sum + v, 0);

    this.pieData = {
      labels: ['Focused', 'Distracted'],
      datasets: [
        {
          data: [totalF, totalD],
          backgroundColor: ['green', 'red']
        }
      ]
    };
  }
}


