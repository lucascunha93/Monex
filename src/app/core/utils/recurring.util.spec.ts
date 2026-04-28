import { RecurringRule, Transaction } from '../models/finance.models';
import { buildRecurringDate, shouldGenerateForMonth } from './recurring.util';

const baseRule: RecurringRule = {
  id: 'rule_1',
  description: 'Aluguel',
  amount: 1800,
  type: 'expense',
  dayOfMonth: 5,
  startDate: '2024-01-01',
  categoryId: 'cat_housing',
  accountId: 'acc_1',
};

const emptyTransactions: Transaction[] = [];

describe('shouldGenerateForMonth', () => {
  it('should return true when rule has no prior generation and no existing transactions', () => {
    const rule = { ...baseRule, lastGeneratedMonth: undefined };
    expect(shouldGenerateForMonth(rule, '2025-06', emptyTransactions)).toBe(true);
  });

  it('should return false when rule already has lastGeneratedMonth for that month', () => {
    const rule = { ...baseRule, lastGeneratedMonth: '2025-06' };
    expect(shouldGenerateForMonth(rule, '2025-06', emptyTransactions)).toBe(false);
  });

  it('should return false when a matching transaction already exists for that month', () => {
    const existing: Transaction[] = [
      {
        id: 'trx_1',
        description: 'Aluguel',
        amount: 1800,
        date: '2025-06-05',
        type: 'expense',
        categoryId: 'cat_housing',
        accountId: 'acc_1',
        recurringRuleId: 'rule_1',
        createdAt: '',
        updatedAt: '',
      },
    ];
    const rule = { ...baseRule, lastGeneratedMonth: undefined };
    expect(shouldGenerateForMonth(rule, '2025-06', existing)).toBe(false);
  });

  it('should return false when target date is before rule startDate', () => {
    const rule = { ...baseRule, startDate: '2025-07-01', lastGeneratedMonth: undefined };
    expect(shouldGenerateForMonth(rule, '2025-06', emptyTransactions)).toBe(false);
  });

  it('should return false when target date is after rule endDate', () => {
    const rule = { ...baseRule, endDate: '2025-05-31', lastGeneratedMonth: undefined };
    expect(shouldGenerateForMonth(rule, '2025-06', emptyTransactions)).toBe(false);
  });

  it('should return true when target date is exactly on startDate month', () => {
    const rule = { ...baseRule, startDate: '2025-06-01', lastGeneratedMonth: undefined };
    expect(shouldGenerateForMonth(rule, '2025-06', emptyTransactions)).toBe(true);
  });

  it('should return true when target date is exactly on endDate month', () => {
    const rule = { ...baseRule, endDate: '2025-06-30', lastGeneratedMonth: undefined };
    expect(shouldGenerateForMonth(rule, '2025-06', emptyTransactions)).toBe(true);
  });

  it('should handle rules with dayOfMonth exceeding month length (e.g. Feb 31 → Feb 28)', () => {
    const rule = { ...baseRule, dayOfMonth: 31, startDate: '2025-01-01', lastGeneratedMonth: undefined };
    // Feb 2025 only has 28 days — should clamp to day 28
    expect(shouldGenerateForMonth(rule, '2025-02', emptyTransactions)).toBe(true);
  });

  it('should not be affected by transactions of a different rule', () => {
    const existing: Transaction[] = [
      {
        id: 'trx_1',
        description: 'Outro',
        amount: 200,
        date: '2025-06-05',
        type: 'expense',
        categoryId: 'cat_other',
        accountId: 'acc_1',
        recurringRuleId: 'rule_OTHER',
        createdAt: '',
        updatedAt: '',
      },
    ];
    const rule = { ...baseRule, lastGeneratedMonth: undefined };
    expect(shouldGenerateForMonth(rule, '2025-06', existing)).toBe(true);
  });
});

describe('buildRecurringDate', () => {
  it('should return the ISO date for day 5 of June 2025', () => {
    const rule = { ...baseRule, dayOfMonth: 5 };
    expect(buildRecurringDate(rule, '2025-06')).toBe('2025-06-05');
  });

  it('should clamp dayOfMonth to the last day of February', () => {
    const rule = { ...baseRule, dayOfMonth: 31 };
    expect(buildRecurringDate(rule, '2025-02')).toBe('2025-02-28');
  });

  it('should clamp dayOfMonth correctly for leap February', () => {
    const rule = { ...baseRule, dayOfMonth: 30 };
    // 2024 is a leap year — Feb has 29 days
    expect(buildRecurringDate(rule, '2024-02')).toBe('2024-02-29');
  });

  it('should pad single-digit day with zero', () => {
    const rule = { ...baseRule, dayOfMonth: 3 };
    expect(buildRecurringDate(rule, '2025-11')).toBe('2025-11-03');
  });
});
