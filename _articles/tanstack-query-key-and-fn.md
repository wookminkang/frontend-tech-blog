# TanStack Query에서 queryKey와 queryFn은 어떻게 동작하나요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

`queryKey`는 캐시를 식별하는 고유 키입니다. 배열 형태로 선언하며, `queryFn` 내부에서 사용하는 모든 변수를 포함해야 합니다. `queryFn`은 데이터를 가져오는 비동기 함수로, 실패 시 반드시 에러를 throw해야 TanStack Query가 에러 상태를 인식합니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

TanStack Query는 `queryKey`를 기준으로 캐시를 저장하고 불러옵니다. 키가 같으면 같은 캐시를 사용하고, 키가 다르면 새로운 요청을 보냅니다. 이 원리를 이해하지 못하면 데이터가 갱신되지 않거나, 의도치 않게 이전 요청의 데이터가 표시되는 문제가 생깁니다.

**queryKey의 동작 방식**

`queryKey`는 배열로 선언합니다. TanStack Query는 배열의 내용을 직렬화해 비교하므로, 배열 안의 값이 하나라도 바뀌면 새 요청이 발생합니다.

```ts
// 키가 바뀌면 새 요청이 발생합니다.
['posts']                        // 전체 포스트
['posts', 1]                     // id가 1인 포스트
['posts', { status: 'draft' }]   // draft 상태의 포스트
['posts', userId, { page: 2 }]   // userId가 바뀌면 다시 요청
```

핵심 규칙은 **`queryFn` 내부에서 사용하는 모든 변수는 `queryKey`에 포함**해야 한다는 것입니다. 외부 변수를 queryFn에서 참조하지만 queryKey에 빠뜨리면, 그 변수가 바뀌어도 TanStack Query는 캐시가 유효하다고 판단해 새 요청을 보내지 않습니다.

**queryFn의 동작 방식**

`queryFn`은 Promise를 반환하는 함수입니다. 성공 시 데이터를 반환하고, 실패 시 반드시 에러를 throw해야 합니다. `fetch`는 4xx, 5xx 응답에도 에러를 throw하지 않으므로 응답 상태를 직접 확인해야 합니다.

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
import { useQuery } from '@tanstack/react-query';

// queryFn에서 userId를 사용하지만 queryKey에 포함하지 않았습니다.
// userId가 바뀌어도 TanStack Query는 캐시가 유효하다고 판단합니다.
// 이전 사용자의 데이터가 계속 표시됩니다.
function useUserPosts(userId: number) {
  return useQuery({
    queryKey: ['posts'],  // userId 누락
    queryFn: () => fetchPostsByUser(userId),
  });
}

// fetch는 4xx/5xx에 에러를 throw하지 않습니다.
// isError가 false인 채로 빈 데이터나 에러 메시지가 data에 담깁니다.
function usePost(id: number) {
  return useQuery({
    queryKey: ['posts', id],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${id}`);
      return res.json(); // 404여도 에러 없이 진행됩니다.
    },
  });
}
```

`queryKey`에 의존성이 빠지면 캐시 무효화가 일어나지 않아 오래된 데이터가 그대로 표시됩니다. `fetch` 응답 상태를 확인하지 않으면 에러 상황을 정상으로 처리합니다.

---

#### 올바른 사용법 (Good Example)

```tsx
import { useQuery } from '@tanstack/react-query';

// queryFn에서 사용하는 userId를 queryKey에 포함합니다.
// userId가 바뀌면 자동으로 새 요청이 발생합니다.
function useUserPosts(userId: number) {
  return useQuery({
    queryKey: ['posts', 'user', userId], // 의존성 포함
    queryFn: () => fetchPostsByUser(userId),
  });
}

// fetch 응답 상태를 확인하고 실패 시 에러를 throw합니다.
function usePost(id: number) {
  return useQuery({
    queryKey: ['posts', id],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${id}`);
      if (!res.ok) {
        throw new Error(`포스트 조회 실패: ${res.status}`);
      }
      return res.json();
    },
  });
}

// 컴포넌트에서 사용 예시
function PostList({ userId }: { userId: number }) {
  const { data, isLoading, isError, error } = useUserPosts(userId);

  if (isLoading) return <p>불러오는 중...</p>;
  if (isError) return <p>{error.message}</p>;

  return (
    <ul>
      {data.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

```tsx
// 쿼리 파라미터, 필터, 페이지 등 모든 의존성을 queryKey에 포함하는 패턴
function usePosts({ page, status, userId }: PostsParams) {
  return useQuery({
    queryKey: ['posts', { page, status, userId }], // 객체로 묶어 관리
    queryFn: () => fetchPosts({ page, status, userId }),
    // staleTime: 데이터를 신선하다고 판단하는 시간 (ms)
    // 이 시간 안에는 캐시를 그대로 사용하고 새 요청을 보내지 않습니다.
    staleTime: 1000 * 60 * 5, // 5분
  });
}
```

---

#### 정리 (Conclusion)

| 규칙 | 설명 |
|------|------|
| queryKey는 배열로 선언 | `['posts', id]` 형태로 계층 구조를 표현합니다 |
| queryFn의 모든 의존성을 queryKey에 포함 | 누락하면 캐시 무효화가 되지 않습니다 |
| fetch 응답 상태 확인 | 4xx/5xx 시 직접 throw해야 isError가 작동합니다 |
| queryFn은 데이터를 반환하거나 throw | 에러를 삼키면 TanStack Query가 감지하지 못합니다 |

`queryKey`를 의존성 배열처럼 다루는 것이 핵심입니다. ESLint 플러그인 `@tanstack/eslint-plugin-query`를 사용하면 누락된 의존성을 자동으로 경고해줍니다.

---

### 추가 학습 자료 공유합니다.

- [TanStack Query 공식 문서 — Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
- [TanStack Query 공식 문서 — Query Functions](https://tanstack.com/query/latest/docs/framework/react/guides/query-functions)

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
| `{{TITLE}}` | TanStack Query에서 queryKey와 queryFn은 어떻게 동작하나요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | TanStack Query, React Query, queryKey, queryFn, 캐시 |
| `{{DATE}}` | 2026-04-15 |
| `{{SLUG}}` | tanstack-query-key-and-fn |
| `{{SUMMARY}}` | queryKey는 캐시 식별자입니다. queryFn에서 사용하는 모든 변수를 포함해야 하며, queryFn은 실패 시 에러를 throw해야 합니다. |
| `{{WHY}}` | queryKey에 의존성이 빠지면 캐시 무효화가 안 되고, fetch 에러를 throw하지 않으면 isError가 작동하지 않습니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
