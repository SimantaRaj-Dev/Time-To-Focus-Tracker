// client/src/app/services/focus-domains.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export interface FocusDomain {
  id: string;
  domain: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  color?: string;
  category?: string;
}

@Injectable({ providedIn: 'root' })
export class FocusDomainsService {
  private readonly KEY = 'focus-domains';
  private domainsSub$ = new BehaviorSubject<FocusDomain[]>([]);
  public  domains$    = this.domainsSub$.asObservable();
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      const raw = localStorage.getItem(this.KEY);
      if (raw) this.domainsSub$.next(JSON.parse(raw));
    }
  }

  list(): FocusDomain[] {
    return [...this.domainsSub$.value];
  }

  getDomains(): FocusDomain[] {
    return [...this.domainsSub$.value];
  }

  normalizeDomain(input: string): string {
    return input.trim().toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];
  }

  add(domain: string, name?: string): void {
    if (!this.isBrowser) return;
    const d = this.normalizeDomain(domain);
    if (!this.domainsSub$.value.some(x => x.domain === d)) {
      const fd: FocusDomain = {
        id: `${Date.now()}`,
        domain: d,
        name: name || d,
        isActive: true,
        createdAt: new Date()
      };
      const arr = [...this.domainsSub$.value, fd];
      this.domainsSub$.next(arr);
      localStorage.setItem(this.KEY, JSON.stringify(arr));
    }
  }

  remove(domain: string): void {
    if (!this.isBrowser) return;
    const d = this.normalizeDomain(domain);
    const arr = this.domainsSub$.value.filter(x => x.domain !== d);
    this.domainsSub$.next(arr);
    localStorage.setItem(this.KEY, JSON.stringify(arr));
  }

  clearDomains(): void {
    if (!this.isBrowser) return;
    this.domainsSub$.next([]);
    localStorage.removeItem(this.KEY);
    localStorage.removeItem('selectedDomains');
  }

  isFocusedTab(domain: string): boolean {
    return this.domainsSub$.value.some(x => x.domain === this.normalizeDomain(domain));
  }
}