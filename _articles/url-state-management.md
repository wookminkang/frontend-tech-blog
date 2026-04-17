# 게시판 검색 필터 조건은 왜 URL로 관리해야 하나요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

검색어, 카테고리, 페이지 번호처럼 게시판의 필터 조건을 `useState`로만 관리하면 새로고침 시 초기화되고, 링크 공유가 불가능하며, 브라우저 뒤로 가기가 동작하지 않습니다. 이 조건들은 URL 쿼리 파라미터(`?keyword=react&page=2`)로 관리해야 합니다. URL이 곧 상태가 되므로 새로고침해도 유지되고, 링크를 공유하면 동일한 결과를 볼 수 있으며, 히스토리 탐색도 자연스럽게 동작합니다. Next.js App Router에서는 `useSearchParams`와 `useRouter`를 조합해 구현합니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

게시판을 처음 만들 때 필터 조건을 `useState`로 관리하는 경우가 많습니다. 동작은 하지만 실무에서 반드시 만나게 되는 세 가지 문제가 있습니다.

**첫째, 새로고침하면 필터가 초기화됩니다.** 사용자가 "React" 키워드로 검색하고 3페이지까지 탐색했는데, 새로고침하는 순간 1페이지 전체 목록으로 돌아갑니다. 이탈률이 높아지는 직접적인 원인입니다.

**둘째, 링크를 공유할 수 없습니다.** 팀원에게 특정 검색 결과를 공유하려면 URL을 복사해 전달합니다. `useState`로만 관리하면 URL이 항상 `/board`여서 어떤 조건으로 보고 있는지 전달할 방법이 없습니다.

**셋째, 브라우저 뒤로 가기가 어색합니다.** 검색 → 상세 페이지 → 뒤로 가기를 했을 때 검색 조건이 유지되어야 합니다. URL에 상태가 없으면 이전 필터 조건을 복원할 수 없습니다.

상태의 성격에 따라 관리 위치를 구분하면 다음과 같습니다.

| 상태 종류 | 예시 | 관리 위치 |
|----------|------|----------|
| URL 상태 | 검색어, 카테고리, 정렬, 페이지 번호 | URL 쿼리 파라미터 |
| 전역 상태 | 로그인 유저 정보, 장바구니 | Context, Zustand, Jotai |
| 서버 상태 | API 응답 데이터, 로딩/에러 | TanStack Query |
| 로컬 상태 | 모달 열기/닫기, 입력 포커스 | useState |

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
// 필터 조건을 useState로만 관리하는 경우
// 새로고침, 링크 공유, 뒤로 가기 모두 동작하지 않습니다.

'use client';

import { useState, useEffect } from 'react';

export default function BoardPage() {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('전체');
  const [page, setPage] = useState(1);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetchPosts({ keyword, category, page }).then(setPosts);
  }, [keyword, category, page]);

  return (
    <>
      <input
        value={keyword}
        onChange={(e) => {
          setKeyword(e.target.value);
          setPage(1); // 검색어 변경 시 페이지 초기화 — 매번 직접 처리해야 합니다.
        }}
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option>전체</option>
        <option>공지</option>
        <option>자유</option>
      </select>
      {/* URL: /board — 어떤 조건으로 보고 있는지 전혀 알 수 없습니다. */}
    </>
  );
}
```

---

#### 올바른 사용법 (Good Example)

```tsx
// app/board/page.tsx — Server Component
// URL 쿼리 파라미터를 searchParams prop으로 받아 서버에서 데이터를 fetching합니다.
// URL: /board?keyword=react&category=공지&page=2

