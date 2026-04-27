import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { FinanceStore } from '../../state/finance.store';
import { formatCurrency } from '../../core/utils/money.util';
import { Transaction } from '../../core/models/finance.models';

const MONTH_LABELS: Record<string, string> = {
  '01': 'Janeiro', '02': 'Fevereiro', '03': 'Marco', '04': 'Abril',
  '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
  '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
};

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, CardModule, ChartModule],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {

  readonly lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: { family: 'Outfit' }, boxWidth: 12 } },
      tooltip: { callbacks: { label: (ctx: { dataset: { label: string }; parsed: { y: number } }) => ` ${ctx.dataset.label}: R$ ${ctx.parsed.y.toFixed(2)}` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'Outfit', size: 11 } } },
      y: { grid: { color: 'rgba(15,23,42,0.05)' }, ticks: { font: { family: 'Outfit', size: 11 }, callback: (v: number) => `R$ ${v}` } },
    },
  };

  readonly doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { position: 'bottom', labels: { font: { family: 'Outfit' }, boxWidth: 12, padding: 16 } },
      tooltip: { callbacks: { label: (ctx: { label: string; parsed: number }) => ` ${ctx.label}: R$ ${ctx.parsed.toFixed(2)}` } },
    },
  };

  readonly monthlyLineData = computed(() => {
    const monthMap = new Map<string, { income: number; expense: number }>();

    for (const t of this.store.transactions()) {
      const month = t.date.slice(0, 7);
      const cur = monthMap.get(month) ?? { income: 0, expense: 0 };
      if (t.type === 'income') cur.income += t.amount; else cur.expense += t.amount;
      monthMap.set(month, cur);
    }

    const months = Array.from(monthMap.keys()).sort((a, b) => a.localeCompare(b)).slice(-6);
    const shortLabels = months.map((m) => {
      const [, mo] = m.split('-');
      return MONTH_LABELS[mo]?.slice(0, 3) ?? mo;
    });

    return {
      labels: shortLabels,
      datasets: [
        {
          label: 'Receitas',
          data: months.map((m) => monthMap.get(m)?.income ?? 0),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34,197,94,0.12)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#22c55e',
          pointRadius: 4,
        },
        {
          label: 'Despesas',
          data: months.map((m) => monthMap.get(m)?.expense ?? 0),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,0.12)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#ef4444',
          pointRadius: 4,
        },
      ],
    };
  });

  readonly categoryPieData = computed(() => ({
    labels: this.store.categoryBreakdown().map((i) => i.category?.name ?? 'Sem categoria'),
    datasets: [{
      data: this.store.categoryBreakdown().map((i) => i.total),
      backgroundColor: this.store.categoryBreakdown().map((i) => i.category?.color ?? '#94a3b8'),
      hoverOffset: 6,
      borderWidth: 2,
      borderColor: '#ffffff',
    }],
  }));

  readonly monthSaving = computed(() => this.store.currentMonthIncome() - this.store.currentMonthExpense());

  readonly recentTransactions = computed(() =>
    [...this.store.transactionsByMonth()]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6),
  );

  readonly monthLabel = computed(() => {
    const [year, month] = this.store.selectedMonth().split('-');
    return `${MONTH_LABELS[month] ?? month} ${year}`;
  });

  readonly isCurrentMonth = computed(() => {
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return this.store.selectedMonth() === key;
  });

  constructor(public readonly store: FinanceStore) {}

  money(value: number): string {
    return formatCurrency(value, this.store.settings().locale, this.store.settings().currency);
  }

  categoryName(id: string): string {
    return this.store.categories().find((c) => c.id === id)?.name ?? 'Sem categoria';
  }

  formatDate(isoDate: string): string {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Intl.DateTimeFormat(this.store.settings().locale, {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }).format(new Date(year, month - 1, day));
  }

  categoryPct(amount: number): number {
    const total = this.store.currentMonthExpense();
    if (total <= 0) return 0;
    return Math.round((amount / total) * 100);
  }

  trackTx(_: number, tx: Transaction): string {
    return tx.id;
  }
}
