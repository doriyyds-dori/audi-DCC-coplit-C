export type Role = 'SUPER_ADMIN' | 'USER';

export interface UserRecord {
  regionManager: string;
  city: string;
  storeShortName: string;
  storeCode: string;
  position: string;
  name: string;
  username: string;
  initialPassword: string;
  latestPassword: string;
  createdAt: string;
  updatedAt: string;
  role: Role;
  uniqueKey: string;
}

export interface SessionUser extends UserRecord {}

const USERS_KEY = 'audi_users_v1';
const SESSION_KEY = 'audi_session_v1';
const MASTER_SEED = 'audi_seed_v1';
const ADMIN_USERNAME = 'SAR3';
const ADMIN_PASSWORD = 'SAR3_2026';
const REQUIRED_HEADERS = ['区域经理','城市','门店简称','门店代码','岗位','姓名'];

const textEncoder = new TextEncoder();

const toKey = (row: Pick<UserRecord, 'storeCode'|'position'|'name'>) => `${row.storeCode}__${row.position}__${row.name}`;

const normalizeText = (v: string) => (v || '').trim();

const simpleHash = (input: string): number => {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return Math.abs(h >>> 0);
};

const toPseudoPinyin = (name: string): string => {
  return Array.from(name)
    .map((ch) => {
      if (/^[a-zA-Z0-9]$/.test(ch)) return ch.toLowerCase();
      if (/^[\u4e00-\u9fff]$/.test(ch)) {
        return `u${ch.charCodeAt(0).toString(16)}`;
      }
      return '';
    })
    .join('')
    .replace(/\s+/g, '')
    .toLowerCase();
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === ',' && !inQuote) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map((v) => v.trim());
};

const parseCSVText = (text: string) => {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new Error('CSV 内容为空或缺少数据行');
  const headers = parseCSVLine(lines[0]);
  if (REQUIRED_HEADERS.join('|') !== headers.join('|')) {
    throw new Error(`CSV 列名错误，必须严格为：${REQUIRED_HEADERS.join(',')}`);
  }
  return lines.slice(1).map((line, idx) => {
    const cols = parseCSVLine(line);
    if (cols.length !== REQUIRED_HEADERS.length) {
      throw new Error(`第 ${idx + 2} 行列数错误，期望 ${REQUIRED_HEADERS.length} 列，实际 ${cols.length} 列`);
    }
    return {
      regionManager: normalizeText(cols[0]),
      city: normalizeText(cols[1]),
      storeShortName: normalizeText(cols[2]),
      storeCode: normalizeText(cols[3]),
      position: normalizeText(cols[4]),
      name: normalizeText(cols[5]),
    };
  });
};

const getUsers = (): UserRecord[] => {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveUsers = (users: UserRecord[]) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

const ensureAdmin = () => {
  const users = getUsers();
  if (!users.find((u) => u.username === ADMIN_USERNAME)) {
    const now = new Date().toISOString();
    users.unshift({
      regionManager: '总部',
      city: '总部',
      storeShortName: '总部',
      storeCode: '0000',
      position: '超级管理员',
      name: 'SAR3',
      username: ADMIN_USERNAME,
      initialPassword: ADMIN_PASSWORD,
      latestPassword: ADMIN_PASSWORD,
      createdAt: now,
      updatedAt: now,
      role: 'SUPER_ADMIN',
      uniqueKey: 'ADMIN__SAR3',
    });
    saveUsers(users);
  }
};

export const initAuthSystem = () => ensureAdmin();

export const login = (username: string, password: string): SessionUser => {
  ensureAdmin();
  const users = getUsers();
  const found = users.find((u) => u.username === username.trim());
  if (!found || found.latestPassword !== password) {
    throw new Error('用户名或密码错误');
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(found));
  return found;
};

export const logout = () => localStorage.removeItem(SESSION_KEY);

export const getCurrentSession = (): SessionUser | null => {
  const raw = localStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
};

export const changePassword = (username: string, currentPassword: string, newPassword: string) => {
  const users = getUsers();
  const idx = users.findIndex((u) => u.username === username);
  if (idx < 0) throw new Error('用户不存在');
  if (users[idx].latestPassword !== currentPassword) throw new Error('当前密码错误');
  users[idx].latestPassword = newPassword;
  users[idx].updatedAt = new Date().toISOString();
  saveUsers(users);
  const session = getCurrentSession();
  if (session?.username === username) localStorage.setItem(SESSION_KEY, JSON.stringify(users[idx]));
};

export const validateUtf8File = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    return decoder.decode(buffer);
  } catch {
    throw new Error('CSV 编码错误：仅支持 UTF-8');
  }
};

const generateUniqueUsername = (storeCode: string, name: string, used: Set<string>, uniqueSeed: string) => {
  const code4 = storeCode.slice(-4).padStart(4, '0');
  const pinyin = toPseudoPinyin(name);
  let base = `${code4}${pinyin}`;
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  const suffix = (simpleHash(`${base}_${uniqueSeed}`) % 1296).toString(36).padStart(2, '0');
  base = `${base}${suffix}`;
  let count = 1;
  while (used.has(base)) {
    base = `${code4}${pinyin}${suffix}${count}`;
    count += 1;
  }
  used.add(base);
  return base;
};

const generateInitialPassword = (name: string, uniqueKey: string) => {
  const pinyin = toPseudoPinyin(name);
  const seed = localStorage.getItem(MASTER_SEED) || `${Date.now()}`;
  localStorage.setItem(MASTER_SEED, seed);
  const num = simpleHash(`${seed}_${uniqueKey}`) % 10000;
  return `${pinyin}${String(num).padStart(4, '0')}`;
};

export const importUsersFromCSV = (text: string) => {
  ensureAdmin();
  const parsed = parseCSVText(text);
  const users = getUsers();
  const byKey = new Map(users.map((u) => [u.uniqueKey, u]));
  const usedUsernames = new Set(users.map((u) => u.username));

  let created = 0;
  let updated = 0;

  for (const row of parsed) {
    const uniqueKey = toKey(row);
    const existing = byKey.get(uniqueKey);
    if (existing && existing.role === 'USER') {
      existing.regionManager = row.regionManager;
      existing.city = row.city;
      existing.storeShortName = row.storeShortName;
      existing.storeCode = row.storeCode;
      existing.position = row.position;
      existing.name = row.name;
      existing.updatedAt = new Date().toISOString();
      updated += 1;
      continue;
    }

    const username = generateUniqueUsername(row.storeCode, row.name, usedUsernames, uniqueKey);
    const initialPassword = generateInitialPassword(row.name, uniqueKey);
    const now = new Date().toISOString();
    users.push({
      ...row,
      username,
      initialPassword,
      latestPassword: initialPassword,
      createdAt: now,
      updatedAt: now,
      role: 'USER',
      uniqueKey,
    });
    created += 1;
  }

  saveUsers(users);
  return { created, updated, total: users.length };
};

export const exportUsersCSV = () => {
  const users = getUsers();
  const headers = ['区域经理','城市','门店简称','门店代码','岗位','姓名','用户名','初始密码','最新密码','创建时间','最近修改时间'];
  const rows = users.map((u) => [
    u.regionManager, u.city, u.storeShortName, u.storeCode, u.position, u.name,
    u.username, u.initialPassword, u.latestPassword, u.createdAt, u.updatedAt,
  ]);
  return [headers.join(','), ...rows.map((r) => r.map((v) => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
};

export const getAllUsers = () => getUsers();

export const downloadCSV = (filename: string, content: string) => {
  const blob = new Blob([textEncoder.encode('\uFEFF' + content)], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
};
