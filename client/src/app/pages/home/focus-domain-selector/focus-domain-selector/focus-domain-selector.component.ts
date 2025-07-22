// src/app/pages/home/focus-domain-selector/focus-domain-selector.component.ts

import { Component, OnInit, Inject, PLATFORM_ID, Output, EventEmitter } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FocusDomainsService, FocusDomain } from '../../../../services/focus-domains.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-focus-domain-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './focus-domain-selector.component.html',
  styleUrls: ['./focus-domain-selector.component.scss']
})
export class FocusDomainSelectorComponent implements OnInit {
  @Output() selectionChange = new EventEmitter<string[]>();  // ← add this

  public domains: FocusDomain[] = [];
  public selected = new Set<string>();
  public newDomain = '';
  domainSuggestions = [
    'leetcode.com',
    'github.com',
    'docs.google.com',
    'notion.so'
  ];
  private isBrowser: boolean;

  constructor(
    public svc: FocusDomainsService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.svc.domains$.subscribe((list: FocusDomain[]) => {
      this.domains = list;
      for (const d of Array.from(this.selected)) {
        if (!list.some(item => item.domain === d)) {
          this.selected.delete(d);
        }
      }
      this.emitSelection();
    });
  }

  toggle(domain: string): void {
    this.selected.has(domain)
      ? this.selected.delete(domain)
      : this.selected.add(domain);
    this.emitSelection();
  }

  addNewDomain(): void {
    if (!this.isBrowser) return;
    const d = this.svc.normalizeDomain(this.newDomain);
    if (d && !this.selected.has(d)) {
      this.svc.add(d);
      this.selected.add(d);
      this.emitSelection();
    }
    this.newDomain = '';
  }

  quickToggle(sug: string): void {
    if (!this.isBrowser) return;
    const d = this.svc.normalizeDomain(sug);
    if (!this.domains.some(fd => fd.domain === d)) {
      this.svc.add(d);
    }
    this.toggle(d);
  }

  removeDomain(domain: string): void {
    if (!this.isBrowser) return;
    this.svc.remove(domain);       
    this.domains = this.svc.getDomains();
    this.selected.delete(domain);
    this.emitSelection();
  }

  private emitSelection(): void {
    this.selectionChange.emit(Array.from(this.selected));
  }
}








