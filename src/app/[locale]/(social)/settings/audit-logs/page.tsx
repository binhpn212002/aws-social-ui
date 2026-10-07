'use client';

import { Laptop, ShieldCheck, Smartphone } from 'lucide-react';

export default function UserAuditLogsPage() {
  const auditLogs = [
    {
      id: 'log_1',
      action: 'USER_LOGIN',
      actionTitle: 'Đăng nhập thành công',
      ip: '118.69.182.45 (TP. Hồ Chí Minh, VN)',
      device: 'MacBook Pro / Chrome 129',
      icon: Laptop,
      time: 'Hôm nay, 14:15',
      status: 'SUCCESS',
    },
    {
      id: 'log_2',
      action: 'PASSWORD_CHANGE',
      actionTitle: 'Đổi mật khẩu tài khoản',
      ip: '118.69.182.45 (TP. Hồ Chí Minh, VN)',
      device: 'MacBook Pro / Chrome 129',
      icon: Laptop,
      time: 'Hôm qua, 09:30',
      status: 'SUCCESS',
    },
    {
      id: 'log_3',
      action: 'USER_LOGIN',
      actionTitle: 'Đăng nhập qua di động',
      ip: '14.161.32.18 (Viettel 4G)',
      device: 'iPhone 15 Pro / Safari',
      icon: Smartphone,
      time: '3 ngày trước',
      status: 'SUCCESS',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
          <ShieldCheck className="h-5 w-5 text-teal-600" />
          Nhật ký an ninh & Hoạt động tài khoản
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Theo dõi các lần đăng nhập, thiết bị và các thao tác bảo mật nhạy cảm (truy xuất từ
          DynamoDB)
        </p>
      </div>

      <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-md dark:divide-slate-800/60 dark:border-slate-800/80 dark:bg-slate-900/80">
        {auditLogs.map((log) => {
          const Icon = log.icon;
          return (
            <div
              key={log.id}
              className="flex items-center justify-between py-3.5 first:pt-1 last:pb-1"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-teal-50 p-2.5 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {log.actionTitle}
                    </h4>
                    <span className="py-0.2 rounded-full bg-emerald-100 px-2 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                      {log.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {log.device} · IP: {log.ip}
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-slate-400">{log.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
