export type TransactionType = 'income' | 'expense';

export type AccountType = 'checking' | 'cash' | 'credit';

export interface Category {
  id: string;
  name: string;
  type: TransactionType | 'both';
  color: string;
  icon: string;
  keywords: string[];
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  openingBalance: number;
  color: string;
  creditLimit?: number;
  closingDay?: number;
  dueDay?: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  categoryId: string;
  accountId: string;
  createdAt: string;
  updatedAt: string;
  recurringRuleId?: string;
  installment?: {
    current: number;
    total: number;
  };
  location?: string;
}

export interface RecurringRule {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  accountId: string;
  dayOfMonth: number;
  startDate: string;
  endDate?: string;
  lastGeneratedMonth?: string;
}

export interface SyncQueueItem {
  id: string;
  action: string;
  payload: unknown;
  createdAt: string;
}

export interface TransactionFilters {
  search: string;
  type: TransactionType | 'all';
  categoryId: string;
  accountId: string;
  from?: string;
  to?: string;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  dueDate?: string;
}

export interface UserSettings {
  locale: string;
  currency: string;
  darkMode: boolean;
}
