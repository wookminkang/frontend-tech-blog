# Next.js의 SSG, SSR, ISR은 어떻게 다른가요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

Next.js는 세 가지 렌더링 전략을 제공합니다. SSG는 빌드 시점에 HTML을 생성하고, SSR은 요청마다 HTML을 새로 생성하며, ISR은 SSG의 성능을 유지하면서 일정 주기로 페이지를 재생성합니다. 콘텐츠의 변경 빈도와 데이터 최신성 요구 수준에 따라 전략을 선택해야 합니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

렌더링 전략을 구분하지 않고 모든 페이지에 동일한 방식을 적용하면 성능 저하나 오래된 데이터 노출 문제가 생깁니다.

각 전략의 동작 방식을 이해하는 것이 중요합니다.

- **SSG (Static Site Generation)**: `getStaticProps`를 사용합니다. 빌드 시점에 데이터를 가져와 HTML을 생성합니다. 이후 요청에는 이미 만들어진 HTML을 그대로 제공하므로 응답이 매우 빠릅니다. 단, 빌드 이후 데이터가 바뀌어도 페이지는 업데이트되지 않습니다.

- **SSR (Server-Side Rendering)**: `getServerSideProps`를 사용합니다. 사용자가 페이지를 요청할 때마다 서버에서 데이터를 가져와 HTML을 생성합니다. 항상 최신 데이터를 보여줄 수 있지만, 요청마다 서버 부하가 발생합니다.

- **ISR (Incremental Static Regeneration)**: `getStaticProps`에 `revalidate` 옵션을 추가합니다. SSG처럼 빌드 시 HTML을 만들되, 설정한 시간이 지나면 백그라운드에서 페이지를 재생성합니다. 빠른 응답 속도와 주기적인 데이터 갱신을 동시에 얻을 수 있습니다.

실무에서는 변경이 거의 없는 콘텐츠에 SSR을 사용하거나, 실시간 데이터가 필요하지 않은 페이지에 SSG만 고집하는 경우 문제가 생깁니다.

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
// 블로그 포스트 목록 — 자주 바뀌지 않는 데이터임에도 SSR 적용
// 매 요청마다 서버에서 데이터를 가져오므로 불필요한 서버 부하가 발생합니다.
export async function getServerSideProps() {
  const res = await fetch('https://api.example.com/posts');
  const posts = await res.json();

  return {
    props: { posts },
  };
}

export default function BlogList({ posts }) {
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

위 코드에서 블로그 포스트 목록은 하루에 몇 번 바뀌지 않는 데이터입니다. 그럼에도 `getServerSideProps`를 사용하면, 페이지를 방문할 때마다 서버가 API를 호출하고 HTML을 새로 생성합니다. 트래픽이 늘어날수록 서버 비용과 응답 지연이 함께 증가합니다.

---

#### 올바른 사용법 (Good Example)

```tsx
// SSG — 빌드 시 HTML 생성. 변경이 거의 없는 정적 콘텐츠에 적합합니다.
export async function getStaticProps() {
  const res = await fetch('https://api.example.com/docs');
  const docs = await res.json();

  return {
    props: { docs },
  };
}

// ISR — revalidate로 주기적 재생성. 자주 바뀌지는 않지만 최신 상태가 필요한 경우에 적합합니다.
export async function getStaticProps() {
  const res = await fetch('https://api.example.com/posts');
  const posts = await res.json();

  return {
    props: { posts },
    revalidate: 60, // 60초마다 백그라운드에서 페이지 재생성
  };
}

// SSR — 요청마다 최신 데이터 필요. 로그인 사용자 정보, 실시간 재고 등에 적합합니다.
export async function getServerSideProps(context) {
  const { userId } = context.query;
  const res = await fetch(`https://api.example.com/user/${userId}`);
  const user = await res.json();

  return {
    props: { user },
  };
}
```

세 가지 전략을 콘텐츠 성격에 맞게 선택하면 됩니다.

- 약관, 소개 페이지처럼 거의 바뀌지 않는 페이지: **SSG**
- 블로그 목록, 상품 목록처럼 가끔 업데이트되는 페이지: **ISR**
- 장바구니, 사용자 대시보드처럼 요청마다 다른 데이터가 필요한 페이지: **SSR**

---

#### 정리 (Conclusion)

Next.js의 렌더링 전략은 성능과 데이터 최신성 사이의 균형을 맞추기 위해 존재합니다. 모든 페이지에 SSR을 적용하는 것은 개발하기 쉽지만 불필요한 서버 부하를 만들고, 모든 페이지에 SSG를 적용하면 빠르지만 데이터가 낡을 수 있습니다. 콘텐츠의 변경 주기와 데이터 최신성 요구 수준을 기준으로 전략을 선택하세요.

| 전략 | 생성 시점 | 최신성 | 서버 부하 | 적합한 페이지 |
|------|---------|--------|---------|-------------|
| SSG | 빌드 시 | 낮음 | 없음 | 정적 문서, 소개 페이지 |
| ISR | 빌드 + 주기적 재생성 | 중간 | 낮음 | 블로그, 상품 목록 |
| SSR | 요청마다 | 높음 | 높음 | 사용자 대시보드, 실시간 데이터 |

---

### 추가 학습 자료 공유합니다.

- [Next.js 공식 문서 — Data Fetching](https://nextjs.org/docs/pages/building-your-application/data-fetching)
- [Next.js 공식 문서 — Incremental Static Regeneration](https://nextjs.org/docs/pages/building-your-application/data-fetching/incremental-static-regeneration)

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

Contact: team.maeilmail@gmail.com
Socials: Velog / Github
Etc: 팀 소개 / 서비스 피드백
```

---

## 키워드 변수 정의

| 키워드 | 값 |
|--------|----|
| `{{TITLE}}` | Next.js의 SSG, SSR, ISR은 어떻게 다른가요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | Next.js, SSG, SSR, ISR, 렌더링 |
| `{{DATE}}` | 2026-04-15 |
| `{{SLUG}}` | nextjs-ssg-ssr-isr-difference |
| `{{SUMMARY}}` | Next.js의 세 가지 렌더링 전략(SSG, SSR, ISR)의 동작 방식과 올바른 선택 기준을 설명합니다. |
| `{{WHY}}` | 렌더링 전략을 구분하지 않으면 불필요한 서버 부하나 오래된 데이터 노출 문제가 생깁니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
