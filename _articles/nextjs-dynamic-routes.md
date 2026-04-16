# Next.js에서 다이나믹 라우트는 어떻게 사용하나요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

폴더명을 `[param]` 형식으로 만들면 동적 세그먼트가 생성됩니다. `/articles/react-hooks`, `/articles/nextjs-routing`처럼 URL 일부가 바뀌는 페이지를 하나의 파일로 처리할 수 있습니다. Page 컴포넌트에서는 `params`로 값을 읽고, 빌드 시점에 정적 페이지를 미리 생성하려면 `generateStaticParams()`를 함께 사용합니다. App Router에서 `params`는 Promise이기 때문에 반드시 `await`으로 받아야 합니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

블로그나 상품 상세 페이지처럼 URL 경로만 다르고 구조는 같은 페이지를 만들 때, 동적 라우트를 모르면 두 가지 실수를 합니다.

**첫째, 페이지마다 개별 파일을 만듭니다.** `react-hooks/page.tsx`, `nextjs-routing/page.tsx`를 각각 만들면 콘텐츠가 늘어날수록 파일이 쌓이고, 레이아웃 변경 시 모든 파일을 수정해야 합니다.

**둘째, `params`를 잘못 받습니다.** Next.js 15부터 `params`는 Promise 객체입니다. `await` 없이 바로 구조분해하면 값이 `undefined`로 나옵니다.

다이나믹 라우트의 세 가지 패턴을 구분해두면 대부분의 상황에 대응할 수 있습니다.

| 패턴 | 예시 폴더 | 매칭 경로 | 매칭 안 되는 경로 |
|------|-----------|-----------|-----------------|
| `[slug]` | `app/articles/[slug]` | `/articles/react-hooks` | `/articles/a/b` |
| `[...slug]` | `app/docs/[...slug]` | `/docs/a`, `/docs/a/b/c` | `/docs` (루트) |
| `[[...slug]]` | `app/shop/[[...slug]]` | `/shop`, `/shop/a`, `/shop/a/b` | 없음 |

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
// params를 await 없이 바로 구조분해하는 경우
// Next.js 15에서 params는 Promise이므로 slug가 undefined로 나옵니다.

interface PageProps {
  params: { slug: string }; // Promise가 아닌 일반 객체로 잘못 타입 정의
}

export default function ArticlePage({ params }: PageProps) {
  const { slug } = params; // undefined — await 없이 접근했기 때문입니다.

  return <h1>{slug}</h1>; // 렌더링되지 않거나 undefined 출력
}
```

```tsx
// generateStaticParams 없이 동적 렌더링에만 의존하는 경우
// 빌드 시 HTML을 생성하지 않아 요청마다 서버에서 렌더링이 발생합니다.
// 변경이 거의 없는 콘텐츠라면 불필요한 서버 부하입니다.

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await fetchArticle(slug); // 매 요청마다 fetch 발생

  return <article>{article.content}</article>;
}
// generateStaticParams가 없으면 빌드 시 정적 HTML을 생성하지 않습니다.
```

---

#### 올바른 사용법 (Good Example)

```tsx
// app/articles/[slug]/page.tsx

import { notFound } from 'next/navigation';

// 1. 빌드 시 생성할 slug 목록을 반환합니다.
//    이 함수가 있어야 빌드 시점에 정적 HTML이 만들어집니다.
export async function generateStaticParams() {
  const articles = await fetchAllArticles();

  return articles.map((article) => ({
    slug: article.slug,
  }));
}

// 2. SEO를 위한 메타데이터도 동적으로 생성합니다.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // await 필수
  const article = await fetchArticle(slug);

  return {
    title: article.title,
    description: article.summary,
  };
}

// 3. 페이지 컴포넌트 — params를 반드시 await으로 받습니다.
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params; // await 필수
  const article = await fetchArticle(slug);

  if (!article) notFound(); // 없는 slug면 404 처리

  return (
    <main>
      <h1>{article.title}</h1>
      <p>{article.content}</p>
    </main>
  );
}
```

`generateStaticParams()`가 있으면 빌드 시 각 slug에 대한 정적 HTML이 생성됩니다. 이후 요청에는 이미 만들어진 HTML을 바로 전달하므로 응답이 빠릅니다. 새 콘텐츠를 추가할 때는 `generateStaticParams()`가 반환하는 목록에 포함시키거나, `dynamicParams = true`(기본값)를 유지하면 목록에 없는 slug도 요청 시 서버에서 생성합니다.

---

#### 정리 (Conclusion)

다이나믹 라우트는 폴더명을 `[param]`으로 만드는 것에서 시작합니다. Page 컴포넌트에서 `params`를 받을 때는 반드시 `await`을 붙여야 하며, 변경이 드문 콘텐츠라면 `generateStaticParams()`로 빌드 시 정적 페이지를 미리 생성해두는 것이 성능상 유리합니다. URL 구조가 중첩되거나 루트 경로까지 포함해야 하는 경우에는 `[...slug]`나 `[[...slug]]` 패턴을 활용합니다.

| 상황 | 선택 |
|------|------|
| `/post/123` 같은 단일 세그먼트 | `[id]` |
| `/docs/a/b/c` 같은 다단계 경로 | `[...slug]` |
| `/shop`과 `/shop/a/b` 모두 같은 파일로 처리 | `[[...slug]]` |
| 빌드 시 정적 HTML 생성이 필요한 경우 | `generateStaticParams()` 추가 |
| 없는 경로 접근 시 404 처리 | `notFound()` 호출 |

---

### 추가 학습 자료 공유합니다.

- [Next.js 공식 문서 — Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [Next.js 공식 문서 — generateStaticParams](https://nextjs.org/docs/app/api-reference/functions/generate-static-params)

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
| `{{TITLE}}` | Next.js에서 다이나믹 라우트는 어떻게 사용하나요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | Next.js, Dynamic Routes, generateStaticParams, App Router, params |
| `{{DATE}}` | 2026-04-16 |
| `{{SLUG}}` | nextjs-dynamic-routes |
| `{{SUMMARY}}` | `[param]` 폴더로 동적 세그먼트를 만들고, `generateStaticParams()`로 빌드 시 정적 페이지를 생성합니다. App Router에서 `params`는 Promise이므로 반드시 await으로 받아야 합니다. |
| `{{WHY}}` | 파일을 개별로 만들거나, params를 await 없이 접근해 undefined가 되는 실수가 반복됩니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
