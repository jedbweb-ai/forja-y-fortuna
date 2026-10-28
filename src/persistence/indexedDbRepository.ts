import { migrateSave, type SaveFile, type SaveRepository } from './saveFile';

const DB_NAME = 'forja-y-fortuna';
const DB_VERSION = 1;
const STORE = 'saves';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'slot' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        tx.oncomplete = () => { db.close(); resolve(req.result); };
        tx.onerror = () => { db.close(); reject(tx.error); };
      }),
  );
}

export class IndexedDbRepository implements SaveRepository {
  async load(slot: string): Promise<SaveFile | null> {
    const raw = await run('readonly', (s) => s.get(slot));
    return raw ? migrateSave(raw) : null;
  }

  async save(file: SaveFile): Promise<void> {
    await run('readwrite', (s) => s.put(file));
  }

  async remove(slot: string): Promise<void> {
    await run('readwrite', (s) => s.delete(slot));
  }

  async list() {
    const all = (await run('readonly', (s) => s.getAll())) as SaveFile[];
    return all.map(({ slot, savedAt, summary, version }) => ({ slot, savedAt, summary, version }));
  }
}
