import assert from 'node:assert/strict';
import { buildFollowUpPlan, composeFinalText, countChineseChars, mustUseUnknownWhenMissing, parsePlanItems, validateBody } from '../server/amsRules.mjs';

const extract = {
  schema_version: '1.0.0',
  session_id: 's1',
  facts: { customer_title: '张先生', consult_model: 'Audi E5', intent_level: 'unknown', invite_result: '待定', trade_in: '否' },
  concerns: [{ topic: '续航', evidence: [{ action_key: 'pitch_range', action_label: '续航讲解' }] }],
  objections: [{ topic: '价格', evidence: [{ manual_note: '客户说预算高' }] }],
};

const plan = buildFollowUpPlan(extract);
const parsed = parsePlanItems(plan);
assert.equal(parsed.titleOk, true);
assert.equal(parsed.invalidMore, false);
assert.ok(parsed.items.length <= 3);

const p1 = '客户张先生咨询Audi E5，关注续航与价格，性格理性谨慎，客户类型偏对比决策，意向等级待确认，缺失信息后续补充。';
const p2 = '本次为新客首触，已介绍续航补能与权益，客户认可空间表现，已确认基础用车场景，邀约暂未锁定时间，异议集中在预算对比，后续按计划推进。';
assert.equal(validateBody(p1, p2), true);
const bodyCount = countChineseChars(`${p1}${p2}`);
assert.ok(bodyCount >= 100 && bodyCount <= 150);

const text = composeFinalText(p1, p2, plan);
assert.ok(/后续跟进计划\n1\./.test(text));
assert.equal(mustUseUnknownWhenMissing(extract, `${p1}${p2}`), true);

const actionStatsKey = JSON.stringify({ pitch_range: 2, closing_invite: 1 });
assert.equal(/csv_s_\d+/.test(actionStatsKey), false);

console.log('AMS rules checks passed');
