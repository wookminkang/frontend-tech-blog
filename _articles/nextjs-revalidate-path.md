# Next.js revalidatePath는 무엇이고 언제 사용하나요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

`revalidatePath`는 특정 경로(URL)에 해당하는 캐시를 즉시 무효화하는 Next.js의 캐시 제어 함수입니다.
`revalidateTag`가 fetch 캐시를 태그 단위로 무효화한다면, `revalidatePath`는 특정 페이지와 연관된 모든 캐시(라우트 캐시, 데이터 캐시)를 경로 기준으로 한 번에 무효화합니다.
"이 페이지 전체를 지금 당장 다시 만들어라"가 필요할 때 사용합니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

Next.js App Router는 여러 캐시 레이어를 가집니다.

| 캐시 종류 | 저장 위치 | 설명 |
|-----------|-----------|------|
| 데이터 캐시 | 서버 | `fetch` 응답 결과 |
| Full Route Cache | 서버 | 렌더링된 HTML/RSC Payload |
| Router Cache | 클라이언트 | 방문한 페이지 세그먼트 |

`revalidateTag`는 데이터 캐시(특정 fetch)만 무효화합니다. 하지만 서버에서 렌더링된 페이지 자체(Full Route Cache)까지 새로 만들어야 할 때는 `revalidatePath`를 사용합니다.

예를 들어 `/posts/1` 페이지에서 여러 `fetch`를 사용하고 있다면, 태그를 하나씩 찾아서 `revalidateTag`를 여러 번 호출하는 대신 `revalidatePath('/posts/1')`으로 한 번에 처리할 수 있습니다.

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
'use server';

import { revalidateTag } from 'next/cache';

// 한 페이지에 여러 데이터 소스가 있을 때 — 태그를 모두 기억해야 함
export async function updatePost(postId: string, data: FormData) {
  await savePost(postId, data);

  // 이 페이지에 어떤 태그가 있는지 일일이 파악해서 호출해야 함
  revalidateTag('posts');
  revalidateTag(`post-${postId}`);
  revalidateTag('comments');
  revalidateTag('author');
  // 태그를 하나라도 빠뜨리면 일부 데이터가 갱신되지 않음
}
```

태그 방식은 fetch마다 태그를 붙이고, 무효화 시 태그를 빠짐없이 나열해야 합니다. 페이지 구조가 복잡할수록 누락 위험이 높아집니다.

---

#### 올바른 사용법 (Good Example)

```tsx
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// 글 수정 후 해당 페이지 전체 캐시 무효화
export async function updatePost(postId: string, data: FormData) {
  await savePost(postId, data);

  // /posts/[postId] 경로의 모든 캐시를 한 번에 무효화
  revalidatePath(`/posts/${postId}`);
}

// 글 삭제 후 목록 페이지 캐시 무효화
export async function deletePost(postId: string) {
  await removePost(postId);

  revalidatePath('/posts'); // 목록 페이지
  revalidatePath(`/posts/${postId}`); // 상세 페이지
  redirect('/posts');
}
```

특정 경로의 모든 캐시가 한 번에 무효화됩니다. 태그를 일일이 기억하지 않아도 됩니다.

**type 옵션으로 범위를 조절할 수 있습니다:**

```tsx
// 'page' (기본값) — 해당 경로의 페이지만 무효화
revalidatePath('/posts/1', 'page');

// 'layout' — 해당 경로의 레이아웃 포함 하위 모든 페이지 무효화
// /posts 레이아웃을 공유하는 모든 페이지(/posts/1, /posts/2 등)를 한 번에 무효화
revalidatePath('/posts', 'layout');
```

---

**revalidatePath vs revalidateTag 선택 기준:**

| 상황 | 권장 방식 |
|------|-----------|
| 특정 fetch 결과만 갱신 | `revalidateTag` |
| 특정 페이지 전체를 갱신 | `revalidatePath` |
| 공유 레이아웃 아래 모든 페이지 갱신 | `revalidatePath('/경로', 'layout')` |
| 외부 Webhook으로 데이터 태그를 알 때 | `revalidateTag` |
| Server Action에서 폼 제출 후 페이지 갱신 | `revalidatePath` |

---

#### 정리 (Conclusion)

`revalidatePath`는 특정 URL 경로에 해당하는 캐시를 즉시 무효화합니다.
페이지에 연관된 fetch 태그를 일일이 찾아서 무효화하는 대신, 경로 하나로 관련 캐시를 한 번에 처리할 수 있습니다.
Server Action에서 데이터를 변경한 뒤 `revalidatePath`로 해당 페이지 캐시를 날리는 것이 가장 일반적인 사용 패턴입니다.

---

### 추가 학습 자료 공유합니다.

- [Next.js 공식 문서 — revalidatePath](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)
- [Next.js 공식 문서 — 캐싱 개요](https://nextjs.org/docs/app/building-your-application/caching)

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
| `{{TITLE}}` | Next.js revalidatePath는 무엇이고 언제 사용하나요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | Next.js, revalidatePath, 캐시, Server Action, ISR |
| `{{DATE}}` | 2026-04-20 |
| `{{SLUG}}` | nextjs-revalidate-path |
| `{{SUMMARY}}` | revalidatePath는 특정 URL 경로의 모든 캐시를 즉시 무효화합니다. Server Action에서 데이터 변경 후 페이지 전체를 갱신할 때 사용합니다. |
| `{{WHY}}` | revalidateTag는 태그 단위로 선택적으로 무효화하지만, 페이지 전체를 한 번에 갱신해야 할 때는 revalidatePath가 더 간단합니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
