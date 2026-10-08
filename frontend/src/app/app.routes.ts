import { Routes } from '@angular/router';
import { adminGuard, authGuard, employeeGuard, homeGuard } from './core/guards';
import { LoginComponent } from './pages/login.component';
import { ShellComponent } from './pages/shell.component';
import { PunchComponent } from './pages/punch.component';
import { HistoryComponent } from './pages/history.component';
import { OverviewComponent } from './pages/overview.component';
import { EmployeesComponent } from './pages/employees.component';
import { MonthlyComponent } from './pages/monthly.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', canActivate: [homeGuard], component: PunchComponent },
      { path: 'punch', component: PunchComponent, canActivate: [employeeGuard] },
      { path: 'history', component: HistoryComponent, canActivate: [employeeGuard] },
      { path: 'overview', component: OverviewComponent, canActivate: [adminGuard] },
      { path: 'monthly', component: MonthlyComponent, canActivate: [adminGuard] },
      { path: 'employees', component: EmployeesComponent, canActivate: [adminGuard] },
    ],
  },
  { path: '**', redirectTo: '' },
];
