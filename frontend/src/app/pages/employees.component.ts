import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';

const blank = () => ({ _id: '', name: '', email: '', password: '', role: 'employee', department: 'General', employeeId: '' });

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="head">
      <div><h1>Employees</h1><p>Add people, update details and deactivate accounts.</p></div>
      <button class="btn amber" (click)="open()">Add employee</button>
    </div>

    @if (form()) {
      <section class="card" style="margin-bottom:20px">
        <h2>{{ form()._id ? 'Edit employee' : 'New employee' }}</h2>
        @if (error()) { <div class="error" style="margin-top:12px" role="alert">{{ error() }}</div> }
        <form class="grid g4" style="margin-top:14px" (ngSubmit)="save()">
          <div class="field"><label>Name</label><input class="input" name="name" [(ngModel)]="form().name" required></div>
          <div class="field"><label>Email</label><input class="input" type="email" name="email" [(ngModel)]="form().email" required></div>
          <div class="field"><label>{{ form()._id ? 'New password (optional)' : 'Password' }}</label>
            <input class="input" type="password" name="password" [(ngModel)]="form().password" [required]="!form()._id" minlength="6"></div>
          <div class="field"><label>Employee ID</label><input class="input" name="employeeId" [(ngModel)]="form().employeeId"></div>
          <div class="field"><label>Department</label><input class="input" name="department" [(ngModel)]="form().department"></div>
          <div class="field"><label>Role</label>
            <select class="input" name="role" [(ngModel)]="form().role"><option value="employee">Employee</option><option value="admin">Admin</option></select></div>
          <div style="display:flex;gap:10px;align-items:end;grid-column: span 2">
            <button class="btn" type="submit">Save changes</button>
            <button class="btn ghost" type="button" (click)="form.set(null)">Cancel</button>
          </div>
        </form>
      </section>
    }

    <section class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Role</th><th>Status</th><th></th></tr></thead>
          <tbody>
            @for (u of users(); track u._id) {
              <tr>
                <td><b>{{ u.name }}</b><div class="muted" style="font-size:12px">{{ u.employeeId }}</div></td>
                <td>{{ u.email }}</td><td>{{ u.department }}</td>
                <td style="text-transform:capitalize">{{ u.role }}</td>
                <td><span [class]="'chip ' + (u.active ? 'present' : 'off')">{{ u.active ? 'Active' : 'Inactive' }}</span></td>
                <td style="text-align:right">
                  <button class="btn ghost small" (click)="open(u)">Edit</button>
                  <button class="btn ghost small" style="margin-left:6px" (click)="toggle(u)">{{ u.active ? 'Deactivate' : 'Activate' }}</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
        @if (!users().length) { <div class="empty">No employees yet. Select Add employee to create the first one.</div> }
      </div>
    </section>
  `,
})
export class EmployeesComponent implements OnInit {
  private api = inject(ApiService);
  users = signal<any[]>([]);
  form = signal<any>(null);
  error = signal('');

  ngOnInit() { this.load(); }
  load() { this.api.users().subscribe((u) => this.users.set(u)); }
  open(u?: any) { this.error.set(''); this.form.set(u ? { ...u, password: '' } : blank()); }

  save() {
    const f = this.form();
    const body = { ...f };
    if (!body.password) delete body.password;
    const req = f._id ? this.api.updateUser(f._id, body) : this.api.createUser(body);
    req.subscribe({
      next: () => { this.form.set(null); this.load(); },
      error: (e) => this.error.set(e.error?.message || 'Could not save this employee.'),
    });
  }
  toggle(u: any) { this.api.updateUser(u._id, { active: !u.active }).subscribe(() => this.load()); }
}
