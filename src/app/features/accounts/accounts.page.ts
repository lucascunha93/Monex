import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { createId } from '../../core/utils/id.util';
import { FinanceStore } from '../../state/finance.store';

@Component({
  selector: 'app-accounts-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, InputTextModule, InputNumberModule, ButtonModule, TableModule],
  templateUrl: './accounts.page.html',
  styleUrl: './accounts.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountsPage {
  draft = {
    name: '',
    type: 'checking' as 'checking' | 'cash' | 'credit',
    openingBalance: 0,
    creditLimit: 0,
    closingDay: 7,
    dueDay: 15,
    color: '#1d4ed8',
  };

  constructor(public readonly store: FinanceStore) {}

  async save(): Promise<void> {
    const model = this.draft;
    if (!model.name.trim()) {
      return;
    }

    await this.store.saveAccount({
      id: createId('acc'),
      name: model.name.trim(),
      type: model.type,
      openingBalance: model.openingBalance,
      creditLimit: model.type === 'credit' ? model.creditLimit : undefined,
      closingDay: model.type === 'credit' ? model.closingDay : undefined,
      dueDay: model.type === 'credit' ? model.dueDay : undefined,
      color: model.color,
    });

    this.draft = {
      name: '',
      type: 'checking',
      openingBalance: 0,
      creditLimit: 0,
      closingDay: 7,
      dueDay: 15,
      color: '#1d4ed8',
    };
  }
}
