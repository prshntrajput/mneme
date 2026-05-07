import Dexie, { type EntityTable } from 'dexie';
import type { TabIngestPayload } from '@mneme/shared';

interface QueuedTab extends TabIngestPayload {
  id?: number;
  queuedAt: number;
  attempts: number;
}

class MnemeDB extends Dexie {
  syncQueue!: EntityTable<QueuedTab, 'id'>;

  constructor() {
    super('MnemeDB');
    this.version(1).stores({
      syncQueue: '++id, queuedAt, attempts',
    });
  }
}

export const db = new MnemeDB();

export async function enqueueTab(tab: TabIngestPayload): Promise<void> {
  await db.syncQueue.add({ ...tab, queuedAt: Date.now(), attempts: 0 });
}

export async function getPendingTabs(): Promise<QueuedTab[]> {
  return db.syncQueue.orderBy('queuedAt').toArray();
}

export async function removeQueuedTab(id: number): Promise<void> {
  await db.syncQueue.delete(id);
}

export async function incrementAttempts(id: number): Promise<void> {
  await db.syncQueue.update(id, { attempts: (await db.syncQueue.get(id))?.attempts ?? 0 + 1 });
}
