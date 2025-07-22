import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

export interface FocusDomain {
  id: string;
  domain: string;
  name: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class FocusDomainsService {
  private readonly KEY = 'focus-domains';
  private domains$ = new BehaviorSubject<FocusDomain[]>([]);
  domains = this.domains$.asObservable();
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    if (this.isBrowser) {
      const raw = localStorage.getItem(this.KEY);
      if (raw) this.domains$.next(JSON.parse(raw));
    }
  }

  /** Normalize domain strings consistently */
  public normalizeDomain(input: string): string {
    return input
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];
  }

  /** Add a new domain to storage */
  add(domain: string, name?: string) {
    if (!this.isBrowser) return;
    const norm = this.normalizeDomain(domain);
    if (!this.domains$.value.find(d => d.domain === norm)) {
      const fd: FocusDomain = {
        id: `${Date.now()}`,
        domain: norm,
        name: name || norm,
        isActive: true
      };
      this.set([...this.domains$.value, fd]);
    }
  }

  /** Expose current array of domains synchronously */
  public getDomains(): FocusDomain[] {
    return this.domains$.value;
  }

  /** Remove a domain by its identifier or domain string */
  public remove(domain: string): void {
    if (!this.isBrowser) return;
    const norm = this.normalizeDomain(domain);
    const filtered = this.domains$.value.filter(d => d.domain !== norm);
    this.set(filtered);
  }

  private set(arr: FocusDomain[]) {
    this.domains$.next(arr);
    if (this.isBrowser) {
      localStorage.setItem(this.KEY, JSON.stringify(arr));
    }
  }
}


