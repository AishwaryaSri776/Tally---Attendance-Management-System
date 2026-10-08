import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);
  user = signal<any>(JSON.parse(localStorage.getItem('tally_user') || 'null'));
  isAdmin = computed(() => this.user()?.role === 'admin');
  token = () => localStorage.getItem('tally_token');

  login(email: string, password: string) {
    return this.api.login(email, password).pipe(
      tap((res) => {
        localStorage.setItem('tally_token', res.token);
        localStorage.setItem('tally_user', JSON.stringify(res.user));
        this.user.set(res.user);
      })
    );
  }
  logout() {
    localStorage.removeItem('tally_token');
    localStorage.removeItem('tally_user');
    this.user.set(null);
    this.router.navigateByUrl('/login');
  }
}
