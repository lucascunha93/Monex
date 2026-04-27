import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { createId } from '../../core/utils/id.util';
import { formatCurrency } from '../../core/utils/money.util';
import { FinanceStore } from '../../state/finance.store';

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, InputTextModule, InputNumberModule],
  templateUrl: './reports.page.html',
  styleUrl: './reports.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPage {
  draftGoal = {
    name: '',
    targetAmount: 10000,
    currentAmount: 0,
  };

  readonly projectedBalance = computed(() => this.store.consolidatedBalance() + (this.store.currentMonthIncome() - this.store.currentMonthExpense()) * 3);
  readonly topCategoryName = computed(() => this.store.insights().topCategory?.category?.name ?? 'Sem dados');

  constructor(public readonly store: FinanceStore) {}

  money(value: number): string {
    return formatCurrency(value, this.store.settings().locale, this.store.settings().currency);
  }

  progress(goal: { targetAmount: number; currentAmount: number }): number {
    if (goal.targetAmount <= 0) {
      return 0;
    }
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  }

  async saveGoal(): Promise<void> {
    const model = this.draftGoal;
    if (!model.name.trim() || model.targetAmount <= 0) {
      return;
    }

    await this.store.saveGoal({
      id: createId('goal'),
      name: model.name.trim(),
      targetAmount: model.targetAmount,
      currentAmount: model.currentAmount,
    });

    this.draftGoal = {
      name: '',
      targetAmount: 10000,
      currentAmount: 0,
    };
  }
}
