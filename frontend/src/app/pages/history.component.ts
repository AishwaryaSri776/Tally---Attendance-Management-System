import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { thisMonth, todayStr } from '../core/dates';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="head">
      <div><h1>My attendance</h1><p>Your days, hours and status for the month.</p></div>
      <input class="input" type="month" style="width:auto" [ngModel]="month()" (ngModelChange)="month.set($event); load()" aria-label="Month">
    </div>
    <div class="grid g2">
      <section class="card">
        <h2>Calendar</h2>
        <div class="cal" style="margin-top:14px">
          @for (d of dows; track d) { <div class="dow">{{ d }}</div> }
          @for (b of blanks(); track $index) { <div></div> }
          @for (c of cells(); track c.day) { <div [class]="'day ' + c.cls" [title]="c.label">{{ c.day }}</div> }
        </div>
        <div class="legend">
          <span><i style="background:var(--green)"></i>On time</span><span><i style="background:var(--amber)"></i>Late</span>
          <span><i style="background:#E8895A"></i>Half day</span><span><i style="background:var(--sky)"></i>Leave</span>
          <span><i style="background:#F6CFC6"></i>Absent</span>
        </div>
      </section>
      <section class="card">
        <h2>Summary</h2>
        <div class="grid" style="grid-template-columns:1fr 1fr;margin-top:14px">
          <div class="stat present"><b>{{ data()?.summary.present }}</b><span>On time</span></div>
          <div class="stat late"><b>{{ data()?.summary.late }}</b><span>Late</span></div>
          <div class="stat leave"><b>{{ data()?.summary.leave }}</b><span>Leave</span></div>
          <div class="stat absent"><b>{{ data()?.summary.absent }}</b><span>Absent</span></div>
        </div>
        <p style="margin:16px 0 0"><b style="font-size:22px" class="mono">{{ data()?.summary.percentage }}%</b> <span class="muted">attendance</span></p>
      </section>
    </div>
    <section class="card" style="margin-top:18px">
      <h2>Daily log</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Clock in</th><th>Clock out</th><th>Hours</th><th>Status</th></tr></thead>
          <tbody>
            @for (r of data()?.records; track r._id) {
              <tr class="mono">
                <td>{{ r.date | date: 'EEE, d MMM' }}</td>
                <td>{{ r.checkIn ? (r.checkIn | date: 'shortTime') : '—' }}</td>
                <td>{{ r.checkOut ? (r.checkOut | date: 'shortTime') : '—' }}</td>
                <td>{{ r.workedMinutes ? (r.workedMinutes / 60).toFixed(1) + ' h' : '—' }}</td>
                <td><span [class]="'chip ' + r.status">{{ r.status }}</span></td>
              </tr>
            }
          </tbody>
        </table>
        @if (!data()?.records?.length) { <div class="empty">No attendance recorded for this month yet.</div> }
      </div>
    </section>
  `,
})
export class HistoryComponent implements OnInit {
  private api = inject(ApiService);
  dows = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  month = signal(thisMonth());
  data = signal<any>(null);

  blanks = computed(() => {
    const [y, m] = this.month().split('-').map(Number);
    return Array.from({ length: (new Date(y, m - 1, 1).getDay() + 6) % 7 });
  });
  cells = computed(() => {
    const d = this.data();
    if (!d) return [];
    const [y, m] = this.month().split('-').map(Number);
    const byDate = new Map<string, any>(d.records.map((r: any) => [r.date, r]));
    const today = todayStr();
    return Array.from({ length: d.days }, (_, i) => {
      const day = i + 1;
      const key = `${this.month()}-${String(day).padStart(2, '0')}`;
      const dow = new Date(y, m - 1, day).getDay();
      const rec = byDate.get(key);
      let cls = '';
      if (rec) cls = rec.status;
      else if (dow !== 0 && dow !== 6 && key < today) cls = 'absent';
      if (key === today) cls += ' today';
      return { day, cls, label: rec ? rec.status : cls.includes('absent') ? 'absent' : 'no work' };
    });
  });

  ngOnInit() { this.load(); }
  load() { this.api.myMonth(this.month()).subscribe((r) => this.data.set(r)); }
}
