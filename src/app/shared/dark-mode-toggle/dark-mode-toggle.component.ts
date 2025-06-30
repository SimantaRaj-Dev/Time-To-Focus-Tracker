import { Component, Inject, PLATFORM_ID, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-dark-mode-toggle',
  standalone: true,
  templateUrl: './dark-mode-toggle.component.html',
  styleUrls: ['./dark-mode-toggle.component.scss']
})
export class DarkModeToggleComponent implements OnInit {
  isDarkMode = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = localStorage.getItem('theme');
      this.isDarkMode = savedTheme === 'dark';
      if (this.isDarkMode) {
        document.getElementById('html-root')?.classList.add('dark');
      }
    }
  }

  toggleDarkMode(event: Event) {
    if (!isPlatformBrowser(this.platformId)) return;

    const checked = (event.target as HTMLInputElement).checked;
    this.isDarkMode = checked;

    const htmlEl = document.getElementById('html-root');
    if (checked) {
      htmlEl?.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      htmlEl?.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }
}

