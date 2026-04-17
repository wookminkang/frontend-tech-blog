# SSG로 만든 페이지가 글을 수정해도 반영되지 않는 이유는 무엇인가요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

SSG(Static Site Generation)는 빌드 시점에 HTML을 미리 생성합니다. 빌드 이후에 데이터가 바뀌어도 이미 만들어진 HTML 파일은 그대로이기 때문에 변경 내용이 반영되지 않습니다. 해결 방법은 상황에 따라 네 가지로 나뉩니다. 주기적으로 갱신하는 ISR, 특정 이벤트에 즉시 갱신하는 On-demand Revalidation, 요청마다 서버에서 렌더링하는 SSR, 그리고 재빌드 배포입니다. 콘텐츠 변경 빈도와 응답 속도 요구사항에 따라 적합한 방법이 달라집니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

SSG의 동작 방식을 이해하면 문제의 원인이 명확해집니다.

빌드 명령(`next build`)을 실행하는 순간, Next.js는 `generateStaticParams`가 반환한 모든 경로에 대해 데이터를 가져와 HTML 파일을 생성합니다. 이 HTML 파일이 CDN에 배포되고, 이후 사용자 요청이 오면 서버 렌더링 없이 저장된 HTML을 그대로 전달합니다.

응답이 빠른 이유가 바로 이것이고, 동시에 데이터 변경이 반영되지 않는 이유도 이것입니다. **HTML은 빌드 시점의 스냅샷**이기 때문입니다.

```
빌드 시점          이후 데이터 변경
    │                     │
    ▼                     ▼
HTML 생성 → CDN 배포   DB/CMS 수정
                │
                ▼
         사용자 요청 → 기존 HTML 그대로 응답
                         (변경 내용 없음)
```

이 문제를 해결하는 방법은 "언제, 얼마나 자주 HTML을 다시 만들 것인가"에 따라 달라집니다.

| 방법 | 갱신 시점 | 응답 속도 | 적합한 상황 |
|------|---------|---------|-----------|
| 재빌드 배포 | 수동으로 배포할 때 | 빠름 | 변경이 드문 정적 콘텐츠 |
| ISR | 설정한 주기마다 | 빠름 | 수 분~수 시간 단위 갱신 허용 |
| On-demand Revalidation | 콘텐츠 저장 즉시 | 빠름 | 즉시 반영이 필요한 CMS |
| SSR | 요청마다 | 상대적으로 느림 | 실시간 데이터, 개인화 페이지 |

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
// app/posts/[slug]/page.tsx
// cache 설정 없이 fetch — 기본값은 SSG(force-cache)입니다.
// 빌드 이후 CMS에서 글을 수정해도 재배포 전까지 반영되지 않습니다.

export default async function PostPage({ params }) {
  const { slug } = await params;

  // 기본 cache: 'force-cache' — 빌드 시점 응답을 영구적으로 캐싱합니다.
  const post = await fetch(`https://api.example.com/posts/${slug}`).then(r => r.json());

  return <article>{post.content}</article>;
}
```

```tsx
// generateStaticParams만 있고 revalidate가 없는 경우
// 빌드 시 생성된 HTML이 재배포 전까지 고정됩니다.

export async function generateStaticParams() {
  const posts = await fetchAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}
// CMS에서 글을 수정해도 다음 배포 때까지 변경 내용이 보이지 않습니다.
```

---

#### 올바른 사용법 (Good Example)

**방법 1 — ISR (Incremental Static Regeneration)**

설정한 시간이 지난 후 첫 번째 요청이 오면 백그라운드에서 페이지를 다시 생성합니다. 재생성 중에는 이전 HTML을 그대로 제공하고, 완료되면 새 HTML로 교체합니다.

```tsx
// app/posts/[slug]/page.tsx

export const revalidate = 60; // 60초마다 재검증

export async function generateStaticParams() {
  const posts = await fetchAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = await fetch(`https://api.example.com/posts/${slug}`, {
    next: { revalidate: 60 }, // fetch 단위로도 설정 가능
  }).then(r => r.json());

  return <article>{post.content}</article>;
}
// 글 수정 후 최대 60초 안에 변경 내용이 반영됩니다.
```

**방법 2 — On-demand Revalidation**

CMS나 관리자 도구에서 글을 저장하는 순간 특정 경로를 즉시 재생성합니다. ISR처럼 주기를 기다리지 않아도 됩니다.

```tsx
// app/api/revalidate/route.ts
// CMS에서 글 저장 시 이 API를 웹훅으로 호출합니다.

