import { SessionUser } from './authService';

export interface ActionEvent {
  ts: string;
  sessionId: string;
  username: string;
  action_key: string;
  action_label: string;
  action_group: string;
  meta?: Record<string, any>;
}

export interface ActionDictionaryItem {
  action_key: string;
  action_label: string;
  action_group: string;
  car_model?: string;
  stage?: string;
  must_say?: string;
  must_do?: string;
}

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
  actionStatsKey: string;
  actionStatsLabel: string;
}

const LOG_KEY = 'audi_behavior_log_v2';
const EVENT_KEY = 'audi_behavior_events_v2';
const DICT_KEY = 'audi_action_dictionary_v1';
const PATH_KEY = 'audi_behavior_path_v1';
let queue = Promise.resolve();

export const getBehaviorPath = () => localStorage.getItem(PATH_KEY) || 'onedrive/behavior/ams_behavior.csv';
export const setBehaviorPath = (path: string) => localStorage.setItem(PATH_KEY, path || 'onedrive/behavior/ams_behavior.csv');

const getRows = (): BehaviorRecord[] => JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
const saveRows = (rows: BehaviorRecord[]) => localStorage.setItem(LOG_KEY, JSON.stringify(rows));
const getEvents = (): ActionEvent[] => JSON.parse(localStorage.getItem(EVENT_KEY) || '[]');
const saveEvents = (rows: ActionEvent[]) => localStorage.setItem(EVENT_KEY, JSON.stringify(rows));
const getDict = (): ActionDictionaryItem[] => JSON.parse(localStorage.getItem(DICT_KEY) || '[]');
const saveDict = (rows: ActionDictionaryItem[]) => localStorage.setItem(DICT_KEY, JSON.stringify(rows));

export const recordActionEvent = (event: ActionEvent, dict?: ActionDictionaryItem) => {
  queue = queue.then(async () => {
    const events = getEvents();
    events.push(event);
    saveEvents(events);
    if (dict) {
      const d = getDict();
      if (!d.find((x) => x.action_key === dict.action_key)) {
        d.push(dict);
        saveDict(d);
      }
    }
  });
  return queue;
};

export const appendBehaviorRecord = (record: BehaviorRecord) => {
  queue = queue.then(async () => {
    const rows = getRows();
    rows.push(record);
    saveRows(rows);
  });
  return queue;
};

export const createBehaviorRecord = (user: SessionUser, payload: { sessionId: string; carModel?: string; summary: string; resultLength: number; actionStatsKey: Record<string, number>; actionStatsLabel: Record<string, number>; }): BehaviorRecord => ({
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
  actionStatsKey: JSON.stringify(payload.actionStatsKey),
  actionStatsLabel: JSON.stringify(payload.actionStatsLabel),
});

const csv = (rows: string[][]) => rows.map((r) => r.map((v) => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');

export const exportBehaviorCSV = () => {
  const headers = ['区域经理','城市','门店简称','门店代码','岗位','姓名','时间戳','session_id','车型','生成结果摘要/长度','关键动作统计_key','关键动作统计_label'];
  const rows = getRows().map((r) => [r.regionManager,r.city,r.storeShortName,r.storeCode,r.position,r.name,r.timestamp,r.sessionId,r.carModel,`${r.resultSummary} / ${r.resultLength}`,r.actionStatsKey,r.actionStatsLabel]);
  return [headers.join(','), csv(rows)].join('\n');
};

export const exportBehaviorEventsCSV = () => {
  const headers = ['ts','session_id','user','action_key','action_label','action_group','meta'];
  const rows = getEvents().map((e) => [e.ts,e.sessionId,e.username,e.action_key,e.action_label,e.action_group,JSON.stringify(e.meta || {})]);
  return [headers.join(','), csv(rows)].join('\n');
};

export const exportActionDictionaryCSV = () => {
  const headers = ['action_key','action_label','action_group','车型','阶段','must_say','must_do'];
  const rows = getDict().map((d) => [d.action_key,d.action_label,d.action_group,d.car_model || '',d.stage || '',d.must_say || '',d.must_do || '']);
  return [headers.join(','), csv(rows)].join('\n');
};
