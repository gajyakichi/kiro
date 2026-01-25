import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { reconfigureDb } from "@/lib/db";

const VAULTS_FILE = path.join(process.cwd(), "vaults.json");
const ENV_FILE = path.join(process.cwd(), ".env");

interface Vault {
  id: string;
  name: string;
  path: string;
  active: boolean;
}

async function readVaults(): Promise<Vault[]> {
  try {
    const data = await fs.readFile(VAULTS_FILE, "utf-8");
    return JSON.parse(data) as Vault[];
  } catch {
    return [];
  }
}

async function writeVaults(vaults: Vault[]) {
  await fs.writeFile(VAULTS_FILE, JSON.stringify(vaults, null, 2));
}

async function updateEnv(vaultPath: string) {
  try {
    const envContent = await fs.readFile(ENV_FILE, "utf-8");
    const lines = envContent.split("\n");
    const newLines = lines.map(line => {
      if (line.startsWith("VAULT_PATH=")) {
        return `VAULT_PATH="${vaultPath}"`;
      }
      return line;
    });

    if (!lines.some(l => l.startsWith("VAULT_PATH="))) {
      newLines.push(`VAULT_PATH="${vaultPath}"`);
    }

    await fs.writeFile(ENV_FILE, newLines.join("\n"));
  } catch (error) {
    console.error("Failed to update .env", error);
  }
}

export async function GET() {
  const vaults = await readVaults();
  return NextResponse.json(vaults);
}

export async function POST(request: Request) {
  try {
    const { name, path: vPath } = await request.json();
    const vaults = await readVaults();
    
    const newVault = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      path: vPath,
      active: false
    };

    vaults.push(newVault);
    await writeVaults(vaults);
    
    return NextResponse.json(newVault);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id } = await request.json();
    const vaults = await readVaults();
    
    const vault = vaults.find((v: Vault) => v.id === id);
    if (!vault) {
      return NextResponse.json({ error: "Vault not found" }, { status: 404 });
    }

    // Switch active status
    const updatedVaults = vaults.map((v: Vault) => ({
      ...v,
      active: v.id === id
    }));

    await writeVaults(updatedVaults);
    
    // Update .env for persistence
    await updateEnv(vault.path);

    // Dynamic Database Reconfiguration
    reconfigureDb({
      STORAGE_MODE: "local",
      VAULT_PATH: vault.path
    });

    return NextResponse.json({ success: true, vault });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const vaults = await readVaults();
    
    const newVaults = vaults.filter((v: Vault) => v.id !== id);
    await writeVaults(newVaults);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
