import fs from 'fs';
import path from 'path';
import db from '../src/lib/db';

const NOTES_FILE = path.join(process.cwd(), 'notes.json');

async function migrate() {
  if (!fs.existsSync(NOTES_FILE)) {
    console.log('No notes.json found. Skipping migration.');
    return;
  }

  try {
    const content = fs.readFileSync(NOTES_FILE, 'utf-8');
    const notes = JSON.parse(content);

    const insert = db.prepare('INSERT INTO comments (text, timestamp) VALUES (?, ?)');
    
    db.transaction((notesToMigrate) => {
      for (const note of notesToMigrate) {
        insert.run(note.text, note.timestamp);
      }
    })(notes);

    console.log(`Migrated ${notes.length} notes to SQLite.`);
    
    // Rename file instead of deleting to be safe
    fs.renameSync(NOTES_FILE, `${NOTES_FILE}.bak`);
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migrate();
