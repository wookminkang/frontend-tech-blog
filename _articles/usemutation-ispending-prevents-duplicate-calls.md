# 급하게 결제 버튼을 두 번 눌렀을 때, 저는 어떻게 중복 호출을 막았을까요?

> **실무 경험에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

사용자가 결제하기 버튼을 빠르게 두 번 누르면 API 호출이 두 번 발생합니다. TanStack Query v5의 `useMutation`은 요청이 진행 중인 동안 `isPending`을 `true`로 반환합니다. 이 값을 버튼의 `disabled` 속성에 연결하는 것만으로 중복 호출을 막을 수 있습니다. 별도의 로딩 상태를 직접 선언하고 관리하던 방식을 대체합니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

결제하기 버튼은 클릭 즉시 서버에 요청을 보냅니다. 그런데 응답이 돌아오기까지는 시간이 걸립니다. 이 사이에 사용자가 버튼을 한 번 더 누르면 동일한 API가 다시 호출됩니다. 결제 요청이 두 번 처리되거나, 서버 측에서 중복 처리를 방어하더라도 불필요한 트래픽이 발생합니다.

TanStack Query를 도입하기 전에는 이 문제를 직접 해결해야 했습니다. `isSubmitting` 같은 이름의 상태값을 `useState`로 하나 선언하고, 버튼을 클릭하는 순간 `true`로 바꾸고, 응답이 오면 다시 `false`로 바꾸는 코드를 매번 작성했습니다. 버튼의 `disabled`에는 이 상태값을 연결했습니다. 기능은 동작하지만, API를 호출하는 함수마다 이 패턴을 반복해야 했습니다.

TanStack Query v5의 `useMutation`은 이 반복을 없애줍니다.

`useMutation`은 `mutate`를 호출하는 순간부터 응답을 받을 때까지 `isPending`을 `true`로 유지합니다. 클라이언트에서 서버로 요청을 보내고 응답이 오기 전까지의 구간이 정확하게 `isPending === true`인 구간입니다. 버튼의 `disabled` 속성에 `isPending`을 그대로 연결하면, 첫 번째 요청이 완료되기 전에는 버튼 자체가 비활성화되어 두 번째 클릭이 전달되지 않습니다.

로딩 상태를 따로 선언하고, 요청 전후로 값을 바꾸는 코드가 필요 없어집니다. `useMutation`이 그 역할을 대신하기 때문입니다.

---

#### useMutation과 useQuery의 에러 처리 방식 차이

`useMutation`을 도입하면서 한 가지 더 달라진 점이 있었습니다. 에러를 처리하는 위치입니다.

`useQuery`에서는 `throwOnError: true` 옵션을 설정하면 에러가 발생했을 때 가장 가까운 ErrorBoundary로 에러가 전파됩니다. 컴포넌트 바깥에서 에러를 받아 처리하는 방식입니다.

`useMutation`은 다릅니다. 반환값에 포함된 `isError`와 `error`를 구조 분해 할당으로 꺼내 컴포넌트 내부에서 직접 처리합니다. 결제 실패 메시지를 화면에 바로 표시하거나, 특정 에러 코드에 따라 다른 안내문을 보여주는 식입니다.

이 차이는 각 훅의 특성에서 비롯됩니다. `useQuery`는 데이터를 불러오는 과정에서 발생한 에러를 페이지 단위로 처리하는 것이 자연스럽습니다. 반면 `useMutation`은 사용자의 액션에 의해 발생하는 요청이기 때문에, 에러의 맥락이 해당 인터랙션에 밀접하게 연결되어 있습니다. 결제 실패가 왜 일어났는지, 어떤 안내를 보여줄지는 결제 버튼이 있는 컴포넌트가 가장 잘 알고 있습니다.

---

#### 정리 (Conclusion)

`useMutation`의 `isPending`은 중복 클릭 방지를 위해 따로 상태를 만들 필요를 없애줍니다. 요청이 진행 중인 구간을 라이브러리가 정확하게 관리하기 때문에, 개발자는 그 값을 UI에 연결하는 데만 집중하면 됩니다.

에러 처리 방식도 `useQuery`와 구분해서 이해해 두면 도움이 됩니다. 데이터를 가져오는 흐름의 에러는 ErrorBoundary로, 사용자의 액션에서 비롯된 에러는 컴포넌트 내부에서 `isError`와 `error`로 처리하는 것이 TanStack Query가 의도한 방식입니다.

---

### 추가 학습 자료 공유합니다.

- [TanStack Query 공식 문서 — useMutation](https://tanstack.com/query/latest/docs/framework/react/reference/useMutation)
- [TanStack Query 공식 문서 — Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)

---

## 키워드 변수 정의

| 키워드 | 값 |
|--------|----|
| `{{TITLE}}` | 급하게 결제 버튼을 두 번 눌렀을 때, 저는 어떻게 중복 호출을 막았을까요? |
| `{{CATEGORY}}` | 실무 경험 |
| `{{TAGS}}` | React, TanStack Query, useMutation, isPending, 중복 요청 방지, 실무 |
| `{{DATE}}` | 2026-05-12 |
| `{{SLUG}}` | usemutation-ispending-prevents-duplicate-calls |
| `{{SUMMARY}}` | useMutation의 isPending을 버튼 disabled에 연결하는 것만으로 중복 클릭 문제를 해결할 수 있습니다. 직접 로딩 상태를 관리하던 방식을 대체하고, 에러 처리도 isError와 error로 컴포넌트 내부에서 직접 다룹니다. |
