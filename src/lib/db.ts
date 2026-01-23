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

const getAbsoluteDbPath = (mode: string, vaultPath: string, dbUrl: string) => {
  if (mode === 'local') {
    if (vaultPath && vaultPath.trim() !== '') {
      const vaultDir = expandPath(vaultPath);
      if (!fs.existsSync(vaultDir)) {
        fs.mkdirSync(vaultDir, { recursive: true });
      }
      return path.join(vaultDir, 'kiro.db');
    } else {
      const dbPath = dbUrl.replace('file:', '');
      const absolutePath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
      const dir = path.dirname(absolutePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      return absolutePath;
    }
  }
  return null;
};

const createPrismaClient = (mode: string, vaultPath: string, dbUrl: string) => {
  if (mode === 'local') {
    const absolutePath = getAbsoluteDbPath(mode, vaultPath, dbUrl);
    const adapter = new PrismaBetterSqlite3({ url: `file:${absolutePath}` });
    console.log(`📡 Storage: Local SQLite (${absolutePath})`);
    return new PrismaClient({ adapter });
  } else {
    console.log(`🌐 Storage: Remote Database (${dbUrl})`);
    return new PrismaClient();
  }
};

const prismaInstance = globalForPrisma.prisma ?? createPrismaClient(STORAGE_MODE, VAULT_PATH, DATABASE_URL);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaInstance;

/**
 * Dynamically reconfigures the Prisma client for a new path or mode.
 */
export const reconfigureDb = (config: { STORAGE_MODE: string, VAULT_PATH?: string, DATABASE_URL?: string }) => {
  console.log(`🔄 Reconfiguring Database... Mode: ${config.STORAGE_MODE}, Vault: ${config.VAULT_PATH}`);
  const newPrisma = createPrismaClient(
    config.STORAGE_MODE, 
    config.VAULT_PATH || '', 
    config.DATABASE_URL || 'file:./prisma/dev.db'
  );
  
  globalForPrisma.prisma = newPrisma;
  return newPrisma;
};

// Use a Proxy to ensure 'prisma' always points to the latest instance in globalForPrisma
const prismaProxy = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    const current = globalForPrisma.prisma || prismaInstance;
    return (current as any)[prop];
  }
});

export const getDb = () => globalForPrisma.prisma || prismaInstance;

export default prismaProxy;
