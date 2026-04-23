import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
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
    ButtonModule,
    TagModule,
    QuickEntryComponent,
    TransactionDialogComponent,
  ],
  templateUrl: './transactions.page.html',
  styleUrl: './transactions.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionsPage {
  readonly dialogOpen = signal(false);
  readonly categoryFilterOptions = computed(() => [{ name: 'Todas categorias', id: 'all' }, ...this.store.categories()]);
  readonly accountFilterOptions = computed(() => [{ name: 'Todas contas', id: 'all' }, ...this.store.accounts()]);

  constructor(public readonly store: FinanceStore) {}

  trackById(index: number, item: { id: string }): string {
    return item.id;
  }

  money(value: number): string {
    return formatCurrency(value, this.store.settings().locale, this.store.settings().currency);
  }

  categoryName(id: string): string {
    return this.store.categories().find((category) => category.id === id)?.name ?? 'Sem categoria';
  }

  accountName(id: string): string {
    return this.store.accounts().find((account) => account.id === id)?.name ?? 'Sem conta';
  }

  async handleQuickEntry(event: { description: string; amount: number; inferredType: 'income' | 'expense' }): Promise<void> {
    const account = this.store.accounts()[0];
    if (!account) {
      return;
    }

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
