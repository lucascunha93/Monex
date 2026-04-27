import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FinanceStore } from '../../state/finance.store';
import { formatCurrency } from '../../core/utils/money.util';
import { QuickEntryComponent } from '../../shared/components/quick-entry/quick-entry.component';
import { TransactionDialogComponent } from '../../shared/components/transaction-dialog/transaction-dialog.component';

@Component({
  selector: 'app-transactions-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ScrollingModule,
    CardModule,
    InputTextModule,
    SelectModule,
    QuickEntryComponent,
    TransactionDialogComponent,
  ],
  templateUrl: './transactions.page.html',
  styleUrl: './transactions.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionsPage {
  readonly dialogOpen = signal(false);

  readonly typeOptions = [
    { label: 'Todos os tipos', value: 'all' },
    { label: 'Receitas', value: 'income' },
    { label: 'Despesas', value: 'expense' },
  ];

  readonly categoryFilterOptions = computed(() => [
    { name: 'Todas as categorias', id: 'all' },
    ...this.store.categories(),
  ]);

  readonly accountFilterOptions = computed(() => [
    { name: 'Todas as contas', id: 'all' },
    ...this.store.accounts(),
  ]);

  constructor(public readonly store: FinanceStore) {}

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }

  money(value: number): string {
    return formatCurrency(value, this.store.settings().locale, this.store.settings().currency);
  }

  categoryName(id: string): string {
    return this.store.categories().find((c) => c.id === id)?.name ?? 'Sem categoria';
  }

  catColor(id: string): string {
    return this.store.categories().find((c) => c.id === id)?.color ?? '#94a3b8';
  }

  catIcon(id: string): string {
    return this.store.categories().find((c) => c.id === id)?.icon ?? 'pi pi-tag';
  }

  accountName(id: string): string {
    return this.store.accounts().find((a) => a.id === id)?.name ?? 'Sem conta';
  }

  formatDate(isoDate: string): string {
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  }

  async handleQuickEntry(event: { description: string; amount: number; inferredType: 'income' | 'expense' }): Promise<void> {
    const account = this.store.accounts()[0];
    if (!account) return;

    await this.store.addTransaction({
      description: event.description,
      amount: event.amount,
      type: event.inferredType,
      date: new Date().toISOString().slice(0, 10),
      accountId: account.id,
    });
  }

  async handleDialogSubmit(payload: {
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

  async remove(id: string): Promise<void> {
    await this.store.removeTransaction(id);
  }
}
