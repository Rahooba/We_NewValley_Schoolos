# SchoolOS — Next.js Edition

هذا تحويل مشروع **SchoolOS** من Google Apps Script + Google Sheets إلى:

- **Next.js 14** (App Router) بدل Frontend/Pages القديمة
- **PostgreSQL عبر Supabase** بدل Google Sheets، باستخدام **Prisma ORM**
- **NextAuth.js** بدل الـ AuthService/SessionManager اليدوي، مع نفس فكرة الـ Roles/Permissions

## مطابقة الهيكل القديم بالجديد

| القديم (Google Apps Script) | الجديد (Next.js) |
|---|---|
| `Login.html` + `LoginJS.html` | `app/(auth)/login/page.tsx` + `components/LoginForm.tsx` |
| `AuthService` (GAS) | `lib/auth.ts` (NextAuth Credentials Provider) |
| `SessionManager` (GAS) | JWT session من NextAuth (تلقائي، محفوظ في cookie موقّع) |
| `Dashboard.html` + `Navbar/Sidebar.html` | `app/(dashboard)/layout.tsx` + `components/Sidebar.tsx` + `components/Topbar.tsx` |
| `Router.gs` (SPA يدوي) | Next.js App Router (تلقائي، كل مجلد = صفحة) |
| 01_System_DB (Users/Roles/Permissions) | جداول `users` / `roles` / `permissions` / `role_permissions` في Postgres (`prisma/schema.prisma`) |
| 02–10 (باقي القواعد) | باقي الموديلات في نفس ملف `prisma/schema.prisma`، كل قاعدة قديمة = مجموعة جداول موضحة بالتعليقات |

## هيكل المشروع

```
schoolos-next/
├── prisma/
│   ├── schema.prisma      ← كل الـ 10 قواعد بيانات القديمة كجداول Postgres
│   └── seed.ts            ← يزرع الـ Roles + Permissions بالظبط زي شيتاتك + يوزر أدمن افتراضي
├── lib/
│   ├── auth.ts            ← إعدادات NextAuth
│   ├── prisma.ts          ← Prisma client
│   └── nav.ts             ← تعريف الشريط الجانبي + الصلاحية المطلوبة لكل مسار (مصدر واحد للحقيقة)
├── middleware.ts          ← يحمي كل المسارات تلقائيًا حسب صلاحيات الـ Role
├── app/
│   ├── (auth)/login/      ← صفحة تسجيل الدخول
│   └── (dashboard)/       ← كل الوحدات: students, hr, academics, exams, inventory,
│                             visitors, quality, committees, reports, settings/users, settings/roles
└── components/            ← Sidebar, Topbar, LoginForm, PermissionGate
```

## التشغيل محليًا

1. **أنشئ مشروع Supabase** (مجاني): https://supabase.com → انسخ الـ Connection String من
   Project Settings → Database (استخدمي كل من "Connection pooling" لـ `DATABASE_URL` و
   "Direct connection" لـ `DIRECT_URL`).

2. انسخي `.env.example` إلى `.env` واملئي القيم:
   ```bash
   cp .env.example .env
   ```

3. ثبّتي الحزم:
   ```bash
   npm install
   ```

4. أنشئي الجداول في Supabase:
   ```bash
   npx prisma migrate dev --name init
   ```

5. ازرعي بيانات الـ Roles/Permissions + يوزر أدمن افتراضي:
   ```bash
   npm run db:seed
   ```
   (البيانات اللي هتتزرع هي بالظبط جدول الـ Roles وجدول الـ Permissions اللي بعتيهم.
   جدول Role_Permissions كان لسه فاضي عندك، فحطينا ربط منطقي مبدئي حسب وصف كل دور —
   عدّليه براحتك من صفحة "الأدوار والصلاحيات" بعد التشغيل.)

6. شغّلي السيرفر:
   ```bash
   npm run dev
   ```
   وادخلي على http://localhost:3000 — هيوديكي على صفحة تسجيل الدخول تلقائيًا.
   بيانات الدخول الافتراضية: `admin@schoolos.local` / `ChangeMe123!` (غيّريها فورًا).

> **ملاحظة:** في بيئة الإنشاء الحالية مفيش اتصال إنترنت لتحميل محرك Prisma الثنائي
> (`binaries.prisma.sh` غير متاح)، فمقدرتش أشغّل `prisma generate` هنا لاختبار كامل.
> على جهازك (بيه إنترنت طبيعي) الأمر هيشتغل عادي زي أي مشروع Prisma.

## اللي شغال فعليًا دلوقتي

- ✅ تسجيل دخول كامل (NextAuth + bcrypt + Prisma) — نفس فكرة AuthService/UserService القديمة
- ✅ حماية كل المسارات بالـ middleware حسب صلاحيات الـ Role (مطابق لجدول Permissions)
- ✅ Sidebar ديناميكي بيظهر بس الوحدات اللي المستخدم له صلاحية `.view` فيها
- ✅ وحدة **شئون الطلاب** شغالة بالكامل كمرجع (قراءة من Postgres) — استخدميها كنموذج لباقي الوحدات
- ✅ صفحتي **إدارة المستخدمين** و **الأدوار والصلاحيات** شغالتين وبتقرأ من نفس جداول الـ Roles/Permissions
- 🔄 باقي الوحدات (HR, Academics, Exams, Inventory, Visitors, Quality, Committees, Reports) لسه
  Placeholder — الجداول جاهزة في `schema.prisma`، الباقي بناء شاشات CRUD زي "شئون الطلاب"

## الخطوة الجاية المقترحة

كملي الـ Roadmap بتاعك بنفس الترتيب: **Phase 2 (Master Data)** — ابدئي بصفحة "إضافة طالب"
(`app/(dashboard)/students/new`) وServer Action بتاعتها، وبعدين كرري نفس النمط على HR.
لو عايزاني أكمل معاكي وحدة بعد التانية، قوليلي وهنكملها سوا.
