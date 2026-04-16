# React에서 useCallback, useMemo, React.memo는 언제 써야 하나요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

`React.memo`는 props가 바뀌지 않으면 컴포넌트 리렌더링을 건너뜁니다. `useCallback`은 함수의 참조를 고정해 불필요한 재생성을 막고, `useMemo`는 연산 결과값의 참조를 고정합니다. 세 가지 모두 참조 동일성에 기반한 최적화이며, 남용하면 오히려 메모리 비용이 증가하므로 실제 성능 문제가 확인된 곳에만 적용해야 합니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

React는 부모 컴포넌트가 리렌더링되면 자식 컴포넌트도 기본적으로 함께 리렌더링됩니다. 자식에게 전달되는 props가 바뀌지 않았더라도 마찬가지입니다.

문제는 함수와 객체가 참조 타입이라는 점입니다. 부모가 리렌더링될 때마다 함수와 객체는 새 참조로 다시 만들어집니다. `React.memo`로 감싼 자식 컴포넌트도 props의 참조가 바뀌었다고 판단해 리렌더링됩니다.

세 가지 훅/함수의 역할은 각각 다릅니다.

- **`React.memo`**: 컴포넌트를 감싸서 이전 props와 새 props를 얕은 비교합니다. props가 같으면 리렌더링을 건너뜁니다.
- **`useCallback`**: 함수를 의존성 배열 기준으로 메모이제이션합니다. 의존성이 바뀌지 않으면 같은 함수 참조를 유지합니다. `React.memo`로 감싼 컴포넌트에 함수를 props로 내릴 때 함께 사용합니다.
- **`useMemo`**: 계산 결과값을 의존성 배열 기준으로 메모이제이션합니다. 무거운 연산 결과나 객체/배열을 props로 내릴 때 참조를 고정합니다.

중요한 점은 세 가지 모두 비용이 있다는 것입니다. 메모이제이션된 값을 저장하고 의존성을 비교하는 작업 자체가 메모리와 연산을 소비합니다. 단순한 컴포넌트나 빠른 연산에 적용하면 최적화가 아니라 오히려 성능을 저하시킬 수 있습니다.

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
import { useState, useCallback, useMemo, memo } from 'react';

// 모든 함수와 값에 무조건 useCallback / useMemo를 적용한 경우
export default function ProductPage() {
  const [count, setCount] = useState(0);
  const [query, setQuery] = useState('');

  // 단순 증가 함수에 useCallback을 쓸 필요가 없습니다.
  // 이 컴포넌트가 자주 리렌더링되지 않는다면 메모이제이션 비용만 추가됩니다.
  const increment = useCallback(() => {
    setCount((c) => c + 1);
  }, []);

  // 단순한 문자열 연산에 useMemo를 쓸 필요가 없습니다.
  const label = useMemo(() => {
    return `현재 수량: ${count}`;
  }, [count]);

  // React.memo 없이 useCallback만 쓰면 아무 효과가 없습니다.
  const handleSearch = useCallback((value: string) => {
    setQuery(value);
  }, []);

  return (
    <div>
      <p>{label}</p>
      <button onClick={increment}>추가</button>
      {/* React.memo로 감싸지 않은 컴포넌트에 useCallback 함수를 내려도 */}
      {/* 부모가 리렌더링되면 SearchBox도 그대로 리렌더링됩니다. */}
      <SearchBox onSearch={handleSearch} />
    </div>
  );
}

// React.memo 없이 그냥 선언된 컴포넌트
function SearchBox({ onSearch }: { onSearch: (v: string) => void }) {
  return <input onChange={(e) => onSearch(e.target.value)} />;
}
```

`React.memo` 없이 `useCallback`만 사용하면 참조가 고정되어도 자식 컴포넌트는 부모 리렌더링 시 함께 리렌더링됩니다. `useCallback`과 `useMemo`는 `React.memo`와 짝을 이룰 때 의미가 생깁니다.

---

#### 올바른 사용법 (Good Example)

```tsx
import { useState, useCallback, useMemo, memo } from 'react';

