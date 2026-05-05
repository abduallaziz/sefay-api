# CLAUDE.md — Sefay SaaS ERP

## نظرة عامة
نظام SaaS متكامل لأي نوع تجاري (كوفي، سوبرماركت، ورشة، مغسلة، خياط...)
المطور: مبتدئ يعتمد على Claude.

## المشاريع
- API: https://github.com/abduallaziz/sefay-api (NestJS على Railway)
- Web: https://github.com/abduallaziz/sefay-web (Next.js على Vercel)
- Mobile: https://github.com/abduallaziz/washcloud — مجلد washcloud-mobile

## Tech Stack
- Backend: NestJS + TypeScript + Supabase PostgreSQL + JWT
- Frontend: Next.js + Tailwind + shadcn/ui + Zustand + next-intl
- Mobile: React Native + Expo

## هيكل Backend
```
src/modules/
├── auth/
├── business/
├── users/
├── items/          ← (كان services، تم rename)
├── orders/
├── customers/
├── employees/
├── branches/
├── coupons/
├── expenses/
├── reports/
└── analytics/
```

## هيكل Frontend
```
app/
├── (auth)/         (login, register, onboarding)
└── (dashboard)/
    ├── page.tsx
    ├── orders/
    ├── items/      ← (كان services)
    ├── customers/
    ├── employees/
    ├── branches/
    ├── expenses/
    ├── coupons/
    ├── reports/
    ├── sync/
    └── settings/
```

## قواعد ثابتة
1. كل request فيه businessId
2. JwtAuthGuard + OnboardingGuard على كل الـ routes
3. Branch filter حسب الدور (cashier يشوف فرعه فقط)
4. لا تخلط data بين businesses
5. عربي في الشات — إنجليزي في الكود
6. اسأل عن الكود الموجود قبل أي تعديل

## Refactor القادم
تحويل النظام من Car Wash إلى Universal SaaS:
- services ➜ items
- حذف كل car/wash/vehicle logic
- Orders: serviceId ➜ items[]
- إضافة BusinessType enum
راجع TASKS.md للتفاصيل
