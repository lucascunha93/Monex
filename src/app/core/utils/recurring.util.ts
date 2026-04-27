import { RecurringRule, Transaction } from '../models/finance.models';

export function shouldGenerateForMonth(
  rule: RecurringRule,
  monthKey: string,
  existingTransactions: Transaction[],
): boolean {
  if (rule.lastGeneratedMonth === monthKey) {
    return false;
  }

  const [yearRaw, monthRaw] = monthKey.split('-');
  const year = Number(yearRaw);
  const monthNumber = Number(monthRaw);

  const day = Math.min(rule.dayOfMonth, new Date(year, monthNumber, 0).getDate());
  const dateStr = `${monthKey}-${String(day).padStart(2, '0')}`;
  const dateObj = new Date(`${dateStr}T12:00:00`);

  if (dateObj < new Date(rule.startDate)) {
    return false;
  }
  if (rule.endDate && dateObj > new Date(rule.endDate)) {
    return false;
  }

  const alreadyExists = existingTransactions.some(
    (t) => t.recurringRuleId === rule.id && monthKeyFromDate(t.date) === monthKey,
  );

  return !alreadyExists;
}

export function buildRecurringDate(rule: RecurringRule, monthKey: string): string {
  const [yearRaw, monthRaw] = monthKey.split('-');
  const year = Number(yearRaw);
  const monthNumber = Number(monthRaw);
  const day = Math.min(rule.dayOfMonth, new Date(year, monthNumber, 0).getDate());
  return `${monthKey}-${String(day).padStart(2, '0')}`;
}

function monthKeyFromDate(isoDate: string): string {
  return isoDate.slice(0, 7);
}
