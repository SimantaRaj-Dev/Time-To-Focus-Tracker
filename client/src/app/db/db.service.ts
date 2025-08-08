import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import Dexie, { Table } from 'dexie';
import { liveQuery } from 'dexie';
import { from, Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FocusSession } from '../models/focus-session.model';

@Injectable({ providedIn: 'root' })
export class DbService {
  private db!: Dexie;
  private sessionsTable!: Table<FocusSession, string>;
  public sessions$: Observable<FocusSession[]>;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId) && 'indexedDB' in window) {
      this.setupDexie();
      this.sessions$ = from(
        liveQuery(() =>
          this.sessionsTable.orderBy('startTime').reverse().toArray()
        )
      ).pipe(
        catchError(err => {
          console.error('Error loading sessions:', err);
          return throwError(() => new Error('Unable to load session history'));
        })
      );
    } else {
      console.warn('IndexedDB not available; sessions$ will be empty');
      this.sessions$ = of([]);
    }
  }

  /** Initialize Dexie and open the database */
  private setupDexie(): void {
    this.db = new Dexie('TimeToFocusDB');
    this.db.version(3).stores({
      focusSessions:
        'id,taskName,startTime,endTime,totalTabSwitches,focusedTimeInSeconds,distractedTimeInSeconds'
    });
    // Cast the table to use string as primary key type
    this.sessionsTable = this.db.table<FocusSession>('focusSessions') as Table<FocusSession, string>;
    this.openDb();
  }

  private async openDb(): Promise<void> {
    try {
      await this.db.open();
    } catch (err) {
      console.error('Dexie open() failed:', err);
    }
  }

  /** CREATE or UPDATE (upsert) */
  public async put(session: FocusSession): Promise<string> {
    if (!this.sessionsTable) {
      throw new Error('IndexedDB is not initialized');
    }
    try {
      return await this.sessionsTable.put(session);
    } catch (err) {
      console.error('Error saving session:', err, session);
      throw new Error('Failed to save session');
    }
  }

  /** READ all sessions imperatively */
  public async getAll(): Promise<FocusSession[]> {
    if (!this.sessionsTable) {
      throw new Error('IndexedDB is not initialized');
    }
    try {
      return await this.sessionsTable.toArray();
    } catch (err) {
      console.error('Error fetching all sessions:', err);
      throw new Error('Unable to retrieve sessions');
    }
  }

  /** READ one session by ID */
  public async getById(id: string): Promise<FocusSession | undefined> {
    if (!this.sessionsTable) {
      throw new Error('IndexedDB is not initialized');
    }
    try {
      return await this.sessionsTable.get(id);
    } catch (err) {
      console.error(`Error fetching session by id=${id}:`, err);
      throw new Error('Failed to load session');
    }
  }

  /** DELETE a session by ID */
  public async delete(id: string): Promise<void> {
    if (!this.sessionsTable) {
      throw new Error('IndexedDB is not initialized');
    }
    try {
      await this.sessionsTable.delete(id);
    } catch (err) {
      console.error(`Error deleting session id=${id}:`, err);
      throw new Error('Failed to delete session');
    }
  }
}








