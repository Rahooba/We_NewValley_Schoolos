import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Reveal } from '@/components/Reveal';
import { MomentsSlider } from '@/components/MomentsSlider';
import {
  ArrowLeft,
  ChevronDown,
  Sparkles,
  Landmark,
  UtensilsCrossed,
  Users,
  Trophy,
  GraduationCap,
  Factory,
  DoorOpen,
  ClipboardCheck,
  Award,
  FileCheck2
} from 'lucide-react';

const achievements = [
  {
    image: '/achievements/visit-02.jpg',
    icon: Landmark,
    title: 'زيارة دولة رئيس مجلس الوزراء',
    description:
      'استقبلت المدرسة دولة رئيس مجلس الوزراء وعددًا من الوزراء والمسؤولين، في جولة تفقدية شملت معامل الشبكات والإلكترونيات وقاعات الحاسب الآلي، والاطلاع على مشروعات الطلاب.'
  },
  {
    image: '/achievements/iftar-01.jpg',
    icon: UtensilsCrossed,
    title: 'الإفطار الجماعي بالمدرسة',
    description:
      'جمعت مائدة الإفطار الجماعي أسرة المدرسة من طلاب ومعلمين وإداريين في أجواء أسرية مميزة، احتفاءً بروح التكافل والانتماء داخل المدرسة.'
  },
  {
    image: '/achievements/group-photo.jpg',
    icon: Users,
    title: 'أسرة مدرسة WE للتكنولوجيا التطبيقية',
    description:
      'صورة جماعية تجمع طلاب وطالبات المدرسة مع أعضاء هيئة التدريس والإدارة، تعبيرًا عن روح الفريق الواحد التي تميز مسيرتنا التعليمية.'
  },
  {
    image: '/achievements/we-visit-01.jpg',
    icon: Factory,
    title: 'زيارة ممثلي WE للاتصالات لتفقد التجهيزات',
    description:
      'استقبلت المدرسة السيد نائب محافظ الوادي الجديد في جولة تفقدية لتجهيزات مدرسة WE للتكنولوجيا التطبيقية ومصنع الملابس الجاهزة، بحضور ممثلي شركة WE للاتصالات وبمرافقة الدكتور جمال حسن محمد وكيل وزارة التربية والتعليم بالمحافظة.'
  },
  {
    image: '/achievements/opening-2022.jpg',
    icon: DoorOpen,
    title: 'افتتاح المدرسة عام 2022',
    description:
      'خلال الأسبوع الأول من دخولها الخدمة، شهد السيد محافظ الوادي الجديد طابور الصباح بمدرسة WE للتكنولوجيا التطبيقية، يرافقه الدكتور جمال حسن وكيل التعليم بالمحافظة، في بداية مشرقة لمسيرة المدرسة.'
  },
  {
    image: '/achievements/governor-visit-01.jpg',
    icon: ClipboardCheck,
    title: 'جولة تفقدية لمحافظ الوادي الجديد',
    description:
      'شملت الجولة التفقدية للواء الدكتور محمد الزملوط محافظ الوادي الجديد والسيدة حنان مجدي زيارة مدرسة WE للتكنولوجيا التطبيقية، برفقة المهندس سيد عبد العزيز وكيل التربية والتعليم، والأستاذ جهاد متولي رئيس المركز، والمهندسة إيمان صبر مدير فرع الأبنية التعليمية.'
  },
  {
    image: '/achievements/edutech-2024.jpg',
    icon: Award,
    title: 'المشاركة في معرض EDU Tech الدولي 2024',
    description:
      'مثّل طلاب مدرسة WE للتكنولوجيا التطبيقية بالوادي الجديد مدارس WE على مستوى الجمهورية في الدورة الثالثة لمعرض EDU Tech الدولي للتعليم الفني والتدريب المهني، بعد فوزهم بالمركز الأول في مسابقة Youth In Lead للمشروعات.'
  },
  {
    image: '/achievements/exams-2025-2026.jpg',
    icon: FileCheck2,
    title: 'متابعة امتحانات الدبلومات الفنية',
    description:
      'تابعت السيدة حنان مجدي محافظ الوادي الجديد انطلاق امتحانات الدبلومات الفنية للعام الدراسي 2025/2026، والتي أداها 2639 طالبًا وطالبة أمام 14 لجنة امتحانية، برفقة السيد محمد كجك نائب المحافظ والدكتور إبراهيم قناوي مدير مديرية التربية والتعليم.'
  }
];

