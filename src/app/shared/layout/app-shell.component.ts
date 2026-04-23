import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { FinanceStore } from '../../state/finance.store';
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
    ButtonModule,
    TagModule,
    TransactionDialogComponent,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  readonly showDialog = signal(false);

  readonly navItems = [
    { label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard' },
    { label: 'Transacoes', icon: 'pi pi-list', route: '/transactions' },
    { label: 'Contas', icon: 'pi pi-wallet', route: '/accounts' },
    { label: 'Categorias', icon: 'pi pi-tags', route: '/categories' },
    { label: 'Relatorios', icon: 'pi pi-chart-bar', route: '/reports' },
    { label: 'Configuracoes', icon: 'pi pi-cog', route: '/settings' },
  ];

  readonly statusLabel = computed(() => (this.sync.isOnline() ? 'Online' : 'Offline'));

  constructor(
    public readonly store: FinanceStore,
    public readonly sync: OfflineSyncService,
  ) {}

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
