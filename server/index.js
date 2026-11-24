import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = process.env.SHAJRA_DATA_DIR || path.join(ROOT_DIR, 'data');
const DB_FILE = path.join(DATA_DIR, 'family_tree.json');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const PORT = Number(process.env.PORT || 3001);

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function readDatabase() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return null;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.people)) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.error('Error reading family_tree.json:', err);
    return null;
  }
}

function writeDatabase(payload) {
  const dataToSave = {
    version: '1.0',
    updatedAt: new Date().toISOString(),
    pinnedPersonId: payload.pinnedPersonId ?? null,
    people: Array.isArray(payload.people) ? payload.people : []
  };

  // Atomic write via temporary file
  const tempFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
  return dataToSave;
}

function sendJSON(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // --- API ROUTES ---
  if (pathname === '/api/tree' && req.method === 'GET') {
    const dbData = readDatabase();
    if (!dbData) {
      // No server tree saved yet -> tell client it is uninitialized so client can seed or use initialPeople
      return sendJSON(res, 200, {
        initialized: false,
        people: null,
        pinnedPersonId: null
      });
    }
    return sendJSON(res, 200, {
      initialized: true,
      updatedAt: dbData.updatedAt,
      pinnedPersonId: dbData.pinnedPersonId || null,
      people: dbData.people
    });
  }

  if (pathname === '/api/tree' && (req.method === 'POST' || req.method === 'PUT')) {
    let body = '';
    // Allow up to 100MB payload for large photo galleries
    const MAX_BYTES = 100 * 1024 * 1024;

    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > MAX_BYTES) {
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        const parsed = JSON.parse(body || '{}');
        if (!Array.isArray(parsed.people)) {
          return sendJSON(res, 400, { error: 'Payload must contain a "people" array' });
        }
        const saved = writeDatabase({
          people: parsed.people,
          pinnedPersonId: parsed.pinnedPersonId
        });
        return sendJSON(res, 200, {
          ok: true,
          updatedAt: saved.updatedAt,
          count: saved.people.length,
          pinnedPersonId: saved.pinnedPersonId
        });
      } catch (err) {
        console.error('Failed to save family tree:', err);
        return sendJSON(res, 500, { error: 'Failed to save family tree data' });
      }
    });
    return;
  }

  // --- STATIC FRONTEND SERVING (if dist/ exists) ---
  if (fs.existsSync(DIST_DIR)) {
    let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);

    // Prevent directory traversal
    if (!filePath.startsWith(DIST_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    try {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
      return;
    } catch {
      res.writeHead(500);
      res.end('Internal Server Error');
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Shajra Server API & Static Host listening on http://0.0.0.0:${PORT}`);
  console.log(`Database file location: ${DB_FILE}`);
});
