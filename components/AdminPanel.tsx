import React, { useRef, useState } from 'react';
import { downloadCSV, exportUsersCSV, getAllUsers, importUsersFromCSV, validateUtf8File } from '../services/authService';
import { exportActionDictionaryCSV, exportBehaviorCSV, exportBehaviorEventsCSV, getBehaviorPath, setBehaviorPath } from '../services/behaviorLogService';

const AdminPanel: React.FC = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const [path, setPath] = useState(getBehaviorPath());

  const onUpload = async (file?: File) => {
    if (!file) return;
    try {
      const text = await validateUtf8File(file);
      const result = importUsersFromCSV(text);
      setMsg(`导入成功：新增 ${result.created}，更新 ${result.updated}`);
    } catch (e: any) {
      setMsg(`导入失败：${e.message}`);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold">管理员功能</h2>
      <div className="bg-white border rounded-xl p-4 space-y-3">
        <div className="font-semibold">用户名单导入（CSV UTF-8）</div>
        <input ref={fileRef} type="file" accept=".csv" onChange={(e) => onUpload(e.target.files?.[0])} />
        <p className="text-xs text-gray-500">列名必须：区域经理,城市,门店简称,门店代码,岗位,姓名</p>
      </div>

      <div className="bg-white border rounded-xl p-4 space-y-3">
        <div className="font-semibold">账号导出</div>
        <div className="flex gap-2">
          <button className="px-3 py-2 border rounded" onClick={() => downloadCSV('all_users_latest.csv', exportUsersCSV())}>导出最新用户名与密码</button>
          <button className="px-3 py-2 border rounded" onClick={() => downloadCSV('ams_behavior_summary.csv', exportBehaviorCSV())}>导出行为汇总</button>
          <button className="px-3 py-2 border rounded" onClick={() => downloadCSV('ams_behavior_events.csv', exportBehaviorEventsCSV())}>导出事件明细</button>
          <button className="px-3 py-2 border rounded" onClick={() => downloadCSV('action_dictionary.csv', exportActionDictionaryCSV())}>导出按钮字典</button>
        </div>
        <p className="text-xs text-gray-500">当前用户总数：{getAllUsers().length}</p>
      </div>

      <div className="bg-white border rounded-xl p-4 space-y-3">
        <div className="font-semibold">行为日志路径（用于后续 OneDrive 同步）</div>
        <input value={path} onChange={(e) => setPath(e.target.value)} className="w-full border rounded px-3 py-2" />
        <button className="px-3 py-2 border rounded" onClick={() => { setBehaviorPath(path); setMsg('路径已保存'); }}>保存路径</button>
      </div>

      {msg && <div className="text-sm text-purple-700">{msg}</div>}
    </div>
  );
};

export default AdminPanel;
