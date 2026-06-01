import { createClient } from '@libsql/client';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'dev.db');
const url = `file:${dbPath}`;

export const client = createClient({ url });

export interface Download {
  id: string;
  title: string | null;
  url: string;
  format: string;
  fileSize: string | null;
  filePath: string | null;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  thumbnailUrl: string | null;
}

export interface Schedule {
  id: string;
  url: string;
  format: string;
  time: string;
  frequency: string;
  status: 'ACTIVE' | 'PAUSED';
  createdAt: string;
  lastTriggeredAt: string | null;
}

let isInitialized = false;

async function ensureTable() {
  if (isInitialized) return;
  await client.execute(`
    CREATE TABLE IF NOT EXISTS downloads (
      id TEXT PRIMARY KEY,
      title TEXT,
      url TEXT NOT NULL,
      format TEXT NOT NULL,
      fileSize TEXT,
      filePath TEXT,
      status TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);
  try {
    await client.execute(`ALTER TABLE downloads ADD COLUMN thumbnailUrl TEXT;`);
  } catch {
    // Column may already exist
  }
  await client.execute(`
    CREATE TABLE IF NOT EXISTS schedules (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      format TEXT NOT NULL,
      time TEXT NOT NULL,
      frequency TEXT NOT NULL,
      status TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      lastTriggeredAt TEXT
    );
  `);
  isInitialized = true;
  if (typeof window === 'undefined') {
    try {
      const { startSchedulerWorker } = require('./scheduler-worker');
      startSchedulerWorker();
    } catch (err) {
      console.error('Failed to import or start scheduler worker:', err);
    }
  }
}

export const db = {
  download: {
    findMany: async (options?: { orderBy?: { createdAt?: 'asc' | 'desc' } }) => {
      await ensureTable();
      const order = options?.orderBy?.createdAt || 'desc';
      const result = await client.execute({
        sql: `SELECT * FROM downloads ORDER BY createdAt ${order === 'desc' ? 'DESC' : 'ASC'}`,
        args: []
      });
      return result.rows.map(row => ({
        id: row.id as string,
        title: row.title as string | null,
        url: row.url as string,
        format: row.format as string,
        fileSize: row.fileSize as string | null,
        filePath: row.filePath as string | null,
        status: row.status as 'PENDING' | 'COMPLETED' | 'FAILED',
        createdAt: row.createdAt as string,
        thumbnailUrl: row.thumbnailUrl as string | null,
      }));
    },

    findUnique: async (options: { where: { id: string } }) => {
      await ensureTable();
      const result = await client.execute({
        sql: 'SELECT * FROM downloads WHERE id = ? LIMIT 1',
        args: [options.where.id]
      });
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.id as string,
        title: row.title as string | null,
        url: row.url as string,
        format: row.format as string,
        fileSize: row.fileSize as string | null,
        filePath: row.filePath as string | null,
        status: row.status as 'PENDING' | 'COMPLETED' | 'FAILED',
        createdAt: row.createdAt as string,
        thumbnailUrl: row.thumbnailUrl as string | null,
      };
    },

    create: async (options: { data: { url: string; format: string; status: 'PENDING' | 'COMPLETED' | 'FAILED' } }) => {
      await ensureTable();
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const { url, format, status } = options.data;
      await client.execute({
        sql: 'INSERT INTO downloads (id, title, url, format, fileSize, filePath, status, createdAt, thumbnailUrl) VALUES (?, NULL, ?, ?, NULL, NULL, ?, ?, NULL)',
        args: [id, url, format, status, createdAt]
      });
      return {
        id,
        title: null,
        url,
        format,
        fileSize: null,
        filePath: null,
        status,
        createdAt,
        thumbnailUrl: null,
      };
    },

    update: async (options: { 
      where: { id: string }; 
      data: { title?: string | null; fileSize?: string | null; filePath?: string | null; status?: 'PENDING' | 'COMPLETED' | 'FAILED'; thumbnailUrl?: string | null } 
    }) => {
      await ensureTable();
      const { id } = options.where;
      const { title, fileSize, filePath, status, thumbnailUrl } = options.data;
      
      const fields: string[] = [];
      const args: any[] = [];
      
      if (title !== undefined) {
        fields.push('title = ?');
        args.push(title);
      }
      if (fileSize !== undefined) {
        fields.push('fileSize = ?');
        args.push(fileSize);
      }
      if (filePath !== undefined) {
        fields.push('filePath = ?');
        args.push(filePath);
      }
      if (status !== undefined) {
        fields.push('status = ?');
        args.push(status);
      }
      if (thumbnailUrl !== undefined) {
        fields.push('thumbnailUrl = ?');
        args.push(thumbnailUrl);
      }
      
      if (fields.length === 0) {
        throw new Error('No fields to update');
      }
      
      args.push(id);
      await client.execute({
        sql: `UPDATE downloads SET ${fields.join(', ')} WHERE id = ?`,
        args
      });
      
      const updated = await db.download.findUnique({ where: { id } });
      if (!updated) throw new Error('Record not found after update');
      return updated;
    },

    delete: async (options: { where: { id: string } }) => {
      await ensureTable();
      const { id } = options.where;
      const record = await db.download.findUnique({ where: { id } });
      await client.execute({
        sql: 'DELETE FROM downloads WHERE id = ?',
        args: [id]
      });
      return record;
    }
  },

  schedule: {
    findMany: async () => {
      await ensureTable();
      const result = await client.execute('SELECT * FROM schedules ORDER BY createdAt DESC');
      return result.rows.map(row => ({
        id: row.id as string,
        url: row.url as string,
        format: row.format as string,
        time: row.time as string,
        frequency: row.frequency as string,
        status: row.status as 'ACTIVE' | 'PAUSED',
        createdAt: row.createdAt as string,
        lastTriggeredAt: row.lastTriggeredAt as string | null,
      }));
    },

    findUnique: async (options: { where: { id: string } }) => {
      await ensureTable();
      const result = await client.execute({
        sql: 'SELECT * FROM schedules WHERE id = ? LIMIT 1',
        args: [options.where.id]
      });
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.id as string,
        url: row.url as string,
        format: row.format as string,
        time: row.time as string,
        frequency: row.frequency as string,
        status: row.status as 'ACTIVE' | 'PAUSED',
        createdAt: row.createdAt as string,
        lastTriggeredAt: row.lastTriggeredAt as string | null,
      };
    },

    create: async (options: { data: { url: string; format: string; time: string; frequency: string; status: 'ACTIVE' | 'PAUSED' } }) => {
      await ensureTable();
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      const { url, format, time, frequency, status } = options.data;
      await client.execute({
        sql: 'INSERT INTO schedules (id, url, format, time, frequency, status, createdAt, lastTriggeredAt) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)',
        args: [id, url, format, time, frequency, status, createdAt]
      });
      return {
        id,
        url,
        format,
        time,
        frequency,
        status,
        createdAt,
        lastTriggeredAt: null,
      };
    },

    update: async (options: {
      where: { id: string };
      data: { status?: 'ACTIVE' | 'PAUSED'; lastTriggeredAt?: string | null }
    }) => {
      await ensureTable();
      const { id } = options.where;
      const { status, lastTriggeredAt } = options.data;

      const fields: string[] = [];
      const args: any[] = [];

      if (status !== undefined) {
        fields.push('status = ?');
        args.push(status);
      }
      if (lastTriggeredAt !== undefined) {
        fields.push('lastTriggeredAt = ?');
        args.push(lastTriggeredAt);
      }

      if (fields.length === 0) {
        throw new Error('No fields to update');
      }

      args.push(id);
      await client.execute({
        sql: `UPDATE schedules SET ${fields.join(', ')} WHERE id = ?`,
        args
      });

      const updated = await db.schedule.findUnique({ where: { id } });
      if (!updated) throw new Error('Record not found after update');
      return updated;
    },

    delete: async (options: { where: { id: string } }) => {
      await ensureTable();
      const { id } = options.where;
      const record = await db.schedule.findUnique({ where: { id } });
      await client.execute({
        sql: 'DELETE FROM schedules WHERE id = ?',
        args: [id]
      });
      return record;
    }
  }
};
