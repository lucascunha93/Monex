import { Injectable } from '@angular/core';
import { FinanceStore } from '../../state/finance.store';
import { formatCurrency } from '../utils/money.util';
import { MONTH_LABELS } from '../utils/date.util';

/**
 * Centraliza toda a formatação dependente de locale/moeda do usuário.
 * Substitui os métodos money() / formatDate() / categoryName()
 * que estavam duplicados em cada page component.
 */
@Injectable({ providedIn: 'root' })
export class FormatService {
  constructor(private readonly store: FinanceStore) {}

  /** Moeda corrente do usuário. */
  get currency(): string {
    return this.store.settings().currency;
  }

  /** Locale corrente do usuário. */
  get locale(): string {
    return this.store.settings().locale;
  }

  /** Formata um número como moeda (ex: R$ 1.200,00). */
  money(value: number): string {
    return formatCurrency(value, this.locale, this.currency);
  }

  /** Formata uma data ISO (YYYY-MM-DD) para exibição local (ex: 01/06/2025). */
  date(isoDate: string): string {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Intl.DateTimeFormat(this.locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(year, month - 1, day));
  }

  /** Retorna o nome do mês + ano para uma chave YYYY-MM (ex: "Janeiro 2025"). */
  monthLabel(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    return `${MONTH_LABELS[month] ?? month} ${year}`;
  }

  /** Retorna abreviação de 3 letras do mês para uma chave YYYY-MM (ex: "Jan"). */
  shortMonthLabel(monthKey: string): string {
    const month = monthKey.split('-').pop() ?? '';
    return MONTH_LABELS[month]?.slice(0, 3) ?? month;
  }

  /** Retorna o nome de uma categoria pelo id (com fallback seguro). */
  categoryName(id: string): string {
    return this.store.categories().find((c) => c.id === id)?.name ?? 'Sem categoria';
  }
}
