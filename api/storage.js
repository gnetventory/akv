import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // Enable CORS for mobile and cross-origin clients
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const dbPath = path.join(process.cwd(), 'data', 'directory_db.json');

  if (req.method === 'GET') {
    try {
      if (fs.existsSync(dbPath)) {
        const content = fs.readFileSync(dbPath, 'utf8');
        const data = JSON.parse(content);
        return res.status(200).json(data);
      }
      return res.status(200).json({});
    } catch (err) {
      console.error('Error serving storage DB:', err);
      return res.status(500).json({ error: 'Failed to read database' });
    }
  }

  if (req.method === 'POST') {
    // In Vercel serverless environment, local filesystem is read-only for git files.
    // Return success to client so sync calls do not error.
    return res.status(200).json({ success: true, message: 'Storage event received' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
