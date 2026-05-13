import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { apiBaseInterceptor } from './core/api-base.interceptor';
import { authInterceptor } from './core/auth.interceptor';
import { AppConfigService } from './core/app-config.service';
import { AuthService } from './core/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiBaseInterceptor, authInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: (cfg: AppConfigService) => () => cfg.load(),
      deps: [AppConfigService],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (auth: AuthService) => () => auth.initFromStorage(),
      deps: [AuthService],
      multi: true,
    },
  ],
};
