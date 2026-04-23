import { ChangeDetectionStrategy, Component, EventEmitter, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { parseQuickInput } from '../../../core/utils/quick-input.util';

@Component({
  selector: 'app-quick-entry',
  standalone: true,
  imports: [FormsModule, InputTextModule, ButtonModule],
  templateUrl: './quick-entry.component.html',
  styleUrl: './quick-entry.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickEntryComponent {
  readonly inputValue = signal<string>('');

  @Output() quickParsed = new EventEmitter<{
    description: string;
    amount: number;
    inferredType: 'income' | 'expense';
  }>();

  submit(): void {
    const parsed = parseQuickInput(this.inputValue());
    if (!parsed) {
      return;
    }
    this.quickParsed.emit(parsed);
    this.inputValue.set('');
  }
}
