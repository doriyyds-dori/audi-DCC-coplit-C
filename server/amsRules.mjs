export const UNKNOWN = '待确认';
export const countChineseChars = (text) => text.replace(/[\s\n]/g, '').length;
export const parsePlanItems = (text) => {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const titleOk = lines[0] === '后续跟进计划';
  const items = lines.filter((l) => /^([1-3])\.\s/.test(l));
  const invalidMore = lines.some((l) => /^[4-9]\.\s/.test(l));
  return { titleOk, items, invalidMore };
};
export const buildFollowUpPlan = (extract) => {
  const facts = extract?.facts || {};
  const invite = facts.invite_result || UNKNOWN;
  const objections = Array.isArray(extract?.objections) ? extract.objections : [];
  const hasTradeIn = (facts.trade_in || '').includes('是');
  const intent = facts.intent_level || UNKNOWN;
  const plan = [];
  if (invite.includes('已约')) plan.push('1. 立即发送门店定位、接待人联系方式及到店提醒，确认到店时间与人数。');
  else plan.push('1. 发送车型亮点与门店定位资料，48小时内二次回访锁定试驾档期（待确认时间）。');
  if (objections.length > 0) plan.push(`2. 针对“${objections[0].topic || UNKNOWN}”准备对比说明与权益口径，电话/微信复述确认是否消除顾虑。`);
  else plan.push('2. 回访补充客户预算、购车决策人及付款方式信息，完善成交条件（待确认）。');
  if (hasTradeIn) plan.push('3. 邀请到店做旧车评估并预估置换补贴，形成总价方案推进成交。');
  else if (intent === '高') plan.push('3. 推进本周末到店试驾并锁定配置，跟进订车节点。');
  else plan.push('3. 保持每周一次触达，优先确认试驾意愿与时间窗口。');
  return ['后续跟进计划', ...plan.slice(0, 3)].join('\n');
};
export const validateBody = (p1, p2) => { const total = countChineseChars(`${p1}${p2}`); return total >= 100 && total <= 150; };
export const composeFinalText = (p1, p2, planText) => `${p1}\n${p2}\n${planText}`;
export const mustUseUnknownWhenMissing = (extract, text) => {
  const required = [extract?.facts?.customer_title, extract?.facts?.consult_model, extract?.facts?.intent_level];
  const hasMissing = required.some((v) => !v || v === 'unknown');
  return !hasMissing || /待确认|未获取/.test(text);
};
