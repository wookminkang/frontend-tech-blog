# Next.js에서 revalidate는 무엇이고 어떻게 동작하나요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

`revalidate`는 Next.js의 ISR(Incremental Static Regeneration) 기능으로, 정적으로 생성된 페이지나 캐시된 데이터를 일정 시간마다 백그라운드에서 갱신하는 방법입니다.
`fetch`의 `next.revalidate` 옵션 또는 페이지의 `export const revalidate`로 설정하며, 지정한 시간(초)이 지나면 다음 요청 시 서버에서 데이터를 새로 가져옵니다.
빌드 시점에 생성된 정적 페이지의 장점(빠른 응답)을 유지하면서, 일정 주기로 최신 데이터를 반영할 수 있습니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

Next.js에서 데이터를 가져오는 방식은 크게 세 가지입니다.

| 방식 | 특징 | 문제 |
|------|------|------|
| 정적 생성 (SSG) | 빌드 시 한 번만 생성, 빠름 | 데이터가 바뀌어도 재배포 전까지 갱신 안 됨 |
| 서버 사이드 렌더링 (SSR) | 요청마다 최신 데이터 | 매 요청마다 서버 연산 발생, 느릴 수 있음 |
| ISR (revalidate) | 정적 페이지를 주기적으로 갱신 | 갱신 주기 안에는 오래된 데이터 노출 가능 |

`revalidate`는 SSG와 SSR의 중간 지점입니다. 최초 요청은 캐시된 정적 페이지를 빠르게 반환하고, 설정한 시간이 지난 후 첫 요청이 들어오면 백그라운드에서 페이지를 재생성합니다. 이 시점의 요청자는 여전히 이전 버전을 받고, 그 다음 요청자부터 새 버전을 받습니다. 이를 **Stale-While-Revalidate** 패턴이라고 합니다.

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
// revalidate 없이 fetch — 빌드 시 한 번만 데이터를 가져오고 이후 갱신 없음
async function PostList() {
  const res = await fetch('https://api.example.com/posts');
  const posts = await res.json();

  return <ul>{posts.map((p) => <li key={p.id}>{p.title}</li>)}</ul>;
}
```

`revalidate`를 설정하지 않으면 Next.js는 빌드 시 한 번 데이터를 캐싱하고 이후 갱신하지 않습니다. 게시글이 추가되거나 수정되어도 재배포 전까지 이전 목록이 표시됩니다.

---

#### 올바른 사용법 (Good Example)

```tsx
// fetch 레벨에서 revalidate 설정
async function PostList() {
  const res = await fetch('https://api.example.com/posts', {
    next: { revalidate: 60 }, // 60초마다 백그라운드에서 재검증
  });
  const posts = await res.json();

  return <ul>{posts.map((p) => <li key={p.id}>{p.title}</li>)}</ul>;
}
```

```tsx
// 페이지 레벨에서 revalidate 설정 — 해당 페이지의 모든 fetch에 적용
export const revalidate = 60;

async function PostList() {
  const res = await fetch('https://api.example.com/posts');
  const posts = await res.json();

  return <ul>{posts.map((p) => <li key={p.id}>{p.title}</li>)}</ul>;
}
```

60초가 지난 뒤 첫 요청이 들어오면, 기존 캐시를 즉시 반환하면서 백그라운드에서 데이터를 새로 가져옵니다. 재생성이 완료되면 다음 요청부터 새 데이터가 보입니다.

**revalidate 값 설정 기준:**

| 콘텐츠 유형 | 권장 revalidate |
|-------------|-----------------|
| 뉴스, 블로그 목록 | 60 ~ 300초 |
| 상품 가격, 재고 | 10 ~ 30초 |
| 마케팅 페이지 | 3600초 이상 |
| 실시간 데이터 | SSR(`revalidate = 0`) 권장 |

---

#### 정리 (Conclusion)

`revalidate`는 정적 페이지의 빠른 응답과 최신 데이터 반영을 동시에 달성하는 ISR의 핵심 설정입니다.
`fetch` 옵션이나 페이지 레벨의 `export const revalidate`로 설정하며, 설정한 시간이 지나면 백그라운드에서 조용히 재생성됩니다.
데이터의 실시간성이 얼마나 중요한지에 따라 적절한 초 단위를 선택하는 것이 핵심입니다.

---

### 추가 학습 자료 공유합니다.

- [Next.js 공식 문서 — revalidate](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#revalidate)
- [Next.js 공식 문서 — Incremental Static Regeneration](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)

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
| `{{TITLE}}` | Next.js에서 revalidate는 무엇이고 어떻게 동작하나요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | Next.js, ISR, revalidate, SSG, 캐시 |
| `{{DATE}}` | 2026-04-20 |
| `{{SLUG}}` | nextjs-revalidate |
| `{{SUMMARY}}` | revalidate는 정적 페이지를 일정 시간마다 백그라운드에서 재생성하는 ISR 설정입니다. 빠른 응답과 최신 데이터 반영을 동시에 달성합니다. |
| `{{WHY}}` | SSG는 재배포 전까지 갱신이 없고, SSR은 매 요청마다 서버 연산이 발생합니다. revalidate는 그 중간 지점입니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
