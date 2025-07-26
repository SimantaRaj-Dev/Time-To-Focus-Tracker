// src/app/pages/insight/insight.component.ts
import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import Chart, { TooltipItem } from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import { DbService } from '../../services/db.service';
import { FocusSession } from '../../models/focus-session.model';
import { TabEvent } from '../../models/tab-event.model';

@Component({
  selector: 'app-insight',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './insight.component.html',
  styleUrls: ['./insight.component.scss']
})
export class InsightComponent implements OnInit {
  public session?: FocusSession;
  public error: string | null = null;
  public loading = true;
  private isBrowser: boolean;

  constructor(
    private route: ActivatedRoute,
    private db: DbService,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      this.loading = false;
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'No session ID provided.';
      this.loading = false;
      return;
    }

    this.db.getById(id)
      .then(sess => {
        if (!sess) {
          this.error = `Session "${id}" not found.`;
        } else {
          this.session = sess;
          setTimeout(() => this.renderCharts(), 0);
        }
      })
      .catch(() => this.error = 'Failed to load session data.')
      .finally(() => this.loading = false);
  }

  private renderCharts(): void {
    if (!this.session) return;

    this.renderFocusPieChart();
    this.renderTabGanttChart();
    this.renderTabDistributionPieChart();
    this.renderTabSwitchesBarChart();
  }

  // Existing Pie Chart: Focused vs Distracted Time
  private renderFocusPieChart(): void {
    const focusedSec = this.session?.focusedTimeInSeconds;
    const distractedSec = this.session?.distractedTimeInSeconds;
    const pieCtx = document.getElementById('focusPie') as HTMLCanvasElement;
    new Chart(pieCtx, {
      type: 'pie',
      data: {
        labels: ['Focused', 'Distracted'],
        datasets: [{
          data: [focusedSec, distractedSec],
          backgroundColor: ['#4ade80', '#f87171']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#9E9E9E' } },
          tooltip: {
            titleColor: '#9E9E9E',
            bodyColor: '#9E9E9E'
          }
        }
      }
    });
  }

  // Existing Timeline-as-bar Gantt Chart
  private renderTabGanttChart(): void {
    const events = this.session?.tabEvents || [];
    if (events.length <= 1) return;

    // 1. Build a cleaned sequence of significant events: session_start, distinct tab_focus events, and session_end
    const significantEvents = [];
    const sessionStart = events.find(e => e.type === 'session_start');
    if (sessionStart) {
      significantEvents.push(sessionStart);
    }

    let lastPushedDomain = sessionStart?.domain?.replace(/^www\./i, '').trim().toLowerCase();

    for (const event of events) {
      if (event.type === 'tab_focus') {
        const currentDomain = event.domain?.replace(/^www\./i, '').trim().toLowerCase();
        if (currentDomain && currentDomain !== lastPushedDomain) {
          significantEvents.push(event);
          lastPushedDomain = currentDomain;
        }
      }
    }

    const sessionEnd = events.find(e => e.type === 'session_end');
    if (sessionEnd) {
      significantEvents.push(sessionEnd);
    }

    // 2. Normalize domains and filter out invalid domains
    const clean = significantEvents
      .map(e => ({
        timestamp: e.timestamp,
        domain: e.domain?.replace(/^www\./i, '').trim().toLowerCase() || ''
      }))
      .filter(e => e.domain);

    // 3. Build array of unique domains in order of first occurrence
    const domains: string[] = [];
    for (const e of clean) {
      if (!domains.includes(e.domain)) {
        domains.push(e.domain);
      }
    }

    // 4. Prepare data for chart - each data point uses domain string for y
    const dataPoints: { x: [Date, Date]; y: string }[] = [];
    const barColors: string[] = [];

    let sliceStart = clean[0].timestamp;
    let sliceDomain = clean[0].domain;

    for (let i = 1; i < clean.length; i++) {
      const currentEvent = clean[i];
      // If domain changed, close previous slice
      if (currentEvent.domain !== sliceDomain) {
        dataPoints.push({ x: [sliceStart, currentEvent.timestamp], y: sliceDomain });

        const isFocused = this.session!.focusDomains
          .map(d => d.replace(/^www\./i, '').trim().toLowerCase())
          .includes(sliceDomain);
        barColors.push(isFocused ? '#4ade80' : '#f87171');

        // Start new slice on new domain
        sliceStart = currentEvent.timestamp;
        sliceDomain = currentEvent.domain;
      }
    }

    // Close last slice if it has time duration
    const last = clean[clean.length - 1];
    if (last.timestamp > sliceStart) {
      dataPoints.push({ x: [sliceStart, last.timestamp], y: sliceDomain });

      const isFocused = this.session!.focusDomains
        .map(d => d.replace(/^www\./i, '').trim().toLowerCase())
        .includes(sliceDomain);
      barColors.push(isFocused ? '#4ade80' : '#f87171');
    }

    // 5. Legend config
    const legendLabels = ['Focused', 'Distracted'];
    const legendColors = ['#4ade80', '#f87171'];

    // 6. Create the chart with parsing disabled and y using domain strings
    const ctx = document.getElementById('tabGantt') as HTMLCanvasElement;
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: domains,
        datasets: [{
          label: 'Focused vs. Distracted',
          data: dataPoints,
          backgroundColor: barColors,
          borderColor: barColors,
          borderWidth: 1,
          barThickness: 12,
          grouped: false
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: { unit: 'minute' },
            min: clean[0]?.timestamp.getTime(),
            max: clean[clean.length - 1]?.timestamp.getTime(),
            ticks: { color: '#9E9E9E' },
            grid: { color: '#696969' }
          },
          y: {
            type: 'category',
            labels: domains,
            ticks: { color: '#9E9E9E' },
            grid: { color: '#696969', drawTicks: false }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: '#9E9E9E',
              usePointStyle: true,
              generateLabels: chart =>
                legendLabels.map((text, idx) => ({
                  text,
                  fillStyle: legendColors[idx],
                  hidden: false,
                  datasetIndex: 0,
                  index: idx
                }))
            }
          },
          tooltip: {
            titleColor: '#9E9E9E',
            bodyColor: '#9E9E9E',
            callbacks: {
              title: items => {
                const barBackbgroundColor = (items[0].dataset.backgroundColor as string[])[items[0].dataIndex];
                return barBackbgroundColor === '#4ade80' ? 'Focused' : 'Distracted';
              },
              label: ctx => {
                const { x: [start, end], y } = ctx.raw as any;
                const mins = Math.round((end.getTime() - start.getTime()) / 60000);
                return `${y}: ${mins} min`;
              }
            }
          }
        }
      }
    });
  }

  // New Pie Chart: Percentage Distribution of Visited Tabs by Seconds, Focused vs Distracted
  private renderTabDistributionPieChart(): void {
    if (!this.session) return;

    const normalizedFocusDomains = this.session.focusDomains.map(d => d.replace(/^www\./i, '').trim().toLowerCase());

    // Aggregate time per domain from tabEvents
    const domainTimes = new Map<string, number>();
    const events = this.session.tabEvents || [];
    let totalSeconds = 0;

    for (let i = 0; i < events.length - 1; i++) {
      const current = events[i];
      const next = events[i + 1];
      const domain = current.domain?.replace(/^www\./i, '').trim().toLowerCase();
      if (!domain) continue;

      const durationSec = (next.timestamp.getTime() - current.timestamp.getTime()) / 1000;
      if (durationSec > 0) {
        totalSeconds += durationSec;
        domainTimes.set(domain, (domainTimes.get(domain) || 0) + durationSec);
      }
    }

    // Prepare pie data
    const labels: string[] = [];
    const data: number[] = [];
    const backgroundColors: string[] = [];

    domainTimes.forEach((seconds, domain) => {
      labels.push(domain);
      data.push(seconds);
      backgroundColors.push(normalizedFocusDomains.includes(domain) ? '#4ade80' : '#f87171');
    });

    const pieCtx = document.getElementById('tabDistributionPie') as HTMLCanvasElement;
    if (!pieCtx) return;

    new Chart(pieCtx, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: backgroundColors
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#9E9E9E' } },
          tooltip: {
            callbacks: {
              label: ctx => {
                const label = ctx.label || '';
                const value = ctx.parsed || 0;
                const percent = ((value / totalSeconds) * 100).toFixed(1);
                return `${label}: ${Math.round(value)} sec (${percent}%)`;
              }
            },
            titleColor: '#9E9E9E',
            bodyColor: '#9E9E9E'
          }
        }
      }
    });
  }

  // New Bar Chart: Frequency of Different Types of Tab Switches
  private renderTabSwitchesBarChart(): void {
    if (!this.session) return;

    const labels = [
      'Focused to Focused',
      'Focused to Distracted',
      'Distracted to Focused',
      'Distracted to Distracted'
    ];

    const dataValues = [
      this.session.focusedToFocusedTabSwitches ?? 0,
      this.session.focusedToDistractedTabSwitches ?? 0,
      this.session.distractedToFocusedTabSwitches ?? 0,
      this.session.distractedToDistractedTabSwitches ?? 0
    ];

    const backgroundColors = [
      '#4ade80', // Focused to Focused
      '#f87171', // Focused to Distracted
      '#fbbf24', // Distracted to Focused (amber)
      '#ef4444'  // Distracted to Distracted (dark red)
    ];

    const barCtx = document.getElementById('tabSwitchesBar') as HTMLCanvasElement;
    if (!barCtx) return;

    new Chart(barCtx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Tab Switch Frequency',
          data: dataValues,
          backgroundColor: backgroundColors
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#9E9E9E' }
          },
          x: {
            ticks: { color: '#9E9E9E' }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.parsed.y} switches`
            },
            titleColor: '#9E9E9E',
            bodyColor: '#9E9E9E'
          }
        }
      }
    });
  }

  public back(): void {
    this.router.navigate(['/history']);
  }
}