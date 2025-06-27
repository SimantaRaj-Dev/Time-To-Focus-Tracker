import { Injectable } from '@angular/core';
import { FocusSession } from '../models/focus-session.model';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface FocusDB extends DBSchema {
  focusSessions: {
    key: number;
    value: FocusSession;
  };
}

@Injectable({
  providedIn: 'root'
})
export class FocusDbService {
  private dbPromise: Promise<IDBPDatabase<FocusDB>>;

  constructor() {
    this.dbPromise = openDB<FocusDB>('TimeToFocusDB', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('focusSessions')) {
          db.createObjectStore('focusSessions', {
            keyPath: 'id',
            autoIncrement: true,
          });
        }
      }
    });
  }

  async addSession(session: FocusSession): Promise<number> {
    const db = await this.dbPromise;
    return await db.add('focusSessions', session);
  }

  async getAllSessions(): Promise<FocusSession[]> {
    const db = await this.dbPromise;
    return await db.getAll('focusSessions');
  }

  async deleteSession(id: number): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('focusSessions', id);
  }

  async updateSession(session: FocusSession): Promise<void> {
    const db = await this.dbPromise;
    await db.put('focusSessions', session);
  }

  async getSession(id: number): Promise<FocusSession | undefined> {
    const db = await this.dbPromise;
    return await db.get('focusSessions', id);
  }
}