const moments = [
  { image: '/achievements/visit-01.jpg', caption: 'جولة داخل ورشه الاتصالات' },
  { image: '/achievements/visit-03.jpg', caption: 'شرح مشروعات الطلاب لدولة رئيس الوزراء' },
  { image: '/achievements/visit-04.jpg', caption:'تفقد رئيس الوزراء ووزير التربيه والتعليم للمدرسة '},
  { image: '/achievements/iftar-02.jpg', caption: 'لحظات من الإفطار الجماعي' },
  { image: '/achievements/iftar-03.jpg', caption: 'أجواء أسرية بين الطلاب' },
  { image: '/achievements/iftar-04.jpg', caption: 'استعدادات الاحتفالية بالمدرسة' },
  { image: '/achievements/celebration-01.jpg', caption: 'من احتفالات المدرسة' },
  { image: '/achievements/celebration-02.jpg', caption: 'فعاليات الفان داي' },
  { image: '/achievements/celebration-03.jpg', caption: 'أجواء الفرحة بين الطلاب' }
];

export default async function WelcomePage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login?callbackUrl=/welcome');
  }

  const firstName = (session.user.name ?? '').split(' ')[0] || 'بك';

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-paper">
      {/* ---------- HERO ---------- */}
      <section className="relative isolate flex min-h-[92vh] flex-col overflow-hidden px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-10">
        {/* animated gradient backdrop */}
        <div
          className="absolute inset-0 -z-20 animate-gradient-pan bg-size-[200%_200%]"
          style={{
            backgroundImage:
              'linear-gradient(120deg, #3b1a63 0%, #5b2a8c 35%, #8b4fd6 65%, #2fc0a8 100%)'
          }}
        />
        <div className="absolute inset-0 -z-10 bg-black/10" />

        {/* floating decorative blobs */}
        <div className="pointer-events-none absolute -top-16 -right-16 -z-10 h-56 w-56 animate-float-slow rounded-full bg-white/10 blur-2xl sm:h-72 sm:w-72" />
        <div className="pointer-events-none absolute bottom-0 -left-10 -z-10 h-48 w-48 animate-float-slower rounded-full bg-accent/20 blur-2xl sm:h-64 sm:w-64" />
        <div className="pointer-events-none absolute top-1/3 left-1/4 -z-10 h-24 w-24 animate-float-slow rounded-full bg-white/10 blur-xl" />

        {/* top bar: logos + skip link */}
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-2 rounded-2xl bg-white/90 px-3 py-1.5 shadow-lg backdrop-blur sm:px-4 sm:py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/school.png" alt="شعار المدرسة" className="h-7 w-auto sm:h-9" />
          </div>
          <Link
            href="/dashboard"
            className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/30 backdrop-blur transition-colors hover:bg-white/25 sm:px-4 sm:py-2 sm:text-sm"
          >
            تخطي إلى لوحة التحكم
          </Link>
        </div>

        {/* hero content */}
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-5 py-10 text-center sm:gap-7">
          <span className="animate-fade-in-up inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-medium text-white ring-1 ring-white/25 backdrop-blur sm:text-sm">
            <Sparkles size={15} className="text-accent" />
            أهلاً بعودتك إلى SchoolOS
          </span>

          <h1
            className="animate-fade-in-up text-3xl font-extrabold leading-tight text-white text-balance sm:text-5xl md:text-6xl"
            style={{ animationDelay: '120ms' }}
          >
            مرحبًا {firstName}، في مدرسة
            <span className="block bg-linear-to-l from-accent via-white to-accent bg-clip-text text-transparent">
              WE للتكنولوجيا التطبيقية بالوادي الجديد
            </span>
          </h1>

          <p
            className="animate-fade-in-up max-w-2xl text-sm leading-relaxed text-white/85 sm:text-lg"
            style={{ animationDelay: '240ms' }}
          >
            رحلة تعليمية نفخر بها يومًا بعد يوم؛ من زيارات رسمية رفيعة المستوى إلى لحظات إنسانية جمعت
            أسرتنا المدرسية. تصفح أبرز إنجازات المدرسة، ثم تابع إلى لوحة التحكم لإدارة يومك الدراسي.
          </p>

          <div
            className="animate-fade-in-up flex w-full flex-col items-center gap-3 pt-2 sm:w-auto sm:flex-row"
            style={{ animationDelay: '360ms' }}
          >
            <Link
              href="/dashboard"
              className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-8 py-3.5 text-sm font-bold text-brand-dark shadow-[0_18px_40px_-12px_rgba(0,0,0,0.45)] transition-transform hover:-translate-y-0.5 sm:w-auto sm:text-base"
            >
              <span className="animate-pulse-ring absolute inset-0 rounded-full" />
              الذهاب إلى لوحة التحكم
              <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
            </Link>
            <a
              href="#achievements"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/40 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
            >
              استعرض إنجازاتنا
            </a>
          </div>
        </div>

        {/* scroll cue */}
        <a
          href="#achievements"
          aria-label="مرر لأسفل"
          className="mx-auto mt-2 flex h-9 w-9 animate-bounce items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/30 backdrop-blur"
        >
          <ChevronDown size={18} />
        </a>
      </section>

      {/* ---------- ACHIEVEMENTS ---------- */}
      <section id="achievements" className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-10">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3.5 py-1 text-xs font-semibold text-brand sm:text-sm">
            <Trophy size={14} />
            إنجازات مدرستنا
          </span>
          <h2 className="mt-4 font-display text-2xl font-extrabold text-ink sm:text-4xl">
            محطات نفخر بها
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
            لقطات من الفترة الماضية توثّق مسيرة مدرستنا؛ من زيارات رسمية رفيعة المستوى إلى فعاليات
            جمعت أسرتنا المدرسية كلها في أجواء دافئة.
          </p>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:mt-14 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3">
          {achievements.map((item, i) => {
            const Icon = item.icon;
            return (
              <Reveal key={item.title} delay={i * 140} className="h-full">
                <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_10px_30px_-16px_rgba(59,26,99,0.25)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_24px_45px_-18px_rgba(59,26,99,0.35)]">
                  <div className="relative aspect-4/3 w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-brand-dark/80 via-brand-dark/10 to-transparent" />
                    <span className="brand-gradient absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-lg sm:top-4 sm:right-4">
                      <Icon size={18} />
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-5 sm:p-6">
                    <h3 className="font-display text-base font-bold text-ink sm:text-lg">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-muted">{item.description}</p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ---------- MOMENTS MOSAIC ---------- */}
      <section className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-10">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3.5 py-1 text-xs font-semibold text-accent sm:text-sm">
            <GraduationCap size={14} />
            لحظات من الفترة الماضية
          </span>
          <h2 className="mt-4 font-display text-2xl font-extrabold text-ink sm:text-4xl">
            المزيد من الذكريات
          </h2>
        </Reveal>

        <MomentsSlider moments={moments} />
      </section>

      {/* ---------- FINAL CTA ---------- */}
      <section className="relative mx-auto mb-16 max-w-5xl px-4 sm:mb-24 sm:px-6 lg:px-10">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl px-6 py-12 text-center shadow-[0_25px_55px_-20px_rgba(59,26,99,0.45)] sm:px-12 sm:py-16">
            <div
              className="absolute inset-0 -z-10 animate-gradient-pan bg-size-[200%_200%]"
              style={{
                backgroundImage: 'linear-gradient(120deg, #5b2a8c, #3b1a63, #2fc0a8, #5b2a8c)'
              }}
            />
            <h2 className="font-display text-2xl font-extrabold text-white sm:text-3xl">
              جاهز لمتابعة يومك الدراسي؟
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/85 sm:text-base">
              انتقل الآن إلى لوحة التحكم لمتابعة الحضور والدرجات والأنشطة وكل ما يخص مدرستك.
            </p>
            <Link
              href="/dashboard"
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-brand-dark shadow-lg transition-transform hover:-translate-y-0.5 sm:text-base"
            >
              الذهاب إلى لوحة التحكم
              <ArrowLeft size={18} />
            </Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
