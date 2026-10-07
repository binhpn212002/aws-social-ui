'use client';

import { CalendarClock, Clock, Plus, Trash2, User } from 'lucide-react';
import { useState } from 'react';

export default function ScheduledNotificationsPage() {
  const [schedules, setSchedules] = useState([
    {
      id: 'sch_1',
      recipient: 'Trần Quang Huy',
      title: 'Chúc mừng sinh nhật',
      message: 'Chúc mừng sinh nhật bạn hiền, chúc tuổi mới thêm nhiều chứng chỉ AWS!',
      scheduledAt: '2026-10-04 20:00',
      status: 'PENDING',
    },
    {
      id: 'sch_2',
      recipient: 'AWS Study Group',
      title: 'Nhắc họp ôn tập chứng chỉ SAA',
      message: 'Mọi người nhớ 20h tối mai lên Discord luyện đề thi chứng chỉ nhé.',
      scheduledAt: '2026-10-05 09:30',
      status: 'PENDING',
    },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <CalendarClock className="h-5 w-5 text-emerald-600" />
            Lịch hẹn thông báo tự động
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Đặt lịch gửi thông báo cho bạn bè vào thời điểm xác định qua AWS EventBridge & SQS
          </p>
        </div>

        <button className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90">
          <Plus className="h-4 w-4" /> Đặt lịch mới
        </button>
      </div>

      <div className="space-y-3">
        {schedules.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-md sm:flex-row sm:items-center sm:justify-between dark:border-slate-800/80 dark:bg-slate-900/80"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {item.title}
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                  {item.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.message}</p>
              <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> Gửi tới: <strong>{item.recipient}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Clock className="h-3.5 w-3.5" /> {item.scheduledAt}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setSchedules(schedules.filter((s) => s.id !== item.id));
              }}
              className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-slate-700 dark:hover:bg-rose-950/20"
            >
              <Trash2 className="h-3.5 w-3.5" /> Hủy lịch
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
