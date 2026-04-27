import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FinanceStore } from '../../state/finance.store';
import { OfflineSyncService } from '../../core/services/offline-sync.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, SelectModule, ToggleSwitchModule],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage implements OnInit {
  model = { ...this.store.settings() };

  readonly localeOptions = [
    { label: 'Portugues - BR (pt-BR)', value: 'pt-BR' },
    { label: 'Ingles - US (en-US)', value: 'en-US' },
  ];

  readonly currencyOptions = [
    { label: 'Real Brasileiro (BRL)', value: 'BRL' },
    { label: 'Dolar Americano (USD)', value: 'USD' },
    { label: 'Euro (EUR)', value: 'EUR' },
  ];

  constructor(
    public readonly store: FinanceStore,
    public readonly sync: OfflineSyncService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Re-sync model in case store.init() loaded settings after component creation
    this.model = { ...this.store.settings() };
    this.cdr.markForCheck();
  }

  async save(): Promise<void> {
    const prevLocale = this.store.settings().locale;
    const prevCurrency = this.store.settings().currency;

    await this.store.saveSettings({ ...this.model });
    this.model = { ...this.store.settings() };
    this.cdr.markForCheck();

    // Locale/currency require a full reload because Angular's LOCALE_ID is static
    if (this.model.locale !== prevLocale || this.model.currency !== prevCurrency) {
      window.location.reload();
    }
  }

  async syncNow(): Promise<void> {
    await this.sync.flushQueue();
  }
}
