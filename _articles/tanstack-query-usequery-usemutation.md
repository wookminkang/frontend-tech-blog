# useQuery와 useMutation은 어떻게 함께 사용하나요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

`useQuery`는 서버에서 데이터를 GET으로 가져와 캐싱하고, `useMutation`은 데이터를 변경(생성, 수정, 삭제)한 뒤 그 결과를 서버에 반영합니다.
두 훅을 함께 사용할 때 핵심은 **캐시 무효화(invalidation)**입니다. `useMutation`이 성공하면 `queryClient.invalidateQueries`를 호출해 관련 `useQuery`의 캐시를 만료시키고, 최신 데이터를 자동으로 다시 가져오게 만듭니다.
이 패턴을 올바르게 구성하면 서버 상태와 UI 상태가 항상 동기화된 채로 유지됩니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

TanStack Query는 서버에서 가져온 데이터를 클라이언트 메모리(캐시)에 저장합니다. 같은 queryKey로 요청하면 서버에 다시 요청하지 않고 캐시에서 즉시 데이터를 반환합니다.

문제는 데이터를 수정하거나 삭제했을 때입니다. 서버의 실제 데이터는 변경됐지만 클라이언트 캐시는 그대로이기 때문에, UI에는 여전히 이전 데이터가 표시됩니다.

예를 들어 게시글 목록을 `useQuery`로 불러오고, 특정 게시글을 삭제하는 `useMutation`을 실행했을 때, 삭제 성공 후에도 삭제한 게시글이 목록에 그대로 남아있는 상황이 발생합니다. 캐시를 무효화하지 않았기 때문입니다.

`queryClient.invalidateQueries`는 지정한 queryKey의 캐시를 만료 처리해, 다음 렌더링 시 자동으로 서버에 재요청하도록 만들어 이 문제를 해결합니다.

---

#### 기본 설정

TanStack Query를 사용하려면 앱 최상단에 `QueryClientProvider`를 설정해야 합니다.

```tsx
// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1분 동안 데이터를 fresh로 유지
            retry: 1,             // 실패 시 1번 재시도
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

```tsx
// app/layout.tsx
import { QueryProvider } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
```

`QueryClient`를 `useState`로 초기화하는 이유는 컴포넌트가 리렌더링될 때마다 새 인스턴스가 생성되는 것을 막기 위해서입니다.

---

#### useQuery로 데이터 가져오기

`useQuery`는 서버에서 데이터를 가져와 캐시에 저장하는 훅입니다.

```tsx
import { useQuery } from '@tanstack/react-query';

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  createdAt: string;
}

async function fetchPosts(): Promise<Post[]> {
  const res = await fetch('/api/posts');
  if (!res.ok) throw new Error('게시글을 불러오지 못했습니다.');
  return res.json();
}

async function fetchPost(id: number): Promise<Post> {
  const res = await fetch(`/api/posts/${id}`);
  if (!res.ok) throw new Error('게시글을 불러오지 못했습니다.');
  return res.json();
}

// 목록 조회
function PostList() {
  const { data: posts, isLoading, isError, error } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  });

  if (isLoading) return <div>불러오는 중...</div>;
  if (isError) return <div>{error.message}</div>;

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}

