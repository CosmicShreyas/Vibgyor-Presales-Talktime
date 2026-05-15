import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

/** Wait for JWT restore from storage before deciding access (avoids redirect-to-login on refresh). */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.initFromStorage();
  if (auth.user()) return true;
  return router.createUrlTree(['/login']);
};

export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.initFromStorage();
  if (!auth.user()) return true;
  return router.createUrlTree(['/']);
};
