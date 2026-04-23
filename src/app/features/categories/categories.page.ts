import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { createId } from '../../core/utils/id.util';
import { FinanceStore } from '../../state/finance.store';

@Component({
  selector: 'app-categories-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, InputTextModule, ButtonModule, TableModule],
  templateUrl: './categories.page.html',
  styleUrl: './categories.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesPage {
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
