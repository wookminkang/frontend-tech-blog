# Next.js에서 layout.tsx와 라우트 그룹은 어떻게 활용하나요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

`layout.tsx`는 하위 페이지들이 공유하는 UI를 한 곳에 정의하는 파일입니다. 페이지를 이동해도 레이아웃은 유지된 채 콘텐츠 영역만 교체됩니다. 라우트 그룹은 폴더명을 `(폴더명)` 형식으로 만들어 URL 경로에는 영향을 주지 않으면서 레이아웃이나 파일을 묶는 방법입니다. 두 기능을 함께 쓰면 로그인 전/후 페이지, 대시보드, 마케팅 페이지처럼 서로 다른 레이아웃이 필요한 구간을 깔끔하게 분리할 수 있습니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

레이아웃과 라우트 그룹을 모르면 두 가지 문제가 반복됩니다.

**첫째, 루트 레이아웃 하나에 모든 UI를 밀어 넣습니다.** 헤더, 사이드바, 푸터를 `app/layout.tsx`에 전부 넣으면 로그인 페이지나 에러 페이지에도 헤더가 붙어버립니다. 조건부 렌더링으로 숨기려다 코드가 복잡해집니다.

**둘째, 레이아웃을 중복으로 작성합니다.** 비슷한 레이아웃이 필요한 페이지마다 Header, Footer를 직접 import해서 붙이면, 레이아웃을 수정할 때 모든 파일을 찾아 바꿔야 합니다.

`layout.tsx`가 중첩되는 방식과 라우트 그룹이 URL에 영향을 주지 않는다는 점을 이해하면 이 문제를 모두 해결할 수 있습니다.

**layout.tsx 중첩 구조**

```
app/
├── layout.tsx         ← 루트 레이아웃 (모든 페이지에 적용)
├── (marketing)/
│   ├── layout.tsx     ← 마케팅 전용 레이아웃 (루트 레이아웃 아래 중첩)
│   ├── page.tsx       → URL: /
│   └── about/
│       └── page.tsx   → URL: /about
├── (dashboard)/
│   ├── layout.tsx     ← 대시보드 전용 레이아웃
│   └── dashboard/
│       └── page.tsx   → URL: /dashboard
└── (auth)/
    ├── layout.tsx     ← 인증 전용 레이아웃 (헤더/푸터 없음)
    └── login/
        └── page.tsx   → URL: /login
```

폴더명의 `( )` 괄호는 URL에서 제거됩니다. `(marketing)`, `(dashboard)`, `(auth)`는 URL에 나타나지 않습니다.

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
// app/layout.tsx
// 루트 레이아웃에 모든 UI를 넣고 조건부로 숨기는 안티패턴

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Sidebar from '@/components/Sidebar';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // pathname을 클라이언트에서 읽어 조건 처리 — 서버 레이아웃에서 불가능
  // 결국 'use client'를 붙여야 하고, layout 전체가 클라이언트 컴포넌트가 됩니다.
  return (
    <html lang="ko">
      <body>
        <Header />   {/* 로그인 페이지에도 노출됨 */}
        <Sidebar />  {/* 마케팅 페이지에도 노출됨 */}
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

```tsx
// 레이아웃을 개별 페이지에 직접 import하는 안티패턴
// app/dashboard/page.tsx

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';

export default function DashboardPage() {
  return (
    <>
      <Header />
      <Sidebar />
      <main>대시보드 콘텐츠</main>
      <Footer />
    </>
  );
}
// 레이아웃 변경 시 이 구조를 가진 모든 파일을 수정해야 합니다.
```

---

#### 올바른 사용법 (Good Example)

```tsx
// app/layout.tsx — 루트 레이아웃은 html, body 태그와 전역 설정만 담당합니다.

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: '서비스명', template: '%s | 서비스명' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

```tsx
// app/(dashboard)/layout.tsx
// URL에는 영향 없음 — /dashboard, /settings 등에 적용됩니다.

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Header />
        <main>{children}</main>
      </div>
    </div>
  );
}
```

```tsx
// app/(auth)/layout.tsx
// 로그인, 회원가입 페이지는 헤더/사이드바 없이 단순한 레이아웃을 사용합니다.

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </main>
  );
}
```

```
// 완성된 라우트 구조와 URL

app/
├── layout.tsx                  ← 루트 (html, body만)
├── (dashboard)/
│   ├── layout.tsx              ← 헤더 + 사이드바 레이아웃
│   ├── dashboard/
│   │   └── page.tsx            → URL: /dashboard
│   └── settings/
│       └── page.tsx            → URL: /settings
└── (auth)/
    ├── layout.tsx              ← 중앙 정렬 레이아웃
    ├── login/
    │   └── page.tsx            → URL: /login
    └── signup/
        └── page.tsx            → URL: /signup
```

라우트 그룹 덕분에 `/dashboard`와 `/login`이 완전히 다른 레이아웃을 가지면서도, URL에는 그룹명이 드러나지 않습니다. 레이아웃을 수정할 때도 각 그룹의 `layout.tsx` 하나만 바꾸면 됩니다.

---

#### 정리 (Conclusion)

`layout.tsx`는 하위 페이지가 공유하는 UI를 정의하고, 페이지 이동 시 리렌더링 없이 유지됩니다. 라우트 그룹 `(폴더명)`은 URL 구조에 영향을 주지 않으면서 레이아웃과 파일을 논리적으로 묶어줍니다. 루트 `layout.tsx`는 `html`, `body`와 전역 설정만 담고, 구간별 레이아웃은 라우트 그룹 안의 `layout.tsx`로 분리하는 것이 권장 패턴입니다.

| 목적 | 방법 |
|------|------|
| 모든 페이지에 공통 적용 | `app/layout.tsx` |
| 특정 경로 그룹에만 레이아웃 적용 | `app/(그룹명)/layout.tsx` |
| URL에 영향 없이 파일 묶기 | `(폴더명)` 라우트 그룹 |
| 페이지 이동 시 레이아웃 유지 | `layout.tsx`가 자동으로 처리 |
| 특정 구간에서 레이아웃 초기화 | 해당 그룹에 별도 `layout.tsx` 작성 |

---

### 추가 학습 자료 공유합니다.

- [Next.js 공식 문서 — Layouts](https://nextjs.org/docs/app/building-your-application/routing/layouts-and-templates)
- [Next.js 공식 문서 — Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups)

---

### [ACTIONS]

```
[ 콘텐츠 피드백 ]    [ 공유하기 ]
```

---

### [FOOTER]

```
로고: 매일매일
Copyright © 2026 매일매일. All rights reserved.

Contact: kangmu238@gmail.com
Socials: / Github
```

---

## 키워드 변수 정의

| 키워드 | 값 |
|--------|----|
| `{{TITLE}}` | Next.js에서 layout.tsx와 라우트 그룹은 어떻게 활용하나요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | Next.js, layout, 라우트 그룹, App Router, Route Groups |
| `{{DATE}}` | 2026-04-16 |
| `{{SLUG}}` | nextjs-layout-and-route-groups |
| `{{SUMMARY}}` | layout.tsx로 공유 UI를 정의하고, (폴더명) 라우트 그룹으로 URL 변경 없이 레이아웃을 구간별로 분리합니다. |
| `{{WHY}}` | 루트 레이아웃에 모든 UI를 몰아넣거나, 레이아웃을 페이지마다 직접 import해 중복이 생깁니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