import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');

  // 인증 토큰으로 무단 호출 방지
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  const { slug } = await req.json();

  // 특정 경로만 재검증
  revalidatePath(`/posts/${slug}`);

  // 또는 태그 단위로 재검증 (같은 태그를 쓰는 모든 fetch를 무효화)
  // revalidateTag('posts');

  return NextResponse.json({ revalidated: true });
}
```

```tsx
// fetch에 태그를 달아두면 revalidateTag로 한 번에 무효화할 수 있습니다.

const post = await fetch(`https://api.example.com/posts/${slug}`, {
  next: { tags: ['posts', `post-${slug}`] },
}).then(r => r.json());
```

```bash
# CMS 웹훅 설정 예시 — 글 저장 시 아래 URL로 POST 요청을 보냅니다.
POST https://my-site.com/api/revalidate?secret=MY_SECRET
Body: { "slug": "react-hooks-guide" }
```

**방법 3 — SSR (동적 렌더링)**

실시간 데이터가 반드시 필요하거나 사용자별 개인화가 필요한 페이지는 SSG를 포기하고 SSR로 전환합니다.

```tsx
// app/posts/[slug]/page.tsx
// cache: 'no-store' 또는 export const dynamic = 'force-dynamic'

export const dynamic = 'force-dynamic'; // 항상 서버에서 렌더링

export default async function PostPage({ params }) {
  const { slug } = await params;

  const post = await fetch(`https://api.example.com/posts/${slug}`, {
    cache: 'no-store', // 캐시 사용 안 함 — 매 요청마다 새로 fetch
  }).then(r => r.json());

  return <article>{post.content}</article>;
}
// 항상 최신 내용을 보여주지만 CDN 캐시를 사용할 수 없어 응답이 느려집니다.
```

**방법 4 — 재빌드 배포**

변경 빈도가 매우 낮고 즉각적인 반영이 필요하지 않다면 수동 재배포가 가장 단순합니다. Vercel을 사용하면 GitHub push만으로 자동 재빌드됩니다.

```bash
# 로컬에서 직접 재빌드
git add _articles/updated-post.md
git commit -m "아티클 수정: 제목"
git push origin main
# Vercel이 push를 감지해 자동으로 재빌드 및 배포
```

---

#### 정리 (Conclusion)

SSG 페이지가 수정 후 반영되지 않는 것은 버그가 아니라 설계된 동작입니다. 해결 방법은 콘텐츠 변경 빈도와 "얼마나 빨리 반영되어야 하는가"로 결정합니다.

| 상황 | 권장 방법 |
|------|---------|
| 변경이 드물고 수동 배포가 가능한 경우 | 재빌드 배포 |
| 수 분 이내 반영으로 충분한 경우 | ISR (`revalidate: 60` 등) |
| CMS에서 저장하는 즉시 반영해야 하는 경우 | On-demand Revalidation |
| 사용자마다 다른 데이터를 보여줘야 하는 경우 | SSR (`cache: 'no-store'`) |
| 일부는 정적, 일부는 실시간이어야 하는 경우 | SSG + 클라이언트 fetch 혼합 |

---

### 추가 학습 자료 공유합니다.

- [Next.js 공식 문서 — Revalidating Data](https://nextjs.org/docs/app/building-your-application/data-fetching/revalidating)
- [Next.js 공식 문서 — On-demand Revalidation](https://nextjs.org/docs/app/building-your-application/data-fetching/revalidating#on-demand-revalidation)

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
| `{{TITLE}}` | SSG로 만든 페이지가 글을 수정해도 반영되지 않는 이유는 무엇인가요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | Next.js, SSG, ISR, On-demand Revalidation, revalidatePath |
| `{{DATE}}` | 2026-04-17 |
| `{{SLUG}}` | ssg-content-update-problem |
| `{{SUMMARY}}` | SSG는 빌드 시점의 HTML 스냅샷을 제공하므로 이후 데이터 변경이 반영되지 않습니다. ISR, On-demand Revalidation, SSR, 재빌드 배포 중 변경 빈도와 반영 속도 요구에 맞는 방법을 선택합니다. |
| `{{WHY}}` | HTML이 빌드 시점에 고정되기 때문입니다. 재배포하지 않으면 CDN에 저장된 기존 HTML이 그대로 제공됩니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
