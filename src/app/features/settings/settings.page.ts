import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FinanceStore } from '../../state/finance.store';
import { OfflineSyncService } from '../../core/services/offline-sync.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CardModule, ToggleSwitchModule, ButtonModule],
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPage {
  model = this.store.settings();

  constructor(
    public readonly store: FinanceStore,
    public readonly sync: OfflineSyncService,
  ) {}

  async save(): Promise<void> {
    await this.store.saveSettings(this.model);
  }

  async syncNow(): Promise<void> {
    await this.sync.flushQueue();
  }
}
