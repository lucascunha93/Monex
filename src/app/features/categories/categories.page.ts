import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { createId } from '../../core/utils/id.util';
import { FinanceStore } from '../../state/finance.store';

@Component({
  selector: 'app-categories-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, InputTextModule, SelectModule],
  templateUrl: './categories.page.html',
  styleUrl: './categories.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesPage {
  readonly typeOptions = [
    { label: 'Despesa', value: 'expense' },
    { label: 'Receita', value: 'income' },
    { label: 'Ambos', value: 'both' },
  ];

  readonly typeLabels: Record<string, string> = {
    expense: 'Despesa',
    income: 'Receita',
    both: 'Ambos',
  };

  readonly presetColors = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#3b82f6', '#8b5cf6', '#ec4899', '#0891b2',
    '#14b8a6', '#6366f1', '#84cc16', '#f43f5e',
  ];

  readonly iconOptions = [
    'pi pi-tag', 'pi pi-shopping-cart', 'pi pi-car', 'pi pi-home',
    'pi pi-heart', 'pi pi-briefcase', 'pi pi-chart-line', 'pi pi-graduation-cap',
    'pi pi-ticket', 'pi pi-book', 'pi pi-apple', 'pi pi-bolt',
  ];

  draft = {
    name: '',
    type: 'expense' as 'income' | 'expense' | 'both',
    color: '#0ea5e9',
    icon: 'pi pi-tag',
    keywords: '',
  };

  constructor(public readonly store: FinanceStore) {}

  async save(): Promise<void> {
    const model = this.draft;
    if (!model.name.trim()) {
      return;
    }

    await this.store.saveCategory({
      id: createId('cat'),
      name: model.name,
      type: model.type,
      color: model.color,
      icon: model.icon,
      keywords: model.keywords
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    });

    this.draft = {
      name: '',
      type: 'expense',
      color: '#0ea5e9',
      icon: 'pi pi-tag',
      keywords: '',
    };
  }
}
