import { SessionUser } from './authService';

export interface BehaviorRecord {
  regionManager: string;
  city: string;
  storeShortName: string;
  storeCode: string;
  position: string;
  name: string;
  timestamp: string;
  sessionId: string;
  carModel: string;
  resultSummary: string;
  resultLength: number;
  buttonStats: string;
}

const LOG_KEY = 'audi_behavior_log_v1';
const PATH_KEY = 'audi_behavior_path_v1';
let queue = Promise.resolve();

export const getBehaviorPath = () => localStorage.getItem(PATH_KEY) || 'onedrive/behavior/ams_behavior.csv';
export const setBehaviorPath = (path: string) => localStorage.setItem(PATH_KEY, path || 'onedrive/behavior/ams_behavior.csv');

const getRows = (): BehaviorRecord[] => {
  const raw = localStorage.getItem(LOG_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveRows = (rows: BehaviorRecord[]) => localStorage.setItem(LOG_KEY, JSON.stringify(rows));

export const appendBehaviorRecord = (record: BehaviorRecord) => {
  queue = queue.then(async () => {
    const rows = getRows();
    rows.push(record);
    saveRows(rows);
  });
  return queue;
};

export const createBehaviorRecord = (user: SessionUser, payload: { sessionId: string; carModel?: string; summary: string; resultLength: number; buttonStats?: Record<string, number> }): BehaviorRecord => ({
  regionManager: user.regionManager,
  city: user.city,
  storeShortName: user.storeShortName,
  storeCode: user.storeCode,
  position: user.position,
  name: user.name,
  timestamp: new Date().toISOString(),
  sessionId: payload.sessionId,
  carModel: payload.carModel || '',
  resultSummary: payload.summary,
  resultLength: payload.resultLength,
  buttonStats: JSON.stringify(payload.buttonStats || {}),
});

export const exportBehaviorCSV = () => {
  const headers = ['区域经理','城市','门店简称','门店代码','岗位','姓名','时间戳','session_id','车型','生成结果摘要/长度','关键按钮点击统计'];
  const rows = getRows().map((r) => [
    r.regionManager, r.city, r.storeShortName, r.storeCode, r.position, r.name,
    r.timestamp, r.sessionId, r.carModel, `${r.resultSummary} / ${r.resultLength}`, r.buttonStats,
  ]);
  return [headers.join(','), ...rows.map((r) => r.map((v) => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
};
