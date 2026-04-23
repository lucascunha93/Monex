import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { FinanceStore } from '../../state/finance.store';
import { formatCurrency } from '../../core/utils/money.util';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, CardModule, ChartModule, TagModule],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  readonly monthlyLineData = computed(() => {
    const monthMap = new Map<string, { income: number; expense: number }>();

    for (const transaction of this.store.transactions()) {
      const month = transaction.date.slice(0, 7);
      const current = monthMap.get(month) ?? { income: 0, expense: 0 };
      if (transaction.type === 'income') {
        current.income += transaction.amount;
      } else {
        current.expense += transaction.amount;
      }
      monthMap.set(month, current);
    }

    const months = Array.from(monthMap.keys())
      .sort((a, b) => a.localeCompare(b))
      .slice(-6);
    return {
      labels: months,
      datasets: [
        {
          label: 'Receitas',
          data: months.map((month) => monthMap.get(month)?.income ?? 0),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.15)',
          tension: 0.4,
        },
        {
          label: 'Despesas',
          data: months.map((month) => monthMap.get(month)?.expense ?? 0),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          tension: 0.4,
        },
      ],
    };
  });

  readonly categoryPieData = computed(() => ({
    labels: this.store.categoryBreakdown().map((item) => item.category?.name ?? 'Sem categoria'),
    datasets: [
      {
        data: this.store.categoryBreakdown().map((item) => item.total),
        backgroundColor: this.store.categoryBreakdown().map((item) => item.category?.color ?? '#94a3b8'),
      },
    ],
  }));

  constructor(public readonly store: FinanceStore) {}

  money(value: number): string {
    return formatCurrency(value, this.store.settings().locale, this.store.settings().currency);
  }
}
