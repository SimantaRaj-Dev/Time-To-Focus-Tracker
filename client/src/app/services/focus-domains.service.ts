import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface FocusDomain { id: string; domain: string; name: string; isActive: boolean; }

@Injectable({ providedIn: 'root' })
export class FocusDomainsService {
  private readonly KEY = 'focus-domains';
  private domains$ = new BehaviorSubject<FocusDomain[]>([]);
  domains = this.domains$.asObservable();

  constructor() {
    const raw = localStorage.getItem(this.KEY);
    if (raw) this.domains$.next(JSON.parse(raw));
  }

  add(domain: string, name?: string) {
    const norm = domain.toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    if (!this.domains$.value.find(d => d.domain === norm)) {
      const fd: FocusDomain = { id: `${Date.now()}`, domain: norm, name: name||norm, isActive: true };
      this.set([...this.domains$.value, fd]);
    }
  }

  toggle(id: string) {
    this.set(this.domains$.value.map(d => d.id === id ? { ...d, isActive: !d.isActive } : d));
  }

  remove(id: string) {
    this.set(this.domains$.value.filter(d => d.id !== id));
  }

  private set(arr: FocusDomain[]) {
    this.domains$.next(arr);
    localStorage.setItem(this.KEY, JSON.stringify(arr));
  }
}

