import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Environment switching logic
const STORAGE_MODE = process.env.STORAGE_MODE || 'local';
const DATABASE_URL = process.env.DATABASE_URL || 'file:./prisma/dev.db';

interface VaultInit { path: string; active: boolean; }

// Ensure VAULT_PATH is persistent by reading vaults.json first
let VAULT_PATH = process.env.VAULT_PATH || '';
try {
  const vaultsFile = path.join(process.cwd(), "vaults.json");
  if (fs.existsSync(vaultsFile)) {
    const vaultsData: VaultInit[] = JSON.parse(fs.readFileSync(vaultsFile, 'utf-8'));
    const activeVault = vaultsData.find(v => v.active);
    if (activeVault) {
      VAULT_PATH = activeVault.path;
    }
  }
} catch (e) {
  console.warn("Failed to load vaults.json during DB init:", e);
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const expandPath = (p: string) => {
  if (p.startsWith('~/')) {
    return path.join(os.homedir(), p.slice(2));
  }
  return path.resolve(p);
};

const cleanUrl = (url: any) => {
  if (!url || typeof url !== 'string') return '';
  return url.replace('file:', '');
};

const getAbsoluteDbPath = (mode: string, vaultPath: string, dbUrl: string) => {
  const safeDbUrl = dbUrl || 'file:./prisma/dev.db';

  if (mode === 'local') {
    try {
      if (vaultPath && vaultPath.trim() !== '') {
        const vaultDir = expandPath(vaultPath);
        if (!fs.existsSync(vaultDir)) {
          fs.mkdirSync(vaultDir, { recursive: true });
        }
        return path.join(vaultDir, 'kiro.db');
      }
    } catch (e) {
      console.error("❌ Invalid Vault Path. Falling back to default DB.", e);
    }
    
    // Fallback: Use the default DB path from env or relative to project
    const dbPath = cleanUrl(safeDbUrl);
    const absolutePath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
    const dir = path.dirname(absolutePath);
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    } catch (e) {
      console.error("❌ Critical: Could not create default DB directory.", e);
    }
    return absolutePath;
  }
  return null;
};

const createPrismaClient = (mode: string, vaultPath: string, dbUrl: string) => {
  const safeDbUrl = dbUrl || 'file:./prisma/dev.db';
  let dbPath = '';
  
  if (mode === 'local') {
    const absolutePath = getAbsoluteDbPath(mode, vaultPath, safeDbUrl);
    if (absolutePath) {
      dbPath = absolutePath;
      console.log(`📡 Storage: Local SQLite (${absolutePath})`);
    } else {
       // Fallback
       dbPath = cleanUrl(safeDbUrl);
    }
  } else {
    // Remote
    dbPath = cleanUrl(safeDbUrl);
    if (!dbPath) dbPath = './prisma/dev.db';
  }

  // Ensure dbPath is valid
  if (!dbPath) {
      console.error("❌ Critical: DB Path could not be determined.");
      dbPath = './prisma/dev.db';
  }

  console.log(`🔌 Initializing Prisma Client with path: ${dbPath}`);

  // Set environment variable to ensure Prisma internals use the correct path
  process.env.DATABASE_URL = `file:${dbPath}`;

  try {
      return new PrismaClient({
          datasources: {
              db: { url: `file:${dbPath}` }
          }
      } as any);
  } catch (e) {
      console.error("Failed to initialize Prisma Client:", e);
      // Fallback explicitly to dev.db to avoid 'replace' error on query
      return new PrismaClient({
        datasources: {
            db: { url: 'file:./prisma/dev.db' }
        }
      } as any);
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
    const current = (globalForPrisma.prisma || prismaInstance);
    if (!current) {
        console.error("❌ Prisma Client is not initialized!");
        return undefined;
    }
    return (current as unknown as Record<string | symbol, unknown>)[prop];
  }
});

export const getDb = () => globalForPrisma.prisma || prismaInstance;

export default prismaProxy;
