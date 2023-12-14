import { AuthService } from './authService';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authservice : AuthService){}
  canActivate()
  {
    return this.authservice.isAuthenticated;
  }
  
}
