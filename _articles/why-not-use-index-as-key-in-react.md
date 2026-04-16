# 블로그 상세 페이지 템플릿

> 이 파일은 매일매일 블로그 아티클 작성을 위한 템플릿입니다.
> `{{키워드}}` 형식의 변수를 실제 내용으로 교체하여 사용합니다.

---

## 메타 정보 (Meta)

```
title: 왜 React에서 배열의 index를 key로 사용하면 안 되나요?
category: 프론트엔드
tags: React, key, 리스트 렌더링, 성능 최적화
published_at: 2026-04-14
slug: why-not-use-index-as-key-in-react
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

# 왜 React에서 배열의 index를 key로 사용하면 안 되나요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

React는 key를 기준으로 이전 렌더링과 현재 렌더링의 컴포넌트를 비교합니다.
배열의 index를 key로 사용하면 리스트 순서가 바뀔 때 React가 잘못된 컴포넌트를 재사용해 예상치 못한 버그가 발생합니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

React는 리스트를 렌더링할 때 각 아이템을 key 값으로 추적합니다.
key가 동일하면 React는 "같은 컴포넌트"라고 판단하고 DOM을 재사용합니다.

index를 key로 사용하면 아이템을 추가하거나 삭제하거나 순서를 변경할 때, 실제로는 다른 아이템인데 key가 같아져 React가 잘못된 컴포넌트를 재사용하게 됩니다.

이로 인해 발생하는 문제는 다음과 같습니다.

- 입력창(input)의 값이 의도치 않은 아이템에 남아있음
- 애니메이션이 잘못된 아이템에 적용됨
- 체크박스 상태가 뒤바뀜
- 불필요한 리렌더링으로 성능 저하

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
const TodoList = ({ todos }: { todos: Todo[] }) => {
  return (
    <ul>
      {todos.map((todo, index) => (
        <TodoItem key={index} todo={todo} />
      ))}
    </ul>
  );
};
```

위 코드에서 todos 배열의 맨 앞에 새 아이템을 추가하면, 기존 아이템들의 index가 모두 1씩 밀립니다.
React는 key가 0인 컴포넌트가 여전히 존재한다고 판단해 첫 번째 TodoItem을 재사용합니다.
이 경우 해당 컴포넌트 내부의 로컬 상태(예: input 값, 체크박스)가 엉뚱한 아이템에 붙게 됩니다.

---

#### 올바른 사용법 (Good Example)

```tsx
const TodoList = ({ todos }: { todos: Todo[] }) => {
  return (
    <ul>
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
};
```

각 아이템의 고유한 id를 key로 사용하면 React가 아이템을 정확하게 추적합니다.
배열의 순서가 바뀌어도 key가 유지되기 때문에 올바른 컴포넌트를 재사용하거나 업데이트합니다.

고유 id가 없는 경우에는 crypto.randomUUID() 또는 nanoid 라이브러리로 생성하되, 렌더링 중이 아닌 데이터 생성 시점에 부여해야 합니다.

```tsx
// 데이터 생성 시점에 id 부여 (렌더링 중 생성 금지)
const newTodo = {
  id: crypto.randomUUID(),
  text: '새 할일',
  done: false,
};
```

---

#### 정리 (Conclusion)

key는 React가 리스트 아이템을 구별하는 유일한 기준입니다.
index는 배열 순서가 바뀌거나 아이템이 추가/삭제될 때마다 바뀌기 때문에 key로 적합하지 않습니다.

반드시 각 아이템의 고유한 id를 key로 사용하세요.
단, 리스트가 정적이고 절대 순서가 바뀌지 않는 경우에만 index를 key로 사용하는 것이 허용됩니다.

---

### 추가 학습 자료 공유합니다.

- [React 공식 문서 — 리스트와 key](https://ko.react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key)
- [Robin Wieruch — Index as a key is an anti-pattern](https://robinwieruch.de/react-list-key)

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
| `{{TITLE}}` | 왜 React에서 배열의 index를 key로 사용하면 안 되나요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | React, key, 리스트 렌더링, 성능 최적화 |
| `{{DATE}}` | 2026-04-14 |
| `{{SLUG}}` | why-not-use-index-as-key-in-react |
| `{{SUMMARY}}` | React는 key를 기준으로 컴포넌트를 비교합니다. index를 key로 사용하면 렌더링 버그가 발생합니다. |
| `{{WHY}}` | index가 바뀌면 React가 다른 컴포넌트를 같은 컴포넌트로 오인해 잘못 재사용합니다. |
| `{{LANG}}` | tsx |
| `{{BAD_CODE}}` | todos.map((todo, index) => <TodoItem key={index} />) |
| `{{BAD_CODE_EXPLAIN}}` | index가 밀리면 React가 잘못된 컴포넌트를 재사용합니다. |
| `{{GOOD_CODE}}` | todos.map((todo) => <TodoItem key={todo.id} />) |
| `{{GOOD_CODE_EXPLAIN}}` | 고유 id를 사용하면 React가 아이템을 정확하게 추적합니다. |
| `{{CONCLUSION}}` | key는 항상 고유한 id를 사용하세요. 정적 리스트에만 index 허용. |
| `{{RESOURCE_1_TITLE}}` | React 공식 문서 — 리스트와 key |
| `{{RESOURCE_1_URL}}` | https://ko.react.dev/learn/rendering-lists |
| `{{RESOURCE_2_TITLE}}` | Index as a key is an anti-pattern |
| `{{RESOURCE_2_URL}}` | https://robinwieruch.de/react-list-key |
| `{{YEAR}}` | 2026 |

---

## 카테고리 목록

아티클 작성 시 아래 카테고리 중 하나를 선택합니다.

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
