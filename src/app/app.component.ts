import { Component, OnInit, effect } from '@angular/core';
import { Router } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { FinanceStore } from './state/finance.store';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [RouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(
    private readonly auth: AuthService,
    private readonly store: FinanceStore,
    private readonly router: Router,
  ) {
    effect(() => {
      const { darkMode } = this.store.settings();
      document.body.classList.toggle('dark-mode', darkMode);
    });
  }

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
