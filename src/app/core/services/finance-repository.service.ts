import { Injectable } from '@angular/core';
import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES, DEFAULT_RECURRING_RULES, DEFAULT_SETTINGS } from '../constants/default-data';
import {
  Account,
  Category,
  FinancialGoal,
  RecurringRule,
  SyncQueueItem,
  Transaction,
  UserSettings,
} from '../models/finance.models';
import { IndexedDbService } from './indexeddb.service';

@Injectable({
  providedIn: 'root',
})
export class FinanceRepositoryService {
  constructor(private readonly db: IndexedDbService) {}

  switchUser(userId: string): void {
    this.db.switchUser(userId);
  }

  async bootstrapIfNeeded(): Promise<void> {
    const [accounts, categories, recurring] = await Promise.all([
      this.db.getAll<Account>('accounts'),
      this.db.getAll<Category>('categories'),
      this.db.getAll<RecurringRule>('recurring-rules'),
    ]);

    if (!accounts.length) {
      await this.db.bulkPut('accounts', DEFAULT_ACCOUNTS);
    }
    if (!categories.length) {
      await this.db.bulkPut('categories', DEFAULT_CATEGORIES);
    }
    if (!recurring.length) {
      await this.db.bulkPut('recurring-rules', DEFAULT_RECURRING_RULES);
    }

    const settings = await this.db.getAll<{ id: string } & UserSettings>('settings');
    if (!settings.length) {
      await this.db.put('settings', {
        id: 'default',
        ...DEFAULT_SETTINGS,
      });
    }
  }

  getTransactions(): Promise<Transaction[]> {
    return this.db.getAll<Transaction>('transactions');
  }

  saveTransaction(transaction: Transaction): Promise<void> {
    return this.db.put('transactions', transaction);
  }

  deleteTransaction(id: string): Promise<void> {
    return this.db.delete('transactions', id);
  }

  getAccounts(): Promise<Account[]> {
    return this.db.getAll<Account>('accounts');
  }

  saveAccount(account: Account): Promise<void> {
    return this.db.put('accounts', account);
  }

  getCategories(): Promise<Category[]> {
    return this.db.getAll<Category>('categories');
  }

  saveCategory(category: Category): Promise<void> {
    return this.db.put('categories', category);
  }

  getRecurringRules(): Promise<RecurringRule[]> {
    return this.db.getAll<RecurringRule>('recurring-rules');
  }

  saveRecurringRule(rule: RecurringRule): Promise<void> {
    return this.db.put('recurring-rules', rule);
  }

  getGoals(): Promise<FinancialGoal[]> {
    return this.db.getAll<FinancialGoal>('goals');
  }

  saveGoal(goal: FinancialGoal): Promise<void> {
    return this.db.put('goals', goal);
  }

  getSettings(): Promise<Array<{ id: string } & UserSettings>> {
    return this.db.getAll<Array<{ id: string } & UserSettings>[number]>('settings');
  }

  saveSettings(settings: { id: string } & UserSettings): Promise<void> {
    return this.db.put('settings', settings);
  }

  getQueue(): Promise<SyncQueueItem[]> {
    return this.db.getAll<SyncQueueItem>('sync-queue');
  }

  saveQueueItem(item: SyncQueueItem): Promise<void> {
    return this.db.put('sync-queue', item);
  }

  deleteQueueItem(id: string): Promise<void> {
    return this.db.delete('sync-queue', id);
  }
}
