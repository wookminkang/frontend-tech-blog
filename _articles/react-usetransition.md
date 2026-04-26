# 무거운 상태 업데이트 때문에 UI가 멈추는 현상, useTransition으로 어떻게 해결하나요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

`useTransition`은 React 18에서 도입된 훅으로, 특정 상태 업데이트를 "덜 급한 업데이트"로 표시할 수 있게 해줍니다.
React는 이렇게 표시된 업데이트를 잠시 미뤄두고, 버튼 클릭이나 텍스트 입력처럼 사용자가 즉각적인 반응을 기대하는 작업을 먼저 처리합니다.
결과적으로 무거운 렌더링이 진행되는 동안에도 UI가 굳지 않고 반응성을 유지할 수 있습니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

React는 기본적으로 상태가 바뀌면 즉시 렌더링을 시작합니다. 이때 렌더링할 컴포넌트가 많거나 계산이 무거우면, 그 렌더링이 끝날 때까지 다른 어떤 작업도 처리하지 못합니다.

예를 들어 검색창에 글자를 입력할 때마다 10,000개 항목을 필터링해야 한다면, 그 렌더링이 완료될 때까지 입력창의 커서조차 움직이지 않는 현상이 발생합니다.

이것이 "UI가 굳는(blocking)" 현상입니다.

`useTransition`은 이 문제를 해결하기 위해 상태 업데이트에 우선순위를 부여합니다.

| 업데이트 종류 | 예시 | 처리 방식 |
|-------------|------|----------|
| 긴급 (Urgent) | 타이핑, 클릭, 드래그 | 즉시 처리 |
| 전환 (Transition) | 검색 결과 렌더링, 탭 전환, 목록 필터 | 긴급 업데이트 처리 후 실행 |

`startTransition`으로 감싼 상태 업데이트는 전환 업데이트로 분류되어, 급한 업데이트가 들어오면 잠시 중단되고 급한 업데이트를 먼저 처리합니다.

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
import { useState } from "react";

const ITEMS = Array.from({ length: 10000 }, (_, i) => `항목 ${i + 1}`);

function SlowList({ query }: { query: string }) {
  const filtered = ITEMS.filter((item) => item.includes(query));
  return (
    <ul>
      {filtered.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState("");

  return (
    <>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)} // 타이핑 즉시 무거운 렌더링 시작
        placeholder="검색어를 입력하세요"
      />
      <SlowList query={query} />
    </>
  );
}
```

`setQuery`가 호출되는 순간 React는 즉시 `SlowList` 렌더링을 시작합니다. 10,000개 항목 필터링이 끝나기 전까지는 입력창도 반응하지 않아 타이핑이 버벅이는 현상이 발생합니다.

---

#### 올바른 사용법 (Good Example)

```tsx
import { useState, useTransition } from "react";

const ITEMS = Array.from({ length: 10000 }, (_, i) => `항목 ${i + 1}`);

function SlowList({ query }: { query: string }) {
  const filtered = ITEMS.filter((item) => item.includes(query));
  return (
    <ul>
      {filtered.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function SearchPage() {
  const [inputValue, setInputValue] = useState(""); // 입력창에 즉시 반영
  const [query, setQuery] = useState("");           // 리스트에 전달되는 값
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value); // 급한 업데이트 — 입력창 즉시 반응

    startTransition(() => {
      setQuery(e.target.value); // 전환 업데이트 — 리스트는 여유 있을 때 렌더링
    });
  }

  return (
    <>
      <input
        value={inputValue}
        onChange={handleChange}
        placeholder="검색어를 입력하세요"
      />
      {isPending && <p>목록을 불러오는 중...</p>}
      <SlowList query={query} />
    </>
  );
}
```

상태를 두 개로 분리한 것이 핵심입니다.

- `inputValue`: 입력창에 즉시 반영되어야 하는 값 — `startTransition` 밖에서 업데이트합니다.
- `query`: `SlowList`에 전달되는 값 — `startTransition` 안에서 업데이트합니다.

`isPending`이 `true`인 동안 로딩 문구를 표시해 사용자에게 "처리 중"임을 알리는 피드백도 제공할 수 있습니다.

---

#### 정리 (Conclusion)

`useTransition`은 무거운 렌더링으로 UI가 멈추는 문제를 해결하는 훅입니다. `startTransition`으로 감싼 업데이트는 긴급 업데이트가 끝난 뒤 처리되어 사용자가 느끼는 반응성이 유지됩니다.

| 상황 | useTransition 적용 여부 |
|------|----------------------|
| 입력값 기반 실시간 목록 필터링 | 적용 |
| 탭 전환으로 무거운 컴포넌트 교체 | 적용 |
| 서버 요청 (fetch, API 호출) | 미적용 — `useDeferredValue` 또는 TanStack Query 사용 |
| 간단한 토글, 모달 열기/닫기 | 미적용 — 렌더링 비용이 낮으면 효과 없음 |

---

### 추가 학습 자료 공유합니다.

- [React 공식 문서 — useTransition](https://react.dev/reference/react/useTransition)
- [React 공식 문서 — Keeping the UI Responsive](https://react.dev/learn/keeping-the-ui-responsive)

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
| `{{TITLE}}` | 무거운 상태 업데이트 때문에 UI가 멈추는 현상, useTransition으로 어떻게 해결하나요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | React, Hook, useTransition, 성능 최적화, 동시성 |
| `{{DATE}}` | 2026-04-27 |
| `{{SLUG}}` | react-usetransition |
| `{{SUMMARY}}` | `startTransition`으로 감싼 상태 업데이트는 우선순위가 낮아져 긴급 UI 반응을 먼저 처리합니다. 검색 필터링, 탭 전환처럼 무거운 렌더링이 UI를 블로킹하는 상황에서 사용합니다. |
| `{{WHY}}` | React는 기본적으로 모든 상태 업데이트를 동일한 우선순위로 처리해 무거운 렌더링이 다른 상호작용을 블로킹합니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
