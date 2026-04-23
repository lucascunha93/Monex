import { Injectable } from '@angular/core';
import { TransactionType } from '../models/finance.models';
import { CsvColumnMapping, CsvPreviewRow } from '../models/csv.models';

const KNOWN_DATE_HEADERS = ['data', 'date', 'data lancamento', 'data transacao', 'dt', 'data pagamento'];
const KNOWN_DESC_HEADERS = [
  'descricao',
  'description',
  'historico',
  'memo',
  'estabelecimento',
  'lancamento',
  'detalhes',
];
const KNOWN_AMOUNT_HEADERS = ['valor', 'value', 'amount', 'montante', 'debito', 'credito', 'vlr'];
const KNOWN_TYPE_HEADERS = ['tipo', 'type', 'lancamento', 'natureza', 'd/c'];

@Injectable({
  providedIn: 'root',
})
export class CsvParserService {
  detectDelimiter(sample: string): string {
    const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0 };
    const firstLine = sample.split('\n')[0] ?? '';
    for (const char of firstLine) {
      if (char in counts) {
        counts[char]++;
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ',';
  }

  parseRaw(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
    const delimiter = this.detectDelimiter(csvText);
    const lines = csvText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      return { headers: [], rows: [] };
    }

    const headers = this.splitLine(lines[0], delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map((line) => {
      const cells = this.splitLine(line, delimiter).map((cell) => cell.trim().replace(/^"|"$/g, ''));
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = cells[index] ?? '';
      });
      return row;
    });

    return { headers, rows };
  }

  autoDetectMapping(headers: string[]): CsvColumnMapping {
    const normalize = (s: string) => s.toLowerCase().trim();
    const find = (candidates: string[]) =>
      headers.find((h) => candidates.includes(normalize(h))) ?? headers[0] ?? '';

    return {
      dateColumn: find(KNOWN_DATE_HEADERS),
      descriptionColumn: find(KNOWN_DESC_HEADERS),
      amountColumn: find(KNOWN_AMOUNT_HEADERS),
      typeColumn: headers.find((h) => KNOWN_TYPE_HEADERS.includes(normalize(h))),
      defaultType: 'expense',
    };
  }

  buildPreview(rows: Record<string, string>[], mapping: CsvColumnMapping): CsvPreviewRow[] {
    return rows.map((raw) => {
      const dateStr = raw[mapping.dateColumn] ?? '';
      const descStr = raw[mapping.descriptionColumn] ?? '';
      const amountStr = raw[mapping.amountColumn] ?? '';
      const typeStr = mapping.typeColumn ? (raw[mapping.typeColumn] ?? '') : '';

      const date = this.parseDate(dateStr);
      const amount = this.parseAmount(amountStr);
      const type = this.parseType(typeStr, mapping.defaultType);

      const valid = !!date && amount > 0 && descStr.length > 0;
      const validationError = !date
        ? `Data invalida: "${dateStr}"`
        : amount <= 0
          ? `Valor invalido: "${amountStr}"`
          : !descStr
            ? 'Descricao vazia'
            : undefined;

      return {
        raw,
        parsed: {
          date: date ?? dateStr,
          description: descStr,
          amount,
          type,
          valid,
          validationError,
        },
      };
    });
  }

  parseDate(raw: string): string | null {
    if (!raw) return null;

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

    // DD/MM/YYYY or DD-MM-YYYY
    const brMatch = raw.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
    if (brMatch) return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;

    // MM/DD/YYYY (US format)
    const usMatch = raw.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
    if (usMatch) {
      const d = new Date(`${usMatch[3]}-${usMatch[1]}-${usMatch[2]}`);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }

    // Try native parse as last resort
    const native = new Date(raw);
    if (!isNaN(native.getTime())) return native.toISOString().slice(0, 10);

    return null;
  }

  parseAmount(raw: string): number {
    if (!raw) return 0;

    // Remove currency symbol and spaces
    let cleaned = raw.replace(/[R$\s]/g, '');

    // Handle negative amounts presented with parentheses: (1.234,56)
    const isParenNegative = /^\(.*\)$/.test(cleaned);
    cleaned = cleaned.replace(/[()]/g, '');

    // Detect Brazilian format (1.234,56 → dot is thousands, comma is decimal)
    if (/^\d{1,3}(\.\d{3})*(,\d{1,2})?$/.test(cleaned)) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // US/ISO format (1,234.56)
      cleaned = cleaned.replace(/,/g, '');
    }

    const value = parseFloat(cleaned);
    return isNaN(value) ? 0 : isParenNegative ? Math.abs(value) : Math.abs(value);
  }

  parseType(raw: string, defaultType: TransactionType): TransactionType {
    const normalized = raw.toLowerCase().trim();
    const incomeHints = ['c', 'credito', 'credit', 'receita', 'income', 'entrada', '+'];
    const expenseHints = ['d', 'debito', 'debit', 'despesa', 'expense', 'saida', '-'];

    if (incomeHints.includes(normalized)) return 'income';
    if (expenseHints.includes(normalized)) return 'expense';
    return defaultType;
  }

  private splitLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }
}
