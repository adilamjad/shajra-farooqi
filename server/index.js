import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = process.env.SHAJRA_DATA_DIR || path.join(ROOT_DIR, 'data');
const DB_FILE = path.join(DATA_DIR, 'family_tree.json');
const AUTH_FILE = path.join(DATA_DIR, 'auth_users.json');
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

// --- PASSWORD HASHING & TOKEN SIGNING ---
function hashPassword(password, salt) {
  const usedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), usedSalt, 64).toString('hex');
  return `${usedSalt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, originalHash] = storedHash.split(':');
  const candidateHash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(originalHash, 'hex'),
      Buffer.from(candidateHash, 'hex')
    );
  } catch {
    return false;
  }
}

function loadOrInitAuthConfig() {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const raw = fs.readFileSync(AUTH_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.secret && parsed.accounts) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading auth_users.json:', err);
  }

  const defaultAdminPass = process.env.SHAJRA_ADMIN_PASSWORD || 'admin123';
  const defaultViewerPass = process.env.SHAJRA_VIEWER_PASSWORD || 'viewer123';

  const initialConfig = {
    secret: crypto.randomBytes(32).toString('hex'),
    updatedAt: new Date().toISOString(),
    accounts: {
      admin: {
        username: 'admin',
        role: 'admin',
        passwordHash: hashPassword(defaultAdminPass)
      },
      viewer: {
        username: 'viewer',
        role: 'viewer',
        passwordHash: hashPassword(defaultViewerPass)
      }
    }
  };

  saveAuthConfig(initialConfig);
  return initialConfig;
}

function saveAuthConfig(config) {
  const tempFile = `${AUTH_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(config, null, 2), 'utf-8');
  fs.renameSync(tempFile, AUTH_FILE);
}

function createSignedToken(payload, secret) {
  const data = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifySignedToken(token, secret) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [data, sig] = token.split('.');
  const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function getAuthenticatedUser(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    // Default unauthenticated visitors open in Viewer mode
    return { username: 'viewer', role: 'viewer', isDefaultViewer: true };
  }
  const token = authHeader.slice(7).trim();
  const authConfig = loadOrInitAuthConfig();
  const verified = verifySignedToken(token, authConfig.secret);
  if (!verified) {
    return { username: 'viewer', role: 'viewer', isDefaultViewer: true };
  }
  return {
    username: verified.username,
    role: verified.role === 'admin' ? 'admin' : 'viewer',
    isDefaultViewer: false
  };
}

// --- TREE DATABASE HELPERS ---
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

function readJsonBody(req, maxBytes = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > maxBytes) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Initialize auth file on startup
loadOrInitAuthConfig();

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // --- AUTH ROUTES ---
  if (pathname === '/api/auth/me' && req.method === 'GET') {
    const user = getAuthenticatedUser(req);
    const authConfig = loadOrInitAuthConfig();
    return sendJSON(res, 200, {
      username: user.username,
      role: user.role,
      isDefaultViewer: user.isDefaultViewer,
      accountsInfo: {
        adminUsername: authConfig.accounts.admin.username,
        viewerUsername: authConfig.accounts.viewer.username
      }
    });
  }

  if (pathname === '/api/auth/login' && req.method === 'POST') {
    try {
      const { username, password } = await readJsonBody(req);
      const authConfig = loadOrInitAuthConfig();
      const cleanUser = String(username || '').trim().toLowerCase();

      const adminAcc = authConfig.accounts.admin;
      const viewerAcc = authConfig.accounts.viewer;

      let matchedAccount = null;
      if (cleanUser === adminAcc.username.toLowerCase()) {
        if (verifyPassword(password, adminAcc.passwordHash)) {
          matchedAccount = adminAcc;
        }
      } else if (cleanUser === viewerAcc.username.toLowerCase()) {
        if (verifyPassword(password, viewerAcc.passwordHash)) {
          matchedAccount = viewerAcc;
        }
      }

      if (!matchedAccount) {
        return sendJSON(res, 401, { error: 'Invalid username or password' });
      }

      const token = createSignedToken(
        { username: matchedAccount.username, role: matchedAccount.role },
        authConfig.secret
      );

      return sendJSON(res, 200, {
        ok: true,
        username: matchedAccount.username,
        role: matchedAccount.role,
        token
      });
    } catch {
      return sendJSON(res, 400, { error: 'Invalid login request' });
    }
  }

  if (pathname === '/api/auth/update-credentials' && req.method === 'POST') {
    const user = getAuthenticatedUser(req);
    if (user.role !== 'admin') {
      return sendJSON(res, 403, { error: 'Only Admin can update account credentials' });
    }

    try {
      const {
        targetRole,
        newUsername,
        newPassword
      } = await readJsonBody(req);

      if (targetRole !== 'admin' && targetRole !== 'viewer') {
        return sendJSON(res, 400, { error: 'targetRole must be "admin" or "viewer"' });
      }
      if (!newPassword || String(newPassword).length < 4) {
        return sendJSON(res, 400, { error: 'Password must be at least 4 characters' });
      }

      const authConfig = loadOrInitAuthConfig();
      const targetAcc = authConfig.accounts[targetRole];
      if (newUsername && String(newUsername).trim()) {
        targetAcc.username = String(newUsername).trim();
      }
      targetAcc.passwordHash = hashPassword(String(newPassword));
      authConfig.updatedAt = new Date().toISOString();
      saveAuthConfig(authConfig);

      // Issue a fresh admin token if admin updated their own username
      const token = createSignedToken(
        {
          username: authConfig.accounts.admin.username,
          role: 'admin'
        },
        authConfig.secret
      );

      return sendJSON(res, 200, {
        ok: true,
        message: `${targetRole === 'admin' ? 'Admin' : 'Viewer'} credentials updated successfully`,
        token,
        accountsInfo: {
          adminUsername: authConfig.accounts.admin.username,
          viewerUsername: authConfig.accounts.viewer.username
        }
      });
    } catch {
      return sendJSON(res, 500, { error: 'Failed to update credentials' });
    }
  }

  // --- TREE DATA ROUTES ---
  if (pathname === '/api/tree' && req.method === 'GET') {
    const dbData = readDatabase();
    if (!dbData) {
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
    const user = getAuthenticatedUser(req);
    const existingDb = readDatabase();

    // Allow initial seeding ONLY if the server DB doesn't exist yet, OR if authenticated as Admin
    if (existingDb && user.role !== 'admin') {
      return sendJSON(res, 403, {
        error: 'Viewer accounts have read-only access and cannot modify the family tree.'
      });
    }

    try {
      const parsed = await readJsonBody(req, 100 * 1024 * 1024);
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
  }

  // --- STATIC FRONTEND SERVING (if dist/ exists) ---
  if (fs.existsSync(DIST_DIR)) {
    let filePath = path.join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);

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
