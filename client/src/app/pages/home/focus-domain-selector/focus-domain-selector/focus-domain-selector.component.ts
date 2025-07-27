import { Component, OnInit, Inject, PLATFORM_ID, Output, EventEmitter } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FocusDomainsService, FocusDomain } from '../../../../services/focus-domains.service';

@Component({
  selector: 'app-focus-domain-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './focus-domain-selector.component.html',
  styleUrls: ['./focus-domain-selector.component.scss']
})
export class FocusDomainSelectorComponent implements OnInit {
  @Output() domainsSelectionChange = new EventEmitter<string[]>();
  public availableDomains: FocusDomain[] = [];
  public selectedDomainSet = new Set<string>();
  public newDomainInput = '';
  public suggestions = [
    'leetcode.com', 'github.com', 'docs.google.com', 'notion.so'
  ];
  private isBrowser = false;

  constructor(
    private domainsService: FocusDomainsService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;

    // Subscribe to persisted domain list
    this.domainsService.domains$
      .subscribe(list => {
        this.availableDomains = list;
        // Clean out any selected entries no longer in the list
        for (const domain of Array.from(this.selectedDomainSet)) {
          if (!list.some(fd => fd.domain === domain)) {
            this.selectedDomainSet.delete(domain);
          }
        }
        this.emitChanges();
      });

    // Restore selection after page reload
    const raw = localStorage.getItem('selectedDomains');
    if (raw) {
      try {
        JSON.parse(raw).forEach((d: string) => this.selectedDomainSet.add(d));
        this.emitChanges();
      } catch {}
    }
  }

  toggleDomain(domain: string): void {
    if (this.selectedDomainSet.has(domain)) {
      this.selectedDomainSet.delete(domain);
    } else {
      this.selectedDomainSet.add(domain);
    }
    this.persistSelection();
    this.emitChanges();
  }

  addDomain(normalized: string | ''): void {
    if (!this.isBrowser) return;
    normalized === '' ? this.domainsService.normalizeDomain(this.newDomainInput) : normalized;
    if (!this.selectedDomainSet.has(normalized)) {
      this.domainsService.add(normalized);
      this.selectedDomainSet.add(normalized);
      this.persistSelection();
      this.emitChanges();
    }
    this.newDomainInput = '';
  }

  quickToggle(domain: string): void {
    if (!this.isBrowser) return;
    debugger;
    const normalized = this.domainsService.normalizeDomain(domain);
    if (!this.availableDomains.some(fd => fd.domain === normalized)) {
      this.addDomain(normalized);
      this.persistSelection();
    }
    else {
      this.domainsService.remove(normalized);
    }
  }

  removeDomain(domain: string): void {
    if (!this.isBrowser) return;
    this.domainsService.remove(domain);
    this.availableDomains = this.domainsService.getDomains();
    this.selectedDomainSet.delete(domain);
    this.persistSelection();
    this.emitChanges();
  }

  clearAllSelections(): void {
    this.selectedDomainSet.clear();
    this.persistSelection();
    this.emitChanges();
  }

  private emitChanges(): void {
    this.domainsSelectionChange.emit(Array.from(this.selectedDomainSet));
  }

  private persistSelection(): void {
    if (!this.isBrowser) return;
    localStorage.setItem(
      'selectedDomains',
      JSON.stringify(Array.from(this.selectedDomainSet))
    );
  }
}