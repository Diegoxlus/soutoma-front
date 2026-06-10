import { inject } from '@angular/core';
import { Router, UrlTree } from '@angular/router';

import { AuthService } from '../../auth/services/auth.service';

export function authGuard(): boolean | UrlTree {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated() ? true : router.createUrlTree(['/admin/login']);
}

export function loginRedirectGuard(): boolean | UrlTree {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated() ? router.createUrlTree(['/admin']) : true;
}
