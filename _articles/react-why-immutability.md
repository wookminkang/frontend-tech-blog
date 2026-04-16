# React에서 왜 상태를 직접 변경하면 안 되나요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

React는 이전 상태와 새 상태를 얕은 비교(shallow comparison)로 감지합니다. 객체나 배열을 직접 수정하면 참조값이 바뀌지 않아 React가 변경을 감지하지 못하고, 리렌더링이 발생하지 않습니다. 불변성을 지킨다는 것은 상태를 수정할 때 기존 값을 바꾸는 것이 아니라 새로운 참조를 가진 값을 만들어 반환하는 것입니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

JavaScript에서 객체와 배열은 참조 타입입니다. 변수에는 실제 값이 아니라 메모리 주소(참조)가 저장됩니다.

```js
const a = { count: 0 };
const b = a;       // b는 a와 같은 메모리 주소를 가리킵니다.
b.count = 1;
console.log(a === b); // true — 같은 참조이므로 비교 결과가 변하지 않습니다.
```

React의 `useState`와 `useReducer`는 상태가 바뀌었는지 판단할 때 이전 참조와 새 참조를 `Object.is`로 비교합니다. 참조가 같으면 변경이 없다고 판단해 리렌더링을 건너뜁니다.

즉, 기존 객체나 배열을 직접 수정하면 참조는 그대로이므로 React는 상태가 바뀐 것을 모릅니다. 화면이 업데이트되지 않고, 추후 다른 상태 변경이 일어났을 때 예상치 못한 값이 렌더링될 수 있습니다.

불변성을 지켜야 하는 이유는 세 가지입니다.

- **리렌더링 보장**: 새 참조를 반환해야 React가 변경을 감지하고 화면을 업데이트합니다.
- **예측 가능성**: 이전 상태가 보존되므로 디버깅과 상태 추적이 쉬워집니다.
- **React 내부 최적화 호환**: `React.memo`, `useMemo`, `useCallback` 등 참조 비교에 의존하는 최적화 도구들이 올바르게 동작합니다.

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
import { useState } from 'react';

type Item = { id: number; name: string };

export default function ItemList() {
  const [items, setItems] = useState<Item[]>([
    { id: 1, name: 'React' },
    { id: 2, name: 'Next.js' },
  ]);

  const addItem = () => {
    // 기존 배열을 직접 수정합니다. 참조가 바뀌지 않아 리렌더링이 발생하지 않습니다.
    items.push({ id: 3, name: 'TypeScript' });
    setItems(items); // 같은 참조를 그대로 넘기므로 React는 변경을 감지하지 못합니다.
  };

  const updateFirst = () => {
    // 기존 객체를 직접 수정합니다.
    items[0].name = 'React 19';
    setItems(items); // 리렌더링 안 됨
  };

  return (
    <ul>
      {items.map((item) => <li key={item.id}>{item.name}</li>)}
      <button onClick={addItem}>추가</button>
      <button onClick={updateFirst}>수정</button>
    </ul>
  );
}
```

`push`와 직접 할당은 기존 배열/객체를 변경하므로 참조가 그대로입니다. `setItems`에 같은 참조를 전달하면 React는 상태가 바뀌지 않았다고 판단해 리렌더링을 건너뜁니다.

---

#### 올바른 사용법 (Good Example)

```tsx
import { useState } from 'react';

type Item = { id: number; name: string };

export default function ItemList() {
  const [items, setItems] = useState<Item[]>([
    { id: 1, name: 'React' },
    { id: 2, name: 'Next.js' },
  ]);

  const addItem = () => {
    // 스프레드 연산자로 새 배열을 만들어 반환합니다.
    setItems([...items, { id: 3, name: 'TypeScript' }]);
  };

  const updateFirst = () => {
    // map으로 새 배열을 만들고, 수정 대상만 새 객체로 교체합니다.
    setItems(items.map((item) =>
      item.id === 1 ? { ...item, name: 'React 19' } : item
    ));
  };

  const removeItem = (id: number) => {
    // filter로 해당 항목을 제외한 새 배열을 만들어 반환합니다.
    setItems(items.filter((item) => item.id !== id));
  };

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          {item.name}
          <button onClick={() => removeItem(item.id)}>삭제</button>
        </li>
      ))}
      <button onClick={addItem}>추가</button>
      <button onClick={updateFirst}>수정</button>
    </ul>
  );
}
```

`[...items]`, `map`, `filter`는 모두 원본을 건드리지 않고 새 배열을 반환합니다. React는 새 참조를 받아 변경을 감지하고 리렌더링을 실행합니다.

---

#### 정리 (Conclusion)

불변성을 지키기 위한 패턴을 조작 유형별로 정리하면 다음과 같습니다.

| 조작 | 직접 변경 (금지) | 불변 패턴 (권장) |
|------|----------------|----------------|
| 항목 추가 | `arr.push(item)` | `[...arr, item]` |
| 항목 제거 | `arr.splice(i, 1)` | `arr.filter(...)` |
| 항목 수정 | `arr[i].name = 'x'` | `arr.map(...)` |
| 객체 수정 | `obj.key = value` | `{ ...obj, key: value }` |
| 객체 중첩 수정 | `obj.a.b = value` | `{ ...obj, a: { ...obj.a, b: value } }` |

중첩이 깊은 객체를 자주 수정해야 한다면 `immer` 라이브러리를 사용하면 불변성을 유지하면서도 직접 수정하는 것처럼 코드를 작성할 수 있습니다.

---

### 추가 학습 자료 공유합니다.

- [React 공식 문서 — Updating Objects in State](https://react.dev/learn/updating-objects-in-state)
- [React 공식 문서 — Updating Arrays in State](https://react.dev/learn/updating-arrays-in-state)

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
| `{{TITLE}}` | React에서 왜 상태를 직접 변경하면 안 되나요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | React, 불변성, immutability, useState, 얕은 비교, shallow comparison |
| `{{DATE}}` | 2026-04-15 |
| `{{SLUG}}` | react-why-immutability |
| `{{SUMMARY}}` | React는 얕은 비교로 상태 변경을 감지합니다. 기존 참조를 직접 수정하면 리렌더링이 발생하지 않습니다. |
| `{{WHY}}` | 객체/배열은 참조 타입이라 직접 수정하면 참조값이 바뀌지 않아 React가 변경을 감지하지 못합니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
