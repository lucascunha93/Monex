import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { AuthService } from './core/services/auth.service';
import { FinanceStore } from './state/finance.store';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(
    private readonly auth: AuthService,
    private readonly store: FinanceStore,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      const userId = this.auth.getUserId();
      this.store.switchUser(userId);
      void this.store.init();
    } else {
      void this.router.navigate(['/login']);
    }
  }
}
