# 블로그 상세 페이지 템플릿

> 이 파일은 매일매일 블로그 아티클 작성을 위한 템플릿입니다.
> `{{키워드}}` 형식의 변수를 실제 내용으로 교체하여 사용합니다.

---

## 메타 정보 (Meta)

```
title: 왜 useState를 조건문 안에서 사용하면 안 되나요?
category: 프론트엔드
tags: React, useState, Hook, 조건부 렌더링
published_at: 2026-04-14
slug: why-not-use-usestate-in-condition
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

# 왜 useState를 조건문 안에서 사용하면 안 되나요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

`useState()`를 조건문 안에서 사용하면 안 되는 이유는 React가 `state`를 관리하는 방식이
`useState`를 호출하는 순서와 연관되어 있기 때문입니다.
렌더링마다 호출 순서가 달라지면 React 내부 상태가 뒤섞여 심각한 버그가 발생합니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

리액트는 컴포넌트 내부에서 `useState()`가 호출된 순서를 기준으로 `state`를 저장하고 업데이트합니다.

그런데 `useState()`를 조건문 안에서 호출하면 특정 렌더링 시에는 호출되고,
다른 렌더링에서는 호출되지 않을 가능성이 생깁니다.

이렇게 되면 React가 각 `useState()` 호출을 순서 기반으로 매핑하기 때문에,
이후 렌더링에서 이전에 있던 `useState()` 호출들의 대응 값이 어긋나
상태들이 사라지거나 잘못된 값으로 채워집니다.

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
function Example({ shouldUseState }) {
  if (shouldUseState) {
    // 조건문 안에서 useState 호출 — Hook 규칙 위반
    const [count, setCount] = useState(0);
  }

  return <div>Example Component</div>;
}
```

`shouldUseState`가 `true`일 때만 `useState`가 호출됩니다.
`false`로 바뀌는 순간 React 내부의 Hook 순서가 어긋나 예측 불가한 버그가 발생합니다.

---

#### 올바른 사용법 (Good Example)

```tsx
function Example({ shouldUseState }) {
  // 항상 최상위에서 호출
  const [count, setCount] = useState(0);

  if (!shouldUseState) {
    return null;  // 조건은 반환에서 처리
  }

  return <div>{count}</div>;
}
```

`useState`는 항상 컴포넌트 최상위에서 호출합니다.
조건 처리는 Hook 호출 이후에 `return`으로 분기합니다.

---

#### 같은 규칙이 적용되는 경우

이 규칙은 `useState`뿐 아니라 모든 React Hook에 동일하게 적용됩니다.

```tsx
// 잘못된 예 — useEffect도 조건문 금지
if (condition) {
  useEffect(() => { /* ... */ }, []);  // Hook 규칙 위반
}

// 올바른 예 — 조건은 Hook 내부에서
useEffect(() => {
  if (condition) {
    /* 조건에 따른 로직 */
  }
}, [condition]);
```

---

#### 정리 (Conclusion)

`useState`는 항상 컴포넌트의 최상위에서 호출해야 합니다.
조건문이나 반복문 내부에서 호출하지 않는다.

조건에 따라 상태를 다르게 처리하고 싶다면, Hook 호출 이후에 `return`으로 분기하거나
Hook 내부에서 조건 로직을 처리하세요.

---

### 추가 학습 자료 공유합니다.

- [React 공식 문서 — Hook의 규칙](https://react.dev/reference/rules/rules-of-hooks)
- [d5br5.dev — React useState 동작 원리 이해하기](https://d5br5.dev/blog/react/hooks_introduction)

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
| `{{TITLE}}` | 왜 useState를 조건문 안에서 사용하면 안 되나요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | React, useState, Hook, 조건부 렌더링 |
| `{{DATE}}` | 2026-04-14 |
| `{{SLUG}}` | why-not-use-usestate-in-condition |
| `{{SUMMARY}}` | useState는 호출 순서 기반으로 관리되므로 조건문 안에서 호출하면 순서가 달라져 버그가 발생합니다. |
| `{{WHY}}` | React는 Hook 호출 순서에 의존해 상태를 저장하므로 조건문 내부 호출 시 순서가 어긋납니다. |
| `{{LANG}}` | tsx |
| `{{BAD_CODE}}` | if (shouldUseState) { const [count, setCount] = useState(0); } |
| `{{BAD_CODE_EXPLAIN}}` | shouldUseState가 false로 바뀌면 Hook 순서가 어긋나 버그가 발생합니다. |
| `{{GOOD_CODE}}` | const [count, setCount] = useState(0); if (!shouldUseState) { return null; } |
| `{{GOOD_CODE_EXPLAIN}}` | 최상위에서 Hook을 호출하고 조건은 return으로 분기합니다. |
| `{{CONCLUSION}}` | useState는 항상 컴포넌트 최상위에서 호출하고 조건은 그 이후에 처리합니다. |
| `{{RESOURCE_1_TITLE}}` | React 공식 문서 — Hook의 규칙 |
| `{{RESOURCE_1_URL}}` | https://react.dev/reference/rules/rules-of-hooks |
| `{{RESOURCE_2_TITLE}}` | d5br5.dev — React useState 동작 원리 이해하기 |
| `{{RESOURCE_2_URL}}` | https://d5br5.dev/blog/react/hooks_introduction |
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
