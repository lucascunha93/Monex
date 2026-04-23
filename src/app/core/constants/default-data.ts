import { Account, Category, RecurringRule, UserSettings } from '../models/finance.models';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_food', name: 'Alimentacao', type: 'expense', color: '#ef4444', icon: 'pi pi-shopping-bag', keywords: ['mercado', 'ifood', 'restaurante', 'lanche'] },
  { id: 'cat_transport', name: 'Transporte', type: 'expense', color: '#f59e0b', icon: 'pi pi-car', keywords: ['uber', '99', 'combustivel', 'taxi'] },
  { id: 'cat_home', name: 'Casa', type: 'expense', color: '#a855f7', icon: 'pi pi-home', keywords: ['aluguel', 'energia', 'agua', 'internet'] },
  { id: 'cat_health', name: 'Saude', type: 'expense', color: '#06b6d4', icon: 'pi pi-heart', keywords: ['farmacia', 'consulta', 'plano'] },
  { id: 'cat_salary', name: 'Salario', type: 'income', color: '#22c55e', icon: 'pi pi-wallet', keywords: ['salario', 'pagamento', 'holerite'] },
  { id: 'cat_freelance', name: 'Freela', type: 'income', color: '#10b981', icon: 'pi pi-briefcase', keywords: ['freela', 'projeto', 'cliente'] },
  { id: 'cat_investments', name: 'Investimentos', type: 'income', color: '#3b82f6', icon: 'pi pi-chart-line', keywords: ['juros', 'dividendos', 'invest'] },
];

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'acc_checking', name: 'Banco Principal', type: 'checking', openingBalance: 2500, color: '#3b82f6' },
  { id: 'acc_cash', name: 'Carteira', type: 'cash', openingBalance: 300, color: '#f97316' },
  {
    id: 'acc_card',
    name: 'Cartao Platinum',
    type: 'credit',
    openingBalance: 0,
    creditLimit: 5000,
    closingDay: 7,
    dueDay: 15,
    color: '#e11d48',
  },
];

export const DEFAULT_RECURRING_RULES: RecurringRule[] = [
  {
    id: 'rec_rent',
    description: 'Aluguel',
    amount: 1800,
    type: 'expense',
    categoryId: 'cat_home',
    accountId: 'acc_checking',
    dayOfMonth: 5,
    startDate: '2026-01-01',
    lastGeneratedMonth: undefined,
  },
];

export const DEFAULT_SETTINGS: UserSettings = {
  locale: 'pt-BR',
  currency: 'BRL',
  darkMode: false,
};
