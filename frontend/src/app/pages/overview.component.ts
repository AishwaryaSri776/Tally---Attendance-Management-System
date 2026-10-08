import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../core/api.service';
import { todayStr } from '../core/dates';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="head">
      <div>
        <h1>Today at work</h1>
        <p>{{ today | date: 'EEEE, d MMMM y' }}</p>
      </div>

      <button
        class="btn"
        type="button"
        (click)="resetToday()"
        [disabled]="!changedEmployees.size"
      >
        Reset
      </button>
    </div>

    <div class="grid g5">
      <div class="stat">
        <b>{{ stats()?.total ?? 0 }}</b>
        <span>Employees</span>
      </div>

      <div class="stat present">
        <b>{{ stats()?.present ?? 0 }}</b>
        <span>On time</span>
      </div>

      <div class="stat late">
        <b>{{ (stats()?.late ?? 0) + (stats()?.halfDay ?? 0) }}</b>
        <span>Late or half day</span>
      </div>

      <div class="stat leave">
        <b>{{ stats()?.leave ?? 0 }}</b>
        <span>On leave</span>
      </div>

      <div class="stat absent">
        <b>{{ stats()?.absent ?? 0 }}</b>
        <span>Not in yet</span>
      </div>
    </div>

    <section class="card" style="margin-top:20px">
      <div class="head" style="margin-bottom:12px">
        <h2>Daily register</h2>

        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap">

          <!-- Search Employee -->
          <input
            class="input"
            type="text"
            placeholder="Search..."
            style="width:240px"
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)"
            aria-label="Search employee"
          >

          <!-- Date -->
          <input
            class="input"
            type="date"
            style="width:auto"
            [ngModel]="date()"
            [max]="today"
            (ngModelChange)="changeDate($event)"
            aria-label="Date"
          >

        </div>
      </div>

      @if (msg()) {
        <div class="ok" style="margin-bottom:10px" role="status">
          {{ msg() }}
        </div>
      }

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Clock in</th>
              <th>Clock out</th>
              <th>Hours</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            @for (r of filteredRows(); track r.userId) {
              <tr>
                <td>
                  <b>{{ r.name }}</b>

                  <div class="muted" style="font-size:12px">
                    {{ r.employeeId }}
                  </div>
                </td>

                <td>{{ r.department }}</td>

                <td class="mono">
                  {{ r.checkIn ? (r.checkIn | date: 'shortTime') : '—' }}
                </td>

                <td class="mono">
                  {{ r.checkOut ? (r.checkOut | date: 'shortTime') : '—' }}
                </td>

                <td class="mono">
                  {{
                    r.workedMinutes
                      ? (r.workedMinutes / 60).toFixed(1) + ' h'
                      : '—'
                  }}
                </td>

                <td>
                  <select
                    class="input"
                    style="width:auto;padding:5px 8px"
                    [ngModel]="r.status"
                    (ngModelChange)="mark(r, $event)"
                    [attr.aria-label]="'Status for ' + r.name"
                  >
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="half-day">Half day</option>
                    <option value="leave">Leave</option>
                    <option value="absent">Absent</option>
                  </select>
                </td>
              </tr>
            }
          </tbody>
        </table>

        @if (!filteredRows().length) {
          <div class="empty">
            @if (searchTerm()) {
              No employee found for "{{ searchTerm() }}".
            } @else {
              No employees yet. Add your team on the Employees page.
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class OverviewComponent implements OnInit {
  private api = inject(ApiService);

  today = todayStr();
  date = signal(todayStr());

  rows = signal<any[]>([]);
  stats = signal<any>(null);
  msg = signal('');

  // Search text
  searchTerm = signal('');

  // Stores original status before changing
  changedEmployees = new Map<string, string>();

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.stats().subscribe((s) => {
      this.stats.set(s);
    });

    this.api.report(this.date()).subscribe((r) => {
      this.rows.set(r.rows);
    });
  }

  // Search by employee name OR employee ID
  filteredRows() {
    const search = this.searchTerm().trim().toLowerCase();

    if (!search) {
      return this.rows();
    }

    return this.rows().filter((row) => {
      const name = String(row.name ?? '').toLowerCase();
      const employeeId = String(row.employeeId ?? '').toLowerCase();

      return (
        name.includes(search) ||
        employeeId.includes(search)
      );
    });
  }

  changeDate(newDate: string) {
    this.date.set(newDate);

    this.changedEmployees.clear();
    this.searchTerm.set('');
    this.msg.set('');

    this.load();
  }

  mark(row: any, status: string) {
    // Save original status only once
    if (!this.changedEmployees.has(row.userId)) {
      this.changedEmployees.set(row.userId, row.status);
    }

    this.api
      .mark({
        userId: row.userId,
        date: this.date(),
        status
      })
      .subscribe(() => {
        this.msg.set(
          `${row.name} marked ${status.replace('-', ' ')}.`
        );

        this.load();
      });
  }

  resetToday() {
    if (this.date() !== this.today) {
      this.msg.set('Reset is available only for today.');
      return;
    }

    if (!this.changedEmployees.size) {
      this.msg.set('Nothing to reset.');
      return;
    }

    const confirmed = confirm(
      "Are you sure you want to undo today's attendance changes?"
    );

    if (!confirmed) {
      return;
    }

    const resetRequests = Array.from(
      this.changedEmployees.entries()
    ).map(([userId, originalStatus]) =>
      this.api.mark({
        userId,
        date: this.today,
        status: originalStatus
      })
    );

    forkJoin(resetRequests).subscribe(() => {
      this.changedEmployees.clear();

      this.msg.set(
        "Today's attendance changes have been reset."
      );

      this.load();
    });
  }
}