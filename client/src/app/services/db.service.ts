import { Injectable } from '@angular/core';
import Dexie, { Table } from 'dexie';
import { liveQuery } from 'dexie';
import { FocusSession } from '../models/focus-session.model';
import { from, Observable } from 'rxjs';

class AppDB extends Dexie {
  focusSessions!: Table<FocusSession, string>;
  constructor() {
    super('TimeToFocusDB');
    this.version(1).stores({
      focusSessions: 'id,taskName,startTime,endTime,distractionRating,tabSwitches,focusedTimeMinutes,distractedTimeMinutes'
    });
  }
}

@Injectable({ providedIn: 'root' })
export class DbService {
  private db = new AppDB();
  sessions$: Observable<FocusSession[]> = from(
    liveQuery(() => this.db.focusSessions.toArray())
  );

  add(session: FocusSession): Promise<string> {
    return this.db.focusSessions.add(session);
  }

  async update(session: FocusSession): Promise<void> {
    await this.db.focusSessions.put(session);
  }

  delete(id: string): Promise<void> {
    return this.db.focusSessions.delete(id);
  }
}



