# AI에게 개발을 맡기기 전에 왜 기본기가 먼저여야 하나요?

> **기타에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

"블로그 웹사이트 만들어줘"처럼 막연하게 요청하면 AI는 그럴듯해 보이지만 실제 요구사항과 다른 결과물을 만들어냅니다. 구체적인 요구사항을 전달하려면 웹의 기본 구조를 이해하고 있어야 합니다. 또한 AI가 만들어준 코드가 올바른지, 유지보수 가능한지 판단하는 것도 결국 개발자 본인의 몫입니다. AI는 작업 속도를 높여주는 도구이지, 개발자의 판단력을 대체하지 않습니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

AI 도구가 발전하면서 코드를 몰라도 개발할 수 있다는 인식이 생겼습니다. 실제로 간단한 프로토타입은 만들 수 있습니다. 하지만 실무 수준의 결과물을 만들고 유지하려면 반드시 두 가지 지점에서 한계를 만납니다.

**첫째, 요구사항이 불명확하면 결과물도 불명확합니다.** AI는 요청을 해석해 가장 일반적인 답변을 만들어냅니다. "커뮤니티 사이트 만들어줘"라고 하면 AI는 어떤 커뮤니티인지, 회원 가입이 필요한지, 게시글에 이미지가 붙는지, 댓글은 대댓글까지 지원하는지 모릅니다. 요청이 모호할수록 AI의 판단이 개발자의 판단을 대신하게 되고, 그 결과는 대부분 수정이 필요한 상태로 나옵니다.

**둘째, 검토할 기준이 없으면 잘못된 코드를 걸러낼 수 없습니다.** AI는 동작하는 코드를 만들어내지만 항상 좋은 코드를 만드는 것은 아닙니다. 전역 상태를 남발하거나, 보안 취약점이 있거나, 확장하기 어려운 구조를 만들더라도 기본기가 없으면 문제를 발견하지 못한 채 그대로 사용하게 됩니다.

기본기는 AI를 잘 쓰기 위한 전제 조건입니다.

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```
// AI에게 막연하게 요청하는 경우

"블로그 웹사이트 만들어줘"

→ AI가 임의로 결정하는 것들:
  - 프레임워크 (React? Next.js? Vue?)
  - 스타일링 방식 (CSS Modules? Tailwind? styled-components?)
  - 라우팅 구조 (/posts/[id]? /blog/[slug]?)
  - 댓글 기능 포함 여부
  - 로그인 필요 여부
  - 데이터 저장 방식 (로컬 파일? DB? CMS?)

결과: 동작은 하지만 요구사항과 다르고,
      수정하려면 전체 구조를 이해해야 합니다.
```

```
// 기본기 없이 AI 코드를 그대로 사용하는 경우

// AI가 생성한 코드 — 동작은 하지만 문제가 있습니다.
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(async () => {       // async를 useEffect에 직접 전달 (메모리 누수)
    const res = await fetch(`/api/users/${userId}`);
    const data = await res.json();
    setUser(data);
  }, []);                       // userId가 바뀌어도 재요청 안 함 (버그)

  return <div>{user?.name}</div>;
}

// 기본기가 있다면:
// - useEffect에 async 직접 전달이 잘못됐다는 걸 알 수 있습니다.
// - userId를 의존성 배열에 넣어야 한다는 걸 알 수 있습니다.
// 기본기가 없다면: 동작하는 것처럼 보여 그냥 넘어갑니다.
```

---

#### 올바른 사용법 (Good Example)

```
// 기본 구조를 이해한 뒤 구체적으로 요청하는 경우

"Next.js App Router 기반으로 블로그를 만들어줘.
 글 목록은 / 경로에 SSG로 렌더링하고,
 상세 페이지는 /articles/[slug]로 라우팅해줘.
 마크다운 파일을 _articles 폴더에 저장하고
 빌드 시 generateStaticParams로 정적 페이지를 생성해줘.
 스타일은 Tailwind CSS를 사용하고,
 카테고리 필터는 클라이언트 컴포넌트로 분리해줘."

→ 이 요청이 가능한 이유:
  - SSG와 SSR의 차이를 알기 때문에 SSG를 선택할 수 있습니다.
  - 동적 라우팅 구조를 알기 때문에 [slug] 패턴을 지정할 수 있습니다.
  - Server/Client Component 경계를 알기 때문에 분리 기준을 줄 수 있습니다.
```

