import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const authed = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(authed).pipe(
    catchError((err) => {
      if (err.status === 401 && !req.url.includes('/auth/login')) auth.logout();
      return throwError(() => err);
    })
  );
};

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.user() ? true : inject(Router).parseUrl('/login');
};
export const adminGuard: CanActivateFn = () => (inject(AuthService).isAdmin() ? true : inject(Router).parseUrl('/punch'));
export const employeeGuard: CanActivateFn = () => (inject(AuthService).isAdmin() ? inject(Router).parseUrl('/overview') : true);
export const homeGuard: CanActivateFn = () => inject(Router).parseUrl(inject(AuthService).isAdmin() ? '/overview' : '/punch');
