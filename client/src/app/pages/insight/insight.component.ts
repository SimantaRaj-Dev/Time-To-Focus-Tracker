// src/app/pages/insight/insight.component.ts
import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import Chart, { TooltipItem } from 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import { DbService } from '../../services/db.service';
import { FocusSession } from '../../models/focus-session.model';

interface GanttDatum {
  x: [Date, Date];
  y: number;
  label: string;
  backgroundColor: string;
}

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
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
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

    // Pie Chart
    const focusedInSeconds = this.session.focusedTimeInSeconds;
    const distractedInSeconds = this.session.distractedTimeInSeconds;
    const pieCtx = document.getElementById('focusPie') as HTMLCanvasElement;
    new Chart(pieCtx, {
      type: 'pie',
      data: {
        labels: ['Focused', 'Distracted'],
        datasets: [{ data: [focusedInSeconds, distractedInSeconds], backgroundColor: ['#4ade80', '#f87171'] }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#9E9E9E' }
          },
          tooltip: {
            titleColor: '#9E9E9E',
            bodyColor: '#9E9E9E'
          }
        }
      }
    });

    // Gantt Chart (as horizontal bar chart)
    const events = this.session.tabEvents || [];
    if (events.length > 1) {
      const cleanEvents = events.filter(e => !!e.domain);  // Filter out undefined domains
      const domains = Array.from(new Set(cleanEvents.map(e => e.domain)));
      const dataset: GanttDatum[] = cleanEvents.slice(0, -1).map((e, i) => ({
        x: [e.timestamp, cleanEvents[i + 1].timestamp],
        y: domains.indexOf(e.domain),
        label: e.domain,
        backgroundColor: '#f87171'
      }));
      const ganttCtx = document.getElementById('tabGantt') as HTMLCanvasElement;
      new Chart<'bar', GanttDatum[], number>(ganttCtx, {
        type: 'bar',
        data: { datasets: [{ label: 'Tab Activity', data: dataset, barThickness: 12, grouped: false }] },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { 
              type: 'time', 
              time: { unit: 'minute' },
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
            tooltip: {
              callbacks: {
                label(context: TooltipItem<'bar'>) {
                  const raw = context.raw as GanttDatum;
                  const [start, end] = raw.x;
                  const durationMin = Math.round((end.getTime() - start.getTime()) / 60000);
                  return `${raw.label}: ${durationMin} min`;
                }
              },
              titleColor: '#9E9E9E',
              bodyColor: '#9E9E9E'
            }
          }
        }
      });
    }
  }

  public back(): void {
    this.router.navigate(['/history']);
  }
}


