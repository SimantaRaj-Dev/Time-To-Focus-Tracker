import { Component, OnInit } from '@angular/core';
import { FocusSessionService } from '../../services/focus-session.service';
import { FocusSession } from '../../models/focus-session.model';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {
  sessions: FocusSession[] = [];

  constructor(private fs: FocusSessionService) {}

  ngOnInit(): void {
    this.fs.historySessions$.subscribe((arr: FocusSession[]) => {
      this.sessions = arr.sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );
    });
  }
}


