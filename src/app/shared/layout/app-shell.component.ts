import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FinanceStore } from '../../state/finance.store';
import { AuthService } from '../../core/services/auth.service';
import { OfflineSyncService } from '../../core/services/offline-sync.service';
import { TransactionDialogComponent } from '../components/transaction-dialog/transaction-dialog.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TransactionDialogComponent,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  readonly showDialog = signal(false);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)),
    { initialValue: null }
  );

  readonly showFab = computed(() => {
    const url = this.currentUrl()?.urlAfterRedirects ?? this.router.url;
    return ['/dashboard', '/transactions'].some(r => url.startsWith(r));
  });

  readonly navItems = [
    { label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard' },
    { label: 'Transacoes', icon: 'pi pi-list', route: '/transactions' },
    { label: 'Contas', icon: 'pi pi-wallet', route: '/accounts' },
    { label: 'Categorias', icon: 'pi pi-tags', route: '/categories' },
    { label: 'Relatorios', icon: 'pi pi-chart-bar', route: '/reports' },
    { label: 'Importar CSV', icon: 'pi pi-file-import', route: '/import' },
    { label: 'Configuracoes', icon: 'pi pi-cog', route: '/settings' },
  ];

  readonly statusLabel = computed(() => (this.sync.isOnline() ? 'Online' : 'Offline'));
  readonly currentUserName = computed(() => this.auth.currentUser()?.name ?? '');

  constructor(
    public readonly store: FinanceStore,
    public readonly sync: OfflineSyncService,
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  logout(): void {
    this.auth.logout();
    this.store.clear();
    void this.router.navigate(['/login']);
  }

  async onCreateTransaction(payload: {
    description: string;
    amount: number;
    date: string;
    type: 'income' | 'expense';
    categoryId?: string;
    accountId: string;
    location?: string;
  }): Promise<void> {
    await this.store.addTransaction(payload);
  }
}
