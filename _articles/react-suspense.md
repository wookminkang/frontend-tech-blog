# React Suspense는 무엇이고 언제 사용하나요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

React Suspense는 컴포넌트가 준비되지 않았을 때 대신 보여줄 폴백(fallback) UI를 선언적으로 지정하는 기능입니다.
비동기 데이터 로딩이나 코드 스플리팅처럼 "아직 준비 중인 상태"를 컴포넌트 트리 바깥에서 한 곳에 모아 처리할 수 있습니다.
로딩 상태를 각 컴포넌트마다 직접 관리하지 않아도 되기 때문에, 컴포넌트는 데이터가 준비된 상태만 신경 쓰면 됩니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

비동기 데이터를 다루는 컴포넌트는 보통 세 가지 상태를 직접 관리해야 합니다. 로딩 중, 에러, 성공입니다.
컴포넌트가 늘어날수록 `isLoading`, `error`, `data` 분기 처리가 반복되고, 로딩 UI 로직이 비즈니스 로직과 섞입니다.

Suspense는 이 중 "로딩 중" 상태를 컴포넌트 바깥으로 위임합니다.
자식 컴포넌트가 준비되지 않았다는 신호를 보내면(`Promise throw`), 가장 가까운 `<Suspense>` 경계가 `fallback`을 대신 렌더링합니다.

**언제 사용하나요?**

| 상황 | 설명 |
|------|------|
| 코드 스플리팅 | `React.lazy`로 동적 import된 컴포넌트가 로드되는 동안 fallback 표시 |
| 서버 데이터 페칭 | TanStack Query, Relay 등 Suspense를 지원하는 라이브러리와 함께 사용 |
| Next.js 스트리밍 SSR | 서버에서 느린 데이터를 기다리는 동안 나머지 UI를 먼저 전송 |

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchUser(userId)
      .then(setUser)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [userId]);

  // 로딩/에러/성공 분기가 컴포넌트 안에 뒤섞임
  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div>에러가 발생했습니다.</div>;
  if (!user) return null;

  return <div>{user.name}</div>;
}
```

컴포넌트마다 `isLoading`, `error` 상태를 직접 관리합니다. 로딩 UI가 컴포넌트 전체에 흩어지고, 여러 컴포넌트를 합성할 때 로딩 화면이 제각각 뜨는 문제가 생깁니다.

---

#### 올바른 사용법 (Good Example)

```tsx
import { Suspense } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';

// 컴포넌트는 데이터가 준비된 상태만 처리
function UserProfile({ userId }: { userId: string }) {
  const { data: user } = useSuspenseQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  return <div>{user.name}</div>;
}

// 로딩/에러 처리는 컴포넌트 바깥에서 선언적으로
function ProfilePage({ userId }: { userId: string }) {
  return (
    <ErrorBoundary fallback={<div>에러가 발생했습니다.</div>}>
      <Suspense fallback={<div>로딩 중...</div>}>
        <UserProfile userId={userId} />
      </Suspense>
    </ErrorBoundary>
  );
}
```

`UserProfile`은 데이터가 항상 존재한다고 가정하고 렌더링 로직에만 집중합니다.
로딩 중일 때는 `<Suspense>`의 `fallback`이, 에러가 나면 `<ErrorBoundary>`의 `fallback`이 대신 렌더링됩니다.

**여러 컴포넌트를 하나의 Suspense로 묶으면 로딩 화면을 통합할 수 있습니다.**

```tsx
function Dashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      {/* 세 컴포넌트 중 하나라도 준비 안 됐으면 DashboardSkeleton 표시 */}
      <UserProfile userId="1" />
      <RecentPosts userId="1" />
      <ActivityFeed userId="1" />
    </Suspense>
  );
}
```

경계를 세분화하면 준비된 컴포넌트부터 순서대로 보여줄 수 있고, 하나로 묶으면 모든 준비가 끝난 뒤 한 번에 전환됩니다. 어떤 방식이 더 좋은 UX인지는 상황에 따라 다릅니다.

---

#### 정리 (Conclusion)

Suspense는 로딩 상태를 컴포넌트 바깥으로 분리해 선언적으로 관리하는 방법입니다.
`isLoading` 분기를 컴포넌트 안에 두는 대신, `<Suspense fallback={...}>`으로 감싸면 컴포넌트는 준비된 데이터만 다루면 됩니다.
에러 처리는 `<ErrorBoundary>`와 함께 사용하는 것이 기본 패턴입니다.

---

### 추가 학습 자료 공유합니다.

- [React 공식 문서 — Suspense](https://react.dev/reference/react/Suspense)
- [TanStack Query — useSuspenseQuery](https://tanstack.com/query/latest/docs/framework/react/reference/useSuspenseQuery)

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
| `{{TITLE}}` | React Suspense는 무엇이고 언제 사용하나요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | React, Suspense, ErrorBoundary, TanStack Query, 코드스플리팅 |
| `{{DATE}}` | 2026-04-20 |
| `{{SLUG}}` | react-suspense |
| `{{SUMMARY}}` | Suspense는 로딩 상태를 컴포넌트 바깥으로 분리해 선언적으로 처리합니다. isLoading 분기 대신 fallback으로 로딩 UI를 지정하고, ErrorBoundary와 함께 에러도 처리합니다. |
| `{{WHY}}` | 컴포넌트마다 isLoading/error 분기를 반복하면 로딩 로직과 비즈니스 로직이 뒤섞입니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
