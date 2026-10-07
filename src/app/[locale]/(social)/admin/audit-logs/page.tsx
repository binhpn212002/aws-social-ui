'use client';

import { RefreshCw, Search, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

export default function AdminAuditLogsPage() {
  const [selectedAction, setSelectedAction] = useState('ALL');

  const adminLogs = [
    {
      id: 'aud_9841',
      actor: 'alex.dev (usr_99)',
      action: 'POST_DELETE',
      resource: 'POST (p_5512)',
      ip: '118.69.182.45',
      time: '2026-10-03 14:10:02',
      status: 'SUCCESS',
    },
    {
      id: 'aud_9840',
      actor: 'huy.architect (usr_2)',
      action: 'BLOCK_USER',
      resource: 'USER (usr_88)',
      ip: '27.72.101.90',
      time: '2026-10-03 13:45:19',
      status: 'SUCCESS',
    },
    {
      id: 'aud_9839',
      actor: 'unknown_bot',
      action: 'LOGIN_FAILED',
      resource: 'AUTH',
      ip: '194.26.29.11',
      time: '2026-10-03 12:02:44',
      status: 'FAILED',
    },
    {
      id: 'aud_9838',
      actor: 'admin_root',
      action: 'SYSTEM_CONFIG_UPDATE',
      resource: 'DYNAMODB_INDEX',
      ip: '127.0.0.1 (VPN)',
      time: '2026-10-03 10:15:00',
      status: 'SUCCESS',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Bảng kiểm toán hệ thống (Admin Portal)
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Truy vấn toàn bộ nhật ký an ninh hệ thống phân tán DynamoDB với Cursor Pagination
            </p>
          </div>

          <button className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300">
            <RefreshCw className="h-3.5 w-3.5" /> Làm mới
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Lọc theo User ID, IP, Action..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pr-3 pl-9 text-xs text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <select
            value={selectedAction}
            onChange={(e) => {
              setSelectedAction(e.target.value);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <option value="ALL">Tất cả hành động</option>
            <option value="USER_LOGIN">USER_LOGIN</option>
            <option value="POST_DELETE">POST_DELETE</option>
            <option value="BLOCK_USER">BLOCK_USER</option>
            <option value="LOGIN_FAILED">LOGIN_FAILED</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold tracking-wider text-slate-400 uppercase dark:border-slate-800 dark:bg-slate-800/40">
            <tr>
              <th className="px-4 py-3">Log ID</th>
              <th className="px-4 py-3">Tác tử (Actor)</th>
              <th className="px-4 py-3">Hành động</th>
              <th className="px-4 py-3">Tài nguyên</th>
              <th className="px-4 py-3">IP Address</th>
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium dark:divide-slate-800/60">
            {adminLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                <td className="px-4 py-3 font-mono text-[11px] text-slate-400">{log.id}</td>
                <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                  {log.actor}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{log.resource}</td>
                <td className="px-4 py-3 font-mono text-[11px] text-slate-500">{log.ip}</td>
                <td className="px-4 py-3 text-slate-400">{log.time}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      log.status === 'SUCCESS'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                    }`}
                  >
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
