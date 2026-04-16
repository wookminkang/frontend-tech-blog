# Next.js에서 [[...slug]]는 [...slug]와 어떻게 다른가요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

`[...slug]`는 하나 이상의 경로 세그먼트를 배열로 받는 캐치올 라우트이고, `[[...slug]]`는 세그먼트가 없는 경우(루트 경로)까지 포함하는 선택적 캐치올 라우트입니다. `[...slug]`는 `/docs/a` 처럼 하위 경로에만 매칭되고, `[[...slug]]`는 `/docs` 자체에도 매칭됩니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

깊이가 가변적인 URL 구조를 처리할 때 파일을 여러 개 만들거나, `[...slug]`와 루트 경로용 `page.tsx`를 분리해 관리하면 라우트가 중복되거나 유지보수가 어려워집니다.

두 문법의 동작 차이를 정확히 이해해야 합니다.

**`[...slug]` — 캐치올 라우트**

`/docs/react`, `/docs/react/hooks`, `/docs/react/hooks/useEffect` 처럼 하위 경로는 모두 매칭하지만, `/docs` 자체에는 매칭되지 않습니다. `/docs`에 접근하면 404가 발생합니다.

```
app/docs/[...slug]/page.tsx

매칭 O : /docs/react
매칭 O : /docs/react/hooks
매칭 X : /docs              ← 404
```

**`[[...slug]]` — 선택적 캐치올 라우트**

세그먼트 없이 루트 경로까지 포함해 모두 매칭합니다. `params.slug`는 세그먼트가 없을 때 `undefined`가 됩니다.

```
app/docs/[[...slug]]/page.tsx

매칭 O : /docs
매칭 O : /docs/react
매칭 O : /docs/react/hooks
```

공식 문서, 다단계 카테고리 페이지, CMS 기반 콘텐츠처럼 루트 경로와 하위 경로를 하나의 컴포넌트로 처리해야 할 때 `[[...slug]]`를 사용합니다.

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
// app/docs/page.tsx + app/docs/[...slug]/page.tsx 를 따로 만드는 경우
// 루트(/docs)와 하위 경로를 별도 파일로 관리하면 로직이 중복됩니다.

// app/docs/page.tsx
export default function DocsRoot() {
  return <h1>문서 홈</h1>;
}

// app/docs/[...slug]/page.tsx
type Props = {
  params: Promise<{ slug: string[] }>;
};

export default async function DocsPage({ params }: Props) {
  const { slug } = await params;
  return <h1>{slug.join(' / ')}</h1>;
}
```

루트 경로와 하위 경로에서 보여줄 UI가 비슷한데도 파일을 나눠 관리하고 있습니다. 데이터 페칭 로직, 레이아웃, 브레드크럼 같은 공통 코드가 두 파일에 분산됩니다.

---

#### 올바른 사용법 (Good Example)

```tsx
// app/docs/[[...slug]]/page.tsx
// 루트(/docs)와 모든 하위 경로를 하나의 파일에서 처리합니다.

import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ slug?: string[] }>;
};

export default async function DocsPage({ params }: Props) {
  const { slug } = await params;

  // slug가 없으면 /docs 루트 — 목차 페이지를 보여줍니다.
  if (!slug) {
    return (
      <div>
        <h1>문서 홈</h1>
        <p>왼쪽 메뉴에서 문서를 선택하세요.</p>
      </div>
    );
  }

  // slug 배열로 실제 문서를 조회합니다.
  // 예: /docs/react/hooks → slug = ['react', 'hooks']
  const doc = await fetchDoc(slug);

  if (!doc) notFound();

  return (
    <article>
      <nav>{slug.join(' > ')}</nav>
      <h1>{doc.title}</h1>
      <div>{doc.content}</div>
    </article>
  );
}

async function fetchDoc(slug: string[]) {
  const path = slug.join('/');
  const res = await fetch(`https://api.example.com/docs/${path}`);
  if (!res.ok) return null;
  return res.json();
}
```

```tsx
// generateStaticParams로 정적 경로를 미리 생성할 수도 있습니다.

export async function generateStaticParams() {
  const res = await fetch('https://api.example.com/docs/all-slugs');
  const slugs: string[][] = await res.json();

  return [
    { slug: undefined },            // /docs 루트
    ...slugs.map((s) => ({ slug: s })), // /docs/react, /docs/react/hooks 등
  ];
}
```

`slug`가 `undefined`인 경우(루트)와 배열인 경우(하위 경로)를 하나의 컴포넌트 안에서 분기 처리하므로, 공통 로직을 중복 없이 관리할 수 있습니다.

---

#### 정리 (Conclusion)

| 구분 | `[...slug]` | `[[...slug]]` |
|------|------------|--------------|
| 루트 경로 매칭 | X (404) | O |
| 하위 경로 매칭 | O | O |
| slug 타입 | `string[]` | `string[] \| undefined` |
| 적합한 경우 | 루트 없이 하위 경로만 필요할 때 | 루트 + 하위 경로를 함께 처리할 때 |

루트 경로(`/docs`)와 하위 경로(`/docs/react/hooks`)를 동일한 레이아웃과 로직으로 처리해야 한다면 `[[...slug]]`를 선택하세요. 단, `params.slug`가 `undefined`일 수 있으므로 반드시 분기 처리가 필요합니다.

---

### 추가 학습 자료 공유합니다.

- [Next.js 공식 문서 — Catch-all Segments](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes#catch-all-segments)
- [Next.js 공식 문서 — Optional Catch-all Segments](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes#optional-catch-all-segments)

---

### [FOOTER]

```
로고: 매일매일
Copyright © 2026 매일매일. All rights reserved.

Contact: kangmu238@gmail.com
Socials: Github
```

---

## 키워드 변수 정의

| 키워드 | 값 |
|--------|----|
| `{{TITLE}}` | Next.js에서 [[...slug]]는 [...slug]와 어떻게 다른가요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | Next.js, App Router, catch-all, optional catch-all, slug, 동적 라우팅 |
| `{{DATE}}` | 2026-04-15 |
| `{{SLUG}}` | nextjs-optional-catch-all-routes |
| `{{SUMMARY}}` | [...slug]는 하위 경로만 매칭하고, [[...slug]]는 루트 경로까지 포함해 매칭합니다. |
| `{{WHY}}` | 루트와 하위 경로를 별도 파일로 관리하면 로직이 중복되고 유지보수가 어려워집니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
