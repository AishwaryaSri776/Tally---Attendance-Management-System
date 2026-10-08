import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <aside class="side">
        <div class="brand"><i></i> Tally</div>
        <nav class="nav" aria-label="Main">
          @if (auth.isAdmin()) {
            <a routerLink="/overview" routerLinkActive="active">Today</a>
            <a routerLink="/monthly" routerLinkActive="active">Monthly report</a>
            <a routerLink="/employees" routerLinkActive="active">Employees</a>
          } @else {
            <a routerLink="/punch" routerLinkActive="active">Clock</a>
            <a routerLink="/history" routerLinkActive="active">My attendance</a>
          }
        </nav>
        <div class="me">
          <div><b>{{ auth.user()?.name }}</b><small>{{ auth.user()?.department }} · {{ auth.user()?.role }}</small></div>
          <button class="btn ghost small" (click)="auth.logout()">Sign out</button>
        </div>
      </aside>
      <main class="main"><router-outlet /></main>
    </div>
  `,
})
export class ShellComponent { auth = inject(AuthService); }
