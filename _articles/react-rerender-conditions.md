# React 컴포넌트는 어떤 조건에서 리렌더링되나요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

React 컴포넌트는 네 가지 조건에서 리렌더링됩니다. 자신의 상태가 바뀔 때, 부모 컴포넌트가 리렌더링될 때, 구독 중인 Context 값이 바뀔 때, 그리고 사용 중인 커스텀 훅 내부 상태가 바뀔 때입니다. 이 조건들을 정확히 이해해야 불필요한 리렌더링을 찾아 제거할 수 있습니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

리렌더링이 일어나는 조건을 알지 못하면, 컴포넌트가 예상보다 훨씬 자주 리렌더링되는 이유를 파악하기 어렵습니다. 각 조건을 구체적으로 살펴봅니다.

**1. 자신의 상태(state)가 바뀔 때**

`useState`나 `useReducer`로 관리하는 상태가 변경되면 해당 컴포넌트가 리렌더링됩니다. 단, 새 값이 이전 값과 참조가 같으면 리렌더링이 발생하지 않습니다(`Object.is` 비교).

**2. 부모 컴포넌트가 리렌더링될 때**

부모가 리렌더링되면 자식도 기본적으로 함께 리렌더링됩니다. 자식에게 전달되는 props가 전혀 바뀌지 않았더라도 마찬가지입니다. `React.memo`로 감싸야만 props 변경 여부를 비교해 불필요한 리렌더링을 막을 수 있습니다.

**3. 구독 중인 Context 값이 바뀔 때**

`useContext`로 Context를 구독하는 컴포넌트는 Provider의 value가 바뀔 때마다 리렌더링됩니다. 컴포넌트가 Context의 일부 값만 사용하더라도 value 객체의 참조가 바뀌면 전체가 리렌더링됩니다.

**4. 사용 중인 커스텀 훅 내부 상태가 바뀔 때**

커스텀 훅 내부에서 `useState`나 `useReducer`를 사용하면, 훅을 호출한 컴포넌트가 그 상태의 소유자가 됩니다. 훅 내부 상태가 바뀌면 사용하는 컴포넌트가 리렌더링됩니다.

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
import { useState, createContext, useContext } from 'react';

// Context value를 렌더링마다 새 객체로 만들어 전달합니다.
// Provider 아래 모든 구독 컴포넌트가 매번 리렌더링됩니다.
const UserContext = createContext(null);

export default function App() {
  const [count, setCount] = useState(0);
  const [user, setUser] = useState({ name: 'Minwook' });

  return (
    // count가 바뀔 때마다 { user, setUser }는 새 객체 참조가 됩니다.
    // UserContext를 구독하는 모든 컴포넌트가 리렌더링됩니다.
    <UserContext.Provider value={{ user, setUser }}>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      <Profile />
      <Settings />
    </UserContext.Provider>
  );
}

function Profile() {
  const { user } = useContext(UserContext);
  // count가 바뀌는 것과 무관하지만, Context value 참조가 바뀌어 리렌더링됩니다.
  return <p>{user.name}</p>;
}

function Settings() {
  const { setUser } = useContext(UserContext);
  return <button onClick={() => setUser({ name: 'New' })}>변경</button>;
}
```

```tsx
// 부모가 리렌더링될 때 자식도 불필요하게 리렌더링되는 경우

export default function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      {/* count와 전혀 무관한 HeavyChild도 매번 리렌더링됩니다. */}
      <HeavyChild />
    </div>
  );
}

function HeavyChild() {
  // 렌더링 비용이 큰 컴포넌트
  return <div>복잡한 UI</div>;
}
```

`App`의 `count`가 바뀔 때마다 `value` 객체가 새로 만들어져 `Profile`과 `Settings` 모두 불필요하게 리렌더링됩니다. `HeavyChild`는 props가 없는데도 부모 리렌더링에 따라 함께 리렌더링됩니다.

---

#### 올바른 사용법 (Good Example)

```tsx
import { useState, createContext, useContext, useMemo, memo } from 'react';

