import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FocusSessionService } from '../../services/focus-session.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  task = '';
  domainsInput = '';

  constructor(
    private svc: FocusSessionService,
    private router: Router
  ) {}

  async onStart(): Promise<void> {
    if (!this.task.trim()) return;
    const doms = this.domainsInput
      .split(',')
      .map(d => d.trim())
      .filter(Boolean);
    await this.svc.startSession(this.task, doms);
    this.router.navigate(['/insights']);
  }
}


