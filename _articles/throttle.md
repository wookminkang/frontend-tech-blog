# 스로틀(throttle)은 무엇이고 언제 사용하나요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

스로틀(throttle)은 연속으로 발생하는 이벤트를 일정 시간 간격으로 제한해 최대 1회만 실행하도록 제어하는 기법입니다. 디바운스가 마지막 이벤트 기준으로 기다린다면, 스로틀은 첫 번째 실행 이후 일정 시간이 지나야 다음 실행을 허용합니다. 스크롤 이벤트, 마우스 이동 추적, 무한 스크롤 트리거처럼 이벤트가 끊임없이 발생하면서도 주기적으로 처리가 필요한 상황에 적합합니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

스크롤 이벤트는 사용자가 마우스 휠을 한 번 굴릴 때 수십 번씩 발생합니다. `scroll` 이벤트 핸들러에서 DOM 위치를 계산하거나 API를 호출하면 1초에 수십 번 실행될 수 있습니다. 이 계산이 무거울수록 메인 스레드가 막혀 화면이 버벅거립니다.

디바운스로는 이 문제를 해결하기 어렵습니다. 디바운스는 이벤트가 멈출 때까지 기다리기 때문에, 사용자가 스크롤을 계속하는 동안에는 단 한 번도 실행되지 않습니다. 무한 스크롤에서 사용자가 계속 내리고 있는 도중에도 다음 페이지를 불러와야 하는 경우라면 디바운스가 아닌 스로틀이 맞습니다.

두 기법의 차이를 정리하면 다음과 같습니다.

| 기법 | 동작 방식 | 적합한 상황 |
|------|-----------|-------------|
| 디바운스 | 마지막 이벤트 후 일정 시간이 지나면 1회 실행 | 검색 입력, 자동완성, 폼 유효성 검사 |
| 스로틀 | 일정 시간마다 최대 1회 실행 (중간 이벤트 무시) | 스크롤, 마우스 이동, 무한 스크롤, 리사이즈 |

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
function InfiniteScrollList() {
  useEffect(() => {
    function handleScroll() {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      // 스크롤 이벤트마다 매번 실행 — 1초에 수십 번 호출됨
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        fetchNextPage();
      }
    }

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
}
```

`handleScroll`은 스크롤이 발생할 때마다 실행됩니다. 하단에 도달한 순간 `fetchNextPage`가 수십 번 연속 호출되어 같은 페이지를 중복 요청하게 됩니다. 이미 요청 중임을 확인하는 로직을 추가하더라도 스크롤 위치 계산 자체가 매 프레임 실행되는 것은 방지되지 않습니다.

---

#### 올바른 사용법 (Good Example)

```tsx
import { useEffect, useRef } from 'react';

function useThrottle<T extends unknown[]>(
  callback: (...args: T) => void,
  delay: number
) {
  const lastRun = useRef<number>(0);

  return (...args: T) => {
    const now = Date.now();
    if (now - lastRun.current >= delay) {
      lastRun.current = now;
      callback(...args);
    }
  };
}

function InfiniteScrollList() {
  const handleScroll = useThrottle(() => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      fetchNextPage();
    }
  }, 200);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
}
```

`useThrottle`은 마지막 실행 시각을 `useRef`로 기록합니다. 이벤트가 발생했을 때 현재 시각과 마지막 실행 시각의 차이가 `delay`를 넘지 않으면 실행을 건너뜁니다. 200ms로 설정하면 1초에 최대 5번만 `handleScroll`이 실행됩니다.

**`setTimeout` 방식으로도 구현할 수 있습니다.**

```tsx
function useThrottleTimeout<T extends unknown[]>(
  callback: (...args: T) => void,
  delay: number
) {
  const isThrottled = useRef<boolean>(false);

  return (...args: T) => {
    if (isThrottled.current) return;

    callback(...args);
    isThrottled.current = true;

    setTimeout(() => {
      isThrottled.current = false;
    }, delay);
  };
}
```

`isThrottled` 플래그로 실행 중 여부를 관리합니다. 함수가 실행되면 플래그를 `true`로 설정하고, `delay` 이후 `false`로 돌려놓습니다. 플래그가 `true`인 동안은 호출을 무시합니다. `Date.now()` 방식보다 구조가 단순해서 이해하기 쉽습니다.

---

#### 정리 (Conclusion)

스로틀은 이벤트가 멈추지 않아도 일정 주기로 함수를 실행해야 할 때 사용합니다. 실행 주기를 너무 짧게 설정하면 효과가 없고, 너무 길게 설정하면 반응이 뚝뚝 끊기는 느낌이 납니다.

| 상황 | 권장 딜레이 |
|------|-------------|
| 무한 스크롤 트리거 | 200ms |
| 스크롤 위치 기반 UI 업데이트 | 100~200ms |
| 마우스 이동 추적 | 50~100ms |
| 창 리사이즈 레이아웃 재계산 | 200~300ms |

라이브러리를 사용하는 것도 방법입니다. Lodash의 `_.throttle`은 leading/trailing 옵션으로 첫 번째 실행과 마지막 실행을 세밀하게 제어할 수 있습니다. 직접 구현이 번거롭거나 엣지 케이스가 걱정된다면 Lodash를 활용하는 것이 안전합니다.

---

### 추가 학습 자료 공유합니다.

- [MDN — scroll 이벤트](https://developer.mozilla.org/ko/docs/Web/API/Document/scroll_event)
- [Lodash — throttle](https://lodash.com/docs/#throttle)

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
| `{{TITLE}}` | 스로틀(throttle)은 무엇이고 언제 사용하나요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | React, throttle, 스로틀, 성능최적화, 이벤트제어, 스크롤 |
| `{{DATE}}` | 2026-04-18 |
| `{{SLUG}}` | throttle |
| `{{SUMMARY}}` | 스로틀은 연속 이벤트를 일정 시간 간격으로 제한해 최대 1회만 실행하는 기법입니다. 디바운스와 달리 이벤트가 계속 발생해도 주기적으로 실행되며, 스크롤·마우스 이동·무한 스크롤 트리거에 적합합니다. |
| `{{WHY}}` | 스크롤 이벤트는 1초에 수십 번 발생해 핸들러를 그대로 연결하면 메인 스레드 부하와 중복 API 호출이 발생합니다. 디바운스는 이벤트가 멈출 때까지 기다리므로 스크롤 중 주기적 처리가 필요한 상황에는 맞지 않습니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
