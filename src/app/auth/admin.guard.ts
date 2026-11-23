import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { combineLatest, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from './authService';

/** Lets admins through; sends visitors to the login page and other users home. */
@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return combineLatest([this.authService.isAuthenticated$, this.authService.isAdmin$]).pipe(
      take(1),
      map(([isAuthenticated, isAdmin]) => {
        if (!isAuthenticated) return this.router.createUrlTree(['/login']);
        return isAdmin || this.router.createUrlTree(['/']);
      })
    );
  }
}