export default function ProductPage() {
  const [count, setCount] = useState(0);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [filterText, setFilterText] = useState('');

  // useMemo — 무거운 필터 연산 결과를 메모이제이션합니다.
  // filterText나 products가 바뀔 때만 재계산됩니다.
  const filteredProducts = useMemo(
    () => products.filter((p) => p.name.includes(filterText)),
    [products, filterText]
  );

  // useCallback — React.memo로 감싼 자식에 함수를 props로 내릴 때 사용합니다.
  // count가 바뀌어도 handleFilter의 참조는 유지됩니다.
  const handleFilter = useCallback((text: string) => {
    setFilterText(text);
  }, []);

  return (
    <div>
      <p>총 {count}개 담음</p>
      {/* FilterInput은 handleFilter 참조가 바뀌지 않으면 리렌더링되지 않습니다. */}
      <FilterInput onFilter={handleFilter} />
      <ProductList products={filteredProducts} />
    </div>
  );
}

// React.memo — props가 바뀌지 않으면 리렌더링을 건너뜁니다.
// onFilter가 useCallback으로 참조가 고정되어 있어야 효과가 있습니다.
const FilterInput = memo(function FilterInput({
  onFilter,
}: {
  onFilter: (text: string) => void;
}) {
  return <input onChange={(e) => onFilter(e.target.value)} />;
});

// 리스트 아이템이 많고 렌더링 비용이 있을 때 React.memo가 효과적입니다.
const ProductList = memo(function ProductList({
  products,
}: {
  products: Product[];
}) {
  return (
    <ul>
      {products.map((p) => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
});
```

`React.memo` + `useCallback`은 세트로 사용합니다. `useMemo`는 계산 비용이 실제로 큰 연산에만 적용합니다. 단순한 연산이나 자주 바뀌는 값에 적용하면 메모이제이션 비용이 이득보다 커집니다.

---

#### 정리 (Conclusion)

| 도구 | 메모이제이션 대상 | 짝 | 적합한 상황 |
|------|-----------------|-----|-----------|
| `React.memo` | 컴포넌트 | `useCallback`, `useMemo` | props가 자주 바뀌지 않는 자식 컴포넌트 |
| `useCallback` | 함수 참조 | `React.memo` | `React.memo` 자식에 함수 props를 내릴 때 |
| `useMemo` | 연산 결괏값 | `React.memo` | 비용이 큰 연산, 객체/배열을 props로 내릴 때 |

적용 순서를 지키세요. 먼저 상태를 실제로 사용하는 컴포넌트 가까이 내리고, `children` prop으로 렌더링 폭발 범위를 줄이는 것이 우선입니다. 그래도 성능 문제가 남아 있다면 그때 세 가지 도구를 측정 후 적용합니다.

---

### 추가 학습 자료 공유합니다.

- [React 공식 문서 — memo](https://react.dev/reference/react/memo)
- [React 공식 문서 — useCallback](https://react.dev/reference/react/useCallback)
- [React 공식 문서 — useMemo](https://react.dev/reference/react/useMemo)

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
| `{{TITLE}}` | React에서 useCallback, useMemo, React.memo는 언제 써야 하나요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | React, useCallback, useMemo, React.memo, 성능 최적화, 메모이제이션 |
| `{{DATE}}` | 2026-04-15 |
| `{{SLUG}}` | react-usecallback-usememo-reactmemo |
| `{{SUMMARY}}` | 세 가지 최적화 도구는 참조 동일성에 기반합니다. React.memo + useCallback을 세트로 사용하고, useMemo는 비용이 큰 연산에만 적용합니다. |
| `{{WHY}}` | 함수와 객체는 렌더링마다 새 참조가 생성되므로, React.memo만으로는 함수 props의 참조 변경을 막을 수 없습니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
