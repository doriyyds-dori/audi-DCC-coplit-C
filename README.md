# Audi DCC Copilot

## 环境变量
> 所有敏感配置仅放环境变量，严禁写死到代码。

- `DASHSCOPE_API_KEY`：通义千问 API Key（仅后端 `server/index.mjs` 读取）
- `EXTRACT_MODEL`：A段抽取模型，默认 `qwen-turbo`
- `GENERATE_MODEL`：B段生成模型，默认 `qwen-plus`
- `AMS_SERVER_PORT`：本地 AMS 服务端口，默认 `8787`
- `GEMINI_API_KEY`：仅用于 Dojo 陪练（非 AMS）

### 本地运行（推荐）
1. `npm install`
2. 配置 `.env.local`（前端）和终端环境变量（后端）
3. 启动后端：`npm run server`
4. 启动前端：`npm run dev`

### Codespaces/服务器配置
- 在 Codespaces Secrets / 云环境变量中设置 `DASHSCOPE_API_KEY`、`EXTRACT_MODEL`、`GENERATE_MODEL`。
- 前端只调用 `/api/ams/generate`，不直接持有 DashScope 密钥。

## 两段式 AMS 生成
- A段（抽取）：输入 customer + events + context，输出严格 JSON（含 `schema_version`，缺失填 `unknown`，并带 evidence）。
- B段（写作）：先生成“后续跟进计划”（最多3条），再生成正文两段（100-150字），失败自动重试修正。

## 示例
### 示例输入（mock）
```json
{
  "sessionId": "sess_001",
  "customer": {"name": "张三", "gender": "先生", "series": "Audi E5"},
  "context": {"outcome": "UNDECIDED", "logs": "客户关注续航和价格"},
  "events": [
    {"ts": "2026-01-01T10:00:00Z", "action_key": "pitch_range", "action_label": "续航讲解", "action_group": "PITCH"}
  ]
}
```

### 示例A段输出（节选）
```json
{
  "schema_version": "1.0.0",
  "session_id": "sess_001",
  "facts": {"customer_title": "张先生", "consult_model": "Audi E5", "intent_level": "unknown"},
  "concerns": [{"topic": "续航", "evidence": [{"action_key": "pitch_range", "action_label": "续航讲解"}]}],
  "objections": [{"topic": "价格", "evidence": [{"manual_note": "预算顾虑"}]}]
}
```

### 示例B段输出（节选）
```text
客户张先生咨询Audi E5，核心关注续航与价格，性格理性谨慎，客户类型偏对比决策，当前意向等级待确认，关键信息以通话记录为准。
本次为新客首触，已介绍续航补能与核心权益，客户认可空间与续航表现，邀约暂未锁定时间，主要异议在预算对比，后续继续推进。
后续跟进计划
1. 发送车型亮点与门店定位资料，48小时内二次回访锁定试驾档期（待确认时间）。
2. 针对“价格”准备对比说明与权益口径，电话/微信复述确认是否消除顾虑。
3. 保持每周一次触达，优先确认试驾意愿与时间窗口。
```

## 验证脚本
- `npm run test:ams`