interface BoardPageProps {
  searchParams: Promise<{
    keyword?: string;
    category?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function BoardPage({ searchParams }: BoardPageProps) {
  const { keyword = '', category = '전체', sort = 'latest', page = '1' } =
    await searchParams;

  const posts = await fetchPosts({
    keyword,
    category,
    sort,
    page: Number(page),
  });

  return (
    <>
      {/* 필터 UI는 Client Component로 분리합니다. */}
      <BoardFilter keyword={keyword} category={category} sort={sort} />
      <PostList posts={posts} />
      <Pagination current={Number(page)} />
    </>
  );
}
```

```tsx
// components/BoardFilter.tsx — Client Component
// URL을 직접 변경해 필터 조건을 관리합니다.

'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition } from 'react';

interface BoardFilterProps {
  keyword: string;
  category: string;
  sort: string;
}

export default function BoardFilter({ keyword, category, sort }: BoardFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // 현재 쿼리 파라미터를 유지하면서 특정 키만 업데이트하는 헬퍼
  const updateQuery = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 검색어가 바뀌면 페이지를 1로 초기화합니다.
    updateQuery({ keyword: e.target.value, page: '1' });
  };

  const handleCategoryChange = (value: string) => {
    updateQuery({ category: value, page: '1' });
  };

  const handleSortChange = (value: string) => {
    updateQuery({ sort: value, page: '1' });
  };

  return (
    <div style={{ opacity: isPending ? 0.6 : 1, transition: 'opacity 0.2s' }}>
      <input
        defaultValue={keyword}
        onChange={handleKeywordChange}
        placeholder="검색어를 입력하세요"
      />

      <select
        value={category}
        onChange={(e) => handleCategoryChange(e.target.value)}
      >
        {['전체', '공지', '자유', '질문'].map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      <select
        value={sort}
        onChange={(e) => handleSortChange(e.target.value)}
      >
        <option value="latest">최신순</option>
        <option value="popular">인기순</option>
        <option value="comments">댓글순</option>
      </select>
    </div>
  );
}
```

```tsx
// components/Pagination.tsx — 페이지 번호도 URL로 관리합니다.

'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export default function Pagination({ current, total }: { current: number; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div>
      {Array.from({ length: total }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => goToPage(page)}
          style={{ fontWeight: page === current ? 700 : 400 }}
        >
          {page}
        </button>
      ))}
    </div>
  );
}
```

`URLSearchParams`를 활용하면 기존 쿼리 파라미터를 유지하면서 특정 키만 수정할 수 있습니다. 검색어를 바꿀 때 카테고리와 정렬 조건이 사라지지 않는 이유입니다. `useTransition`을 함께 쓰면 라우팅 중에도 UI가 블로킹되지 않습니다.

---

#### 정리 (Conclusion)

게시판의 필터 조건은 URL 쿼리 파라미터로 관리하는 것이 원칙입니다. URL이 상태가 되므로 새로고침, 링크 공유, 뒤로 가기가 자동으로 해결됩니다. Next.js App Router에서는 `searchParams` prop으로 서버에서 초기값을 받고, `useSearchParams` + `useRouter`로 클라이언트에서 URL을 업데이트합니다. `URLSearchParams`로 기존 파라미터를 유지하면서 필요한 키만 덮어쓰는 패턴을 익혀두면 대부분의 필터 UI를 깔끔하게 구현할 수 있습니다.

| 구현 포인트 | 방법 |
|-----------|------|
| 서버에서 초기 필터값 읽기 | `searchParams` prop (Server Component) |
| 클라이언트에서 URL 업데이트 | `useSearchParams` + `useRouter` |
| 기존 파라미터 유지하며 특정 키만 변경 | `new URLSearchParams(searchParams.toString())` |
| 필터 변경 시 페이지 초기화 | `page: '1'` 을 함께 `set` |
| 라우팅 중 UI 블로킹 방지 | `startTransition`으로 감싸기 |

---

### 추가 학습 자료 공유합니다.

- [Next.js 공식 문서 — useSearchParams](https://nextjs.org/docs/app/api-reference/functions/use-search-params)
- [Next.js 공식 문서 — searchParams prop](https://nextjs.org/docs/app/api-reference/file-conventions/page#searchparams-optional)

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
| `{{TITLE}}` | 게시판 검색 필터 조건은 왜 URL로 관리해야 하나요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | Next.js, URL State, useSearchParams, 검색 필터, URLSearchParams |
| `{{DATE}}` | 2026-04-17 |
| `{{SLUG}}` | url-state-management |
| `{{SUMMARY}}` | 검색어, 카테고리, 페이지 번호는 URL 쿼리 파라미터로 관리해야 새로고침, 링크 공유, 브라우저 뒤로 가기가 자연스럽게 동작합니다. Next.js에서는 searchParams prop과 useSearchParams + useRouter를 조합합니다. |
| `{{WHY}}` | useState로만 관리하면 새로고침 시 필터가 초기화되고, 링크 공유가 불가능하며, 뒤로 가기로 이전 조건을 복원할 수 없습니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
