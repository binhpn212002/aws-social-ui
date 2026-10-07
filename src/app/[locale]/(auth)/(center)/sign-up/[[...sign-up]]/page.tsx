'use client';

import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Sparkles,
  User,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from '@/libs/I18nNavigation';

type PasswordRulesProps = {
  hasMinLength: boolean;
  hasLower: boolean;
  hasUpper: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
};

function PasswordRequirements({
  hasMinLength,
  hasLower,
  hasUpper,
  hasNumber,
  hasSpecial,
}: PasswordRulesProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 text-[11px] dark:border-slate-800 dark:bg-slate-800/60">
      <p className="font-semibold text-slate-600 dark:text-slate-300">Yêu cầu bảo mật mật khẩu:</p>
      <div className="mt-1.5 grid grid-cols-2 gap-1 text-slate-500">
        <span className={`flex items-center gap-1 ${hasMinLength ? 'font-medium text-emerald-600 dark:text-emerald-400' : ''}`}>
          <CheckCircle2 className={`h-3 w-3 ${hasMinLength ? 'text-emerald-500' : 'text-slate-300'}`} />
          8+ ký tự
        </span>
        <span className={`flex items-center gap-1 ${hasUpper && hasLower ? 'font-medium text-emerald-600 dark:text-emerald-400' : ''}`}>
          <CheckCircle2 className={`h-3 w-3 ${hasUpper && hasLower ? 'text-emerald-500' : 'text-slate-300'}`} />
          Chữ hoa & thường
        </span>
        <span className={`flex items-center gap-1 ${hasNumber ? 'font-medium text-emerald-600 dark:text-emerald-400' : ''}`}>
          <CheckCircle2 className={`h-3 w-3 ${hasNumber ? 'text-emerald-500' : 'text-slate-300'}`} />
          Chữ số (0-9)
        </span>
        <span className={`flex items-center gap-1 ${hasSpecial ? 'font-medium text-emerald-600 dark:text-emerald-400' : ''}`}>
          <CheckCircle2 className={`h-3 w-3 ${hasSpecial ? 'text-emerald-500' : 'text-slate-300'}`} />
          Ký tự đặc biệt (@$!%*?&)
        </span>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password rules validation
  const hasMinLength = password.length >= 8;
  const hasLower = /[a-z]/u.test(password);
  const hasUpper = /[A-Z]/u.test(password);
  const hasNumber = /\d/u.test(password);
  const hasSpecial = /[@$!%*?&]/u.test(password);
  const isPasswordValid = hasMinLength && hasLower && hasUpper && hasNumber && hasSpecial;

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (isLoading) {
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage('Mật khẩu chưa đáp ứng đầy đủ tiêu chí bảo mật.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await register({
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password,
      });
      router.push('/feed');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-4">
      <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8 dark:border-slate-800/80 dark:bg-slate-900/90">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 text-white shadow-lg shadow-indigo-500/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-xl font-black tracking-tight text-slate-900 sm:text-2xl dark:text-white">
            Đăng ký tài khoản
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Tham gia cộng đồng kỹ sư và lập trình viên AWS Social
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          <div>
            <label htmlFor="fullName" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Họ và tên
            </label>
            <div className="relative mt-1">
              <UserCheck className="absolute top-3 left-3.5 h-4 w-4 text-slate-400" />
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="VD: Nguyễn Văn A"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-2.5 pr-4 pl-10 text-xs text-slate-800 placeholder-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label htmlFor="username" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Username (duy nhất, viết thường)
            </label>
            <div className="relative mt-1">
              <User className="absolute top-3 left-3.5 h-4 w-4 text-slate-400" />
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="VD: nguyenvana hoặc dev_hero"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-2.5 pr-4 pl-10 text-xs text-slate-800 placeholder-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Địa chỉ Email
            </label>
            <div className="relative mt-1">
              <Mail className="absolute top-3 left-3.5 h-4 w-4 text-slate-400" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-2.5 pr-4 pl-10 text-xs text-slate-800 placeholder-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mật khẩu bảo mật
            </label>
            <div className="relative mt-1">
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

          {password && (
            <PasswordRequirements
              hasMinLength={hasMinLength}
              hasLower={hasLower}
              hasUpper={hasUpper}
              hasNumber={hasNumber}
              hasSpecial={hasSpecial}
            />
          )}

          <div>
            <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Xác nhận mật khẩu
            </label>
            <div className="relative mt-1">
              <Lock className="absolute top-3 left-3.5 h-4 w-4 text-slate-400" />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-2.5 pr-4 pl-10 text-xs text-slate-800 placeholder-slate-400 transition focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !fullName.trim() || !username.trim() || !email.trim() || !password.trim()}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 py-3 text-xs font-bold text-white shadow-md shadow-indigo-500/25 transition hover:opacity-95 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang khởi tạo tài khoản...</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Hoàn tất đăng ký</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Link to Login */}
        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Đã có tài khoản?{' '}
          <Link
            href="/sign-in"
            className="font-bold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
