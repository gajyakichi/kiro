import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';

const legacyDb = new Database(path.join(process.cwd(), 'development.db'));
const adapter = new PrismaBetterSqlite3({ url: path.join(process.cwd(), 'prisma.db') });
const prisma = new PrismaClient({ adapter });

interface LegacyProject {
  id: number;
  name: string;
  icon: string | null;
  git_path: string | null;
  artifact_path: string | null;
}

interface LegacyLog {
  id: number;
  timestamp: string | null;
  type: string;
  content: string;
  metadata: string | null;
  project_id: number;
}

interface LegacyComment {
  id: number;
  timestamp: string | null;
  text: string;
  project_id: number;
}

interface LegacyTheme {
  id: number;
  name: string;
  css: string;
  active: number;
  timestamp: string | null;
}

interface LegacyDailyNote {
  id: number;
  project_id: number;
  date: string;
  content: string;
  timestamp: string | null;
}

interface LegacySuggestedTask {
  id: number;
  project_id: number;
  task: string;
  status: string;
  timestamp: string | null;
}

const parseDate = (d: string | number | null | undefined) => {
  if (!d) return new Date();
  const date = new Date(d);
  return isNaN(date.getTime()) ? new Date() : date;
};

async function main() {
  console.log('🚀 Starting data migration from SQLite to Prisma (v7)...');

  // 1. Projects
  const projects = legacyDb.prepare('SELECT * FROM projects').all() as LegacyProject[];
  for (const p of projects) {
    await prisma.project.create({
      data: {
        id: p.id,
        name: p.name,
        icon: p.icon || '',
        git_path: p.git_path || '',
        artifact_path: p.artifact_path || '',
      },
    });
  }
  console.log(`✅ Migrated ${projects.length} projects`);

  // 2. Logs
  const logs = legacyDb.prepare('SELECT * FROM logs').all() as LegacyLog[];
  for (const l of logs) {
    await prisma.log.create({
      data: {
        id: l.id,
        timestamp: parseDate(l.timestamp),
        type: l.type,
        content: l.content,
        metadata: l.metadata || '',
        project_id: l.project_id,
      },
    });
  }
  console.log(`✅ Migrated ${logs.length} logs`);

  // 3. Comments
  const comments = legacyDb.prepare('SELECT * FROM comments').all() as LegacyComment[];
  for (const c of comments) {
    await prisma.comment.create({
      data: {
        id: c.id,
        timestamp: parseDate(c.timestamp),
        text: c.text,
        project_id: c.project_id,
      },
    });
  }
  console.log(`✅ Migrated ${comments.length} comments`);

  // 4. Themes
  const themes = legacyDb.prepare('SELECT * FROM themes').all() as LegacyTheme[];
  for (const t of themes) {
    await prisma.theme.create({
      data: {
        id: t.id,
        name: t.name,
        css: t.css,
        active: !!t.active,
        timestamp: parseDate(t.timestamp),
      },
    });
  }
  console.log(`✅ Migrated ${themes.length} themes`);

  // 5. Daily Notes
  const dailyNotes = legacyDb.prepare('SELECT * FROM daily_notes').all() as LegacyDailyNote[];
  for (const dn of dailyNotes) {
    await prisma.dailyNote.create({
      data: {
        id: dn.id,
        project_id: dn.project_id,
        date: dn.date,
        content: dn.content,
        timestamp: parseDate(dn.timestamp),
      },
    });
  }
  console.log(`✅ Migrated ${dailyNotes.length} daily notes`);

  // 6. Suggested Tasks
  const suggestedTasks = legacyDb.prepare('SELECT * FROM suggested_tasks').all() as LegacySuggestedTask[];
  for (const st of suggestedTasks) {
    await prisma.suggestedTask.create({
      data: {
        id: st.id,
        project_id: st.project_id,
        task: st.task,
        status: st.status,
        timestamp: parseDate(st.timestamp),
      },
    });
  }
  console.log(`✅ Migrated ${suggestedTasks.length} suggested tasks`);

  console.log('🎉 Migration completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    legacyDb.close();
  });
