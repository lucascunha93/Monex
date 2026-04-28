import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FinanceStore } from '../../state/finance.store';
import { formatCurrency } from '../../core/utils/money.util';
import { QuickEntryComponent } from '../../shared/components/quick-entry/quick-entry.component';

@Component({
  selector: 'app-transactions-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    SelectModule,
    QuickEntryComponent,
  ],
  templateUrl: './transactions.page.html',
  styleUrl: './transactions.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionsPage {
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
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Intl.DateTimeFormat(this.store.settings().locale, {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }).format(new Date(year, month - 1, day));
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

  async remove(id: string): Promise<void> {
    await this.store.removeTransaction(id);
  }
}
