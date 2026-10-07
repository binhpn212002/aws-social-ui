'use client';

import {
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  LogIn,
  Sparkles,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from '@/libs/I18nNavigation';

type DemoUser = {
  name: string;
  role: string;
  identifier: string;
  badge: string;
};

const DEMO_USERS: DemoUser[] = [
  {
    name: 'Alex Johnson',
    role: 'Cloud Architect & Admin',
    identifier: 'alex_dev',
    badge: 'ADMIN',
  },
  {
    name: 'Vũ Quốc Bảo',
    role: 'Backend API Developer',
    identifier: 'quocbao_dev',
    badge: 'API DEV',
  },
  {
    name: 'Lê Mai Hương',
    role: 'Product & UI/UX Designer',
    identifier: 'huong_uiux',
    badge: 'DESIGNER',
  },
];

type DemoAccountsListProps = {
  onSelect: (username: string) => void;
};

function DemoAccountsList({ onSelect }: DemoAccountsListProps) {
  return (
    <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <KeyRound className="h-3.5 w-3.5 text-amber-500" />
        <span>Tài khoản demo mẫu (1-Click điền thông tin):</span>
      </div>
      <div className="mt-2.5 grid grid-cols-1 gap-2">
        {DEMO_USERS.map((demo) => (
          <button
            key={demo.identifier}
            type="button"
            onClick={() => onSelect(demo.identifier)}
            className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 px-3 py-2 text-left text-xs transition hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-slate-700/80 dark:bg-slate-800/60 dark:hover:bg-indigo-950/30"
          >
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100">{demo.name}</p>
              <p className="text-[11px] text-slate-400">@{demo.identifier} · {demo.role}</p>
            </div>
            <span className="rounded-lg bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
              {demo.badge}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SignInPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim() || isLoading) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login(identifier.trim(), password);
      router.push('/feed');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const selectDemoUser = (username: string) => {
    setIdentifier(username);
    setPassword('Password123@');
    setErrorMessage(null);
  };

  return (
    <div className="w-full max-w-md p-4">
      <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8 dark:border-slate-800/80 dark:bg-slate-900/90">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 text-white shadow-lg shadow-indigo-500/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-black tracking-tight text-slate-900 sm:text-2xl dark:text-white">
            Đăng nhập AWS Social
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Mạng xã hội đám mây hiệu năng cao trên nền tảng AWS Serverless
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="identifier" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Email hoặc Username
            </label>
            <div className="relative mt-1.5">
              <User className="absolute top-3 left-3.5 h-4 w-4 text-slate-400" />
              <input
                id="identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="VD: alex_dev hoặc user@example.com"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-2.5 pr-4 pl-10 text-xs text-slate-800 placeholder-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mật khẩu
            </label>
            <div className="relative mt-1.5">
              <Lock className="absolute top-3 left-3.5 h-4 w-4 text-slate-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-2.5 pr-10 pl-10 text-xs text-slate-800 placeholder-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-3 right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !identifier.trim() || !password.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 py-3 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition hover:opacity-95 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang xác thực...</span>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Đăng nhập</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Account Selection */}
        <DemoAccountsList onSelect={selectDemoUser} />

        {/* Footer Link to Register */}
        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Chưa có tài khoản?{' '}
          <Link
            href="/sign-up"
            className="font-bold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Đăng ký tài khoản mới
          </Link>
        </div>
      </div>
    </div>
  );
}
