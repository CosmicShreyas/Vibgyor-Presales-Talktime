import { HttpInterceptorFn } from '@angular/common/http';
import { getStoredAuthToken } from './auth-token.storage';

const PUBLIC_API_PATHS = ['/api/brand-partners/login'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (PUBLIC_API_PATHS.some((path) => req.url.includes(path))) {
    return next(req);
  }

  const token = getStoredAuthToken();
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
