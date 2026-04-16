# TanStack Query에서 useMutation과 QueryClient 메서드는 어떻게 사용하나요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

`useMutation`은 데이터를 생성·수정·삭제하는 비동기 작업을 처리합니다. 뮤테이션 성공 후 `invalidateQueries`로 관련 쿼리를 무효화해 최신 데이터를 다시 가져와야 합니다. `setQueryData`로 서버 응답을 캐시에 직접 반영하면 불필요한 재요청을 줄일 수 있습니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

TanStack Query에서 데이터를 조회하는 것은 `useQuery`가 담당하지만, 생성·수정·삭제처럼 서버 상태를 변경하는 작업은 `useMutation`이 담당합니다.

뮤테이션 이후 화면이 업데이트되지 않는 문제가 자주 발생합니다. `useMutation`은 서버에 요청을 보내지만, 캐시를 자동으로 갱신하지는 않습니다. 뮤테이션 성공 후 관련 쿼리를 명시적으로 무효화해야 합니다.

**주요 메서드 역할**

- **`invalidateQueries`**: 특정 queryKey의 캐시를 무효화합니다. 무효화된 쿼리는 다음 렌더링 시 자동으로 재요청됩니다.
- **`setQueryData`**: 캐시를 직접 수정합니다. 서버 응답을 이용해 낙관적 업데이트(optimistic update)를 구현하거나, 뮤테이션 응답 데이터를 캐시에 즉시 반영할 때 사용합니다.
- **`getQueryData`**: 현재 캐시에 저장된 데이터를 읽습니다.
- **`prefetchQuery`**: 사용자가 방문하기 전에 미리 데이터를 가져와 캐시에 저장합니다.

**`enabled` 옵션**

`useQuery`의 `enabled` 옵션이 `false`이면 쿼리가 자동 실행되지 않습니다. 다른 쿼리의 결과에 의존하는 종속 쿼리나, 특정 조건이 충족될 때만 요청하고 싶을 때 사용합니다.

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// 뮤테이션 성공 후 캐시를 무효화하지 않는 경우
// 포스트를 생성해도 목록에 즉시 반영되지 않습니다.
function CreatePost() {
  const mutation = useMutation({
    mutationFn: (title: string) => createPost({ title }),
    // onSuccess 없음 — 성공 후 아무 처리도 하지 않습니다.
  });

  return (
    <button onClick={() => mutation.mutate('새 포스트')}>
      생성
    </button>
  );
}

// enabled 없이 userId가 undefined일 때 쿼리가 실행되는 경우
// undefined가 queryKey에 포함되어 불필요한 요청이 발생합니다.
function useUserProfile(userId: number | undefined) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId!), // userId가 없으면 에러 발생
  });
}
```

뮤테이션 성공 후 `invalidateQueries`를 호출하지 않으면 캐시는 그대로이고 화면도 갱신되지 않습니다. `enabled` 없이 조건부 쿼리를 실행하면 의존 데이터가 준비되기 전에 잘못된 요청이 나갑니다.

---

#### 올바른 사용법 (Good Example)

```tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// 뮤테이션 성공 후 invalidateQueries로 목록 캐시를 무효화합니다.
function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (title: string) => createPost({ title }),
    onSuccess: () => {
      // 'posts' 키를 포함한 모든 쿼리를 무효화합니다.
      // 컴포넌트가 마운트되어 있으면 자동으로 재요청이 발생합니다.
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (error) => {
      console.error('포스트 생성 실패:', error.message);
    },
  });
}

// 컴포넌트에서 사용
function CreatePost() {
  const { mutate, isPending, isError } = useCreatePost();

  return (
    <div>
      <button onClick={() => mutate('새 포스트')} disabled={isPending}>
        {isPending ? '생성 중...' : '생성'}
      </button>
      {isError && <p>생성에 실패했습니다. 다시 시도해주세요.</p>}
    </div>
  );
}
```

```tsx
// setQueryData — 뮤테이션 응답을 캐시에 직접 반영해 재요청을 줄이는 패턴
function useUpdatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) =>
      updatePost({ id, title }),
    onSuccess: (updatedPost) => {
      // 서버 응답으로 캐시를 직접 업데이트합니다. 재요청이 발생하지 않습니다.
      queryClient.setQueryData(['posts', updatedPost.id], updatedPost);
      // 목록 캐시는 무효화해 재요청합니다.
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}
```

```tsx
// enabled — userId가 준비된 후에만 쿼리를 실행합니다.
function useUserProfile(userId: number | undefined) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId!),
    enabled: !!userId, // userId가 있을 때만 실행
  });
}

// 종속 쿼리 — 첫 번째 쿼리 결과를 두 번째 쿼리의 파라미터로 사용
function UserPosts() {
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: fetchCurrentUser,
  });

  const { data: posts } = useQuery({
    queryKey: ['posts', 'user', user?.id],
    queryFn: () => fetchPostsByUser(user!.id),
    enabled: !!user?.id, // user가 로딩될 때까지 실행하지 않습니다.
  });

  return <div>{/* ... */}</div>;
}
```

```tsx
// staleTime / gcTime 설정
// staleTime: 데이터를 신선하다고 판단하는 시간. 이 시간 안에는 재요청하지 않습니다.
// gcTime: 캐시를 메모리에 유지하는 시간. 이 시간 이후 캐시가 삭제됩니다.
function usePostDetail(id: number) {
  return useQuery({
    queryKey: ['posts', id],
    queryFn: () => fetchPost(id),
    staleTime: 1000 * 60 * 10, // 10분간 신선 상태 유지
    gcTime: 1000 * 60 * 30,   // 30분간 캐시 유지
  });
}
```

---

#### 정리 (Conclusion)

| 메서드 / 옵션 | 역할 | 사용 시점 |
|-------------|------|---------|
| `useMutation` | 서버 상태 변경 (생성·수정·삭제) | POST, PUT, PATCH, DELETE 요청 |
| `invalidateQueries` | 캐시 무효화 후 재요청 | 뮤테이션 성공 후 관련 목록 갱신 |
| `setQueryData` | 캐시 직접 수정 | 서버 응답으로 즉시 반영, 재요청 절감 |
| `getQueryData` | 캐시 읽기 | 낙관적 업데이트의 롤백 데이터 보관 |
| `enabled` | 쿼리 실행 여부 제어 | 종속 쿼리, 조건부 실행 |
| `staleTime` | 캐시 신선도 유지 시간 | 자주 바뀌지 않는 데이터의 불필요한 재요청 방지 |

뮤테이션 작성 시 `onSuccess`에 `invalidateQueries`를 함께 작성하는 것을 기본 패턴으로 삼으세요. 서버와 클라이언트 캐시가 항상 동기화됩니다.

---

### 추가 학습 자료 공유합니다.

- [TanStack Query 공식 문서 — Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)
- [TanStack Query 공식 문서 — Invalidations from Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations)

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
| `{{TITLE}}` | TanStack Query에서 useMutation과 QueryClient 메서드는 어떻게 사용하나요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | TanStack Query, React Query, useMutation, invalidateQueries, setQueryData |
| `{{DATE}}` | 2026-04-15 |
| `{{SLUG}}` | tanstack-query-methods |
| `{{SUMMARY}}` | useMutation으로 서버 상태를 변경하고, onSuccess에서 invalidateQueries로 관련 쿼리를 무효화해야 화면이 갱신됩니다. |
| `{{WHY}}` | 뮤테이션 성공 후 invalidateQueries를 호출하지 않으면 캐시가 갱신되지 않아 화면이 업데이트되지 않습니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
