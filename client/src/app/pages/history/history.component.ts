import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { FocusSessionService } from '../../services/focus-session.service';
import { FocusSession } from '../../models/focus-session.model';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, ScrollingModule],
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit {
  sessions: FocusSession[] = [];

  constructor(private fs: FocusSessionService) {}

  ngOnInit(): void {
    this.fs.history$.subscribe(arr => this.sessions = arr);
  }
}