const UserContext = createContext(null);

export default function App() {
  const [count, setCount] = useState(0);
  const [user, setUser] = useState({ name: 'Minwook' });

  // useMemo로 value 객체의 참조를 고정합니다.
  // user나 setUser가 바뀔 때만 새 참조가 만들어집니다.
  const contextValue = useMemo(() => ({ user, setUser }), [user, setUser]);

  return (
    <UserContext.Provider value={contextValue}>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      <Profile />
      <Settings />
    </UserContext.Provider>
  );
}

function Profile() {
  const { user } = useContext(UserContext);
  // count가 바뀌어도 contextValue 참조가 유지되므로 리렌더링되지 않습니다.
  return <p>{user.name}</p>;
}

function Settings() {
  const { setUser } = useContext(UserContext);
  return <button onClick={() => setUser({ name: 'New' })}>변경</button>;
}
```

```tsx
// 방법 1 — 상태를 자식 컴포넌트 안으로 내리기 (State Colocation)
// count 상태를 실제로 사용하는 곳 가까이 내립니다.

function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}

export default function Parent() {
  return (
    <div>
      <Counter />
      {/* Counter가 리렌더링되어도 HeavyChild는 리렌더링되지 않습니다. */}
      <HeavyChild />
    </div>
  );
}

// 방법 2 — children prop으로 렌더링 범위 분리하기
// children은 부모가 리렌더링되어도 다시 만들어지지 않습니다.

function CounterWrapper({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>{count}</button>
      {children}
    </div>
  );
}

export default function ParentWithChildren() {
  return (
    <CounterWrapper>
      {/* HeavyChild는 CounterWrapper가 리렌더링되어도 영향을 받지 않습니다. */}
      <HeavyChild />
    </CounterWrapper>
  );
}

const HeavyChild = memo(function HeavyChild() {
  return <div>복잡한 UI</div>;
});
```

상태를 실제로 사용하는 컴포넌트 안으로 내리거나, `children` prop으로 렌더링 범위를 분리하는 것이 `React.memo`보다 먼저 시도해야 할 방법입니다.

---

#### 정리 (Conclusion)

| 리렌더링 조건 | 발생 시점 | 방지 방법 |
|-------------|---------|---------|
| 자신의 상태 변경 | `setState` 호출 후 참조가 바뀔 때 | 상태를 필요한 곳에만 유지 |
| 부모 리렌더링 | 부모 컴포넌트가 리렌더링될 때마다 | `React.memo`, 상태 내리기, children 분리 |
| Context 값 변경 | Provider의 value 참조가 바뀔 때 | value를 `useMemo`로 안정화 |
| 커스텀 훅 상태 변경 | 훅 내부 상태가 바뀔 때 | 훅 구독 범위를 최소화 |

리렌더링 자체는 나쁜 것이 아닙니다. React는 빠른 리렌더링을 위해 설계되어 있습니다. 문제는 실제로 UI가 바뀌지 않는데 불필요하게 발생하는 리렌더링입니다. React DevTools의 Profiler로 먼저 측정한 뒤, 병목이 확인된 컴포넌트에만 최적화를 적용하세요.

---

### 추가 학습 자료 공유합니다.

- [React 공식 문서 — Rendering](https://react.dev/learn/render-and-commit)
- [React 공식 문서 — Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context)

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
| `{{TITLE}}` | React 컴포넌트는 어떤 조건에서 리렌더링되나요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | React, 리렌더링, re-render, useState, Context, 성능 최적화 |
| `{{DATE}}` | 2026-04-15 |
| `{{SLUG}}` | react-rerender-conditions |
| `{{SUMMARY}}` | React 컴포넌트는 상태 변경, 부모 리렌더링, Context 변경, 커스텀 훅 상태 변경의 네 가지 조건에서 리렌더링됩니다. |
| `{{WHY}}` | 리렌더링 조건을 모르면 컴포넌트가 예상보다 자주 리렌더링되는 이유를 파악하기 어렵습니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
