import { RecurringRule, Transaction } from '../models/finance.models';

/**
 * Determines whether a recurring rule should generate a transaction for a given month.
 * Conditions to skip:
 *  - Rule already marked as generated for that month
 *  - Rule start date is after the target month's generation date
 *  - Rule end date is before the target month's generation date
 *  - A transaction with this rule's ID already exists for that month
 */
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

/**
 * Builds the ISO date string for a recurring rule's transaction in a given month.
 */
export function buildRecurringDate(rule: RecurringRule, monthKey: string): string {
  const [yearRaw, monthRaw] = monthKey.split('-');
  const year = Number(yearRaw);
  const monthNumber = Number(monthRaw);
  const day = Math.min(rule.dayOfMonth, new Date(year, monthNumber, 0).getDate());
  return `${monthKey}-${String(day).padStart(2, '0')}`;
}

/** Extracts the YYYY-MM key from an ISO date string. */
function monthKeyFromDate(isoDate: string): string {
  return isoDate.slice(0, 7);
}
