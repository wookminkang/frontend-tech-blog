# 낙관적 업데이트(Optimistic Update)는 무엇이고 왜 사용하나요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

낙관적 업데이트(Optimistic Update)는 서버 응답을 기다리지 않고 UI를 먼저 변경한 뒤, 서버 요청이 완료되면 실제 결과로 동기화하는 패턴입니다.
요청이 성공할 것이라고 "낙관적으로" 가정하고 UI를 즉시 반영하기 때문에, 사용자는 네트워크 지연 없이 빠른 반응을 경험합니다.
요청이 실패하면 UI를 이전 상태로 되돌립니다(rollback).

---

#### 왜 이런 문제가 발생하나요? (Why)

좋아요 버튼을 클릭했을 때 서버 응답을 기다렸다가 UI를 바꾸면, 네트워크 환경에 따라 0.3초~1초 이상의 딜레이가 발생합니다.
사용자는 버튼이 눌렸는지 확신이 없어 다시 클릭하거나, 응답이 느리다고 느낍니다.

낙관적 업데이트는 클릭 즉시 UI를 반영하고, 서버 통신은 백그라운드에서 처리합니다.
대부분의 요청은 성공하기 때문에 사용자는 딜레이 없는 경험을 얻고, 실패한 경우에만 되돌립니다.

**적합한 상황:**

| 상황 | 이유 |
|------|------|
| 좋아요 / 북마크 / 팔로우 | 성공률이 높고, 실패 시 되돌려도 자연스러움 |
| 댓글 작성 | 즉각적인 피드백이 UX에 큰 영향을 줌 |
| 할 일 완료 체크 | 상태 전환이 단순하고 실패 시 롤백이 명확 |
| 장바구니 담기 | 빠른 반응이 구매 전환에 중요 |

반면 결제, 계좌 이체처럼 정확성이 최우선인 경우에는 서버 응답을 기다리는 것이 맞습니다.

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```tsx
function LikeButton({ postId, initialLiked }: { postId: string; initialLiked: boolean }) {
  const [liked, setLiked] = useState(initialLiked);
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setIsLoading(true);
    // 서버 응답이 올 때까지 UI 변경 없음 — 사용자는 버튼이 눌렸는지 모름
    await toggleLike(postId);
    setLiked((prev) => !prev);
    setIsLoading(false);
  }

  return (
    <button onClick={handleClick} disabled={isLoading}>
      {isLoading ? '...' : liked ? '좋아요 취소' : '좋아요'}
    </button>
  );
}
```

응답이 오기 전까지 버튼이 비활성화되고, 사용자는 "..." 상태를 기다려야 합니다. 네트워크가 느릴수록 체감 지연이 커집니다.

---

#### 올바른 사용법 (Good Example)

**직접 구현:**

```tsx
function LikeButton({ postId, initialLiked }: { postId: string; initialLiked: boolean }) {
  const [liked, setLiked] = useState(initialLiked);

  async function handleClick() {
    // 1. UI 먼저 변경
    const prevLiked = liked;
    setLiked((prev) => !prev);

    try {
      // 2. 백그라운드에서 서버 요청
      await toggleLike(postId);
    } catch {
      // 3. 실패 시 이전 상태로 롤백
      setLiked(prevLiked);
    }
  }

  return (
    <button onClick={handleClick}>
      {liked ? '좋아요 취소' : '좋아요'}
    </button>
  );
}
```

**TanStack Query의 `onMutate`를 활용한 구현:**

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

function LikeButton({ postId, initialLiked }: { postId: string; initialLiked: boolean }) {
  const queryClient = useQueryClient();

  const { mutate } = useMutation({
    mutationFn: () => toggleLike(postId),

    // 요청 전 — UI 먼저 업데이트
    onMutate: async () => {
      // 진행 중인 리페치가 낙관적 업데이트를 덮어쓰지 않도록 취소
      await queryClient.cancelQueries({ queryKey: ['post', postId] });

      // 현재 캐시 값 저장 (롤백용)
      const previousPost = queryClient.getQueryData(['post', postId]);

      // 캐시를 낙관적으로 업데이트
      queryClient.setQueryData(['post', postId], (old: Post) => ({
        ...old,
        liked: !old.liked,
        likeCount: old.liked ? old.likeCount - 1 : old.likeCount + 1,
      }));

      return { previousPost };
    },

    // 실패 시 — 저장해둔 이전 값으로 롤백
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(['post', postId], context?.previousPost);
    },

    // 성공/실패 관계없이 — 서버 실제 데이터로 동기화
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });

  return <button onClick={() => mutate()}>좋아요</button>;
}
```

`onMutate`에서 캐시를 즉시 업데이트하고, `onError`에서 이전 값으로 되돌립니다. `onSettled`에서 서버의 실제 값으로 최종 동기화합니다.

---

#### 정리 (Conclusion)

낙관적 업데이트는 성공을 가정하고 UI를 먼저 바꾼 뒤, 실패 시 롤백하는 패턴입니다.
좋아요, 북마크처럼 성공률이 높고 실패 시 되돌리기 쉬운 액션에 적합합니다.
TanStack Query를 사용한다면 `onMutate` → `onError`(롤백) → `onSettled`(동기화) 흐름이 표준 패턴입니다.

---

### 추가 학습 자료 공유합니다.

- [TanStack Query 공식 문서 — Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [React 공식 문서 — useOptimistic](https://react.dev/reference/react/useOptimistic)

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
| `{{TITLE}}` | 낙관적 업데이트(Optimistic Update)는 무엇이고 왜 사용하나요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | React, TanStack Query, Optimistic Update, useMutation, UX |
| `{{DATE}}` | 2026-04-20 |
| `{{SLUG}}` | optimistic-update |
| `{{SUMMARY}}` | 낙관적 업데이트는 서버 응답 전에 UI를 먼저 변경하고, 실패 시 롤백하는 패턴입니다. 좋아요처럼 성공률이 높은 액션에서 UX를 크게 개선합니다. |
| `{{WHY}}` | 서버 응답을 기다리면 네트워크 지연만큼 UI 반응이 늦어져 사용자 경험이 저하됩니다. |
| `{{LANG}}` | tsx |
| `{{YEAR}}` | 2026 |
