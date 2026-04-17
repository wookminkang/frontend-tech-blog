# React에서 useTransition은 언제 사용하나요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

`useTransition`은 상태 업데이트의 우선순위를 낮춰 UI가 멈추지 않도록 하는 React 18 훅입니다. `startTransition`으로 감싼 상태 업데이트는 긴급하지 않은 작업으로 표시되어, 입력이나 클릭처럼 즉각적인 반응이 필요한 업데이트가 먼저 처리됩니다. 탭 전환, 검색 결과 렌더링, 목록 필터링처럼 무거운 리렌더링이 발생하는 상황에서 체감 성능을 크게 개선할 수 있습니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

React는 기본적으로 모든 상태 업데이트를 동일한 우선순위로 처리합니다. 렌더링이 오래 걸리는 컴포넌트가 있을 때 다른 모든 상호작용이 그 렌더링이 끝날 때까지 블로킹됩니다.

**대표적인 상황이 탭 전환입니다.** 탭을 클릭하면 새 탭의 콘텐츠를 렌더링해야 합니다. 콘텐츠가 무거우면 렌더링이 끝날 때까지 탭 버튼의 활성화 표시조차 바뀌지 않습니다. 사용자 입장에서는 버튼이 반응이 없는 것처럼 느껴집니다.

**검색 입력도 마찬가지입니다.** 입력 값이 바뀔 때마다 수백 개의 결과를 필터링해 리렌더링하면, 타이핑할 때마다 버벅임이 생깁니다.

React 18 이전에는 이 문제를 `setTimeout`으로 렌더링을 뒤로 미루거나, `debounce`로 업데이트 빈도를 줄이는 방식으로 우회했습니다. `useTransition`은 이 우회 없이 React 스케줄러 레벨에서 우선순위를 직접 제어합니다.

| 업데이트 종류 | 예시 | 처리 방식 |
|-------------|------|----------|
| 긴급 (Urgent) | 타이핑, 클릭, 드래그 | 즉시 처리 |
| 전환 (Transition) | 탭 전환, 검색 결과, 목록 필터 | 긴급 업데이트 처리 후 실행 |

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
// 탭 전환 시 무거운 렌더링이 UI를 블로킹하는 경우
// 탭 클릭 → 활성 탭 표시 → 콘텐츠 렌더링이 모두 동일한 우선순위로 처리됩니다.

function Tabs() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <>
      <button onClick={() => setActiveTab('home')}>홈</button>
      <button onClick={() => setActiveTab('posts')}>게시글</button>

      {/* PostsTab이 무거운 컴포넌트라면 클릭 후 탭 버튼 자체가 굳어버립니다. */}
      {activeTab === 'posts' && <PostsTab />}
    </>
  );
}
```

```tsx
// setTimeout으로 렌더링을 뒤로 미루는 우회 방법
// 지연 시간이 임의적이고, React 상태와 타이머가 분리되어 관리가 어렵습니다.

function Tabs() {
  const [activeTab, setActiveTab] = useState('home');
  const [displayTab, setDisplayTab] = useState('home');

  const handleClick = (tab: string) => {
    setActiveTab(tab);         // 탭 버튼 활성화는 즉시
    setTimeout(() => {
      setDisplayTab(tab);      // 콘텐츠 렌더링은 50ms 뒤
    }, 50);
  };

  return (/* ... */);
}
```

---

#### 올바른 사용법 (Good Example)

```tsx
// useTransition으로 탭 콘텐츠 렌더링 우선순위를 낮춥니다.

import { useState, useTransition } from 'react';

function Tabs() {
  const [activeTab, setActiveTab] = useState('home');
  const [isPending, startTransition] = useTransition();

  const handleTabClick = (tab: string) => {
    startTransition(() => {
      // 이 안의 상태 업데이트는 우선순위가 낮아집니다.
      // 탭 버튼 클릭 반응(리플 효과 등)은 즉시 처리되고,
      // PostsTab 렌더링은 브라우저가 여유 있을 때 처리됩니다.
      setActiveTab(tab);
    });
  };

  return (
    <>
      <div style={{ display: 'flex', gap: 8 }}>
        {['home', 'posts', 'settings'].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            style={{
              fontWeight: activeTab === tab ? 700 : 400,
              opacity: isPending ? 0.6 : 1, // 전환 중 시각적 피드백
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* isPending이 true인 동안 이전 탭 콘텐츠를 유지합니다. */}
      <div style={{ opacity: isPending ? 0.5 : 1 }}>
        {activeTab === 'home' && <HomeTab />}
        {activeTab === 'posts' && <PostsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </>
  );
}
```

```tsx
// 검색 입력 — 타이핑은 즉시, 결과 렌더링은 전환으로 처리합니다.

import { useState, useTransition } from 'react';

function SearchPage({ items }: { items: string[] }) {
  const [query, setQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // input 값 업데이트는 startTransition 밖 — 즉시 처리됩니다.
    setQuery(value);

    // 필터링 결과 업데이트는 startTransition 안 — 우선순위가 낮아집니다.
    startTransition(() => {
      const result = items.filter((item) =>
        item.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredItems(result);
    });
  };

  return (
    <>
      <input value={query} onChange={handleChange} placeholder="검색..." />
      {isPending && <span>검색 중...</span>}
      <ul>
        {filteredItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </>
  );
}
```

`isPending`은 전환이 진행 중일 때 `true`가 됩니다. 이를 활용해 로딩 스피너나 opacity 변화처럼 사용자에게 "처리 중"임을 알리는 피드백을 줄 수 있습니다.

---

#### 정리 (Conclusion)

`useTransition`은 무거운 렌더링으로 UI가 멈추는 문제를 해결하는 훅입니다. `startTransition`으로 감싼 업데이트는 긴급 업데이트가 끝난 뒤 처리되어, 사용자가 느끼는 반응성이 유지됩니다. `isPending`으로 전환 중 상태를 감지해 시각적 피드백도 함께 제공할 수 있습니다.

| 상황 | useTransition 적용 여부 |
|------|----------------------|
| 탭 전환으로 무거운 컴포넌트 교체 | 적용 |
| 입력값 기반 실시간 목록 필터링 | 적용 |
| 서버 요청 (fetch, API 호출) | 미적용 — `useDeferredValue` 또는 TanStack Query 사용 |
| 간단한 토글, 모달 열기/닫기 | 미적용 — 렌더링 비용이 낮으면 효과 없음 |

---

### 추가 학습 자료 공유합니다.

- [React 공식 문서 — useTransition](https://react.dev/reference/react/useTransition)
- [React 공식 문서 — Transitions](https://react.dev/blog/2022/03/29/react-v18#new-feature-transitions)

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
| `{{TITLE}}` | React에서 useTransition은 언제 사용하나요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | React, useTransition, 성능 최적화, React 18, isPending |
| `{{DATE}}` | 2026-04-17 |
| `{{SLUG}}` | react-use-transition |
| `{{SUMMARY}}` | `startTransition`으로 감싼 상태 업데이트는 우선순위가 낮아져 긴급 UI 반응을 먼저 처리합니다. 탭 전환, 검색 필터링처럼 무거운 렌더링이 UI를 블로킹하는 상황에서 사용합니다. |
| `{{WHY}}` | React는 기본적으로 모든 상태 업데이트를 동일한 우선순위로 처리해 무거운 렌더링이 다른 모든 상호작용을 블로킹합니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
