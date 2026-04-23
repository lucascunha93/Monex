import { Injectable, signal } from '@angular/core';
import { FinanceRepositoryService } from './finance-repository.service';

@Injectable({
  providedIn: 'root',
})
export class OfflineSyncService {
  readonly isOnline = signal<boolean>(navigator.onLine);
  readonly syncing = signal<boolean>(false);

  constructor(private readonly repository: FinanceRepositoryService) {
    window.addEventListener('online', () => {
      this.isOnline.set(true);
      void this.flushQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline.set(false);
    });
  }

  async enqueue(action: string, payload: unknown): Promise<void> {
    await this.repository.saveQueueItem({
      id: `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      action,
      payload,
      createdAt: new Date().toISOString(),
    });
  }

  async flushQueue(): Promise<void> {
    if (!this.isOnline() || this.syncing()) {
      return;
    }

    this.syncing.set(true);
    try {
      const queue = await this.repository.getQueue();
      for (const item of queue) {
        await new Promise((resolve) => setTimeout(resolve, 80));
        await this.repository.deleteQueueItem(item.id);
      }
    } finally {
      this.syncing.set(false);
    }
  }
}
