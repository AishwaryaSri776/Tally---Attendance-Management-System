import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { thisMonth, todayStr } from '../core/dates';
import { DatePipe } from '@angular/common';
import { ApiService } from '../core/api.service';

const TARGET_MIN = 480;
const R = 130;
const C = 2 * Math.PI * R;

@Component({
  selector: 'app-punch',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="head">
      <div><h1>{{ greeting() }}</h1><p>{{ now() | date: 'EEEE, d MMMM y' }}</p></div>
    </div>
    <div class="grid g2">
      <section class="card punch">
        <div class="ring" role="img" [attr.aria-label]="'Worked ' + workedLabel() + ' of 8 hours'">
          <svg width="300" height="300" viewBox="0 0 300 300">
            <circle cx="150" cy="150" r="130" fill="none" stroke="#E3EBE7" stroke-width="16"/>
            <circle cx="150" cy="150" r="130" fill="none" [attr.stroke]="rec()?.status === 'late' ? '#F2A900' : '#2E8B62'" stroke-width="16"
              stroke-linecap="round" [attr.stroke-dasharray]="C" [attr.stroke-dashoffset]="offset()" style="transition: stroke-dashoffset .8s ease"/>
          </svg>
          <div class="face">
            <div class="time mono">{{ now() | date: 'HH:mm:ss' }}</div>
            <div class="muted">{{ rec()?.checkIn ? 'Worked ' + workedLabel() : 'Not clocked in' }}</div>
          </div>
        </div>
        @if (msg()) { <div [class]="isErr() ? 'error' : 'ok'" role="status">{{ msg() }}</div> }
        @if (!rec()) {
          <button class="btn amber" (click)="act('in')" [disabled]="busy()">Clock in</button>
        } @else if (!rec().checkOut) {
          <button class="btn" (click)="act('out')" [disabled]="busy()">Clock out</button>
        } @else {
          <button class="btn" disabled>Done for today</button>
        }
        @if (rec()) {
          <div class="muted mono">
            In {{ rec().checkIn | date: 'shortTime' }}
            @if (rec().checkOut) { · Out {{ rec().checkOut | date: 'shortTime' }} }
            · <span [class]="'chip ' + rec().status">{{ rec().status }}</span>
          </div>
        }
      </section>

      <section class="card">
        <h2>This month</h2>
        <p class="muted" style="margin-top:4px">{{ summary()?.workingDays }} working days so far</p>
        <div class="grid g2" style="grid-template-columns:1fr 1fr;margin-top:16px">
          <div class="stat present"><b>{{ summary()?.present ?? 0 }}</b><span>On time</span></div>
          <div class="stat late"><b>{{ summary()?.late ?? 0 }}</b><span>Late</span></div>
          <div class="stat leave"><b>{{ summary()?.leave ?? 0 }}</b><span>Leave</span></div>
          <div class="stat absent"><b>{{ summary()?.absent ?? 0 }}</b><span>Absent</span></div>
        </div>
        <p style="margin:18px 0 0"><b class="mono" style="font-size:22px">{{ summary()?.percentage ?? 0 }}%</b> <span class="muted">attendance · {{ hours(summary()?.workedMinutes) }} logged</span></p>
      </section>
    </div>
  `,
})
export class PunchComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  C = C;
  now = signal(new Date());
  rec = signal<any>(null);
  summary = signal<any>(null);
  busy = signal(false); msg = signal(''); isErr = signal(false);
  private timer: any;

  worked = computed(() => {
    const r = this.rec();
    if (!r?.checkIn) return 0;
    const end = r.checkOut ? new Date(r.checkOut) : this.now();
    return Math.max(0, (end.getTime() - new Date(r.checkIn).getTime()) / 60000);
  });
  offset = computed(() => C * (1 - Math.min(1, this.worked() / TARGET_MIN)));
  workedLabel = computed(() => this.hours(this.worked()));
  greeting = computed(() => {
    const h = this.now().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  });

  ngOnInit() {
    this.timer = setInterval(() => this.now.set(new Date()), 1000);
    this.load();
  }
  ngOnDestroy() { clearInterval(this.timer); }

  hours(min = 0) { return `${Math.floor(min / 60)}h ${String(Math.round(min % 60)).padStart(2, '0')}m`; }

  load() {
    this.api.today().subscribe((r) => this.rec.set(r.record));
    this.api.myMonth(thisMonth()).subscribe((r) => this.summary.set(r.summary));
  }

  act(kind: 'in' | 'out') {
    this.busy.set(true); this.msg.set('');
    (kind === 'in' ? this.api.checkIn() : this.api.checkOut()).subscribe({
      next: (r) => {
        this.rec.set(r.record); this.isErr.set(false);
        this.msg.set(kind === 'in' ? 'Clocked in. Have a good day.' : 'Clocked out. See you tomorrow.');
        this.busy.set(false); this.load();
      },
      error: (e) => { this.isErr.set(true); this.msg.set(e.error?.message || 'Something went wrong.'); this.busy.set(false); },
    });
  }
}
