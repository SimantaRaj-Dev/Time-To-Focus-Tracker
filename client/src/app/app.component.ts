import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DarkModeToggleComponent } from './shared/dark-mode-toggle/dark-mode-toggle.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, DarkModeToggleComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}
  toggleDarkMode() {
    if (isPlatformBrowser(this.platformId)) {
      const htmlEl = document.getElementById('html-root');
      htmlEl?.classList.toggle('dark');
      localStorage.setItem(
        'theme',
        htmlEl?.classList.contains('dark') ? 'dark' : 'light'
      );
    }
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        document.getElementById('html-root')?.classList.add('dark');
      }
    }
  }
}

