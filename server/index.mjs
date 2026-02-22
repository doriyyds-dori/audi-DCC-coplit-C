import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildFollowUpPlan, composeFinalText, mustUseUnknownWhenMissing, parsePlanItems, validateBody } from './amsRules.mjs';

const PORT = Number(process.env.AMS_SERVER_PORT || 8787);
const EXTRACT_MODEL = process.env.EXTRACT_MODEL || 'qwen-turbo';
const GENERATE_MODEL = process.env.GENERATE_MODEL || 'qwen-plus';
const API_KEY = process.env.DASHSCOPE_API_KEY;

const redact = (s='') => s.replace(/Bearer\s+[A-Za-z0-9\-_.]+/g, 'Bearer ***');

const requestDashScope = async ({ model, messages, temperature = 0.3 }, retries = 2) => {
  if (!API_KEY) throw new Error('DASHSCOPE_API_KEY 未配置');
  const url = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify({ model, messages, temperature }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`dashscope_${res.status}:${await res.text()}`);
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (e) {
      if (i === retries) throw new Error(redact(String(e)));
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  return '';
};

const jsonFromText = (text) => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('A段输出非JSON');
  return JSON.parse(match[0]);
};

const extractStageA = async (payload) => {
  const prompt = `你是销售通话抽取器。仅输出JSON。\nSchema必须包含: schema_version, session_id, facts, concerns, objections, conclusions, evidence_index。\n规则: 缺失字段填unknown；禁止编造；每个concerns/objections/conclusions条目必须有evidence数组，且每条evidence至少包含 action_key/action_label/action_group/manual_note/material_sent/stay_ms之一。\n输入:${JSON.stringify(payload)}`;
  const content = await requestDashScope({
    model: EXTRACT_MODEL,
    messages: [{ role: 'system', content: '只返回严格JSON，不要markdown' }, { role: 'user', content: prompt }],
    temperature: 0.1,
  });
  const extracted = jsonFromText(content);
  if (!extracted.schema_version) throw new Error('A段缺少schema_version');
  return extracted;
};

const buildBodyPrompt = (extractJson) => `基于以下A段JSON，写AMS正文仅两段，不要编号，不要计划，不要JSON，不要引入新事实。缺失信息写“待确认”或“未获取”。\n第一段必须覆盖：客户称呼/咨询车型/核心需求关注点/性格标签/客户类型/意向等级。\n第二段必须覆盖：新客首触/介绍卖点/客户认可点/确认信息/邀约结果/异议点。\nA段JSON:${JSON.stringify(extractJson)}`;

const splitParagraphs = (text) => {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return [lines[0] || '', lines[1] || lines.slice(1).join('') || ''];
};

const generateBodyWithRetry = async (extractJson, maxRetry = 4) => {
  let draft = '';
  for (let i = 0; i < maxRetry; i++) {
    draft = await requestDashScope({ model: GENERATE_MODEL, messages: [{ role: 'user', content: buildBodyPrompt(extractJson) }], temperature: 0.4 });
    let [p1, p2] = splitParagraphs(draft);
    if (!validateBody(p1, p2)) {
      const target = `请仅重写正文两段，总字符数100-150（中文计数，含标点，不含空格换行）。当前不合格。原文:${p1}\n${p2}`;
      draft = await requestDashScope({ model: GENERATE_MODEL, messages: [{ role: 'user', content: target }], temperature: 0.3 });
      [p1, p2] = splitParagraphs(draft);
    }
    if (validateBody(p1, p2) && mustUseUnknownWhenMissing(extractJson, `${p1}${p2}`)) return { p1, p2 };
  }
  throw new Error('B段正文重试后仍不满足100-150字或缺失字段占位要求');
};

const saveExtract = async (sessionId, extractJson) => {
  const target = path.join(process.cwd(), 'data', 'extract', `${sessionId}.json`);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, JSON.stringify(extractJson, null, 2), 'utf-8');
};

const readBody = async (req) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf-8');
  return raw ? JSON.parse(raw) : {};
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/ams/generate') {
    try {
      const payload = await readBody(req);
      const extractJson = await extractStageA(payload);
      await saveExtract(payload.sessionId || extractJson.session_id || `sess_${Date.now()}`, extractJson);
      const planText = buildFollowUpPlan(extractJson);
      const planCheck = parsePlanItems(planText);
      if (!planCheck.titleOk || planCheck.items.length < 1 || planCheck.items.length > 3 || planCheck.invalidMore) throw new Error('跟进计划格式错误');
      const { p1, p2 } = await generateBodyWithRetry(extractJson);
      const fullText = composeFinalText(p1, p2, planText);
      const [line1, line2, ...rest] = fullText.split(/\r?\n/);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ profile: line1, record: line2, plan: rest.join('\n'), fullText, extractJson }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: String(e) }));
    }
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => console.log(`AMS server running on ${PORT}`));
