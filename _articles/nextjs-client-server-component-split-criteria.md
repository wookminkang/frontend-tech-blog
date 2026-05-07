# Next.js에서 'use client'를 어디에 붙여야 하는지 모르겠다면?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

`'use client'`는 선언된 파일 하나만이 아니라, 그 파일이 import하는 모든 모듈을 클라이언트 번들로 끌어당깁니다. 분리 기준은 단순합니다. "브라우저 API가 실제로 필요한 가장 작은 단위"에만 `'use client'`를 붙이는 것입니다. 상위 컴포넌트에 무심코 붙이는 순간, 그 아래 서버 컴포넌트로 남아있어야 할 것들이 모두 클라이언트 번들로 빨려 들어갑니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

Next.js App Router를 처음 쓰는 개발자들이 가장 많이 겪는 문제가 있습니다. "분명히 Next.js를 쓰고 있는데, 예전 React 프로젝트와 별 차이가 없다"는 느낌입니다.

원인은 거의 항상 하나입니다. `'use client'`를 잘못된 위치에 붙여서, 사실상 애플리케이션 전체가 클라이언트 번들로 묶여버린 것입니다.

`'use client'`는 "이 파일부터 아래는 클라이언트에서 실행된다"는 경계선을 선언하는 디렉티브입니다. 그런데 이 경계선이 생기면, 그 파일이 가져오는(import) 모든 모듈도 함께 클라이언트 번들에 포함됩니다. 서버에서만 실행돼야 할 무거운 라이브러리나 민감한 로직까지 전부 브라우저로 내려갑니다.

Next.js가 App Router에서 기본값을 Server Component로 바꾼 이유가 바로 여기에 있습니다. 데이터 fetch, DB 접근, 무거운 연산은 서버에서 처리하고, 브라우저 상호작용이 필요한 최소한의 부분만 클라이언트로 두겠다는 설계 철학입니다. 그 경계를 무너뜨리면 Next.js를 쓰는 이유가 절반 이상 사라집니다.

---

#### 가장 흔한 실수 — Provider를 layout에 직접 넣는 경우

실무에서 가장 자주 보이는 패턴입니다.

React Query를 도입할 때, `QueryClientProvider`는 반드시 `'use client'` 환경에서 실행되어야 합니다. 개발자는 앱 전체에 Provider를 감싸야 하니, `app/layout.tsx`에 직접 import해서 사용합니다.

이 순간 `layout.tsx`가 `QueryClientProvider`를 import하고, `QueryClientProvider`는 클라이언트 컴포넌트이기 때문에, `layout.tsx`도 사실상 클라이언트 번들에 포함될 위험에 노출됩니다. 레이아웃 아래에 있는 모든 페이지가 이 영향을 받습니다.

ThemeProvider, AuthProvider, 전역 상태 관리 라이브러리의 Provider도 모두 같은 이야기입니다.

이 문제가 무서운 이유는 즉각적인 빌드 에러가 발생하지 않는다는 점입니다. 앱은 정상적으로 동작하는 것처럼 보입니다. 하지만 내부적으로 서버 렌더링의 이점을 잃어가고 있습니다.

---

#### 올바른 분리 기준 (Criteria)

**기준 1 — 브라우저 API가 필요한가?**

`useState`, `useEffect`, `useRef`, `onClick`, `window`, `document` 같은 브라우저 전용 API가 필요하다면 Client Component입니다. 이 기준에 해당하지 않는다면, 굳이 `'use client'`를 붙일 이유가 없습니다.

**기준 2 — 컴포넌트 트리에서 가능한 한 아래에 붙여야 한다**

버튼 하나에 클릭 이벤트가 필요하다고 해서, 그 버튼을 포함한 섹션 전체를 Client Component로 만들 필요가 없습니다. 버튼 컴포넌트만 별도 파일로 분리하고 `'use client'`를 붙이면, 나머지 섹션은 Server Component로 남을 수 있습니다.

`'use client'` 경계는 트리의 아래로 내려갈수록 좋습니다. 상위에 붙일수록 더 많은 것이 클라이언트 번들에 포함됩니다.

**기준 3 — Provider는 반드시 래퍼(Wrapper)로 분리한다**

Provider를 사용해야 한다면, Provider만 감싸는 별도의 Client Component 파일을 만드는 것이 올바른 방법입니다. 이 파일에서 `'use client'`를 선언하고, Provider가 감싸는 `children`은 외부에서 주입받습니다.

