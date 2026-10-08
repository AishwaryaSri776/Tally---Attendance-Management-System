import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = '/api';

  login = (email: string, password: string) => this.http.post<any>(`${this.base}/auth/login`, { email, password });
  today = () => this.http.get<any>(`${this.base}/attendance/today`);
  checkIn = () => this.http.post<any>(`${this.base}/attendance/check-in`, {});
  checkOut = () => this.http.post<any>(`${this.base}/attendance/check-out`, {});
  myMonth = (month: string) => this.http.get<any>(`${this.base}/attendance/me`, { params: { month } });
  stats = () => this.http.get<any>(`${this.base}/attendance/stats`);
  report = (date: string) => this.http.get<any>(`${this.base}/attendance/report`, { params: { date } });
  summary = (month: string) => this.http.get<any>(`${this.base}/attendance/summary`, { params: { month } });
  mark = (body: any) => this.http.post<any>(`${this.base}/attendance/mark`, body);
  users = () => this.http.get<any[]>(`${this.base}/users`);
  createUser = (body: any) => this.http.post<any>(`${this.base}/users`, body);
  updateUser = (id: string, body: any) => this.http.put<any>(`${this.base}/users/${id}`, body);
}
