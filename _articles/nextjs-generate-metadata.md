# Next.js에서 generateMetadata는 어떻게 사용하나요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

`generateMetadata`는 App Router에서 페이지별 SEO 메타데이터를 동적으로 생성하는 함수입니다. `page.tsx` 또는 `layout.tsx`에서 `export async function generateMetadata`를 선언하면, Next.js가 빌드 시점에 각 페이지의 `<title>`, `<meta name="description">`, Open Graph 태그 등을 자동으로 주입합니다. `params`나 외부 데이터를 기반으로 페이지마다 다른 메타데이터를 만들 수 있어 동적 라우트에서 특히 유용합니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

메타데이터를 관리하지 않으면 두 가지 문제가 생깁니다.

**첫째, 모든 페이지의 제목과 설명이 동일합니다.** `layout.tsx`에 정적 `metadata`만 선언하면 블로그 상세 페이지, 상품 페이지 등 URL마다 달라야 할 제목이 전부 같아집니다. 검색 엔진은 중복 메타데이터를 낮게 평가합니다.

**둘째, `<head>`에 직접 태그를 넣으려다 오류가 납니다.** App Router에서는 `<head>` 태그를 직접 조작할 수 없습니다. 반드시 Next.js가 제공하는 Metadata API를 사용해야 합니다.

메타데이터 적용 우선순위는 다음과 같이 동작합니다.

| 위치 | 설명 |
|------|------|
| `app/layout.tsx` | 전체 공통 메타데이터 (기본값) |
| `app/[route]/layout.tsx` | 특정 구간 메타데이터 |
| `app/[route]/page.tsx` | 개별 페이지 메타데이터 (가장 높은 우선순위) |

하위 페이지에서 같은 키를 선언하면 상위 값을 덮어씁니다. `title.template`을 루트에 설정해두면 하위 페이지 제목에 자동으로 서비스명이 붙습니다.

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
// app/layout.tsx
// 정적 metadata만 선언 — 모든 하위 페이지의 title이 동일하게 노출됩니다.

export const metadata = {
  title: '매일매일',
  description: '프론트엔드 기술 블로그',
};
```

```tsx
// app/articles/[slug]/page.tsx
// generateMetadata 없이 페이지를 그냥 렌더링하는 경우

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  return <main>{article.content}</main>;
  // 이 페이지의 <title>은 여전히 루트의 "매일매일"입니다.
  // 검색 결과에 아티클 제목이 아닌 서비스명만 표시됩니다.
}
```

---

#### 올바른 사용법 (Good Example)

```tsx
// app/layout.tsx
// title.template으로 하위 페이지 제목에 서비스명을 자동으로 붙입니다.

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: '매일매일',          // generateMetadata가 없는 페이지의 기본 제목
    template: '%s | 매일매일',    // %s 자리에 각 페이지의 title이 들어갑니다
  },
  description: '프론트엔드 기술 블로그',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: '매일매일',
  },
};
```

```tsx
// app/articles/[slug]/page.tsx
// 아티클 데이터를 기반으로 페이지마다 다른 메타데이터를 생성합니다.

import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  // 존재하지 않는 slug는 빈 객체 반환 — 루트 layout의 기본값이 사용됩니다.
  if (!article) return {};

  const url = `https://example.com/articles/${slug}`;

  return {
    title: article.title,               // template에 의해 "제목 | 매일매일" 형태가 됩니다
    description: article.summary,
    keywords: article.tags,
    alternates: {
      canonical: url,                   // 정규 URL — 중복 인덱싱 방지
    },
    openGraph: {
      title: article.title,
      description: article.summary,
      type: 'article',
      publishedTime: article.date,      // ISO 8601 형식 권장: "2026-04-16"
      url,
      locale: 'ko_KR',
      siteName: '매일매일',
      tags: article.tags,
    },
    twitter: {
      card: 'summary',
      title: article.title,
      description: article.summary,
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  return <main>{article.content}</main>;
}
```

`generateMetadata`와 페이지 컴포넌트가 같은 데이터(`getArticleBySlug`)를 호출하더라도 Next.js는 `fetch` 또는 캐시 레이어에서 자동으로 중복 요청을 제거합니다. 함수를 별도로 메모이제이션할 필요가 없습니다.

---

#### 정리 (Conclusion)

`generateMetadata`는 `params`나 외부 데이터를 받아 페이지별 메타데이터 객체를 반환하는 비동기 함수입니다. 루트 `layout.tsx`에 `title.template`을 설정해두고, 각 동적 페이지에서 `generateMetadata`로 제목과 Open Graph를 덮어쓰는 것이 권장 패턴입니다.

| 항목 | 용도 |
|------|------|
| `title.template` | 루트에 선언, 하위 페이지 제목에 서비스명 자동 부착 |
| `description` | 검색 결과 미리보기 텍스트 |
| `keywords` | 태그 배열을 그대로 전달 |
| `alternates.canonical` | 중복 URL 색인 방지 |
| `openGraph` | 카카오, 슬랙, 트위터 등 SNS 공유 미리보기 |
| `twitter.card` | 트위터 카드 타입 (`summary` 또는 `summary_large_image`) |

---

### 추가 학습 자료 공유합니다.

- [Next.js 공식 문서 — generateMetadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Next.js 공식 문서 — Metadata 객체 전체 필드](https://nextjs.org/docs/app/api-reference/functions/generate-metadata#metadata-fields)

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
| `{{TITLE}}` | Next.js에서 generateMetadata는 어떻게 사용하나요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | Next.js, generateMetadata, SEO, Open Graph, App Router |
| `{{DATE}}` | 2026-04-16 |
| `{{SLUG}}` | nextjs-generate-metadata |
| `{{SUMMARY}}` | `generateMetadata`로 페이지별 title, description, Open Graph를 동적으로 생성합니다. 루트 layout에 `title.template`을 설정하면 하위 페이지 제목에 서비스명이 자동으로 붙습니다. |
| `{{WHY}}` | 정적 metadata만 쓰면 모든 페이지 제목이 동일해져 SEO에 불리하고, App Router에서 head 태그를 직접 조작할 수 없습니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
