# Next.js revalidateTag는 무엇이고 언제 사용하나요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

`revalidateTag`는 특정 태그로 묶인 캐시 항목을 즉시 무효화하는 Next.js의 캐시 제어 함수입니다.
`fetch`에 `tags` 옵션으로 태그를 붙여두면, 나중에 Server Action이나 Route Handler에서 `revalidateTag('태그명')`을 호출해 해당 태그가 달린 캐시를 한 번에 날릴 수 있습니다.
시간 기반의 `revalidate`와 달리 "데이터가 실제로 변경된 시점"에 즉시 갱신할 수 있습니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

`revalidate: 60`처럼 시간 기반 갱신은 데이터가 언제 바뀔지 모를 때 일정 주기로 재검증합니다.
하지만 CMS에서 글을 발행하거나, 관리자가 상품 정보를 수정하는 것처럼 **변경 시점을 정확히 알 수 있는 경우**에는 60초를 기다리는 것이 비효율적입니다.

`revalidateTag`는 이 문제를 해결합니다. 데이터가 변경될 때 직접 해당 태그의 캐시를 지우면, 다음 요청부터 즉시 최신 데이터가 반영됩니다.

**revalidate vs revalidateTag 비교:**

| 방식 | 갱신 시점 | 적합한 상황 |
|------|-----------|-------------|
| `revalidate: N` | N초 후 다음 요청 시 | 갱신 시점을 알 수 없는 데이터 |
| `revalidateTag` | 명시적으로 호출할 때 즉시 | 변경 시점이 명확한 데이터 (글 발행, 상품 수정 등) |

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
// 태그 없이 fetch — revalidateTag로 캐시를 선택적으로 무효화할 수 없음
async function PostList() {
  const res = await fetch('https://api.example.com/posts');
  const posts = await res.json();
  return <ul>{posts.map((p) => <li key={p.id}>{p.title}</li>)}</ul>;
}

// 글을 발행했는데 캐시를 날릴 방법이 없어서 revalidate 시간만 기다려야 함
async function publishPost(postId: string) {
  await fetch(`https://api.example.com/posts/${postId}/publish`, { method: 'POST' });
  // 캐시 무효화 불가 — 사용자는 최대 revalidate 시간만큼 이전 목록을 봄
}
```

태그가 없으면 특정 데이터의 캐시만 선택해서 날릴 수 없습니다. `revalidatePath`로 페이지 전체를 무효화하거나, 시간이 지나길 기다려야 합니다.

---

#### 올바른 사용법 (Good Example)

```tsx
// 1. fetch에 tags 옵션으로 태그 부착
async function PostList() {
  const res = await fetch('https://api.example.com/posts', {
    next: { tags: ['posts'] },
  });
  const posts = await res.json();
  return <ul>{posts.map((p) => <li key={p.id}>{p.title}</li>)}</ul>;
}

async function PostDetail({ postId }: { postId: string }) {
  const res = await fetch(`https://api.example.com/posts/${postId}`, {
    next: { tags: ['posts', `post-${postId}`] }, // 여러 태그 부착 가능
  });
  const post = await res.json();
  return <article>{post.content}</article>;
}
```

```tsx
// 2. Server Action에서 글 발행 시 즉시 캐시 무효화
'use server';

import { revalidateTag } from 'next/cache';

export async function publishPost(postId: string) {
  await fetch(`https://api.example.com/posts/${postId}/publish`, {
    method: 'POST',
  });

  revalidateTag('posts'); // 'posts' 태그가 달린 모든 fetch 캐시 무효화
  // 특정 글만 무효화하려면: revalidateTag(`post-${postId}`)
}
```

`publishPost`가 실행되면 `'posts'` 태그가 붙은 모든 fetch 캐시가 즉시 만료됩니다. 다음 요청부터 서버는 새 데이터를 가져와 캐시를 갱신합니다.

**Route Handler에서도 동일하게 사용할 수 있습니다 (Webhook 수신 등):**

```ts
// app/api/revalidate/route.ts
import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { tag } = await request.json();
  revalidateTag(tag);
  return NextResponse.json({ revalidated: true });
}
```

CMS나 외부 서비스에서 Webhook을 보낼 때 이 엔드포인트를 호출하면, 콘텐츠가 수정되는 즉시 캐시를 무효화할 수 있습니다.

---

#### 정리 (Conclusion)

`revalidateTag`는 데이터 변경 시점이 명확할 때 해당 캐시만 즉시 무효화하는 함수입니다.
`fetch`에 `tags`를 붙여두고, 데이터가 바뀌는 Server Action이나 Webhook Handler에서 `revalidateTag`를 호출하는 것이 기본 패턴입니다.
시간 기반 `revalidate`와 조합해서 "평소에는 60초마다, 수동 발행 시에는 즉시 갱신"처럼 유연하게 캐시 전략을 구성할 수 있습니다.

---

### 추가 학습 자료 공유합니다.

- [Next.js 공식 문서 — revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
- [Next.js 공식 문서 — fetch tags 옵션](https://nextjs.org/docs/app/api-reference/functions/fetch#optionsnexttags)

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
| `{{TITLE}}` | Next.js revalidateTag는 무엇이고 언제 사용하나요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | Next.js, revalidateTag, 캐시, Server Action, ISR |
| `{{DATE}}` | 2026-04-20 |
| `{{SLUG}}` | nextjs-revalidate-tag |
| `{{SUMMARY}}` | revalidateTag는 태그로 묶인 fetch 캐시를 즉시 무효화합니다. 데이터 변경 시점이 명확할 때 시간 기반 revalidate 대신 사용합니다. |
| `{{WHY}}` | 시간 기반 revalidate는 변경 시점을 몰라도 주기적으로 갱신하지만, 변경 시점을 알 때는 즉시 무효화하는 것이 더 효율적입니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
