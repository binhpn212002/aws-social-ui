'use client';

import { Image as ImageIcon, Smile, Video, X } from 'lucide-react';
import { useState } from 'react';

type SocialCreatePostModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmitPost?: (postData: { content: string; privacy: string }) => void;
};

export const SocialCreatePostModal: React.FC<SocialCreatePostModalProps> = ({
  isOpen,
  onClose,
  onSubmitPost,
}) => {
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'FRIENDS' | 'PRIVATE'>('PUBLIC');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmitPost?.({ content, privacy });
      setIsSubmitting(false);
      setContent('');
      onClose();
    }, 600);
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Tạo bài viết mới</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User Info & Privacy selector */}
        <div className="mt-4 flex items-center gap-3">
          {/* oxlint-disable-next-line next(no-img-element) */}
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
            alt="My Profile"
            className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-500/30"
          />
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Alex Johnson</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <select
                value={privacy}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'PUBLIC' || val === 'FRIENDS' || val === 'PRIVATE') {
                    setPrivacy(val);
                  }
                }}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <option value="PUBLIC">🌍 Công khai (PUBLIC)</option>
                <option value="FRIENDS">👥 Bạn bè (FRIENDS)</option>
                <option value="PRIVATE">🔒 Chỉ mình tôi (PRIVATE)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Text Area */}
        <div className="mt-4">
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
            }}
            placeholder="Alex ơi, bạn đang nghĩ gì thế? Hãy chia sẻ với cộng đồng..."
            rows={4}
            className="w-full resize-none rounded-xl border-none bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none dark:text-white"
          />
        </div>

        {/* Media attachments bar */}
        <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200/90 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-800/50">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Thêm vào bài viết:
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              title="Thêm ảnh/video (S3 upload)"
              className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
            >
              <ImageIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              title="Thêm video"
              className="rounded-lg p-2 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40"
            >
              <Video className="h-5 w-5" />
            </button>
            <button
              type="button"
              title="Cảm xúc / Emoji"
              className="rounded-lg p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40"
            >
              <Smile className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition-all hover:opacity-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Đang đăng tải bài viết...' : 'Đăng bài'}
          </button>
        </div>
      </div>
    </div>
  );
};
