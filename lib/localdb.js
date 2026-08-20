/* Local data store. Replaces the Base44 SDK with browser storage so the app
 * runs standalone — no account, no backend, no network. Same call shape as
 * before (db.entities.X.list/create/..., db.auth, db.integrations) so pages
 * did not need rewriting beyond their import line.
 *
 * Records live in localStorage under `sf:<Entity>`. Uploaded files are held
 * in memory for the session and handed back as blob: URLs. */

const KEY = name => `sf:${name}`;
const now = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function readAll(name) {
  try { return JSON.parse(localStorage.getItem(KEY(name))) || []; }
  catch { return []; }
}
function writeAll(name, rows) {
  try { localStorage.setItem(KEY(name), JSON.stringify(rows)); }
  catch (e) { console.warn(`[localdb] could not save ${name}:`, e.message); }
  return rows;
}

/** "-created_date" sorts descending by that field; "name" ascending. */
function applySort(rows, sort) {
  if (!sort) return rows;
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return rows.slice().sort((a, b) => {
    const x = a[field], y = b[field];
    if (x === y) return 0;
    return (x > y ? 1 : -1) * (desc ? -1 : 1);
  });
}
const matches = (row, where) => Object.entries(where || {}).every(([k, v]) => row[k] === v);

function entity(name) {
  return {
    async list(sort, limit) {
      const rows = applySort(readAll(name), sort);
      return limit ? rows.slice(0, limit) : rows;
    },
    async filter(where, sort, limit) {
      const rows = applySort(readAll(name).filter(r => matches(r, where)), sort);
      return limit ? rows.slice(0, limit) : rows;
    },
    async get(id) {
      return readAll(name).find(r => r.id === id) || null;
    },
    async create(data) {
      const row = { id: uid(), created_date: now(), updated_date: now(), ...data };
      writeAll(name, [...readAll(name), row]);
      return row;
    },
    async update(id, patch) {
      const rows = readAll(name);
      const i = rows.findIndex(r => r.id === id);
      if (i < 0) throw new Error(`${name} ${id} not found`);
      rows[i] = { ...rows[i], ...patch, updated_date: now() };
      writeAll(name, rows);
      return rows[i];
    },
    async delete(id) {
      writeAll(name, readAll(name).filter(r => r.id !== id));
      return { id, deleted: true };
    },
    async bulkCreate(list) {
      const rows = list.map(d => ({ id: uid(), created_date: now(), updated_date: now(), ...d }));
      writeAll(name, [...readAll(name), ...rows]);
      return rows;
    },
  };
}

const entities = new Proxy({}, {
  get: (cache, name) => (cache[name] || (cache[name] = entity(String(name)))),
});

const LOCAL_USER = { id: 'local', full_name: 'Local User', email: 'local@soundforge', role: 'owner' };

const auth = {
  async me() { return LOCAL_USER; },
  async isAuthenticated() { return true; },
  async login() { return LOCAL_USER; },
  async logout() { return true; },
  async updateMyUserData(patch) { return { ...LOCAL_USER, ...patch }; },
};

const uploads = new Map();

const integrations = {
  Core: {
    /** Keeps the file in memory and returns a blob URL usable for the session. */
    async UploadFile({ file } = {}) {
      if (!file) throw new Error('No file provided');
      const url = URL.createObjectURL(file);
      uploads.set(url, file);
      return { file_url: url, file_name: file.name, file_size: file.size };
    },
    async GenerateSpeech() {
      throw new Error('Speech generation needs a provider — set one up in Settings.');
    },
    async InvokeLLM() {
      throw new Error('Text generation needs a provider — set one up in Settings.');
    },
    async SendEmail() {
      throw new Error('Email sending is not available offline.');
    },
  },
};

export const db = {
  entities,
  auth,
  integrations,
  appLogs: { async logUserInApp() { /* nothing to report to */ } },
};

export const User = auth;
export const Core = integrations.Core;
export default db;
