export const monthKeyFromDate = (isoDate: string): string => isoDate.slice(0, 7);

export const getCurrentMonthKey = (): string => new Date().toISOString().slice(0, 7);

export const getFirstDayOfMonth = (monthKey: string): string => `${monthKey}-01`;

export const getLastDayOfMonth = (monthKey: string): string => {
  const [yearRaw, monthRaw] = monthKey.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const lastDay = new Date(year, month, 0).getDate();
  return `${monthKey}-${String(lastDay).padStart(2, '0')}`;
};

export const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

export const MONTH_LABELS: Record<string, string> = {
  '01': 'Janeiro',  '02': 'Fevereiro', '03': 'Marco',    '04': 'Abril',
  '05': 'Maio',     '06': 'Junho',     '07': 'Julho',    '08': 'Agosto',
  '09': 'Setembro', '10': 'Outubro',   '11': 'Novembro', '12': 'Dezembro',
};
