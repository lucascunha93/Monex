export const formatCurrency = (value: number, locale = 'pt-BR', currency = 'BRL'): string =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);

export const normalizeMoneyInput = (input: string): number => {
  const sanitized = input
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=.*\.)/g, '')
    .replace(',', '.');
  const value = Number(sanitized);
  return Number.isFinite(value) ? Math.abs(value) : 0;
};
