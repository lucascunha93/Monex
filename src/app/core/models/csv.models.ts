import { TransactionType } from './finance.models';

export interface CsvColumnMapping {
  dateColumn: string;
  descriptionColumn: string;
  amountColumn: string;
  typeColumn?: string;
  defaultType: TransactionType;
}

export interface CsvPreviewRow {
  raw: Record<string, string>;
  parsed: {
    date: string;
    description: string;
    amount: number;
    type: TransactionType;
    valid: boolean;
    validationError?: string;
  };
}

export interface CsvImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}
