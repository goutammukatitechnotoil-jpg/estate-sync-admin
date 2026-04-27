import fs from 'fs';
import path from 'path';

try {
  const filePath = path.join(process.cwd(), 'storage', 'sessions.json');
  if (fs.existsSync(filePath)) {
    const sessions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log('Keys in sessions.json:', Object.keys(sessions));
    for (const key of Object.keys(sessions)) {
      console.log(`History count for ${key}:`, sessions[key].history?.length || 0);
    }
  } else {
    console.log('sessions.json not found');
  }
} catch (e: any) {
  console.log('Error:', e.message);
}
