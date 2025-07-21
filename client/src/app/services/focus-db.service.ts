// client/src/app/services/focus-db.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { FocusSession } from '../models/focus-session.model';

interface FocusDB extends DBSchema {
  focusSessions: {
    key: number;
    value: FocusSession;
  };
}

@Injectable({ providedIn: 'root' })
export class FocusDbService {
  private dbPromise: Promise<IDBPDatabase<FocusDB>> | null = null;
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.dbPromise = openDB<FocusDB>('TimeToFocusDB', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('focusSessions')) {
            db.createObjectStore('focusSessions', {
              keyPath: 'id',
              autoIncrement: true
            });
          }
        }
      });
    }
  }

  private async getDb(): Promise<IDBPDatabase<FocusDB>> {
    if (!this.isBrowser || !this.dbPromise) {
      throw new Error('IndexedDB is unavailable');
    }
    return this.dbPromise;
  }

  async addSession(session: FocusSession): Promise<number> {
    const db = await this.getDb();
    return db.add('focusSessions', session);
  }

  async getAllSessions(): Promise<FocusSession[]> {
    const db = await this.getDb();
    return db.getAll('focusSessions');
  }

  async updateSession(session: FocusSession): Promise<void> {
    const db = await this.getDb();
    await db.put('focusSessions', session);
  }

  async deleteSession(id: number): Promise<void> {
    const db = await this.getDb();
    await db.delete('focusSessions', id);
  }

  async getSession(id: number): Promise<FocusSession | undefined> {
    const db = await this.getDb();
    return db.get('focusSessions', id);
  }
}


