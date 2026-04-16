# Next.js에서 params와 useSearchParams는 어떻게 다른가요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

`params`는 URL 경로의 동적 세그먼트(예: `/blog/[slug]`)에서 값을 꺼낼 때 사용하고, `useSearchParams`는 쿼리스트링(예: `?q=react&page=2`)에서 값을 꺼낼 때 사용합니다. 둘은 URL에서 읽는 위치가 다르며, 사용하는 컴포넌트 환경(서버 / 클라이언트)도 다릅니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

Next.js App Router에서는 URL에서 값을 읽는 방법이 두 가지로 나뉩니다.

- **params**: `/blog/[slug]`처럼 파일명에 대괄호로 정의한 동적 경로 세그먼트의 값입니다. `page.tsx`와 `layout.tsx`에 props로 전달되며, 서버 컴포넌트에서 바로 읽을 수 있습니다.

- **useSearchParams**: URL 뒤에 붙는 쿼리스트링(`?key=value`)을 읽는 훅입니다. 클라이언트 컴포넌트에서만 사용할 수 있으며, `use client` 선언이 필요합니다.

혼동이 생기는 이유는 두 가지입니다.

첫째, 같은 URL에서 값을 꺼내는 것처럼 보이지만 읽는 위치가 다릅니다. `/blog/react?page=2`에서 `react`는 `params`로, `2`는 `useSearchParams`로 읽어야 합니다.

둘째, `useSearchParams`를 사용하는 컴포넌트를 `Suspense`로 감싸지 않으면 Next.js 빌드 시 오류가 발생합니다. 클라이언트에서 쿼리스트링을 읽는 동작이 서버 렌더링 시점에 결정되지 않기 때문입니다.

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
// app/blog/[slug]/page.tsx

'use client';

import { useSearchParams } from 'next/navigation';

// params로 읽어야 할 slug를 useSearchParams로 읽으려 시도하고 있습니다.
// slug는 쿼리스트링이 아니라 경로 세그먼트이므로 undefined가 반환됩니다.
export default function BlogPost() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug'); // 항상 null

  return <h1>{slug}</h1>;
}
```

```tsx
// app/search/page.tsx

'use client';

import { useSearchParams } from 'next/navigation';

// Suspense 없이 useSearchParams를 사용하면 Next.js 빌드 시 오류가 발생합니다.
// "useSearchParams() should be wrapped in a suspense boundary" 오류
export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');

  return <p>검색어: {query}</p>;
}
```

위 코드에서 첫 번째 예시는 경로 세그먼트인 `slug`를 쿼리스트링에서 찾으므로 항상 `null`이 반환됩니다. 두 번째 예시는 `Suspense` 없이 `useSearchParams`를 사용해 빌드 오류가 발생합니다.

---

#### 올바른 사용법 (Good Example)

```tsx
// app/blog/[slug]/page.tsx
// params — 경로 세그먼트에서 값 읽기 (서버 컴포넌트)

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function BlogPost({ params }: Props) {
  const { slug } = await params; // Next.js 15부터 params는 Promise

  return <h1>{slug}</h1>;
}
```

```tsx
// app/search/page.tsx
// useSearchParams — 쿼리스트링에서 값 읽기 (클라이언트 컴포넌트 + Suspense 필수)

import { Suspense } from 'react';
import SearchResult from './SearchResult';

export default function SearchPage() {
  return (
    <Suspense fallback={<p>불러오는 중...</p>}>
      <SearchResult />
    </Suspense>
  );
}
```

```tsx
// app/search/SearchResult.tsx

'use client';

import { useSearchParams } from 'next/navigation';

export default function SearchResult() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const page = searchParams.get('page') ?? '1';

  return (
    <div>
      <p>검색어: {query}</p>
      <p>페이지: {page}</p>
    </div>
  );
}
```

`useSearchParams`를 사용하는 컴포넌트를 별도 파일로 분리하고, 호출하는 쪽에서 `Suspense`로 감싸는 것이 권장 패턴입니다.

---

#### 정리 (Conclusion)

| 구분 | params | useSearchParams |
|------|--------|-----------------|
| 읽는 위치 | URL 경로 세그먼트 (`/blog/[slug]`) | 쿼리스트링 (`?q=value`) |
| 컴포넌트 환경 | 서버 / 클라이언트 모두 사용 가능 | 클라이언트 컴포넌트만 |
| 필요 선언 | 없음 | `'use client'` |
| Suspense 필요 여부 | 불필요 | 필수 |
| Next.js 15 변경사항 | `await params` 필요 (Promise 반환) | 변경 없음 |

URL에서 값을 읽기 전에 먼저 해당 값이 경로에 포함된 것인지, 쿼리스트링에 있는 것인지 구분하세요. 경로 세그먼트라면 `params`, 쿼리스트링이라면 `useSearchParams`입니다.

---

### 추가 학습 자료 공유합니다.

- [Next.js 공식 문서 — useSearchParams](https://nextjs.org/docs/app/api-reference/functions/use-search-params)
- [Next.js 공식 문서 — params (Dynamic Routes)](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)

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

Contact: team.maeilmail@gmail.com
Socials: Velog / Github
Etc: 팀 소개 / 서비스 피드백
```

---

## 키워드 변수 정의

| 키워드 | 값 |
|--------|----|
| `{{TITLE}}` | Next.js에서 params와 useSearchParams는 어떻게 다른가요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | Next.js, params, useSearchParams, App Router, 쿼리스트링 |
| `{{DATE}}` | 2026-04-15 |
| `{{SLUG}}` | nextjs-params-vs-usesearchparams |
| `{{SUMMARY}}` | params는 경로 세그먼트, useSearchParams는 쿼리스트링에서 값을 읽습니다. 사용 환경과 Suspense 필요 여부가 다릅니다. |
| `{{WHY}}` | 둘 다 URL에서 값을 읽지만 위치와 사용 환경이 달라 혼동하기 쉽고, Suspense 누락 시 빌드 오류가 발생합니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
