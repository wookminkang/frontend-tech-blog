# React에서 useRef는 언제 사용하나요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

`useRef`는 두 가지 용도로 사용합니다. 첫째, DOM 요소에 직접 접근해야 할 때(포커스, 스크롤, 크기 측정 등), 둘째, 리렌더링을 발생시키지 않고 값을 유지해야 할 때(타이머 ID, 이전 값 추적 등)입니다. `.current`를 변경해도 컴포넌트가 리렌더링되지 않는 것이 `useState`와의 핵심 차이입니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

React에서 값을 저장하는 방법은 크게 세 가지입니다.

- **`useState`**: 값이 바뀌면 리렌더링이 발생합니다. 화면에 표시되어야 하는 값에 사용합니다.
- **`useRef`**: `.current`를 바꿔도 리렌더링이 발생하지 않습니다. 렌더링 결과에 영향을 주지 않는 값에 사용합니다.
- **일반 변수**: 컴포넌트가 리렌더링될 때마다 초기화됩니다. 렌더링 간 값을 유지할 수 없습니다.

혼동이 생기는 경우는 두 가지입니다.

첫째, 화면에 표시되어야 하는 값을 `useRef`에 저장하는 경우입니다. `.current`를 바꿔도 리렌더링이 일어나지 않아 화면이 업데이트되지 않습니다.

둘째, 리렌더링이 필요 없는 값(타이머 ID, 이전 값 등)을 `useState`에 저장하는 경우입니다. 값이 바뀔 때마다 불필요한 리렌더링이 발생합니다.

`useRef`가 필요한 대표적인 상황은 다음과 같습니다.

- **DOM 접근**: 특정 입력 필드에 포커스 주기, 스크롤 위치 조작, 요소의 크기나 위치 측정
- **타이머 ID 보관**: `setTimeout`, `setInterval`의 반환값을 저장해 나중에 취소할 때
- **이전 값 추적**: 직전 렌더링의 props나 state 값을 기억할 때
- **렌더링 간 플래그 유지**: 최초 렌더링 여부, 특정 동작의 실행 여부 등

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
import { useState, useRef, useEffect } from 'react';

export default function Timer() {
  const [isRunning, setIsRunning] = useState(false);

  // 타이머 ID는 화면에 표시되지 않으므로 useState가 아닌 useRef에 저장해야 합니다.
  // setInterval ID가 바뀔 때마다 불필요한 리렌더링이 발생합니다.
  const [timerId, setTimerId] = useState<number | null>(null);

  const start = () => {
    const id = window.setInterval(() => {
      console.log('tick');
    }, 1000);
    setTimerId(id); // 리렌더링 발생 — 불필요합니다.
    setIsRunning(true);
  };

  const stop = () => {
    if (timerId !== null) {
      window.clearInterval(timerId);
      setTimerId(null); // 리렌더링 발생 — 불필요합니다.
    }
    setIsRunning(false);
  };

  return (
    <div>
      <button onClick={start} disabled={isRunning}>시작</button>
      <button onClick={stop} disabled={!isRunning}>정지</button>
    </div>
  );
}
```

```tsx
// useRef에 저장한 값을 JSX에서 직접 렌더링하는 경우
// ref.current를 바꿔도 리렌더링이 발생하지 않아 화면이 업데이트되지 않습니다.

export default function Counter() {
  const countRef = useRef(0);

  const increment = () => {
    countRef.current += 1; // 화면이 업데이트되지 않습니다.
  };

  return (
    <div>
      {/* countRef.current가 바뀌어도 이 값은 갱신되지 않습니다. */}
      <p>{countRef.current}</p>
      <button onClick={increment}>증가</button>
    </div>
  );
}
```

---

#### 올바른 사용법 (Good Example)

```tsx
import { useRef } from 'react';

// DOM 접근 — 버튼 클릭 시 input에 포커스를 줍니다.
export default function SearchForm() {
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <div>
      <input ref={inputRef} type="text" placeholder="검색어를 입력하세요" />
      <button onClick={focusInput}>검색창 포커스</button>
    </div>
  );
}
```

```tsx
import { useState, useRef } from 'react';

// 타이머 ID 보관 — 화면에 표시할 필요 없으므로 useRef를 사용합니다.
export default function Timer() {
  const [isRunning, setIsRunning] = useState(false);
  const timerIdRef = useRef<number | null>(null); // 리렌더링 없이 값 유지

  const start = () => {
    timerIdRef.current = window.setInterval(() => {
      console.log('tick');
    }, 1000);
    setIsRunning(true); // 버튼 상태 업데이트만 리렌더링 발생
  };

  const stop = () => {
    if (timerIdRef.current !== null) {
      window.clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
    setIsRunning(false);
  };

  return (
    <div>
      <button onClick={start} disabled={isRunning}>시작</button>
      <button onClick={stop} disabled={!isRunning}>정지</button>
    </div>
  );
}
```

```tsx
import { useState, useRef, useEffect } from 'react';

// 이전 값 추적 — 직전 렌더링의 count 값을 기억합니다.
export default function PreviousValue() {
  const [count, setCount] = useState(0);
  const prevCountRef = useRef<number>(0);

  useEffect(() => {
    // 렌더링이 완료된 후 이전 값을 업데이트합니다.
    prevCountRef.current = count;
  });

  return (
    <div>
      <p>현재: {count}</p>
      <p>이전: {prevCountRef.current}</p>
      <button onClick={() => setCount((c) => c + 1)}>증가</button>
    </div>
  );
}
```

---

#### 정리 (Conclusion)

| 구분 | `useState` | `useRef` |
|------|-----------|---------|
| 값 변경 시 리렌더링 | O | X |
| 렌더링 간 값 유지 | O | O |
| 용도 | 화면에 표시되는 값 | DOM 접근, 렌더링과 무관한 값 |
| 값 읽기 | 직접 사용 | `.current`로 접근 |

값이 바뀔 때 화면이 업데이트되어야 한다면 `useState`, 화면과 무관하게 값만 유지하면 된다면 `useRef`를 선택하세요.

---

### 추가 학습 자료 공유합니다.

- [React 공식 문서 — useRef](https://react.dev/reference/react/useRef)
- [React 공식 문서 — Referencing Values with Refs](https://react.dev/learn/referencing-values-with-refs)

---

### [FOOTER]

```
로고: 매일매일
Copyright © 2026 매일매일. All rights reserved.

Contact: kangmu238@gmail.com
Socials: Github
```

---

## 키워드 변수 정의

| 키워드 | 값 |
|--------|----|
| `{{TITLE}}` | React에서 useRef는 언제 사용하나요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | React, useRef, DOM, useState, 훅 |
| `{{DATE}}` | 2026-04-15 |
| `{{SLUG}}` | react-useref |
| `{{SUMMARY}}` | useRef는 DOM 접근과 리렌더링 없이 값을 유지할 때 사용합니다. .current를 변경해도 리렌더링이 발생하지 않습니다. |
| `{{WHY}}` | 렌더링과 무관한 값을 useState에 저장하면 불필요한 리렌더링이, useRef에 표시할 값을 저장하면 화면 갱신이 안 됩니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
