import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { thisMonth } from '../core/dates';

@Component({
  selector: 'app-monthly',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="head">
      <div><h1>Monthly report</h1><p>{{ data()?.workingDays ?? 0 }} working days counted this month.</p></div>
      <div style="display:flex;gap:10px">
        <input class="input" type="month" style="width:auto" [ngModel]="month()" (ngModelChange)="month.set($event); load()" aria-label="Month">
        <button class="btn amber" (click)="exportCsv()" [disabled]="!data()?.rows?.length">Download CSV</button>
      </div>
    </div>
    <section class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Employee</th><th>Department</th><th>On time</th><th>Late</th><th>Half day</th><th>Leave</th><th>Absent</th><th>Hours</th><th>Attendance</th></tr></thead>
          <tbody>
            @for (r of data()?.rows; track r.userId) {
              <tr class="mono">
                <td style="font-family:var(--body)"><b>{{ r.name }}</b></td><td style="font-family:var(--body)">{{ r.department }}</td>
                <td>{{ r.present }}</td><td>{{ r.late }}</td><td>{{ r.halfDay }}</td><td>{{ r.leave }}</td>
                <td [style.color]="r.absent ? 'var(--coral)' : ''">{{ r.absent }}</td>
                <td>{{ (r.workedMinutes / 60).toFixed(1) }}</td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div style="width:70px;height:8px;background:#E3EBE7;border-radius:9px;overflow:hidden">
                      <div [style.width.%]="r.percentage" [style.background]="r.percentage >= 90 ? 'var(--green)' : r.percentage >= 75 ? 'var(--amber)' : 'var(--coral)'" style="height:100%"></div>
                    </div>{{ r.percentage }}%
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
        @if (!data()?.rows?.length) { <div class="empty">No employees to report on yet.</div> }
      </div>
    </section>
  `,
})
export class MonthlyComponent implements OnInit {
  private api = inject(ApiService);
  month = signal(thisMonth());
  data = signal<any>(null);

  ngOnInit() { this.load(); }
  load() { this.api.summary(this.month()).subscribe((r) => this.data.set(r)); }

  exportCsv() {
    const head = ['Employee', 'ID', 'Department', 'On time', 'Late', 'Half day', 'Leave', 'Absent', 'Hours', 'Attendance %'];
    const lines = this.data().rows.map((r: any) =>
      [r.name, r.employeeId || '', r.department, r.present, r.late, r.halfDay, r.leave, r.absent, (r.workedMinutes / 60).toFixed(1), r.percentage]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
    );
    const blob = new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `attendance-${this.month()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
