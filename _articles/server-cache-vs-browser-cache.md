# 서버 캐시와 브라우저 캐시는 어떻게 다른가요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

캐시(cache)는 동일한 데이터를 반복해서 요청하지 않도록 특정 위치에 저장해두는 기법입니다.
브라우저 캐시는 사용자의 브라우저에 리소스를 저장해 네트워크 요청 자체를 줄이고, 서버 캐시는 서버 측에서 연산 결과나 DB 조회 결과를 저장해 응답 속도를 높입니다.
두 캐시는 저장 위치와 제어 주체가 다르기 때문에, 각각의 특성에 맞게 적용해야 합니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

웹 서비스에서 캐시를 잘못 이해하고 적용하면 두 가지 문제가 생깁니다.

**1. 캐시가 없으면 — 불필요한 반복 비용**

사용자가 페이지를 새로고침할 때마다 동일한 이미지, CSS, JS 파일을 서버에서 다시 내려받습니다. 서버는 요청마다 DB를 조회하고 연산을 반복합니다. 트래픽이 늘어날수록 서버 비용과 응답 지연이 커집니다.

**2. 캐시를 잘못 적용하면 — 오래된 데이터 노출**

캐시 만료 시간을 너무 길게 설정하면, 서버에서 데이터가 바뀌어도 사용자는 이전 버전을 계속 보게 됩니다. 배포 후에도 구 버전 JS 파일이 캐시에서 서빙되는 문제가 대표적입니다.

---

**브라우저 캐시 (Client-side Cache)**

브라우저는 서버 응답 헤더의 지시에 따라 리소스를 로컬 디스크에 저장합니다.
다음 요청 시 서버에 가지 않고 저장된 파일을 바로 사용합니다.

핵심 HTTP 헤더는 다음과 같습니다.

| 헤더 | 역할 |
|------|------|
| `Cache-Control: max-age=31536000` | 1년 동안 캐시 유지 |
| `Cache-Control: no-cache` | 매번 서버에 유효성 검사 요청 |
| `Cache-Control: no-store` | 캐시 저장 자체를 금지 |
| `ETag` | 리소스 고유 식별자 — 변경 여부 확인에 사용 |
| `Last-Modified` | 마지막 수정 시간 기반 유효성 검사 |

브라우저가 `ETag`나 `Last-Modified`를 활용해 서버에 유효성 검사를 요청하면, 서버는 리소스가 변경되지 않았을 때 `304 Not Modified`를 반환합니다. 본문 없이 헤더만 오기 때문에 빠릅니다.

---

**서버 캐시 (Server-side Cache)**

서버 캐시는 서버 내부에서 DB 조회나 연산 결과를 저장합니다.
사용자 브라우저와 무관하게 서버 측에서 동작합니다.

대표적인 방식은 다음과 같습니다.

| 방식 | 설명 |
|------|------|
| 메모리 캐시 (Redis, Memcached) | 자주 조회되는 데이터를 메모리에 저장해 DB 부하 감소 |
| CDN 캐시 | 정적 파일을 엣지 서버에 배포해 지리적 지연 감소 |
| Next.js 데이터 캐시 | `fetch` 결과를 서버에 캐싱, `revalidate`로 갱신 주기 설정 |

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
// Next.js App Router — 캐시 설정 없이 매 요청마다 DB 조회
async function ProductList() {
  // 요청마다 DB에서 새로 가져옴 — 동일한 데이터인데도 매번 쿼리 발생
  const res = await fetch('https://api.example.com/products');
  const products = await res.json();

  return <ul>{products.map((p) => <li key={p.id}>{p.name}</li>)}</ul>;
}
```

```tsx
// 정적 파일에 캐시 헤더 없음 — 매 요청마다 파일 다운로드
// next.config.ts
const nextConfig = {
  // headers 설정 없음 → Cache-Control 미설정
};
```

매 요청마다 서버가 DB를 조회하고, 브라우저도 동일한 정적 파일을 반복 다운로드합니다. 트래픽이 몰리면 DB 부하와 응답 지연이 급격히 증가합니다.

---

#### 올바른 사용법 (Good Example)

```tsx
// Next.js App Router — 서버 데이터 캐시 + 재검증 주기 설정
async function ProductList() {
  const res = await fetch('https://api.example.com/products', {
    next: { revalidate: 60 }, // 60초마다 백그라운드에서 재검증
  });
  const products = await res.json();

  return <ul>{products.map((p) => <li key={p.id}>{p.name}</li>)}</ul>;
}
```

```ts
// next.config.ts — 정적 파일 브라우저 캐시 설정
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // 빌드 해시가 포함된 JS/CSS — 파일명이 바뀌면 캐시 무효화
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // HTML — 항상 최신 버전 확인
        source: '/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
    ];
  },
};

export default nextConfig;
```

`/_next/static/` 경로의 파일은 빌드 시 파일명에 해시가 포함되므로, 1년짜리 캐시를 걸어도 안전합니다. 배포하면 파일명이 바뀌기 때문에 캐시가 자동으로 무효화됩니다.
HTML 파일은 `max-age=0, must-revalidate`로 설정해 항상 최신 HTML을 가져오도록 합니다.

서버 캐시는 `revalidate` 값으로 갱신 주기를 조절합니다. 자주 바뀌지 않는 데이터는 길게, 실시간성이 중요한 데이터는 짧게 설정합니다.

---

#### 정리 (Conclusion)

| 구분 | 저장 위치 | 제어 주체 | 주요 목적 |
|------|-----------|-----------|-----------|
| 브라우저 캐시 | 사용자 브라우저 | HTTP 응답 헤더 | 네트워크 요청 감소 |
| 서버 캐시 | 서버 메모리 / CDN | 서버 코드 / 인프라 | DB 부하 감소, 응답 속도 향상 |

정적 파일(JS, CSS, 이미지)은 파일명 해시를 이용해 브라우저 캐시를 길게 설정하고, HTML은 짧게 유지합니다.
서버 데이터는 `revalidate`로 갱신 주기를 명시해, 오래된 데이터가 노출되는 시간을 최소화합니다.

---

### 추가 학습 자료 공유합니다.

- [MDN — HTTP 캐싱](https://developer.mozilla.org/ko/docs/Web/HTTP/Caching)
- [Next.js 공식 문서 — Data Fetching and Caching](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching)

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
| `{{TITLE}}` | 서버 캐시와 브라우저 캐시는 어떻게 다른가요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | Cache, HTTP, Cache-Control, Next.js, 브라우저캐시, 서버캐시 |
| `{{DATE}}` | 2026-04-20 |
| `{{SLUG}}` | server-cache-vs-browser-cache |
| `{{SUMMARY}}` | 브라우저 캐시는 HTTP 헤더로 제어해 네트워크 요청을 줄이고, 서버 캐시는 DB 부하를 줄입니다. 정적 파일은 해시 기반 파일명으로 장기 캐시를, HTML은 must-revalidate로 항상 최신을 유지합니다. |
| `{{WHY}}` | 캐시 없이는 반복 비용이 발생하고, 잘못 적용하면 오래된 데이터가 노출됩니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
