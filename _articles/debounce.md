# 디바운스(debounce)는 무엇이고 언제 사용하나요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

디바운스(debounce)는 연속으로 발생하는 이벤트를 일정 시간 동안 묶어서 마지막 한 번만 실행하도록 제어하는 기법입니다. 사용자가 입력을 멈춘 뒤 일정 시간이 지나야 함수가 실행됩니다. 검색창, 자동완성, 창 리사이즈처럼 짧은 시간에 이벤트가 폭발적으로 발생하는 상황에서 불필요한 API 호출과 연산 낭비를 막아줍니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

검색창에 "zustand"를 입력할 때 키보드를 한 번 누를 때마다 `onChange` 이벤트가 발생합니다. 총 7글자를 입력하면 7번의 API 호출이 발생하고, 빠르게 타이핑하면 거의 동시에 요청이 쏟아집니다. 이전 요청보다 나중 요청의 응답이 먼저 도착하면 검색 결과가 뒤섞이는 경쟁 조건(race condition)도 생깁니다.

디바운스는 이 문제를 타이머로 해결합니다. 이벤트가 발생할 때마다 이전 타이머를 취소하고 새 타이머를 시작합니다. 타이머가 끝날 때까지 새 이벤트가 없으면 그때 함수를 실행합니다. 사용자가 입력을 멈춘 시점에만 API를 호출하게 됩니다.

스로틀(throttle)과 자주 혼동되는데, 두 기법은 목적이 다릅니다.

| 기법 | 동작 방식 | 적합한 상황 |
|------|-----------|-------------|
| 디바운스 | 마지막 이벤트 기준으로 일정 시간 후 1회 실행 | 검색, 자동완성, 폼 유효성 검사 |
| 스로틀 | 일정 시간마다 최대 1회 실행 | 스크롤 이벤트, 마우스 움직임 추적 |

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
function SearchInput() {
  const [query, setQuery] = useState('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    // 키 입력마다 즉시 API 호출
    fetchSearchResults(value);
  }

  return <input value={query} onChange={handleChange} placeholder="검색어를 입력하세요" />;
}
```

"zustand"를 입력하면 `z`, `zu`, `zus`, `zust`, `zusta`, `zustan`, `zustand` 순서로 7번의 API 호출이 발생합니다. 서버 부하가 늘고, 응답 순서가 뒤바뀌면 이전 검색어의 결과가 화면에 남을 수 있습니다.

---

#### 올바른 사용법 (Good Example)

```tsx
import { useState, useEffect, useRef } from 'react';

function SearchInput() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    // 새 입력이 들어오면 이전 타이머 취소
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery) return;
    fetchSearchResults(debouncedQuery);
  }, [debouncedQuery]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="검색어를 입력하세요"
    />
  );
}
```

`query`가 바뀔 때마다 타이머를 초기화합니다. 300ms 안에 새 입력이 들어오면 이전 타이머를 `clearTimeout`으로 취소하고 다시 시작합니다. 사용자가 입력을 멈춘 뒤 300ms가 지나야 `debouncedQuery`가 업데이트되고, 그때 API 호출이 한 번만 발생합니다.

**커스텀 훅으로 분리하면 재사용이 편해집니다.**

```tsx
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// 사용처
function SearchInput() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery) return;
    fetchSearchResults(debouncedQuery);
  }, [debouncedQuery]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="검색어를 입력하세요"
    />
  );
}
```

`useDebounce` 훅은 어떤 값이든 받아서 지연된 값을 반환합니다. 검색창 외에도 폼 유효성 검사, 리사이즈 핸들러 등 디바운스가 필요한 곳이라면 어디서든 재사용할 수 있습니다.

---

#### 정리 (Conclusion)

디바운스는 연속 이벤트 중 마지막 이벤트만 처리해 불필요한 호출을 줄이는 패턴입니다. React에서는 `useEffect`의 클린업 함수(`clearTimeout`)를 활용해 구현하는 것이 기본입니다.

| 상황 | 권장 딜레이 |
|------|-------------|
| 검색 API 호출 | 300ms |
| 폼 유효성 검사 | 500ms |
| 창 리사이즈 처리 | 200ms |
| 자동 저장 | 1000ms 이상 |

딜레이 값은 UX와 서버 부하 사이의 균형입니다. 너무 짧으면 효과가 없고, 너무 길면 반응이 느리게 느껴집니다. 검색 자동완성은 200~300ms가 일반적으로 적절합니다.

---

### 추가 학습 자료 공유합니다.

- [MDN — setTimeout](https://developer.mozilla.org/ko/docs/Web/API/setTimeout)
- [Lodash — debounce](https://lodash.com/docs/#debounce)

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
| `{{TITLE}}` | 디바운스(debounce)는 무엇이고 언제 사용하나요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | React, debounce, 디바운스, 성능최적화, 이벤트제어 |
| `{{DATE}}` | 2026-04-18 |
| `{{SLUG}}` | debounce |
| `{{SUMMARY}}` | 디바운스는 연속 이벤트를 묶어 마지막 한 번만 실행하는 기법입니다. React에서는 useEffect의 clearTimeout 클린업으로 구현하고, useDebounce 커스텀 훅으로 재사용성을 높일 수 있습니다. |
| `{{WHY}}` | 키 입력마다 API를 호출하면 서버 부하와 경쟁 조건(race condition)이 발생합니다. 디바운스는 입력이 멈춘 시점에만 호출이 발생하도록 제어합니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
