import { TestBed } from '@angular/core/testing';
import { CsvParserService } from './csv-parser.service';

describe('CsvParserService', () => {
  let service: CsvParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CsvParserService);
  });

  // ─── detectDelimiter ───────────────────────────────────────────────────────

  describe('detectDelimiter', () => {
    it('should detect comma', () => {
      expect(service.detectDelimiter('col1,col2,col3\nval1,val2,val3')).toBe(',');
    });

    it('should detect semicolon', () => {
      expect(service.detectDelimiter('col1;col2;col3\nval1;val2;val3')).toBe(';');
    });

    it('should detect tab', () => {
      expect(service.detectDelimiter('col1\tcol2\tcol3\nval1\tval2\tval3')).toBe('\t');
    });
  });

  // ─── parseRaw ──────────────────────────────────────────────────────────────

  describe('parseRaw', () => {
    it('should parse CSV with comma delimiter', () => {
      const csv = 'Data,Descricao,Valor\n01/06/2025,Mercado,150.00\n02/06/2025,Uber,30.50';
      const { headers, rows } = service.parseRaw(csv);
      expect(headers).toEqual(['Data', 'Descricao', 'Valor']);
      expect(rows.length).toBe(2);
      expect(rows[0]['Descricao']).toBe('Mercado');
    });

    it('should parse CSV with semicolon delimiter', () => {
      const csv = 'Data;Descricao;Valor\n01/06/2025;Aluguel;1800,00';
      const { rows } = service.parseRaw(csv);
      expect(rows[0]['Descricao']).toBe('Aluguel');
      expect(rows[0]['Valor']).toBe('1800,00');
    });

    it('should handle quoted fields containing delimiter', () => {
      const csv = 'Data,Descricao,Valor\n2025-06-01,"Loja, Centro",500.00';
      const { rows } = service.parseRaw(csv);
      expect(rows[0]['Descricao']).toBe('Loja, Centro');
    });

    it('should return empty for single-line input (no data rows)', () => {
      const { rows } = service.parseRaw('only,headers');
      expect(rows.length).toBe(0);
    });
  });

  // ─── autoDetectMapping ─────────────────────────────────────────────────────

  describe('autoDetectMapping', () => {
    it('should auto-detect Brazilian bank statement headers', () => {
      const headers = ['Data', 'Historico', 'Valor', 'Tipo'];
      const mapping = service.autoDetectMapping(headers);
      expect(mapping.dateColumn).toBe('Data');
      expect(mapping.descriptionColumn).toBe('Historico');
      expect(mapping.amountColumn).toBe('Valor');
      expect(mapping.typeColumn).toBe('Tipo');
    });

    it('should auto-detect English headers', () => {
      const headers = ['Date', 'Description', 'Amount', 'Type'];
      const mapping = service.autoDetectMapping(headers);
      expect(mapping.dateColumn).toBe('Date');
      expect(mapping.descriptionColumn).toBe('Description');
      expect(mapping.amountColumn).toBe('Amount');
    });
  });

  // ─── parseDate ─────────────────────────────────────────────────────────────

  describe('parseDate', () => {
    it('should parse DD/MM/YYYY format', () => {
      expect(service.parseDate('01/06/2025')).toBe('2025-06-01');
    });

    it('should parse DD-MM-YYYY format', () => {
      expect(service.parseDate('15-03-2024')).toBe('2024-03-15');
    });

    it('should pass through ISO YYYY-MM-DD format', () => {
      expect(service.parseDate('2025-06-01')).toBe('2025-06-01');
    });

    it('should return null for invalid date', () => {
      expect(service.parseDate('not-a-date')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(service.parseDate('')).toBeNull();
    });
  });

  // ─── parseAmount ───────────────────────────────────────────────────────────

  describe('parseAmount', () => {
    it('should parse ISO decimal format (1234.56)', () => {
      expect(service.parseAmount('1234.56')).toBeCloseTo(1234.56);
    });

    it('should parse Brazilian format (1.234,56)', () => {
      expect(service.parseAmount('1.234,56')).toBeCloseTo(1234.56);
    });

    it('should parse amount with currency symbol (R$ 50,00)', () => {
      expect(service.parseAmount('R$ 50,00')).toBeCloseTo(50.0);
    });

    it('should parse negative amount expressed as parentheses (1.500,00)', () => {
      expect(service.parseAmount('(1.500,00)')).toBeCloseTo(1500.0);
    });

    it('should return 0 for empty string', () => {
      expect(service.parseAmount('')).toBe(0);
    });

    it('should return 0 for invalid input', () => {
      expect(service.parseAmount('abc')).toBe(0);
    });
  });

  // ─── parseType ─────────────────────────────────────────────────────────────

  describe('parseType', () => {
    it('should detect "C" as income', () => {
      expect(service.parseType('C', 'expense')).toBe('income');
    });

    it('should detect "D" as expense', () => {
      expect(service.parseType('D', 'income')).toBe('expense');
    });

    it('should detect "credito" as income', () => {
      expect(service.parseType('credito', 'expense')).toBe('income');
    });

    it('should detect "debito" as expense', () => {
      expect(service.parseType('debito', 'income')).toBe('expense');
    });

    it('should fall back to default type for unrecognized values', () => {
      expect(service.parseType('unknown', 'income')).toBe('income');
      expect(service.parseType('', 'expense')).toBe('expense');
    });
  });

  // ─── buildPreview ──────────────────────────────────────────────────────────

  describe('buildPreview', () => {
    it('should mark row as valid when all fields parse correctly', () => {
      const rows = [{ Data: '01/06/2025', Descricao: 'Mercado', Valor: '150,00' }];
      const mapping = { dateColumn: 'Data', descriptionColumn: 'Descricao', amountColumn: 'Valor', defaultType: 'expense' as const };
      const preview = service.buildPreview(rows, mapping);
      expect(preview[0].parsed.valid).toBe(true);
      expect(preview[0].parsed.amount).toBeCloseTo(150.0);
      expect(preview[0].parsed.date).toBe('2025-06-01');
    });

    it('should mark row as invalid when date is unparseable', () => {
      const rows = [{ Data: 'invalid', Descricao: 'Mercado', Valor: '150,00' }];
      const mapping = { dateColumn: 'Data', descriptionColumn: 'Descricao', amountColumn: 'Valor', defaultType: 'expense' as const };
      const preview = service.buildPreview(rows, mapping);
      expect(preview[0].parsed.valid).toBe(false);
      expect(preview[0].parsed.validationError).toContain('Data invalida');
    });

    it('should mark row as invalid when amount is 0', () => {
      const rows = [{ Data: '01/06/2025', Descricao: 'Mercado', Valor: 'abc' }];
      const mapping = { dateColumn: 'Data', descriptionColumn: 'Descricao', amountColumn: 'Valor', defaultType: 'expense' as const };
      const preview = service.buildPreview(rows, mapping);
      expect(preview[0].parsed.valid).toBe(false);
    });

    it('should apply type column mapping when provided', () => {
      const rows = [{ Data: '01/06/2025', Descricao: 'Salario', Valor: '3000', Tipo: 'C' }];
      const mapping = {
        dateColumn: 'Data',
        descriptionColumn: 'Descricao',
        amountColumn: 'Valor',
        typeColumn: 'Tipo',
        defaultType: 'expense' as const,
      };
      const preview = service.buildPreview(rows, mapping);
      expect(preview[0].parsed.type).toBe('income');
    });
  });
});
