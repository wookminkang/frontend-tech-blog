# React에서 스크롤 위치에 따라 스타일을 어떻게 바꾸나요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

스크롤이 특정 위치를 넘었을 때 헤더 배경을 바꾸거나 버튼을 보여주려면, `useEffect` 안에서 `window.addEventListener('scroll', handler)`를 등록하고 `window.scrollY`를 임계값과 비교해 `boolean` 상태로 관리하면 됩니다. 이벤트 리스너는 반드시 cleanup 함수에서 제거해야 메모리 누수를 막을 수 있습니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

React에서 `addEventListener`를 `useEffect` 없이 컴포넌트 본문에 직접 호출하면, 렌더링이 발생할 때마다 같은 리스너가 계속 쌓입니다. 스크롤 한 번에 수십 개의 핸들러가 동시에 실행되고, 컴포넌트가 언마운트된 뒤에도 리스너가 남아 메모리 누수로 이어집니다.

또한 cleanup 없이 등록만 하면, 컴포넌트가 사라진 뒤에도 핸들러가 `setState`를 호출해 React 경고가 발생합니다.

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  // 렌더링마다 리스너가 중복 등록됨, cleanup도 없음
  window.addEventListener('scroll', () => {
    setIsScrolled(window.scrollY > 60);
  });

  return (
    <header className={isScrolled ? 'header scrolled' : 'header'}>
      매일매일
    </header>
  );
}
```

렌더링이 일어날 때마다 새 리스너가 추가되고, `setIsScrolled` 호출이 다시 렌더링을 유발해 무한 루프에 가까운 상황이 됩니다. 언마운트 후에도 리스너가 남아 있어 메모리 누수가 발생합니다.

---

#### 올바른 사용법 (Good Example)

```tsx
import { useState, useEffect } from 'react';

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 60);
    }

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className={isScrolled ? 'header scrolled' : 'header'}>
      매일매일
    </header>
  );
}
```

`useEffect`의 빈 의존성 배열 `[]`로 마운트 시 딱 한 번만 등록하고, return 함수에서 리스너를 제거합니다. `isScrolled`가 `true`가 되는 순간 React가 다시 렌더링해 클래스가 교체됩니다.

같은 패턴이 여러 컴포넌트에서 필요하다면 커스텀 훅으로 분리하는 것이 좋습니다.

```tsx
import { useState, useEffect } from 'react';

function useScrollPassed(threshold: number) {
  const [isPassed, setIsPassed] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsPassed(window.scrollY > threshold);
    }

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return isPassed;
}

// 사용 예시
function Header() {
  const isScrolled = useScrollPassed(60);

  return (
    <header className={isScrolled ? 'header scrolled' : 'header'}>
      매일매일
    </header>
  );
}

function BackToTopButton() {
  const isVisible = useScrollPassed(300);

  if (!isVisible) return null;
  return <button>맨 위로</button>;
}
```

---

#### 정리 (Conclusion)

스크롤 위치에 따라 스타일을 바꾸는 패턴의 핵심은 세 가지입니다. 첫째, `useEffect` 안에서 이벤트를 등록합니다. 둘째, `window.scrollY > threshold` 비교 결과를 `boolean` 상태로 관리합니다. 셋째, cleanup 함수에서 반드시 `removeEventListener`를 호출합니다. 여러 컴포넌트에서 재사용한다면 `useScrollPassed`처럼 커스텀 훅으로 분리하면 깔끔합니다.

---

### 추가 학습 자료 공유합니다.

- [React 공식 문서 — useEffect로 동기화하기](https://ko.react.dev/learn/synchronizing-with-effects)
- [MDN — Window: scroll 이벤트](https://developer.mozilla.org/ko/docs/Web/API/Window/scroll_event)

---

## 키워드 변수 정의

| 키워드 | 값 |
|--------|----|
| `{{TITLE}}` | React에서 스크롤 위치에 따라 스타일을 어떻게 바꾸나요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | React, useEffect, scroll, addEventListener, custom hook |
| `{{DATE}}` | 2026-04-28 |
| `{{SLUG}}` | how-to-detect-scroll-position-in-react |
| `{{SUMMARY}}` | useEffect 안에서 window.addEventListener로 스크롤을 감지하고, window.scrollY를 임계값과 비교한 boolean 상태로 클래스나 스타일을 바꿉니다. |
| `{{WHY}}` | useEffect 없이 컴포넌트 본문에 addEventListener를 호출하면 렌더링마다 리스너가 중복 등록되고, cleanup 없이 두면 언마운트 후에도 메모리 누수가 발생합니다. |
| `{{LANG}}` | tsx |
| `{{BAD_CODE}}` | window.addEventListener를 useEffect 없이 컴포넌트 본문에서 직접 호출 |
| `{{GOOD_CODE}}` | useEffect + addEventListener + cleanup(removeEventListener) + boolean 상태 관리 + 커스텀 훅 분리 |
| `{{CONCLUSION}}` | useEffect 안에 등록, scrollY > threshold 비교로 boolean 상태 관리, cleanup에서 removeEventListener 제거 |
| `{{RESOURCE_1_TITLE}}` | React 공식 문서 — useEffect로 동기화하기 |
| `{{RESOURCE_1_URL}}` | https://ko.react.dev/learn/synchronizing-with-effects |
| `{{RESOURCE_2_TITLE}}` | MDN — Window: scroll 이벤트 |
| `{{RESOURCE_2_URL}}` | https://developer.mozilla.org/ko/docs/Web/API/Window/scroll_event |
| `{{YEAR}}` | 2026 |
