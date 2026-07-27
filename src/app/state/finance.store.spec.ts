import { TestBed } from '@angular/core/testing';
import { FinanceRepositoryService } from '../core/services/finance-repository.service';
import { OfflineSyncService } from '../core/services/offline-sync.service';
import { getCurrentMonthKey } from '../core/utils/date.util';
import { FinanceStore } from './finance.store';

describe('FinanceStore', () => {
  let store: FinanceStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FinanceStore,
        { provide: FinanceRepositoryService, useValue: {} },
        { provide: OfflineSyncService, useValue: {} },
      ],
    });

    store = TestBed.inject(FinanceStore);
  });

  it('should expose ordered goal progress views', () => {
    store.goals.set([
      { id: 'goal-1', name: 'Reserva', targetAmount: 1000, currentAmount: 250 },
      { id: 'goal-2', name: 'Viagem', targetAmount: 5000, currentAmount: 5000 },
      { id: 'goal-3', name: 'Cursos', targetAmount: 2000, currentAmount: 1000 },
    ]);

    expect(store.goalProgress()[0].name).toBe('Viagem');
    expect(store.goalProgress()[0].progress).toBe(100);
    expect(store.goalProgress()[1].progress).toBe(50);
  });

  it('should summarize the current month health', () => {
    const monthKey = getCurrentMonthKey();

    store.transactions.set([
      {
        id: 'trx-1',
        description: 'Salario',
        amount: 1000,
        date: `${monthKey}-05`,
        type: 'income',
        categoryId: 'cat_salary',
        accountId: 'acc-1',
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      },
      {
        id: 'trx-2',
        description: 'Mercado',
        amount: 900,
        date: `${monthKey}-10`,
        type: 'expense',
        categoryId: 'cat_food',
        accountId: 'acc-1',
        createdAt: '2026-07-01T00:00:00.000Z',
        updatedAt: '2026-07-01T00:00:00.000Z',
      },
    ]);
    store.goals.set([
      { id: 'goal-1', name: 'Reserva', targetAmount: 1000, currentAmount: 300 },
    ]);

    expect(store.monthSummary().balance).toBe(100);
    expect(store.monthSummary().savingsRate).toBe(10);
    expect(store.monthSummary().status).toBe('warning');
    expect(store.monthSummary().label).toContain('Em ajuste');
  });
});
