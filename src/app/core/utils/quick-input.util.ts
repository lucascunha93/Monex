import { normalizeMoneyInput } from './money.util';

export interface QuickInputResult {
  amount: number;
  description: string;
  inferredType: 'income' | 'expense';
}

const INCOME_HINTS = ['salario', 'freela', 'pix recebido', 'reembolso', 'bonus'];

export const parseQuickInput = (raw: string): QuickInputResult | null => {
  const value = raw.trim();
  if (!value) {
    return null;
  }

  const amountMatch = value.match(/(r\$\s*)?([\d.,]+)/i);
  if (!amountMatch) {
    return null;
  }

  const amount = normalizeMoneyInput(amountMatch[0]);
  const description = value.replace(amountMatch[0], '').replace(/\s+/g, ' ').trim();
  const text = description.toLowerCase();
  const inferredType = INCOME_HINTS.some((hint) => text.includes(hint)) ? 'income' : 'expense';

  return {
    amount,
    description: description || 'Sem descricao',
    inferredType,
  };
};
