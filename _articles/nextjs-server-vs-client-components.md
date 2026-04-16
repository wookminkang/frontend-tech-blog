# Next.js에서 Server Component와 Client Component는 어떻게 다른가요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

App Router에서 모든 컴포넌트는 기본적으로 Server Component입니다. `'use client'`를 파일 최상단에 선언해야 Client Component가 됩니다. Server Component는 서버에서만 실행되어 번들 크기를 줄이고 데이터를 직접 fetch할 수 있지만, `useState`나 이벤트 핸들러를 사용할 수 없습니다. Client Component는 브라우저에서 실행되어 상호작용을 처리하지만, 서버 전용 API를 사용할 수 없습니다. 두 컴포넌트의 경계를 올바르게 설정하는 것이 핵심입니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

Next.js App Router 이전에는 모든 컴포넌트가 클라이언트에서 실행되었습니다. App Router에서는 기본이 Server Component로 바뀌었기 때문에, 이 차이를 모르면 두 가지 실수가 반복됩니다.

**첫째, `'use client'`를 불필요하게 남발합니다.** 데이터 fetch만 하는 컴포넌트에도 `'use client'`를 붙이면 서버 렌더링 이점이 사라지고, 해당 컴포넌트의 의존성이 모두 클라이언트 번들에 포함됩니다.

**둘째, Server Component에서 클라이언트 기능을 사용하려다 오류가 발생합니다.** `useState`, `useEffect`, `onClick` 같은 API는 브라우저에서만 동작합니다. Server Component에서 이를 사용하면 빌드 오류가 납니다.

두 컴포넌트의 차이를 정리하면 다음과 같습니다.

| 기능 | Server Component | Client Component |
|------|-----------------|-----------------|
| 실행 환경 | 서버 | 브라우저 |
| `useState` / `useEffect` | 사용 불가 | 사용 가능 |
| 이벤트 핸들러 (`onClick` 등) | 사용 불가 | 사용 가능 |
| `async / await` 직접 사용 | 가능 | 불가 (별도 처리 필요) |
| DB / 파일 시스템 접근 | 가능 | 불가 |
| 클라이언트 번들 포함 여부 | 포함되지 않음 | 포함됨 |
| 선언 방법 | 기본값 (선언 불필요) | `'use client'` 필요 |

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
// 모든 컴포넌트에 'use client'를 붙이는 경우
// 데이터 fetch만 하는 컴포넌트인데도 클라이언트로 선언하고 있습니다.
'use client';

import { useEffect, useState } from 'react';

export default function ArticleList() {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    fetch('/api/articles')
      .then((res) => res.json())
      .then((data) => setArticles(data));
  }, []);

  return (
    <ul>
      {articles.map((a) => (
        <li key={a.id}>{a.title}</li>
      ))}
    </ul>
  );
}
```

위 코드의 문제점은 두 가지입니다. 첫째, 서버에서 직접 데이터를 가져올 수 있음에도 클라이언트에서 API를 한 번 더 호출합니다. 둘째, `'use client'`로 인해 이 컴포넌트의 모든 의존성이 클라이언트 번들에 포함되어 초기 로드가 느려집니다.

---

#### 올바른 사용법 (Good Example)

```tsx
// Server Component — 데이터를 서버에서 직접 fetch합니다.
// 'use client' 선언 없음 = 기본적으로 Server Component

async function getArticles() {
  const res = await fetch('https://api.example.com/articles', {
    cache: 'no-store', // 또는 { next: { revalidate: 60 } }
  });
  return res.json();
}

export default async function ArticleList() {
  const articles = await getArticles(); // async/await 직접 사용 가능

  return (
    <ul>
      {articles.map((a) => (
        <li key={a.id}>
          {a.title}
          <LikeButton id={a.id} /> {/* 상호작용이 필요한 부분만 Client Component */}
        </li>
      ))}
    </ul>
  );
}
```

```tsx
// Client Component — 상호작용이 필요한 부분만 'use client' 선언
'use client';

import { useState } from 'react';

export function LikeButton({ id }: { id: string }) {
  const [liked, setLiked] = useState(false);

  return (
    <button onClick={() => setLiked((prev) => !prev)}>
      {liked ? '좋아요 취소' : '좋아요'}
    </button>
  );
}
```

핵심은 **`'use client'` 경계를 트리 가능한 한 아래쪽으로 내리는 것**입니다. 상위 컴포넌트는 Server Component로 유지하고, 실제로 브라우저 API가 필요한 리프 컴포넌트에만 `'use client'`를 선언합니다. 이렇게 하면 서버 렌더링의 이점(빠른 초기 로드, 번들 크기 절감)을 최대한 유지할 수 있습니다.

---

#### 정리 (Conclusion)

App Router에서는 컴포넌트를 두 가지로 구분해야 합니다. Server Component는 데이터 fetch, DB 접근, 무거운 의존성 처리에 사용하고, Client Component는 `useState`, `useEffect`, 이벤트 핸들러처럼 브라우저 상호작용이 필요한 경우에만 사용합니다. `'use client'`는 꼭 필요한 컴포넌트에, 트리에서 가능한 한 하위에 선언하는 것이 원칙입니다.

| 질문 | 선택 |
|------|------|
| 데이터를 서버에서 가져오는가? | Server Component |
| `useState`, `useEffect`가 필요한가? | Client Component |
| 클릭, 입력 등 이벤트 처리가 필요한가? | Client Component |
| 브라우저 API (`window`, `document`)를 사용하는가? | Client Component |
| 위 항목이 하나도 없다면? | Server Component (기본값 유지) |

---

### 추가 학습 자료 공유합니다.

- [Next.js 공식 문서 — Server and Client Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js 공식 문서 — Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [React 공식 문서 — 'use client'](https://react.dev/reference/rsc/use-client)

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
| `{{TITLE}}` | Next.js에서 Server Component와 Client Component는 어떻게 다른가요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | Next.js, Server Component, Client Component, App Router, React |
| `{{DATE}}` | 2026-04-16 |
| `{{SLUG}}` | nextjs-server-vs-client-components |
| `{{SUMMARY}}` | App Router에서 컴포넌트는 기본적으로 Server Component입니다. `'use client'` 경계를 트리 하위로 내려 서버 렌더링 이점을 최대한 유지하는 것이 핵심입니다. |
| `{{WHY}}` | `'use client'`를 불필요하게 남발하거나, Server Component에서 브라우저 API를 사용하려다 오류가 발생합니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
