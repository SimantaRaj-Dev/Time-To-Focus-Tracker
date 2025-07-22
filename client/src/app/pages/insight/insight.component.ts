import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { FocusSessionService } from '../../services/focus-session.service';
import { FocusSession } from '../../models/focus-session.model';
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
  lineData!: ChartData<'line'>;
  pieData!: ChartData<'pie'>;
  chartOpts: ChartOptions = { responsive: true };
  isBrowser: boolean;

  constructor(
    private fs: FocusSessionService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.fs.history$.subscribe(list => {
      this.sessions = list.slice(-7);
      
      if (this.isBrowser) {
        this.initializeCharts();
      }
    });
  }

  private initializeCharts(): void {
    const labels = this.sessions.map(s => s.startTime.toLocaleDateString());
    const focused = this.sessions.map(s => s.focusedTimeMinutes || 0);
    const distracted = this.sessions.map(s => s.distractedTimeMinutes || 0);

    this.lineData = {
      labels,
      datasets: [
        { data: focused, label: 'Focused', borderColor: 'green', fill: false },
        { data: distracted, label: 'Distracted', borderColor: 'red', fill: false }
      ]
    };

    const totalF = focused.reduce((a,b)=>a+b,0);
    const totalD = distracted.reduce((a,b)=>a+b,0);
    this.pieData = {
      labels: ['Focused','Distracted'],
      datasets: [{ data: [totalF, totalD], backgroundColor: ['green','red'] }]
    };
  }
}