// 단건 조회
function PostDetail({ id }: { id: number }) {
  const { data: post, isLoading } = useQuery({
    queryKey: ['posts', id],  // id별로 별도 캐시
    queryFn: () => fetchPost(id),
    enabled: !!id,            // id가 있을 때만 실행
  });

  if (isLoading) return <div>불러오는 중...</div>;
  if (!post) return null;

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

**queryKey의 역할:**

queryKey는 캐시의 식별자입니다. `['posts']`와 `['posts', 1]`은 서로 다른 캐시 항목입니다.
queryKey에 변수를 포함시키면, 변수가 바뀔 때마다 자동으로 새 데이터를 요청합니다.

```tsx
// userId가 바뀌면 자동으로 해당 유저의 게시글을 다시 가져옴
const { data } = useQuery({
  queryKey: ['posts', { userId }],
  queryFn: () => fetchPostsByUser(userId),
});
```

**staleTime과 gcTime:**

```tsx
const { data } = useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  staleTime: 5 * 60 * 1000,  // 5분 동안 fresh 상태 유지 — 이 시간 안에는 서버 재요청 없음
  gcTime: 10 * 60 * 1000,    // 10분 동안 캐시 유지 — 이 시간 이후 메모리에서 제거
});
```

`staleTime`이 지나면 데이터가 stale 상태가 됩니다. stale 상태일 때 컴포넌트가 마운트되거나 윈도우 포커스가 돌아오면 자동으로 백그라운드에서 재요청합니다.

---

#### useMutation으로 데이터 변경하기

`useMutation`은 POST, PUT, DELETE 같은 데이터 변경 요청을 처리합니다.

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

async function updatePost(params: { id: number; title: string; content: string }): Promise<Post> {
  const res = await fetch(`/api/posts/${params.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: params.title, content: params.content }),
  });
  if (!res.ok) throw new Error('수정에 실패했습니다.');
  return res.json();
}

async function deletePost(id: number): Promise<void> {
  const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('삭제에 실패했습니다.');
}

function PostEditor({ post }: { post: Post }) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: updatePost,
    onSuccess: (updatedPost) => {
      // 목록 캐시 무효화 — 다음 렌더링 시 목록을 서버에서 다시 가져옴
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      // 해당 게시글 단건 캐시도 무효화
      queryClient.invalidateQueries({ queryKey: ['posts', updatedPost.id] });
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      // 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    updateMutation.mutate({
      id: post.id,
      title: form.title.value,
      content: form.content.value,
    });
  }

  return (
    <div>
      <form onSubmit={handleUpdate}>
        <input name="title" defaultValue={post.title} />
        <textarea name="content" defaultValue={post.content} />
        <button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? '저장 중...' : '저장'}
        </button>
      </form>

      <button
        onClick={() => deleteMutation.mutate(post.id)}
        disabled={deleteMutation.isPending}
      >
        {deleteMutation.isPending ? '삭제 중...' : '삭제'}
      </button>
    </div>
  );
}
```

---

#### 캐시 무효화 전략

`invalidateQueries`에는 세 가지 주요 전략이 있습니다.

**1. 정확한 키로 무효화**

```tsx
// queryKey가 정확히 ['posts', 1]인 캐시만 무효화
queryClient.invalidateQueries({ queryKey: ['posts', 1], exact: true });
```

**2. 접두사로 무효화 (가장 자주 사용)**

```tsx
// ['posts']로 시작하는 모든 캐시 무효화
// ['posts'], ['posts', 1], ['posts', 2], ['posts', { userId: 1 }] 모두 해당
queryClient.invalidateQueries({ queryKey: ['posts'] });
```

**3. 캐시를 직접 업데이트 (setQueryData)**

서버 재요청 없이 캐시를 즉시 업데이트하는 방법입니다. 서버 응답이 수정된 데이터를 그대로 반환할 때 유용합니다.

```tsx
const updateMutation = useMutation({
  mutationFn: updatePost,
  onSuccess: (updatedPost) => {
    // 서버 재요청 없이 캐시를 직접 업데이트
    queryClient.setQueryData(['posts', updatedPost.id], updatedPost);

    // 목록 캐시는 무효화해서 순서나 필터 결과를 서버 기준으로 맞춤
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  },
});
```

`setQueryData`는 네트워크 요청 없이 즉시 UI를 업데이트하기 때문에, 낙관적 업데이트와 함께 쓰이기도 합니다.

---

#### 실전 패턴 — 댓글 CRUD

실제 서비스에서 자주 나오는 댓글 조회, 작성, 수정, 삭제를 한 컴포넌트에서 처리하는 예시입니다.

```tsx
interface Comment {
  id: number;
  postId: number;
  content: string;
  author: string;
}

const commentKeys = {
  all: ['comments'] as const,
  byPost: (postId: number) => ['comments', { postId }] as const,
};

function CommentSection({ postId }: { postId: number }) {
  const queryClient = useQueryClient();

  // 조회
  const { data: comments = [] } = useQuery({
    queryKey: commentKeys.byPost(postId),
    queryFn: async () => {
      const res = await fetch(`/api/posts/${postId}/comments`);
      return res.json() as Promise<Comment[]>;
    },
  });

  // 작성
  const createMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byPost(postId) });
    },
  });

  // 수정
  const updateMutation = useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      const res = await fetch(`/api/comments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byPost(postId) });
    },
  });

  // 삭제
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/comments/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.byPost(postId) });
    },
  });

  return (
    <section>
      <ul>
        {comments.map((comment) => (
          <li key={comment.id}>
            <p>{comment.content}</p>
            <button onClick={() => updateMutation.mutate({ id: comment.id, content: '수정된 내용' })}>
              수정
            </button>
            <button onClick={() => deleteMutation.mutate(comment.id)}>
              삭제
            </button>
          </li>
        ))}
      </ul>

      <button onClick={() => createMutation.mutate('새 댓글 내용')}>
        댓글 작성
      </button>
    </section>
  );
}
```

**queryKey를 객체로 관리하는 이유:**

`commentKeys.byPost(postId)`처럼 queryKey 팩토리를 만들어두면 키가 분산되지 않습니다. 오타나 불일치로 인해 캐시 무효화가 작동하지 않는 버그를 예방할 수 있습니다.

---

#### mutation 상태 활용하기

`useMutation`은 현재 상태를 나타내는 여러 플래그를 제공합니다.

```tsx
const { mutate, isPending, isSuccess, isError, error, reset } = useMutation({
  mutationFn: deletePost,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  },
});