핵심은 `children`에 있습니다. `children`으로 전달된 컴포넌트는 Client Component 내부에 있어도 서버에서 렌더링될 수 있습니다. React의 컴포지션(Composition) 모델 덕분에, 서버에서 만들어진 컴포넌트를 클라이언트 컴포넌트의 `children`으로 전달하면 서버 렌더링 결과가 그대로 유지됩니다.

**기준 4 — 데이터 fetch는 Server Component의 일이다**

데이터를 가져오기 위해 `useEffect` + `useState`를 쓰고 있다면, 그 컴포넌트는 Server Component로 바꿀 수 있을 가능성이 높습니다. Server Component는 `async/await`로 컴포넌트 내부에서 직접 데이터를 가져올 수 있습니다. 클라이언트에서 다시 API를 호출할 필요가 없습니다.

---

#### 실무에서 판단하는 흐름

새로운 컴포넌트를 만들 때 이 순서대로 생각하면 됩니다.

먼저 이 컴포넌트가 사용자의 입력, 클릭, 실시간 상태 변화를 다루는지 확인합니다. 그렇다면 Client Component입니다.

다음으로 데이터를 서버에서 가져올 수 있는지 확인합니다. 가져올 수 있다면 Server Component로 데이터를 fetch하고, 상호작용이 필요한 부분만 자식 Client Component로 분리합니다.

마지막으로 이미 Client Component 안에 있는 자식 중에서 상호작용이 없는 것들을 확인합니다. 이것들은 별도 Server Component로 분리해서 `children`이나 `props`로 전달하면, Client Component 안에서도 서버 렌더링의 이점을 유지할 수 있습니다.

---

#### 확인해볼 신호들 (Signals)

`'use client'`를 재점검할 필요가 있다는 신호들입니다.

페이지 최상단 컴포넌트에 `'use client'`가 있다면 의심해야 합니다. 페이지 대부분은 Server Component로 유지하면서 상호작용 부분만 분리하는 것이 일반적입니다.

layout.tsx에 클라이언트 라이브러리가 직접 import되어 있다면 Provider 분리 패턴을 적용해야 합니다.

데이터를 가져오는 컴포넌트가 `'use client'`이고 내부에서 `useEffect`로 fetch하고 있다면, Server Component로 전환해 직접 fetch하는 방식을 검토해야 합니다.

하나의 파일에 데이터 fetch 로직과 상호작용 로직이 함께 있다면, 분리가 필요하다는 신호입니다. 데이터 fetch는 Server Component로, 상호작용은 Client Component로 각각 분리하는 것이 원칙입니다.

---

#### 정리 (Conclusion)

클라이언트 컴포넌트와 서버 컴포넌트를 분리하는 기준은 기술적인 규칙이기 이전에 설계의 문제입니다. "이 컴포넌트가 왜 브라우저에서 실행되어야 하는가"를 스스로 설명할 수 있어야 합니다.

`'use client'`를 붙이는 이유가 명확하지 않다면, 붙이지 않는 것이 기본값입니다. App Router의 철학은 모든 것을 서버에서 시작해서 필요한 부분만 클라이언트로 내려보내는 것입니다. 반대 방향으로 설계하면 Next.js를 쓰면서도 예전 CRA 프로젝트와 다를 바 없는 결과가 나옵니다.

Provider는 반드시 래퍼로 분리하고, 인터랙션은 트리에서 가능한 한 아래에 위치시키고, 데이터 fetch는 Server Component에서 처리한다. 이 세 가지를 지키는 것만으로도 App Router를 제대로 쓰고 있는 것입니다.

---

### 추가 학습 자료 공유합니다.

- [Next.js 공식 문서 — Composition Patterns](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns)
- [Next.js 공식 문서 — Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)

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
| `{{TITLE}}` | Next.js에서 'use client'를 어디에 붙여야 하는지 모르겠다면? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | Next.js, Server Component, Client Component, use client, App Router |
| `{{DATE}}` | 2026-05-07 |
| `{{SLUG}}` | nextjs-client-server-component-split-criteria |
| `{{SUMMARY}}` | 'use client'는 선언된 파일과 그 하위 import 전체를 클라이언트 번들로 끌어당깁니다. 브라우저 API가 필요한 가장 작은 단위에만 붙이고, Provider는 래퍼로 분리하며, 데이터 fetch는 Server Component에서 처리하는 것이 핵심입니다. |
| `{{YEAR}}` | 2026 |
