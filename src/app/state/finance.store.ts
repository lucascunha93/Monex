import { Injectable, computed, signal } from '@angular/core';
import { FinanceRepositoryService } from '../core/services/finance-repository.service';
import { OfflineSyncService } from '../core/services/offline-sync.service';
import {
  Account,
  Category,
  FinancialGoal,
  RecurringRule,
  Transaction,
  TransactionFilters,
  TransactionType,
  UserSettings,
} from '../core/models/finance.models';
import { createId } from '../core/utils/id.util';
import { getCurrentMonthKey, monthKeyFromDate } from '../core/utils/date.util';
import { resolveCategoryId, fallbackCategoryId } from '../core/utils/category.util';
import { shouldGenerateForMonth, buildRecurringDate } from '../core/utils/recurring.util';

interface AddTransactionInput {
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  categoryId?: string;
  accountId: string;
  recurringRuleId?: string;
  location?: string;
}

@Injectable({
  providedIn: 'root',
})
export class FinanceStore {
  readonly loading = signal<boolean>(false);
  readonly transactions = signal<Transaction[]>([]);
  readonly accounts = signal<Account[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly recurringRules = signal<RecurringRule[]>([]);
  readonly goals = signal<FinancialGoal[]>([]);
  readonly selectedMonth = signal<string>(getCurrentMonthKey());
  readonly settings = signal<UserSettings>({
    locale: 'pt-BR',
    currency: 'BRL',
    darkMode: false,
  });

  readonly filters = signal<TransactionFilters>({
    search: '',
    type: 'all',
    categoryId: 'all',
    accountId: 'all',
  });

  readonly transactionsByMonth = computed(() => {
    const month = this.selectedMonth();
    return this.transactions().filter((transaction) => monthKeyFromDate(transaction.date) === month);
  });

  readonly filteredTransactions = computed(() => {
    const source = this.transactionsByMonth();
    const filters = this.filters();

    return source
      .filter((transaction) => {
        if (filters.type !== 'all' && transaction.type !== filters.type) {
          return false;
        }
        if (filters.categoryId !== 'all' && transaction.categoryId !== filters.categoryId) {
          return false;
        }
        if (filters.accountId !== 'all' && transaction.accountId !== filters.accountId) {
          return false;
        }
        if (filters.from && transaction.date < filters.from) {
          return false;
        }
        if (filters.to && transaction.date > filters.to) {
          return false;
        }
        if (filters.search) {
          const text = `${transaction.description}`.toLowerCase();
          if (!text.includes(filters.search.toLowerCase())) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  });

  readonly currentMonthIncome = computed(() =>
    this.transactionsByMonth()
      .filter((transaction) => transaction.type === 'income')
      .reduce((sum, transaction) => sum + transaction.amount, 0),
  );

  readonly currentMonthExpense = computed(() =>
    this.transactionsByMonth()
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + transaction.amount, 0),
  );

  readonly consolidatedBalance = computed(() => {
    const accountBase = this.accounts().reduce((sum, account) => sum + account.openingBalance, 0);
    const movement = this.transactions().reduce((sum, transaction) => {
      return sum + (transaction.type === 'income' ? transaction.amount : -transaction.amount);
    }, 0);
    return accountBase + movement;
  });

  readonly categoryBreakdown = computed(() => {
    const expenseMap = new Map<string, number>();
    for (const transaction of this.transactionsByMonth()) {
      if (transaction.type !== 'expense') {
        continue;
      }
      const current = expenseMap.get(transaction.categoryId) ?? 0;
      expenseMap.set(transaction.categoryId, current + transaction.amount);
    }

    return Array.from(expenseMap.entries())
      .map(([categoryId, total]) => ({
        categoryId,
        total,
        category: this.categories().find((item) => item.id === categoryId),
      }))
      .sort((a, b) => b.total - a.total);
  });

  readonly insights = computed(() => {
    const currentMonth = this.selectedMonth();
    const [yearRaw, monthRaw] = currentMonth.split('-');
    const monthIndex = Number(monthRaw);
    const year = Number(yearRaw);
    const previousMonth = monthIndex === 1 ? `${year - 1}-12` : `${year}-${String(monthIndex - 1).padStart(2, '0')}`;

    const currentExpense = this.transactions()
      .filter((transaction) => transaction.type === 'expense' && monthKeyFromDate(transaction.date) === currentMonth)
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const previousExpense = this.transactions()
      .filter((transaction) => transaction.type === 'expense' && monthKeyFromDate(transaction.date) === previousMonth)
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const variation = previousExpense > 0 ? ((currentExpense - previousExpense) / previousExpense) * 100 : 0;
    const topCategory = this.categoryBreakdown()[0];

    return {
      variation,
      topCategory,
      message:
        variation > 0
          ? `Seus gastos cresceram ${variation.toFixed(1)}% vs mes anterior`
          : `Seus gastos reduziram ${Math.abs(variation).toFixed(1)}% vs mes anterior`,
    };
  });

  constructor(
    private readonly repository: FinanceRepositoryService,
    private readonly syncService: OfflineSyncService,
  ) {}

  async init(): Promise<void> {
    this.loading.set(true);
    try {
      await this.repository.bootstrapIfNeeded();
      const [transactions, accounts, categories, recurringRules, goals, settingsList] = await Promise.all([
        this.repository.getTransactions(),
        this.repository.getAccounts(),
        this.repository.getCategories(),
        this.repository.getRecurringRules(),
        this.repository.getGoals(),
        this.repository.getSettings(),
      ]);

      this.transactions.set(transactions);
      this.accounts.set(accounts);
      this.categories.set(categories);
      this.recurringRules.set(recurringRules);
      this.goals.set(goals);
      if (settingsList.length) {
        const { id: _id, ...settings } = settingsList[0];
        this.settings.set(settings);
      }

      await this.generateRecurringTransactions();
      await this.syncService.flushQueue();
    } finally {
      this.loading.set(false);
    }
  }

  setSelectedMonth(monthKey: string): void {
    this.selectedMonth.set(monthKey);
  }

  navigateMonth(direction: -1 | 1): void {
    const [yearRaw, monthRaw] = this.selectedMonth().split('-');
    const date = new Date(Number(yearRaw), Number(monthRaw) - 1 + direction, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    this.selectedMonth.set(key);
  }

  updateFilters(partial: Partial<TransactionFilters>): void {
    this.filters.update((current) => ({ ...current, ...partial }));
  }

  resetFilters(): void {
    this.filters.set({
      search: '',
      type: 'all',
      categoryId: 'all',
      accountId: 'all',
    });
  }

  private smartCategory(description: string, type: TransactionType): string | undefined {
    return resolveCategoryId(description, type, this.categories(), this.transactions());
  }

  async addTransaction(input: AddTransactionInput): Promise<void> {
    const now = new Date().toISOString();
    const categoryId =
      input.categoryId && input.categoryId !== 'auto'
        ? input.categoryId
        : this.smartCategory(input.description, input.type) ?? this.fallbackCategory(input.type);

    const transaction: Transaction = {
      id: createId('trx'),
      description: input.description,
      amount: input.amount,
      date: input.date,
      type: input.type,
      categoryId,
      accountId: input.accountId,
      createdAt: now,
      updatedAt: now,
      recurringRuleId: input.recurringRuleId,
      location: input.location,
    };

    this.transactions.update((current) => [...current, transaction]);
    await this.repository.saveTransaction(transaction);
    await this.syncService.enqueue('transaction:create', transaction);
  }

  async removeTransaction(id: string): Promise<void> {
    this.transactions.update((current) => current.filter((item) => item.id !== id));
    await this.repository.deleteTransaction(id);
    await this.syncService.enqueue('transaction:delete', { id });
  }

  async saveAccount(account: Account): Promise<void> {
    this.accounts.update((current) => {
      const exists = current.some((item) => item.id === account.id);
      return exists ? current.map((item) => (item.id === account.id ? account : item)) : [...current, account];
    });
    await this.repository.saveAccount(account);
    await this.syncService.enqueue('account:upsert', account);
  }

  async saveCategory(category: Category): Promise<void> {
    this.categories.update((current) => {
      const exists = current.some((item) => item.id === category.id);
      return exists ? current.map((item) => (item.id === category.id ? category : item)) : [...current, category];
    });
    await this.repository.saveCategory(category);
    await this.syncService.enqueue('category:upsert', category);
  }

  async saveGoal(goal: FinancialGoal): Promise<void> {
    this.goals.update((current) => {
      const exists = current.some((item) => item.id === goal.id);
      return exists ? current.map((item) => (item.id === goal.id ? goal : item)) : [...current, goal];
    });
    await this.repository.saveGoal(goal);
    await this.syncService.enqueue('goal:upsert', goal);
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    this.settings.set(settings);
    await this.repository.saveSettings({ id: 'default', ...settings });
    await this.syncService.enqueue('settings:update', settings);
  }

  switchUser(userId: string): void {
    this.repository.switchUser(userId);
    this.clear();
  }

  clear(): void {
    this.transactions.set([]);
    this.accounts.set([]);
    this.categories.set([]);
    this.recurringRules.set([]);
    this.goals.set([]);
    this.settings.set({ locale: 'pt-BR', currency: 'BRL', darkMode: false });
    this.filters.set({ search: '', type: 'all', categoryId: 'all', accountId: 'all' });
    this.selectedMonth.set(getCurrentMonthKey());
  }

  private fallbackCategory(type: TransactionType): string {
    return fallbackCategoryId(type, this.categories());
  }

  private async generateRecurringTransactions(): Promise<void> {
    const month = this.selectedMonth();

    for (const rule of this.recurringRules()) {
      if (!shouldGenerateForMonth(rule, month, this.transactions())) {
        continue;
      }

      const date = buildRecurringDate(rule, month);

      await this.addTransaction({
        description: rule.description,
        amount: rule.amount,
        date,
        type: rule.type,
        categoryId: rule.categoryId,
        accountId: rule.accountId,
        recurringRuleId: rule.id,
      });

      const updatedRule: RecurringRule = {
        ...rule,
        lastGeneratedMonth: month,
      };
      this.recurringRules.update((current) => current.map((item) => (item.id === rule.id ? updatedRule : item)));
      await this.repository.saveRecurringRule(updatedRule);
    }
  }
}
