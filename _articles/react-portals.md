# React Portal은 무엇이고 왜 사용하나요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

React Portal은 컴포넌트를 DOM 트리상 부모 컴포넌트 바깥에 렌더링할 수 있게 해주는 기능입니다.
`ReactDOM.createPortal(children, domNode)`을 사용하면 모달, 툴팁, 드롭다운처럼 화면 위에 떠야 하는 UI를 DOM 최상위에 렌더링할 수 있습니다.
React의 이벤트 버블링은 DOM 구조가 아닌 React 컴포넌트 트리를 따르기 때문에, Portal을 사용해도 상태와 이벤트는 정상적으로 동작합니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

React에서 컴포넌트를 렌더링하면 기본적으로 부모 컴포넌트의 DOM 노드 안에 자식이 삽입됩니다.
이 구조가 대부분의 경우에는 자연스럽지만, 모달이나 툴팁처럼 화면 위에 올라와야 하는 UI에서는 문제가 됩니다.

구체적으로 두 가지 문제가 발생합니다.

**1. overflow: hidden 또는 clip 문제**

부모 컴포넌트에 `overflow: hidden`이 설정되어 있으면, 그 안에 렌더링된 모달도 잘려 보입니다.
모달은 시각적으로 전체 화면 위에 올라와야 하므로, DOM 상의 부모 자식 관계에서 벗어나야 합니다.

**2. z-index 스태킹 컨텍스트 문제**

`z-index`는 같은 스태킹 컨텍스트(stacking context) 안에서만 비교됩니다.
부모 컴포넌트가 새로운 스태킹 컨텍스트를 형성하면(`position: relative`, `transform`, `opacity` 등), 자식 모달의 `z-index`가 아무리 높아도 부모 바깥의 다른 요소보다 뒤에 그려질 수 있습니다.

Portal은 이 두 문제를 해결합니다. 컴포넌트를 `document.body` 같은 DOM 최상위 노드에 삽입하면, 부모의 CSS 제약에서 완전히 벗어날 수 있습니다.

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
function Card() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ overflow: 'hidden', transform: 'translateZ(0)' }}>
      <button onClick={() => setIsOpen(true)}>모달 열기</button>

      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)' }}>
          <div>모달 내용</div>
          <button onClick={() => setIsOpen(false)}>닫기</button>
        </div>
      )}
    </div>
  );
}
```

`position: fixed`와 높은 `z-index`를 설정했음에도, 부모의 `transform` 속성이 새로운 스태킹 컨텍스트를 만들기 때문에 모달이 의도한 대로 화면 위에 표시되지 않을 수 있습니다.

---

#### 올바른 사용법 (Good Example)

```tsx
import { createPortal } from 'react-dom';

function Modal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)' }}>
      <div>모달 내용</div>
      <button onClick={onClose}>닫기</button>
    </div>,
    document.body
  );
}

function Card() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ overflow: 'hidden', transform: 'translateZ(0)' }}>
      <button onClick={() => setIsOpen(true)}>모달 열기</button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}
```

`createPortal`을 사용하면 `Modal` 컴포넌트는 React 트리상으로는 `Card`의 자식이지만, 실제 DOM에서는 `document.body` 바로 아래에 삽입됩니다.
덕분에 부모의 `overflow: hidden`이나 `transform`으로 인한 스태킹 컨텍스트 문제를 피할 수 있습니다.

Portal을 통해 렌더링된 컴포넌트도 React 트리 안에 있기 때문에, 클릭 이벤트 버블링은 DOM 구조가 아닌 React 컴포넌트 트리를 따릅니다. 즉, `Card` 컴포넌트에서 모달의 이벤트를 캐치할 수 있습니다.

---

#### 정리 (Conclusion)

React Portal은 컴포넌트를 부모 DOM 노드 바깥에 렌더링하고 싶을 때 사용합니다.
모달, 툴팁, 드롭다운처럼 화면 위에 떠야 하는 UI는 부모의 `overflow: hidden`이나 스태킹 컨텍스트 문제를 피하기 위해 Portal로 `document.body`에 렌더링하는 것이 올바른 방법입니다.
Portal을 사용해도 React 이벤트 시스템과 Context는 컴포넌트 트리를 기준으로 동작하므로, 상태 관리와 이벤트 핸들링은 평소와 동일하게 작동합니다.

---

### 추가 학습 자료 공유합니다.

- [React 공식 문서 — createPortal](https://react.dev/reference/react-dom/createPortal)
- [MDN — CSS 스태킹 컨텍스트(Stacking context)](https://developer.mozilla.org/ko/docs/Web/CSS/CSS_positioned_layout/Understanding_z-index/Stacking_context)

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
| `{{TITLE}}` | React Portal은 무엇이고 왜 사용하나요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | React, Portal, createPortal, Modal, z-index |
| `{{DATE}}` | 2026-04-18 |
| `{{SLUG}}` | react-portals |
| `{{SUMMARY}}` | createPortal로 모달 같은 UI를 DOM 최상위에 렌더링해 CSS 스태킹 컨텍스트 문제를 피합니다. Portal을 사용해도 React 이벤트 시스템과 Context는 컴포넌트 트리를 기준으로 동작합니다. |
| `{{WHY}}` | 부모의 overflow:hidden / transform이 스태킹 컨텍스트를 형성해 z-index가 무력화됩니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
