import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Environment switching logic
const STORAGE_MODE = process.env.STORAGE_MODE || 'local';
const DATABASE_URL = process.env.DATABASE_URL || 'file:./prisma/dev.db';
const VAULT_PATH = process.env.VAULT_PATH || '';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const expandPath = (p: string) => {
  if (p.startsWith('~/')) {
    return path.join(os.homedir(), p.slice(2));
  }
  return path.resolve(p);
};

const createPrismaClient = () => {
  if (STORAGE_MODE === 'local') {
    let absolutePath: string;

    if (VAULT_PATH && VAULT_PATH.trim() !== '') {
      const vaultDir = expandPath(VAULT_PATH);
      if (!fs.existsSync(vaultDir)) {
        fs.mkdirSync(vaultDir, { recursive: true });
      }
      absolutePath = path.join(vaultDir, 'kiro.db');
    } else {
      const dbPath = DATABASE_URL.replace('file:', '');
      absolutePath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
      // If DATABASE_URL is the default or contains kaihatsunote, we might want to ensure it's kiro.db
      // But for now, let's just make the VAULT rename explicit.
      // Ensure the directory for the default path exists
      const dir = path.dirname(absolutePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    const adapter = new PrismaBetterSqlite3({ url: `file:${absolutePath}` });
    console.log(`📡 Storage: Local SQLite (${absolutePath})`);
    return new PrismaClient({ adapter });
  } else {
    console.log(`🌐 Storage: Remote Database (${DATABASE_URL})`);
    return new PrismaClient();
  }
};

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
