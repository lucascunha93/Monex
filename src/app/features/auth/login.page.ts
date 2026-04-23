import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../core/services/auth.service';
import { FinanceStore } from '../../state/finance.store';

type LoginMode = 'login' | 'register';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, CardModule, ButtonModule, InputTextModule, PasswordModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  mode = signal<LoginMode>('login');
  name = '';
  email = '';
  password = '';
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private readonly auth: AuthService,
    private readonly store: FinanceStore,
    private readonly router: Router,
  ) {}

  async submit(): Promise<void> {
    this.errorMessage.set(null);
    this.loading.set(true);
    try {
      if (this.mode() === 'login') {
        await this.doLogin();
      } else {
        await this.doRegister();
      }
    } finally {
      this.loading.set(false);
    }
  }

  private async doLogin(): Promise<void> {
    const result = await this.auth.login(this.email, this.password);
    if (!result.success) {
      this.errorMessage.set(
        result.error === 'user_not_found' ? 'Usuário não encontrado.' : 'Senha incorreta.',
      );
      return;
    }
    this.store.switchUser(result.user.id);
    await this.store.init();
    void this.router.navigate(['/dashboard']);
  }

  private async doRegister(): Promise<void> {
    if (!this.name.trim()) {
      this.errorMessage.set('Informe seu nome.');
      return;
    }
    const result = await this.auth.register(this.name, this.email, this.password);
    if (!result.success) {
      this.errorMessage.set('Este e-mail já está em uso.');
      return;
    }
    this.store.switchUser(result.user.id);
    await this.store.init();
    void this.router.navigate(['/dashboard']);
  }

  toggleMode(): void {
    this.mode.update((m) => (m === 'login' ? 'register' : 'login'));
    this.errorMessage.set(null);
  }
}
