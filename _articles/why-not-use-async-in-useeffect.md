# 왜 useEffect에서 async 함수를 직접 사용하면 안 되나요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

`useEffect`의 콜백은 아무것도 반환하지 않거나, cleanup 함수(동기 함수)를 반환해야 합니다. `async` 함수는 항상 `Promise`를 반환하기 때문에 `useEffect`에 직접 전달하면 React가 cleanup을 실행할 수 없습니다. 그 결과 컴포넌트가 언마운트된 이후에도 상태 업데이트가 시도되어 메모리 누수와 경고가 발생합니다. 해결책은 `useEffect` 내부에 `async` 함수를 선언하고 즉시 호출하는 것입니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

`useEffect`의 동작 규칙은 단순합니다. 콜백이 함수를 반환하면 그것을 cleanup으로 실행하고, 아무것도 반환하지 않으면 cleanup 없이 넘어갑니다.

문제는 `async` 함수의 반환값입니다. `async` 함수는 내부에 `return` 구문이 없어도 항상 `Promise`를 반환합니다. React는 이 `Promise`를 cleanup 함수로 인식하려다 실패하고 조용히 무시합니다. cleanup이 실행되지 않으니 다음 문제들이 연쇄됩니다.

**첫째, 언마운트 후 상태 업데이트가 시도됩니다.** 사용자가 페이지를 이동해 컴포넌트가 언마운트되더라도, 진행 중이던 비동기 작업은 멈추지 않습니다. `fetch`가 완료된 시점에 `setState`를 호출하면 React는 이미 사라진 컴포넌트에 상태를 업데이트하려고 시도합니다.

**둘째, race condition이 발생합니다.** 의존성 배열 값이 빠르게 바뀌면 이전 요청보다 새 요청이 먼저 완료될 수 있습니다. cleanup이 없으면 이전 요청의 응답이 나중에 도착해 화면에 잘못된 데이터가 표시됩니다.

**셋째, React 18 StrictMode에서 버그가 증폭됩니다.** StrictMode는 개발 환경에서 `useEffect`를 마운트 → 언마운트 → 마운트 순서로 두 번 실행합니다. cleanup이 없으면 첫 번째 실행의 비동기 작업이 취소되지 않아 두 번의 요청이 동시에 진행됩니다.

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
// async 함수를 useEffect에 직접 전달하는 경우
// async 함수는 Promise를 반환하므로 cleanup이 실행되지 않습니다.

useEffect(async () => {
  const data = await fetchUser(userId);
  setUser(data); // 컴포넌트가 언마운트된 후에도 실행될 수 있습니다.
}, [userId]);
```

```tsx
// cleanup이 없어 race condition이 발생하는 경우
// userId가 1 → 2로 빠르게 바뀔 때,
// userId=2 요청이 먼저 끝나도 userId=1 응답이 나중에 도착하면
// 화면에는 userId=1의 데이터가 표시됩니다.

useEffect(() => {
  fetchUser(userId).then((data) => {
    setUser(data); // 어느 요청의 응답인지 보장할 수 없습니다.
  });
}, [userId]);
```

---

#### 올바른 사용법 (Good Example)

```tsx
// 기본 패턴 — 내부에 async 함수를 선언하고 즉시 호출합니다.

useEffect(() => {
  const load = async () => {
    const data = await fetchUser(userId);
    setUser(data);
  };

  load();
}, [userId]);
```

```tsx
// AbortController 패턴 — 컴포넌트 언마운트 시 진행 중인 fetch를 취소합니다.
// race condition과 언마운트 후 상태 업데이트를 동시에 방지합니다.

useEffect(() => {
  const controller = new AbortController();

  const load = async () => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        signal: controller.signal, // fetch에 AbortSignal 전달
      });
      const data = await res.json();
      setUser(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // 취소된 요청 — 정상적인 동작이므로 무시합니다.
        return;
      }
      setError(err);
    }
  };

  load();

  return () => {
    controller.abort(); // 언마운트 또는 재실행 시 이전 요청 취소
  };
}, [userId]);
```

`AbortController`를 사용하면 cleanup 함수가 호출될 때 진행 중인 `fetch`가 즉시 중단됩니다. StrictMode의 이중 실행에서도 첫 번째 요청이 취소되고 두 번째 요청만 완료되어 안전합니다.

```tsx
// 데이터 fetching이 복잡해진다면 TanStack Query 사용을 고려합니다.
// useEffect + fetch의 반복 패턴을 선언적으로 교체합니다.

import { useQuery } from '@tanstack/react-query';

function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  if (isLoading) return <p>불러오는 중...</p>;
  return <p>{user?.name}</p>;
  // 취소, 캐싱, 재시도, 에러 처리를 라이브러리가 담당합니다.
}
```

---

#### 정리 (Conclusion)

`useEffect`에 `async`를 직접 전달하면 cleanup이 동작하지 않습니다. 콜백 내부에 `async` 함수를 선언하고 즉시 호출하는 패턴이 기본이며, 언마운트나 의존성 변경이 빈번한 경우 `AbortController`로 이전 요청을 취소해 race condition을 방지합니다.

| 상황 | 선택 |
|------|------|
| 단순 데이터 로드 | 내부 async 함수 + 즉시 호출 |
| 언마운트 후 상태 업데이트 방지 | `AbortController` + cleanup |
| 의존성이 자주 바뀌는 fetch | `AbortController`로 이전 요청 취소 |
| fetching 로직이 복잡해질 때 | TanStack Query 도입 검토 |

---

### 추가 학습 자료 공유합니다.

- [React 공식 문서 — useEffect에서 데이터 fetching하기](https://react.dev/reference/react/useEffect#fetching-data-with-effects)
- [MDN — AbortController](https://developer.mozilla.org/ko/docs/Web/API/AbortController)

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
| `{{TITLE}}` | 왜 useEffect에서 async 함수를 직접 사용하면 안 되나요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | React, useEffect, async/await, AbortController, 메모리 누수 |
| `{{DATE}}` | 2026-04-17 |
| `{{SLUG}}` | why-not-use-async-in-useeffect |
| `{{SUMMARY}}` | useEffect 콜백은 cleanup 함수(동기)를 반환해야 합니다. async 함수는 Promise를 반환하므로 cleanup이 실행되지 않아 메모리 누수와 race condition이 발생합니다. |
| `{{WHY}}` | async 함수가 Promise를 반환해 React가 cleanup을 실행하지 못하고, 언마운트 후에도 상태 업데이트가 시도됩니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
