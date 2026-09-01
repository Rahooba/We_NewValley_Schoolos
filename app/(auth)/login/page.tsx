import { Suspense } from 'react';
import { LoginForm } from '@/components/LoginForm';
import { LiveClock } from '@/components/LiveClock';
import { ShieldCheck} from 'lucide-react';
export default function LoginPage() {
  return (
    <main
      className="relative min-h-dvh overflow-x-hidden bg-paper bg-cover bg-bottom bg-no-repeat"
      style={{ backgroundImage: 'url(/login-bg.jpg)' }}
    >
      <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-1 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">

        {/* Partner logos header */}
        <div className="mb-4 rounded-2xl border border-white bg-white/90 px-3 py-2 shadow-[0_10px_30px_-12px_rgba(91,42,140,0.2)] backdrop-blur sm:mb-6 sm:rounded-3xl sm:px-6 sm:py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos-header.png"
            alt="الجهات الداعمة لمنصة SchoolOS"
            className="mx-auto h-auto w-full max-w-4xl"
          />
        </div>

        {/* Login Section */}
        <div className="flex w-full flex-1 items-center justify-center py-2">

          {/* Login Card */}
          <div className="flex w-[92vw] max-w-2xl items-center justify-center rounded-2xl bg-white p-6 shadow-[0_20px_45px_-18px_rgba(59,26,99,0.2)] sm:w-full sm:rounded-3xl sm:p-10 lg:w-162.5 lg:max-w-2xl lg:p-12">

            <div className="w-full max-w-md">

              {/* Title */}
              <h2 className="font-display text-2xl font-extrabold text-brand-dark sm:text-3xl">
                تسجيل الدخول
              </h2>

              {/* Description */}
              <p className="mb-6 mt-1 text-sm text-muted sm:mb-8 sm:text-base">
                ادخل بيانات حسابك للمتابعة
              </p>

              {/* Login Form */}
              <Suspense fallback={null}>
                <LoginForm />
              </Suspense>

              {/* Security Message */}
              <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
                <ShieldCheck
                  size={14}
                  className="shrink-0 text-brand"
                />
                بياناتك محمية بالكامل
              </p>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl bg-white/70 px-4 py-3 backdrop-blur sm:mt-10 sm:flex-row sm:gap-4 sm:rounded-3xl sm:px-5 sm:py-4">

          {/* Live Clock */}
          <LiveClock />

          {/* Quote */}
          <p className="max-w-xs text-center text-xs italic leading-relaxed text-muted sm:max-w-none sm:text-sm">
            &quot; التعليم هو أقوى سلاح يمكنك استخدامه لتغيير العالم &quot;
          </p>

          {/* WE Logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/we-logo.png"
            alt="WE"
            className="h-8 w-auto opacity-90 sm:h-10"
          />

        </div>
      </div>

      {/* NASS Academy Logo — fixed bottom-right of the page */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {/* <img
        src="/nass-logo.png"
        alt="NASS Academy"
        className="fixed bottom-3 right-3 z-50 h-10 w-10 rounded-xl object-cover shadow-[0_6px_18px_-6px_rgba(91,42,140,0.35)] ring-2 ring-white sm:bottom-4 sm:right-4 sm:h-12 sm:w-12"
      /> */}
      <img
  src="/galaxy-logo.jpg"
  alt="NASS Academy"
  className="fixed bottom-3 right-3 z-50 h-20 w-20 rounded-xl object-cover shadow-[0_6px_18px_-6px_rgba(91,42,140,0.35)] ring-2 ring-white sm:bottom-4 sm:right-4 sm:h-14 sm:w-14"
/>

      {/* Made & Developed By Badge — fixed bottom-left of the page */}
      <div className="fixed bottom-3 left-3 z-50 flex items-center gap-2 rounded-full border border-border bg-white/95 px-2 py-1.5 shadow-[0_6px_18px_-6px_rgba(91,42,140,0.35)] backdrop-blur sm:bottom-4 sm:left-4 sm:gap-2.5 sm:px-3 sm:py-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/rehab-photo.jpg"
          alt="Eng. Rehab Ashraf"
          className="h-7 w-7 rounded-full object-cover ring-2 ring-brand/20 sm:h-8 sm:w-8"
        />
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] font-medium text-muted sm:text-[11px]">
            Made &amp; developed by
          </span>
          <span className="text-xs font-bold text-brand-dark sm:text-sm">
            Eng/Rehab Ashraf
          </span>
        </div>
      </div>
    </main>
  );
}