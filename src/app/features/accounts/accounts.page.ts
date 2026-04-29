import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { createId } from '../../core/utils/id.util';
import { FinanceStore } from '../../state/finance.store';
import { FormatService } from '../../core/services/format.service';

@Component({
  selector: 'app-accounts-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, InputTextModule, InputNumberModule, SelectModule],
  templateUrl: './accounts.page.html',
  styleUrl: './accounts.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountsPage {
  readonly accountTypeOptions = [
    { label: 'Conta bancaria', value: 'checking', icon: 'pi pi-building-columns' },
    { label: 'Dinheiro / Carteira', value: 'cash', icon: 'pi pi-wallet' },
    { label: 'Cartao de credito', value: 'credit', icon: 'pi pi-credit-card' },
  ];

  readonly accountTypeLabels: Record<string, string> = {
    checking: 'Banco',
    cash: 'Dinheiro',
    credit: 'Credito',
  };

  readonly accountTypeIcons: Record<string, string> = {
    checking: 'pi pi-building-columns',
    cash: 'pi pi-wallet',
    credit: 'pi pi-credit-card',
  };

  readonly accountColors = [
    '#2563eb', '#16a34a', '#dc2626', '#9333ea',
    '#ea580c', '#0891b2', '#be185d', '#854d0e',
  ];

  draft = {
    name: '',
    type: 'checking' as 'checking' | 'cash' | 'credit',
    openingBalance: 0,
    creditLimit: 0,
    closingDay: 7,
    dueDay: 15,
    color: '#1d4ed8',
  };

  constructor(public readonly store: FinanceStore, public readonly fmt: FormatService) {}

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
