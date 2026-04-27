import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { CsvColumnMapping, CsvPreviewRow } from '../../core/models/csv.models';
import { CsvParserService } from '../../core/services/csv-parser.service';
import { FinanceStore } from '../../state/finance.store';

interface ImportState {
  step: 'upload' | 'map' | 'preview' | 'done';
  headers: string[];
  rawRows: Record<string, string>[];
  mapping: CsvColumnMapping;
  preview: CsvPreviewRow[];
  result: { imported: number; skipped: number } | null;
}

@Component({
  selector: 'app-import-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, SelectModule, TableModule],
  templateUrl: './import.page.html',
  styleUrl: './import.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportPage {
  readonly state = signal<ImportState>({
    step: 'upload',
    headers: [],
    rawRows: [],
    mapping: { dateColumn: '', descriptionColumn: '', amountColumn: '', defaultType: 'expense' },
    preview: [],
    result: null,
  });

  readonly validPreviewRows = computed(() => this.state().preview.filter((row) => row.parsed.valid));
  readonly invalidPreviewRows = computed(() => this.state().preview.filter((row) => !row.parsed.valid));
  readonly selectedAccountId = signal<string>('');
  readonly importing = signal(false);

  readonly typeOptions = [
    { label: 'Despesa', value: 'expense' },
    { label: 'Receita', value: 'income' },
  ];

  readonly typeColumnOptions = computed(() => [
    { label: '— Nenhuma —', value: null as string | null },
    ...this.state().headers.map((h) => ({ label: h, value: h })),
  ]);

  readonly typeColumnValue = computed(() => this.state().mapping.typeColumn ?? null);

  constructor(
    private readonly parser: CsvParserService,
    public readonly store: FinanceStore,
  ) {
    if (store.accounts().length) {
      this.selectedAccountId.set(store.accounts()[0].id);
    }
  }

  money(value: number): string {
    return new Intl.NumberFormat(this.store.settings().locale, {
      style: 'currency',
      currency: this.store.settings().currency,
      maximumFractionDigits: 2,
    }).format(value);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? '';
      const { headers, rows } = this.parser.parseRaw(text);
      const mapping = this.parser.autoDetectMapping(headers);
      this.state.update((current) => ({
        ...current,
        step: 'map',
        headers,
        rawRows: rows,
        mapping,
        preview: [],
      }));
    };
    reader.readAsText(file, 'UTF-8');
  }

  buildPreview(): void {
    const { rawRows, mapping } = this.state();
    const preview = this.parser.buildPreview(rawRows, mapping);
    this.state.update((current) => ({ ...current, step: 'preview', preview }));
  }

  async confirmImport(): Promise<void> {
    this.importing.set(true);
    const accountId = this.selectedAccountId();
    const validRows = this.validPreviewRows();
    let imported = 0;
    let skipped = 0;

    for (const row of this.state().preview) {
      if (!row.parsed.valid) {
        skipped++;
        continue;
      }
      await this.store.addTransaction({
        description: row.parsed.description,
        amount: row.parsed.amount,
        date: row.parsed.date,
        type: row.parsed.type,
        accountId,
      });
      imported++;
    }

    this.importing.set(false);
    this.state.update((current) => ({
      ...current,
      step: 'done',
      result: { imported, skipped },
    }));
  }

  restart(): void {
    this.state.set({
      step: 'upload',
      headers: [],
      rawRows: [],
      mapping: { dateColumn: '', descriptionColumn: '', amountColumn: '', defaultType: 'expense' },
      preview: [],
      result: null,
    });
  }

  backToMap(): void {
    this.state.update((current) => ({ ...current, step: 'map' }));
  }

  updateMapping(key: keyof CsvColumnMapping, value: string): void {
    this.state.update((current) => ({ ...current, mapping: { ...current.mapping, [key]: value } }));
  }
}
