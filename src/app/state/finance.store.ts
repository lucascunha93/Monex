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
import { DEFAULT_SETTINGS } from '../core/constants/default-data';

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

interface GoalProgressView extends FinancialGoal {
  progress: number;
  remaining: number;
  completed: boolean;
}

interface MonthSummary {
  income: number;
  expense: number;
  balance: number;
  savingsRate: number;
  goalsCompleted: number;
  goalsTotal: number;
  averageGoalProgress: number;
  status: 'healthy' | 'warning' | 'danger';
  label: string;
}

const DEFAULT_USER_SETTINGS: UserSettings = { ...DEFAULT_SETTINGS };

@Injectable({
  providedIn: 'root',
})
export class FinanceStore {
  readonly loading = signal<boolean>(false);
  readonly lastError = signal<string | null>(null);
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

  readonly goalProgress = computed<GoalProgressView[]>(() =>
    this.goals()
      .map((goal) => {
        const progress = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;

        return {
          ...goal,
          progress,
          remaining: Math.max(goal.targetAmount - goal.currentAmount, 0),
          completed: goal.currentAmount >= goal.targetAmount,
        };
      })
      .sort((a, b) => b.progress - a.progress),
  );

  readonly monthSummary = computed<MonthSummary>(() => {
    const income = this.currentMonthIncome();
    const expense = this.currentMonthExpense();
    const balance = income - expense;
    const savingsRate = income > 0 ? Math.max((balance / income) * 100, 0) : 0;
    const goals = this.goalProgress();
    const goalsCompleted = goals.filter((goal) => goal.completed).length;
    const averageGoalProgress = goals.length ? goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length : 0;

    if (balance < 0) {
      return {
        income,
        expense,
        balance,
        savingsRate,
        goalsCompleted,
        goalsTotal: goals.length,
        averageGoalProgress,
        status: 'danger',
        label: 'Atenção: despesas acima da receita',
      };
    }

    if (savingsRate < 20) {
      return {
        income,
        expense,
        balance,
        savingsRate,
        goalsCompleted,
        goalsTotal: goals.length,
        averageGoalProgress,
        status: 'warning',
        label: 'Em ajuste: margem de economia abaixo da meta',
      };
    }

    return {
      income,
      expense,
      balance,
      savingsRate,
      goalsCompleted,
      goalsTotal: goals.length,
      averageGoalProgress,
      status: 'healthy',
      label: 'Saudável: fluxo de caixa controlado',
    };
  });

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
          ? `Seus gastos cresceram ${variation.toFixed(1)}% vs. o mês anterior`
          : `Seus gastos reduziram ${Math.abs(variation).toFixed(1)}% vs. o mês anterior`,
    };
  });

  constructor(
    private readonly repository: FinanceRepositoryService,
    private readonly syncService: OfflineSyncService,
  ) {}

  async init(): Promise<void> {
    this.loading.set(true);
    this.lastError.set(null);
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
        localStorage.setItem('monex_settings', JSON.stringify(settings));
      } else {
        this.settings.set(DEFAULT_USER_SETTINGS);
        localStorage.setItem('monex_settings', JSON.stringify(DEFAULT_USER_SETTINGS));
      }

      await this.generateRecurringTransactions();
      await this.syncService.flushQueue();
      this.lastError.set(null);
    } catch {
      this.lastError.set('Nao foi possivel carregar os dados financeiros.');
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

    const previousTransactions = this.transactions();
    this.transactions.set([...previousTransactions, transaction]);

    await this.persistWithRollback(
      () => this.transactions.set(previousTransactions),
      async () => {
        await this.repository.saveTransaction(transaction);
        await this.syncService.enqueue('transaction:create', transaction);
      },
      'Nao foi possivel salvar a transacao.',
    );
  }

  async removeTransaction(id: string): Promise<void> {
    const previousTransactions = this.transactions();
    this.transactions.set(previousTransactions.filter((item) => item.id !== id));

    await this.persistWithRollback(
      () => this.transactions.set(previousTransactions),
      async () => {
        await this.repository.deleteTransaction(id);
        await this.syncService.enqueue('transaction:delete', { id });
      },
      'Nao foi possivel remover a transacao.',
    );
  }

  async saveAccount(account: Account): Promise<void> {
    const previousAccounts = this.accounts();
    this.accounts.set(
      previousAccounts.some((item) => item.id === account.id)
        ? previousAccounts.map((item) => (item.id === account.id ? account : item))
        : [...previousAccounts, account],
    );

    await this.persistWithRollback(
      () => this.accounts.set(previousAccounts),
      async () => {
        await this.repository.saveAccount(account);
        await this.syncService.enqueue('account:upsert', account);
      },
      'Nao foi possivel salvar a conta.',
    );
  }

  async saveCategory(category: Category): Promise<void> {
    const previousCategories = this.categories();
    this.categories.set(
      previousCategories.some((item) => item.id === category.id)
        ? previousCategories.map((item) => (item.id === category.id ? category : item))
        : [...previousCategories, category],
    );

    await this.persistWithRollback(
      () => this.categories.set(previousCategories),
      async () => {
        await this.repository.saveCategory(category);
        await this.syncService.enqueue('category:upsert', category);
      },
      'Nao foi possivel salvar a categoria.',
    );
  }

  async saveGoal(goal: FinancialGoal): Promise<void> {
    const previousGoals = this.goals();
    this.goals.set(
      previousGoals.some((item) => item.id === goal.id)
        ? previousGoals.map((item) => (item.id === goal.id ? goal : item))
        : [...previousGoals, goal],
    );

    await this.persistWithRollback(
      () => this.goals.set(previousGoals),
      async () => {
        await this.repository.saveGoal(goal);
        await this.syncService.enqueue('goal:upsert', goal);
      },
      'Nao foi possivel salvar a meta.',
    );
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    const previousSettings = this.settings();
    this.settings.set(settings);
    localStorage.setItem('monex_settings', JSON.stringify(settings));

    await this.persistWithRollback(
      () => {
        this.settings.set(previousSettings);
        localStorage.setItem('monex_settings', JSON.stringify(previousSettings));
      },
      async () => {
        await this.repository.saveSettings({ id: 'default', ...settings });
        await this.syncService.enqueue('settings:update', settings);
      },
      'Nao foi possivel salvar as configuracoes.',
    );
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
    try {
      const stored = localStorage.getItem('monex_settings');
      this.settings.set(stored ? JSON.parse(stored) : { locale: 'pt-BR', currency: 'BRL', darkMode: false });
    } catch {
      this.settings.set(DEFAULT_USER_SETTINGS);
    }
    this.filters.set({ search: '', type: 'all', categoryId: 'all', accountId: 'all' });
    this.selectedMonth.set(getCurrentMonthKey());
    this.lastError.set(null);
  }

  clearLastError(): void {
    this.lastError.set(null);
  }

  private fallbackCategory(type: TransactionType): string {
    return fallbackCategoryId(type, this.categories());
  }

  private async persistWithRollback(
    rollback: () => void,
    operation: () => Promise<void>,
    failureMessage: string,
  ): Promise<void> {
    try {
      await operation();
      this.lastError.set(null);
    } catch (error) {
      rollback();
      this.lastError.set(failureMessage);
      throw error;
    }
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
