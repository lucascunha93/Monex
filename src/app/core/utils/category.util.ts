import { Category, Transaction, TransactionType } from '../models/finance.models';

/**
 * Resolves a category ID for a transaction using two strategies:
 * 1. Keyword matching against category keywords (priority)
 * 2. History matching — finds a prior transaction with similar description
 *
 * Returns `undefined` if no match found, so callers can apply a fallback.
 */
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

/**
 * Returns the fallback category ID for a given type.
 * Picks the first category matching the type, then falls back to `'both'`, then the first category.
 */
export function fallbackCategoryId(type: TransactionType, categories: Category[]): string {
  const candidate = categories.find((c) => c.type === type || c.type === 'both');
  return candidate?.id ?? categories[0]?.id ?? '';
}
