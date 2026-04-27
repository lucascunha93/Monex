import { Category, Transaction, TransactionType } from '../models/finance.models';

export function resolveCategoryId(
  description: string,
  type: TransactionType,
  categories: Category[],
  history: Transaction[],
): string | undefined {
  const text = description.toLowerCase();

  const byKeyword = categories.find((category) => {
    const typeMatches = category.type === 'both' || category.type === type;
    return typeMatches && category.keywords.some((keyword) => text.includes(keyword.toLowerCase()));
  });

  if (byKeyword) {
    return byKeyword.id;
  }

  const fromHistory = history
    .filter((t) => t.type === type)
    .find((t) => text.includes(t.description.toLowerCase()) || t.description.toLowerCase().includes(text));

  return fromHistory?.categoryId;
}

export function fallbackCategoryId(type: TransactionType, categories: Category[]): string {
  const candidate = categories.find((c) => c.type === type || c.type === 'both');
  return candidate?.id ?? categories[0]?.id ?? '';
}
