// src/app/pages/history/history.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { Router } from '@angular/router';
import { FocusSessionService } from '../../services/focus-session.service';
import { map, Observable } from 'rxjs';
interface HistoryView {
  id: string;
  taskName: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  tabSwitches: number;
  focusPercentage: number;
}

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, ScrollingModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {
  sessions$!: Observable<HistoryView[]>;

  constructor(
    private fs: FocusSessionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.sessions$ = this.fs.history$.pipe(
      map(arr => arr
        .filter(s => s.status === 'completed' && s.startTime && s.endTime)
        .map(s => {
          const start = new Date(s.startTime);
          const end = new Date(s.endTime!);
          const durationSec = (end.getTime() - start.getTime()) / 1000;
          const durationMin = Math.round(durationSec / 60);
          const focusPct = durationSec > 0
            ? Math.round((s.focusedTimeInSeconds / durationSec) * 100)
            : 0;
          return {
            id: s.id!,
            taskName: s.taskName,
            startTime: start,
            endTime: end,
            durationMinutes: durationMin,
            tabSwitches: s.totalTabSwitches,
            focusPercentage: focusPct
          };
        })
      )
    );
  }

  viewInsights(id: string): void {
    this.router.navigate(['/insights', id]);
  }
}