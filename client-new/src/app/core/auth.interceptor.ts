import { HttpInterceptorFn } from '@angular/common/http';
import { getStoredAuthToken } from './auth-token.storage';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = getStoredAuthToken();
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
