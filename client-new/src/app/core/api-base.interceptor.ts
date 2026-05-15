import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AppConfigService } from './app-config.service';

/**
 * Prepends the base URL from `public/app-config.json` when the chosen env URL is non-empty.
 */
export const apiBaseInterceptor: HttpInterceptorFn = (req, next) => {
  const base = inject(AppConfigService).apiBaseUrl();
  if (!base || /^https?:\/\//i.test(req.url)) {
    return next(req);
  }
  const path = req.url.startsWith('/') ? req.url : `/${req.url}`;
  return next(req.clone({ url: `${base}${path}` }));
};
