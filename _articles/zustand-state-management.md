# Zustand는 왜 사용하고 어떤 상황에서 필요한가요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

Zustand는 React 애플리케이션에서 전역 상태를 관리하기 위한 경량 라이브러리입니다. Redux보다 보일러플레이트가 적고, Context API보다 불필요한 리렌더링이 적습니다. `create` 함수 하나로 스토어를 정의하고, 컴포넌트에서는 훅처럼 꺼내 쓰는 단순한 구조가 특징입니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

React에서 상태를 여러 컴포넌트가 공유해야 할 때 두 가지 선택지가 자주 등장합니다.

**Context API를 쓰면 리렌더링이 과도하게 발생합니다.** `Context.Provider`의 value가 바뀌면 해당 Context를 구독하는 모든 컴포넌트가 리렌더링됩니다. 사용자 정보, 다크모드, 언어 설정처럼 변경 빈도가 낮은 값에는 적합하지만, 자주 바뀌는 장바구니 항목이나 필터 상태처럼 값 변화가 잦은 경우 성능 문제로 이어집니다.

**Redux는 구조가 무겁습니다.** 상태 하나를 추가하려면 action, reducer, selector를 각각 정의해야 합니다. 소규모 프로젝트나 빠른 기능 추가가 필요한 상황에서는 이 절차가 오히려 개발 속도를 늦춥니다.

Zustand는 이 두 문제를 동시에 해결합니다. 스토어를 함수 하나로 정의하고, 컴포넌트는 필요한 값만 선택(subscribe)해서 받기 때문에 해당 값이 바뀔 때만 리렌더링됩니다.

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
// Context API로 자주 바뀌는 상태 관리 — 불필요한 리렌더링 발생
const CartContext = createContext(null);

function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);

  return (
    <CartContext.Provider value={{ items, totalPrice, setItems, setTotalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

// items가 바뀌면 totalPrice만 쓰는 컴포넌트도 리렌더링됨
function TotalPrice() {
  const { totalPrice } = useContext(CartContext);
  return <p>{totalPrice}원</p>;
}
```

`CartContext`의 value 객체가 바뀌면 `totalPrice`만 사용하는 `TotalPrice` 컴포넌트도 함께 리렌더링됩니다. 장바구니 항목이 자주 바뀌는 경우 화면 전체가 불필요하게 다시 그려집니다.

---

#### 올바른 사용법 (Good Example)

```tsx
// Zustand 스토어 정의
import { create } from 'zustand';

interface CartStore {
  items: { id: number; name: string; price: number }[];
  totalPrice: number;
  addItem: (item: { id: number; name: string; price: number }) => void;
}

const useCartStore = create<CartStore>((set) => ({
  items: [],
  totalPrice: 0,
  addItem: (item) =>
    set((state) => ({
      items: [...state.items, item],
      totalPrice: state.totalPrice + item.price,
    })),
}));

// totalPrice만 구독 — items가 바뀌어도 리렌더링 안 됨
function TotalPrice() {
  const totalPrice = useCartStore((state) => state.totalPrice);
  return <p>{totalPrice}원</p>;
}

// items만 구독
function CartList() {
  const items = useCartStore((state) => state.items);
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}

// addItem 액션만 구독 — 상태 변경이 없으면 리렌더링 안 됨
function AddItemButton() {
  const addItem = useCartStore((state) => state.addItem);
  return (
    <button onClick={() => addItem({ id: Date.now(), name: '상품', price: 10000 })}>
      추가
    </button>
  );
}
```

`useCartStore`에 선택자 함수를 전달하면 해당 값이 변경될 때만 리렌더링됩니다. `TotalPrice`는 `totalPrice`가 바뀔 때만, `CartList`는 `items`가 바뀔 때만, `AddItemButton`은 `addItem`이 변경되지 않으면 아예 리렌더링되지 않습니다.

---

#### 정리 (Conclusion)

Zustand는 "전역 상태가 필요하지만 Redux는 과하다"는 상황에 맞습니다. 설정 없이 `create` 하나로 스토어를 만들고, 컴포넌트마다 필요한 상태만 선택해서 구독하는 방식이 핵심입니다.

| 상황 | 권장 방법 |
|------|-----------|
| 컴포넌트 1~2개가 공유하는 상태 | props 또는 prop drilling |
| 변경이 드문 전역 설정 (테마, 언어) | Context API |
| 자주 바뀌는 전역 상태 (장바구니, 필터) | Zustand |
| 복잡한 비동기 흐름, 대규모 팀 | Redux Toolkit |

Zustand 스토어를 사용할 때 지켜야 할 핵심 규칙이 있습니다.

**선택자를 반드시 사용하세요.** `useCartStore()` 처럼 선택자 없이 전체 스토어를 구독하면 어떤 값이 바뀌든 항상 리렌더링됩니다. `useCartStore((state) => state.totalPrice)` 처럼 필요한 값만 선택해야 Zustand의 리렌더링 최적화가 동작합니다.

**액션은 스토어 안에 정의하세요.** 상태를 바꾸는 로직을 컴포넌트 밖 스토어에 두면 어디서 상태가 바뀌는지 추적하기 쉬워집니다. 컴포넌트는 `addItem`을 호출하기만 하면 됩니다.

**파일을 스토어 단위로 분리하세요.** 장바구니, 사용자 정보, 모달 상태처럼 도메인별로 스토어를 분리하면 유지보수가 편해집니다. Zustand는 여러 스토어를 동시에 사용해도 충돌이 없습니다.

---

### 추가 학습 자료 공유합니다.

- [Zustand 공식 문서](https://zustand.docs.pmnd.rs/getting-started/introduction)
- [Zustand GitHub](https://github.com/pmndrs/zustand)

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
| `{{TITLE}}` | Zustand는 왜 사용하고 어떤 상황에서 필요한가요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | React, Zustand, 상태관리, 전역상태, 리렌더링 |
| `{{DATE}}` | 2026-04-18 |
| `{{SLUG}}` | zustand-state-management |
| `{{SUMMARY}}` | Zustand는 React 전역 상태 관리를 위한 경량 라이브러리입니다. Context API의 과도한 리렌더링과 Redux의 높은 복잡도 문제를 동시에 해결하며, 선택자 기반 구독으로 필요한 상태 변경에만 반응합니다. |
| `{{WHY}}` | Context API는 value 변경 시 모든 구독 컴포넌트를 리렌더링하고, Redux는 보일러플레이트가 많아 소규모 전역 상태 관리에 비효율적입니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
