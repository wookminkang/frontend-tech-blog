# 블로그 상세 페이지 템플릿

> 이 파일은 매일매일 블로그 아티클 작성을 위한 템플릿입니다.
> `{{키워드}}` 형식의 변수를 실제 내용으로 교체하여 사용합니다.

---

## 메타 정보 (Meta)

```
title: 왜 useEffect에서 async 함수를 직접 사용하면 안 되나요?
category: 프론트엔드
tags: React, useEffect, async/await, 메모리 누수
published_at: 2026-04-14
slug: why-not-use-async-in-useeffect
```

---

## 페이지 구조

---

### [HEADER]

```
로고: 매일매일
```

---

### [ARTICLE]

# 왜 useEffect에서 async 함수를 직접 사용하면 안 되나요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

`useEffect`의 콜백은 동기 함수이거나, cleanup 함수를 반환해야 합니다.
`async` 함수는 항상 `Promise`를 반환하므로 useEffect와 직접 함께 사용하면
예상치 못한 메모리 누수와 버그가 발생합니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

`useEffect`는 콜백 함수가 반환하는 값을 cleanup 함수로 인식합니다.
`async` 함수를 직접 전달하면 React는 `Promise` 객체를 받게 됩니다.
React는 이것을 처리하지 못하고, 비동기 작업이 컴포넌트 언마운트 이후에도
상태를 업데이트하려 해 메모리 누수가 발생합니다.

이로 인해 발생하는 문제입니다.

- 언마운트 후 상태 업데이트 시도로 인한 메모리 누수
- cleanup 함수가 실행되지 않아 구독 해제, 타이머 해제 불가
- race condition 발생 가능
- React 18 StrictMode에서 이중 실행으로 인한 버그 증폭

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
// async 함수를 useEffect에 직접 전달 — 금지
useEffect(async () => {
  const data = await fetchData();
  setData(data);
}, []);
// async 함수는 Promise를 반환
// React가 cleanup 대신 Promise를 받게 됨
```

`async () => {}`는 항상 `Promise`를 반환합니다.
React는 cleanup 함수 자리에 Promise를 받아 무시하고, 비동기 작업이 완료된 후
컴포넌트가 이미 언마운트되었어도 `setData`를 호출해 오류를 일으킵니다.

---

#### 올바른 사용법 (Good Example)

```tsx
useEffect(() => {
  // 내부에 async 함수를 선언하고 바로 호출
  const load = async () => {
    const data = await fetchData();
    setData(data);
  };
  load();
}, []);
```

`useEffect` 콜백 자체는 동기 함수로 유지하고,
내부에 `async` 함수를 선언해 즉시 호출합니다.

메모리 누수 방지가 필요하다면 cleanup과 함께 사용하세요.

```tsx
useEffect(() => {
  let isMounted = true;

  const load = async () => {
    const data = await fetchData();
    if (isMounted) setData(data);
  };

  load();

  return () => { isMounted = false; };
}, []);
```

---

#### 정리 (Conclusion)

`useEffect`에 `async` 함수를 직접 전달하면 안 됩니다.
콜백 내부에 `async` 함수를 선언하고 즉시 호출하는 방식을 사용하세요.

컴포넌트가 언마운트될 가능성이 있다면 isMounted 플래그와 cleanup 함수를 함께 사용해
메모리 누수를 반드시 방지하세요.

---

### 추가 학습 자료 공유합니다.

- [React 공식 문서 — useEffect](https://react.dev/reference/react/useEffect)
- [devtrium — How to use async functions in useEffect](https://devtrium.com/posts/async-function-useeffect)

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

Contact: team.maeilmail@gmail.com
Socials: Velog / Github
Etc: 팀 소개 / 서비스 피드백
```

---

## 키워드 변수 정의

| 키워드 | 값 |
|--------|----|
| `{{TITLE}}` | 왜 useEffect에서 async 함수를 직접 사용하면 안 되나요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | React, useEffect, async/await, 메모리 누수 |
| `{{DATE}}` | 2026-04-14 |
| `{{SLUG}}` | why-not-use-async-in-useeffect |
| `{{SUMMARY}}` | useEffect 콜백은 동기 함수여야 하며, async 직접 사용 시 Promise 반환으로 메모리 누수가 발생합니다. |
| `{{WHY}}` | React가 cleanup 자리에 Promise를 받게 되어 언마운트 후에도 상태 업데이트가 시도됩니다. |
| `{{LANG}}` | tsx |
| `{{BAD_CODE}}` | useEffect(async () => { const data = await fetchData(); setData(data); }, []); |
| `{{BAD_CODE_EXPLAIN}}` | async 함수가 Promise를 반환해 cleanup 함수 대신 Promise가 전달됩니다. |
| `{{GOOD_CODE}}` | useEffect(() => { const load = async () => { ... }; load(); }, []); |
| `{{GOOD_CODE_EXPLAIN}}` | 내부에 async 함수를 선언해 즉시 호출하고 isMounted 플래그로 메모리 누수를 방지합니다. |
| `{{CONCLUSION}}` | useEffect에 async를 직접 전달하지 말고 내부 함수로 선언 후 호출하세요. |
| `{{RESOURCE_1_TITLE}}` | React 공식 문서 — useEffect |
| `{{RESOURCE_1_URL}}` | https://react.dev/reference/react/useEffect |
| `{{RESOURCE_2_TITLE}}` | devtrium — How to use async functions in useEffect |
| `{{RESOURCE_2_URL}}` | https://devtrium.com/posts/async-function-useeffect |
| `{{YEAR}}` | 2026 |

---

## 카테고리 목록

- `프론트엔드` — React, Next.js, TypeScript, CSS, HTML, 성능 최적화
- `CS` — 자료구조, 알고리즘, 네트워크, 운영체제
- `개발도구` — Git, 터미널, IDE

---

## 작성 체크리스트

- [x] 제목은 질문형 ("왜", "어떻게", "무엇이")으로 작성했는가
- [x] 카테고리 뱃지가 지정되었는가
- [x] 핵심 요약 문장이 3줄 이내인가
- [x] 잘못된 코드 예시가 포함되었는가
- [x] 올바른 코드 예시가 포함되었는가
- [x] 추가 학습 자료 링크가 최소 1개 이상인가
- [x] 이모지를 사용하지 않았는가
- [x] slug가 영문 소문자 + 하이픈 형식인가
