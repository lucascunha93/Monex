import { Category, Transaction } from '../models/finance.models';
import { fallbackCategoryId, resolveCategoryId } from './category.util';

describe('resolveCategoryId', () => {
  const categories: Category[] = [
    {
      id: 'cat_food',
      name: 'Alimentação',
      type: 'expense',
      color: '#f00',
      icon: 'pi-food',
      keywords: ['mercado', 'supermercado', 'restaurante', 'ifood'],
    },
    {
      id: 'cat_transport',
      name: 'Transporte',
      type: 'expense',
      color: '#00f',
      icon: 'pi-car',
      keywords: ['uber', 'taxi', 'posto', 'combustivel'],
    },
    {
      id: 'cat_salary',
      name: 'Salário',
      type: 'income',
      color: '#0f0',
      icon: 'pi-money',
      keywords: ['salario', 'pagamento', 'salário'],
    },
    {
      id: 'cat_misc',
      name: 'Outros',
      type: 'both',
      color: '#aaa',
      icon: 'pi-circle',
      keywords: [],
    },
  ];

  const emptyHistory: Transaction[] = [];

  describe('keyword matching', () => {
    it('should match by keyword (exact)', () => {
      const result = resolveCategoryId('Compra no mercado', 'expense', categories, emptyHistory);
      expect(result).toBe('cat_food');
    });

    it('should match keyword case-insensitively', () => {
      const result = resolveCategoryId('SUPERMERCADO Extra', 'expense', categories, emptyHistory);
      expect(result).toBe('cat_food');
    });

    it('should match transport keyword', () => {
      const result = resolveCategoryId('Uber viagem centro', 'expense', categories, emptyHistory);
      expect(result).toBe('cat_transport');
    });

    it('should match income keyword', () => {
      const result = resolveCategoryId('Salario mensal empresa', 'income', categories, emptyHistory);
      expect(result).toBe('cat_salary');
    });

    it('should NOT match a category whose type does not match transaction type', () => {
      // 'salario' is income-only category — should not match for expense
      const result = resolveCategoryId('salario', 'expense', categories, emptyHistory);
      expect(result).toBeUndefined();
    });

    it('should match "both" type category for any transaction type', () => {
      const bothCategories: Category[] = [
        { ...categories[3], keywords: ['transferencia'] },
      ];
      const result = resolveCategoryId('Transferencia bancaria', 'expense', bothCategories, emptyHistory);
      expect(result).toBe('cat_misc');
    });
  });

  describe('history matching', () => {
    const history: Transaction[] = [
      {
        id: 'trx_1',
        description: 'Academia Smart Fit',
        amount: 89.9,
        date: '2025-01-10',
        type: 'expense',
        categoryId: 'cat_health',
        accountId: 'acc_1',
        createdAt: '',
        updatedAt: '',
      },
    ];

    it('should find category from history when description matches', () => {
      const result = resolveCategoryId('academia Smart Fit', 'expense', [], history);
      expect(result).toBe('cat_health');
    });

    it('should NOT match history for different transaction type', () => {
      const result = resolveCategoryId('Academia Smart Fit', 'income', [], history);
      expect(result).toBeUndefined();
    });

    it('should return undefined when no keyword and no history match', () => {
      const result = resolveCategoryId('Pagamento desconhecido xpto', 'expense', categories, emptyHistory);
      expect(result).toBeUndefined();
    });

    it('keyword match takes priority over history match', () => {
      const historyWithDifferentCategory: Transaction[] = [
        {
          id: 'trx_2',
          description: 'mercado',
          amount: 50,
          date: '2025-01-01',
          type: 'expense',
          categoryId: 'cat_misc', // different from keyword-resolved cat_food
          accountId: 'acc_1',
          createdAt: '',
          updatedAt: '',
        },
      ];
      const result = resolveCategoryId('mercado extra', 'expense', categories, historyWithDifferentCategory);
      expect(result).toBe('cat_food'); // keyword wins
    });
  });
});

describe('fallbackCategoryId', () => {
  const categories: Category[] = [
    { id: 'cat_income', name: 'Receita', type: 'income', color: '', icon: '', keywords: [] },
    { id: 'cat_expense', name: 'Despesa', type: 'expense', color: '', icon: '', keywords: [] },
    { id: 'cat_both', name: 'Misc', type: 'both', color: '', icon: '', keywords: [] },
  ];

  it('should return category matching the type', () => {
    expect(fallbackCategoryId('income', categories)).toBe('cat_income');
    expect(fallbackCategoryId('expense', categories)).toBe('cat_expense');
  });

  it('should fall back to "both" type when no direct match', () => {
    const onlyBoth: Category[] = [{ id: 'cat_both', name: 'Misc', type: 'both', color: '', icon: '', keywords: [] }];
    expect(fallbackCategoryId('income', onlyBoth)).toBe('cat_both');
  });

  it('should fall back to first category when nothing else matches', () => {
    const onlyExpense: Category[] = [
      { id: 'cat_expense', name: 'Despesa', type: 'expense', color: '', icon: '', keywords: [] },
    ];
    expect(fallbackCategoryId('income', onlyExpense)).toBe('cat_expense');
  });

  it('should return empty string for empty array', () => {
    expect(fallbackCategoryId('expense', [])).toBe('');
  });
});
