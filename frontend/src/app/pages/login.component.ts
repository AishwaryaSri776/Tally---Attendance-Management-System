import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login">
      <section class="art">
        <div class="brand"><i></i> Tally</div>
        <div>
          <h1>ATTENDANCE PORTAL.</h1>
          <p>"Mark Track Manage".</p>
        </div>
        <small class="muted">Attendance management for teams</small>
      </section>
      <section class="form">
        <form (ngSubmit)="submit()">
          <div><h2>Sign in</h2></div>
          @if (error()) { <div class="error" role="alert">{{ error() }}</div> }
          <div class="field"><label for="email">Email</label>
            <input id="email" class="input" type="email" name="email" [(ngModel)]="email" autocomplete="username" required></div>
          <div class="field"><label for="pw">Password</label>
            <input id="pw" class="input" type="password" name="password" [(ngModel)]="password" autocomplete="current-password" required></div>
          <button class="btn" type="submit" [disabled]="busy()">{{ busy() ? 'Signing in…' : 'Sign in' }}</button>
      
        </form>
      </section>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  email = ''; password = '';
  busy = signal(false); error = signal('');

  submit() {
    this.busy.set(true); this.error.set('');
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (e) => { this.error.set(e.error?.message || 'Could not reach the server. Is the API running?'); this.busy.set(false); },
    });
  }
}