```tsx
// AI가 생성한 코드를 검토하고 수정하는 경우

// AI 생성 코드
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(async () => {
    const res = await fetch(`/api/users/${userId}`);
    const data = await res.json();
    setUser(data);
  }, []);

  return <div>{user?.name}</div>;
}

// 기본기를 바탕으로 검토 후 수정한 코드
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        const res = await fetch(`/api/users/${userId}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setUser(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    };

    load();
    return () => controller.abort(); // 언마운트 시 요청 취소
  }, [userId]);                      // userId 변경 시 재요청

  return <div>{user?.name}</div>;
}
```

기본기를 갖춘 개발자는 AI와 협업하는 방식이 달라집니다. "만들어줘"에서 끝나지 않고, 결과물을 검토해 문제를 발견하고, 더 나은 구조로 유도하는 질문을 이어갑니다.

```
// AI를 도구로 활용하는 협업 흐름

1. 요구사항 구체화  — 기본 구조 이해 → 명확한 스펙 정의
2. 초안 생성       — AI가 빠르게 코드를 생성
3. 검토 및 수정    — 개발자가 로직, 성능, 보안을 검토
4. 개선 요청       — 문제를 발견하면 구체적으로 수정 요청
5. 반복            — 검토 → 수정을 반복하며 완성도를 높임

AI는 2번 단계를 빠르게 처리합니다.
1, 3, 4번은 개발자의 기본기가 없으면 진행할 수 없습니다.
```

---

#### 정리 (Conclusion)

AI는 개발 속도를 높이는 강력한 도구입니다. 하지만 좋은 요구사항을 만드는 것도, 결과물을 판단하는 것도 결국 개발자의 이해에서 나옵니다. 기본기는 AI를 잘 쓰기 위한 조건이지, AI가 대체하는 영역이 아닙니다. 웹의 동작 방식, 컴포넌트 설계, 상태 관리, 렌더링 전략을 이해할수록 AI와의 협업 품질이 올라갑니다.

| 단계 | 기본기가 없을 때 | 기본기가 있을 때 |
|------|--------------|--------------|
| 요청 | "블로그 만들어줘" | 렌더링 전략, 라우팅 구조, 컴포넌트 분리 기준을 명시 |
| 검토 | 동작하면 완성으로 판단 | 구조, 성능, 보안 관점에서 문제를 발견 |
| 수정 | 어디를 어떻게 바꿔야 할지 모름 | 구체적인 수정 방향을 AI에게 전달 |
| 결과 | AI 판단에 전적으로 의존 | AI를 도구로 활용해 빠르게 완성 |

---

### 추가 학습 자료 공유합니다.

- [Andrej Karpathy — Software 2.0](https://karpathy.medium.com/software-2-0-a64152b37c35)
- [Kent C. Dodds — The Merits of Mocking](https://kentcdodds.com/blog/the-merits-of-mocking)

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
| `{{TITLE}}` | AI에게 개발을 맡기기 전에 왜 기본기가 먼저여야 하나요? |
| `{{CATEGORY}}` | 기타 |
| `{{TAGS}}` | AI 개발, 기본기, 요구사항, 코드 검토, 협업 |
| `{{DATE}}` | 2026-04-17 |
| `{{SLUG}}` | ai-dev-and-fundamentals |
| `{{SUMMARY}}` | 막연한 요청은 막연한 결과를 만듭니다. 웹 기본 구조를 이해해야 구체적인 요구사항을 전달할 수 있고, AI가 만든 코드의 품질을 판단할 수 있습니다. 기본기는 AI를 잘 쓰기 위한 전제 조건입니다. |
| `{{WHY}}` | 요구사항이 불명확하면 AI가 임의로 판단하고, 기본기가 없으면 잘못된 코드를 걸러낼 수 없습니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