return (
  <div>
    <button onClick={() => mutate(postId)} disabled={isPending}>
      {isPending ? '삭제 중...' : '삭제'}
    </button>

    {isError && (
      <p>
        {error.message}
        <button onClick={reset}>다시 시도</button>
      </p>
    )}

    {isSuccess && <p>삭제되었습니다.</p>}
  </div>
);
```

| 상태 | 설명 |
|------|------|
| `isPending` | 요청이 진행 중인 상태 |
| `isSuccess` | 요청이 성공한 상태 |
| `isError` | 요청이 실패한 상태 |
| `error` | 발생한 에러 객체 |
| `reset` | 상태를 idle로 초기화 |

---

#### 정리 (Conclusion)

`useQuery`와 `useMutation`을 함께 사용하는 핵심 패턴은 다음과 같습니다.

1. `useQuery`에 명확한 `queryKey`를 부여한다
2. `useMutation`의 `onSuccess`에서 `queryClient.invalidateQueries`로 관련 캐시를 무효화한다
3. 서버 응답으로 단건 데이터를 즉시 업데이트하려면 `setQueryData`를 함께 사용한다
4. queryKey는 팩토리 함수로 중앙 관리해 오타와 불일치를 예방한다

데이터를 변경한 뒤 캐시 무효화를 빠뜨리면 UI와 서버 상태가 불일치하는 버그가 발생합니다. `onSuccess`에 `invalidateQueries`를 넣는 것을 습관으로 만드는 것이 중요합니다.

---

### 추가 학습 자료 공유합니다.

- [TanStack Query 공식 문서 — useQuery](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery)
- [TanStack Query 공식 문서 — useMutation](https://tanstack.com/query/latest/docs/framework/react/reference/useMutation)
- [TanStack Query 공식 문서 — Query Invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)

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
| `{{TITLE}}` | useQuery와 useMutation은 어떻게 함께 사용하나요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | React, TanStack Query, useQuery, useMutation, 캐시무효화 |
| `{{DATE}}` | 2026-04-21 |
| `{{SLUG}}` | tanstack-query-usequery-usemutation |
| `{{SUMMARY}}` | useQuery로 데이터를 가져오고, useMutation으로 변경 후 onSuccess에서 invalidateQueries를 호출해 캐시를 무효화하는 것이 핵심 패턴입니다. |
| `{{WHY}}` | 서버 데이터를 변경해도 클라이언트 캐시는 자동으로 갱신되지 않아, 캐시 무효화 없이는 UI와 서버 상태가 불일치합니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
