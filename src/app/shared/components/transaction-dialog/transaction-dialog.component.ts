import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Account, Category, TransactionType } from '../../../core/models/finance.models';

@Component({
  selector: 'app-transaction-dialog',
  standalone: true,
  imports: [FormsModule, DialogModule, ButtonModule, InputTextModule, InputNumberModule, SelectModule],
  templateUrl: './transaction-dialog.component.html',
  styleUrl: './transaction-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionDialogComponent implements OnChanges {
  @Input({ required: true }) visible = false;
  @Input({ required: true }) categories: Category[] = [];
  @Input({ required: true }) accounts: Account[] = [];
  @Input() locale = 'pt-BR';
  @Input() currency = 'BRL';

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() submitted = new EventEmitter<{
    description: string;
    amount: number;
    date: string;
    type: TransactionType;
    categoryId?: string;
    accountId: string;
    location?: string;
  }>();

  model = {
    description: '',
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    type: 'expense' as TransactionType,
    categoryId: 'auto',
    accountId: '',
    location: '',
  };

  readonly categoryOptions = computed(() => {
    const type = this.model.type;
    return [
      { label: 'Auto (inteligente)', value: 'auto' },
      ...this.categories
        .filter((category) => category.type === 'both' || category.type === type)
        .map((category) => ({ label: category.name, value: category.id })),
    ];
  });

  ngOnChanges(): void {
    if (!this.model.accountId && this.accounts.length) {
      this.model.accountId = this.accounts[0].id;
    }
  }

  close(): void {
    this.visibleChange.emit(false);
  }

  submit(): void {
    const model = this.model;
    if (!model.description || !model.amount || !model.accountId) {
      return;
    }

    this.submitted.emit({
      description: model.description.trim(),
      amount: Math.abs(model.amount),
      date: model.date,
      type: model.type,
      categoryId: model.categoryId,
      accountId: model.accountId,
      location: model.location || undefined,
    });

    this.model = {
      description: '',
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      type: 'expense',
      categoryId: 'auto',
      accountId: this.accounts[0]?.id ?? '',
      location: '',
    };

    this.close();
  }
}
