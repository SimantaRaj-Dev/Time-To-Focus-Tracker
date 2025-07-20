import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';

import { provideHttpClient } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { environment } from '../environments/environment'
import { DBConfig } from 'ngx-indexed-db';

// 👇 Define your DB schema here
const dbConfig: DBConfig = {
  name: 'TimeToFocusDB',
  version: 1,
  objectStoresMeta: [{
    store: 'focusSessions',
    storeConfig: { keyPath: 'id', autoIncrement: true },
    storeSchema: [
      { name: 'taskName', keypath: 'taskName', options: { unique: false } },
      { name: 'startTime', keypath: 'startTime', options: { unique: false } },
      { name: 'focusConfirmedAt', keypath: 'focusConfirmedAt', options: { unique: false } },
      { name: 'endTime', keypath: 'endTime', options: { unique: false } },
      { name: 'tabSwitches', keypath: 'tabSwitches', options: { unique: false } },
      { name: 'idleTimeMinutes', keypath: 'idleTimeMinutes', options: { unique: false } },
      { name: 'distractionRating', keypath: 'distractionRating', options: { unique: false } },
      { name: 'notes', keypath: 'notes', options: { unique: false } }
    ]
  }]
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};

