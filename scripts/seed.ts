import db from '../src/lib/db';

async function seed() {
  try {
    const existing = db.prepare('SELECT id FROM projects LIMIT 1').get();
    if (existing) {
      console.log('Projects already exist. Skipping seed.');
      return;
    }

    const name = 'Kaihatsunote (Meta)';
    const gitPath = '/Users/satoshiyamaguchi/Developer/kaihatsunote';
    const artifactPath = '/Users/satoshiyamaguchi/.gemini/antigravity/brain/8f0e638e-1b68-416b-a5f5-b9e5d648bf14';

    const insert = db.prepare(`
      INSERT INTO projects (name, git_path, artifact_path) 
      VALUES (?, ?, ?)
    `);
    const info = insert.run(name, gitPath, artifactPath);
    console.log(`Initial project seeded with ID: ${info.lastInsertRowid}`);

    // Link existing data to this project
    db.prepare('UPDATE logs SET project_id = ?').run(info.lastInsertRowid);
    db.prepare('UPDATE comments SET project_id = ?').run(info.lastInsertRowid);
    console.log('Linked existing logs and comments to the initial project.');

  } catch (error) {
    console.error('Seeding failed:', error);
  }
}

seed();
