# Next.js App Router에서 error, loading, not-found 파일은 어떻게 동작하나요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

Next.js App Router는 라우트 세그먼트 단위로 `error.tsx`, `loading.tsx`, `not-found.tsx` 파일을 배치해 에러, 로딩, 404 상태를 선언적으로 처리합니다. 이 파일들은 Next.js가 자동으로 React의 ErrorBoundary와 Suspense로 감싸주므로, 수동으로 상태를 관리할 필요가 없습니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

Pages Router에서는 에러, 로딩, 404 상태를 컴포넌트 내부에서 직접 분기 처리하거나, `_error.tsx` 같은 전역 파일로만 대응할 수 있었습니다. 세그먼트별로 다른 UI를 보여주기 어려웠고, 코드가 분산되어 유지보수가 복잡했습니다.

App Router는 이 문제를 특수 파일(Convention File)로 해결합니다.

- **`loading.tsx`**: 해당 세그먼트의 서버 컴포넌트가 데이터를 가져오는 동안 보여줄 스켈레톤 또는 스피너를 정의합니다. 내부적으로 `Suspense`로 감싸집니다.

- **`error.tsx`**: 해당 세그먼트에서 발생한 런타임 에러를 잡아 보여줄 폴백 UI를 정의합니다. 내부적으로 `ErrorBoundary`로 감싸집니다. 반드시 클라이언트 컴포넌트(`'use client'`)여야 합니다.

- **`not-found.tsx`**: `notFound()` 함수를 호출하거나 존재하지 않는 경로에 접근했을 때 보여줄 UI를 정의합니다. 서버 컴포넌트로 작성합니다.

이 파일들은 라우트 폴더마다 독립적으로 배치할 수 있어, 페이지별로 다른 에러/로딩 UI를 선언적으로 구성할 수 있습니다.

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
// app/posts/[id]/page.tsx
// 에러, 로딩, 404 상태를 컴포넌트 내부에서 직접 처리하는 경우

'use client';

import { useEffect, useState } from 'react';

export default function PostPage({ params }: { params: { id: string } }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/posts/${params.id}`)
      .then((res) => {
        if (res.status === 404) { setNotFound(true); return; }
        if (!res.ok) { setError(true); return; }
        return res.json();
      })
      .then((data) => { if (data) setPost(data); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p>불러오는 중...</p>;
  if (notFound) return <p>게시글을 찾을 수 없습니다.</p>;
  if (error) return <p>오류가 발생했습니다.</p>;

  return <h1>{post.title}</h1>;
}
```

서버 컴포넌트의 이점을 포기하고 클라이언트에서 데이터를 직접 가져오고 있습니다. 상태 분기가 컴포넌트 내부에 뒤섞여 코드가 복잡해지고, 에러/로딩 UI를 재사용하기 어렵습니다.

---

#### 올바른 사용법 (Good Example)

```tsx
// app/posts/[id]/loading.tsx
// 데이터를 가져오는 동안 자동으로 표시됩니다.

export default function Loading() {
  return (
    <div>
      <div style={{ background: '#E0E0E0', height: 32, borderRadius: 4, marginBottom: 16 }} />
      <div style={{ background: '#E0E0E0', height: 16, borderRadius: 4, marginBottom: 8 }} />
      <div style={{ background: '#E0E0E0', height: 16, borderRadius: 4, width: '60%' }} />
    </div>
  );
}
```

```tsx
// app/posts/[id]/error.tsx
// 런타임 에러 발생 시 자동으로 표시됩니다. 반드시 'use client'가 필요합니다.

'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <p>게시글을 불러오는 중 오류가 발생했습니다.</p>
      <p>{error.message}</p>
      <button onClick={reset}>다시 시도</button>
    </div>
  );
}
```

```tsx
// app/posts/[id]/not-found.tsx
// notFound()가 호출되거나 존재하지 않는 경로 접근 시 표시됩니다.

export default function NotFound() {
  return (
    <div>
      <h2>게시글을 찾을 수 없습니다.</h2>
      <p>삭제되었거나 존재하지 않는 게시글입니다.</p>
    </div>
  );
}
```

```tsx
// app/posts/[id]/page.tsx
// 서버 컴포넌트에서 notFound()를 호출하면 not-found.tsx가 렌더링됩니다.

import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  const res = await fetch(`https://api.example.com/posts/${id}`);

  if (res.status === 404) notFound(); // not-found.tsx 렌더링
  if (!res.ok) throw new Error('게시글 조회 실패'); // error.tsx 렌더링

  const post = await res.json();

  return <h1>{post.title}</h1>;
}
```

각 특수 파일이 역할을 나눠가지므로 `page.tsx`는 데이터 페칭과 렌더링에만 집중할 수 있습니다. 폴더 구조만 보아도 어떤 세그먼트에서 어떤 상태를 처리하는지 파악할 수 있습니다.

---

#### 정리 (Conclusion)

| 파일 | 역할 | 컴포넌트 종류 | 트리거 조건 |
|------|------|-------------|------------|
| `loading.tsx` | 로딩 중 폴백 UI | 서버 컴포넌트 | 상위 Suspense 해소 전 |
| `error.tsx` | 에러 폴백 UI | 클라이언트 컴포넌트 필수 | 런타임 에러 발생 시 |
| `not-found.tsx` | 404 UI | 서버 컴포넌트 | `notFound()` 호출 또는 매칭 실패 |

세 파일 모두 라우트 폴더 단위로 독립 배치가 가능합니다. 전체 앱에 하나의 에러/로딩 UI를 쓰고 싶다면 `app/` 루트에, 특정 섹션만 다르게 하고 싶다면 해당 폴더에 추가하면 됩니다.

---

### 추가 학습 자료 공유합니다.

- [Next.js 공식 문서 — Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [Next.js 공식 문서 — Loading UI and Streaming](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)

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
| `{{TITLE}}` | Next.js App Router에서 error, loading, not-found 파일은 어떻게 동작하나요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | Next.js, App Router, error.tsx, loading.tsx, not-found.tsx, ErrorBoundary |
| `{{DATE}}` | 2026-04-15 |
| `{{SLUG}}` | nextjs-error-loading-not-found |
| `{{SUMMARY}}` | App Router의 특수 파일(error.tsx, loading.tsx, not-found.tsx)로 라우트 세그먼트별 에러/로딩/404를 선언적으로 처리합니다. |
| `{{WHY}}` | 수동 상태 분기 대신 Next.js가 자동으로 ErrorBoundary, Suspense로 감싸주는 특수 파일을 활용해야 합니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
