# 자바스크립트 Promise는 어떻게 동작하나요?

> **프론트엔드에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

Promise는 비동기 작업의 완료 또는 실패를 나타내는 객체입니다. 콜백 함수를 중첩해서 쓰던 방식의 단점을 해결하기 위해 등장했습니다. `pending`, `fulfilled`, `rejected` 세 가지 상태를 가지며, 한 번 상태가 바뀌면 되돌릴 수 없습니다. `.then()`, `.catch()`, `.finally()`로 비동기 결과를 체인 형태로 처리하고, `async/await`은 Promise 위에서 동작하는 문법적 편의 기능입니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

JavaScript는 싱글 스레드로 동작합니다. 네트워크 요청처럼 시간이 걸리는 작업을 기다리는 동안 메인 스레드가 멈추면 화면 전체가 응답하지 않습니다. 그래서 JavaScript는 비동기 작업을 콜백 함수로 처리해왔습니다.

콜백 방식은 작업이 중첩될수록 코드가 깊어집니다. 사용자 정보를 가져온 뒤 그 결과로 게시글을 가져오고, 게시글 결과로 댓글을 가져오는 순서가 있는 비동기 요청이 3단계만 넘어가도 오른쪽으로 무한히 들여쓰기되는 "콜백 지옥"이 생깁니다. 에러 처리도 각 콜백마다 따로 해야 해서 중복 코드가 늘어납니다.

Promise는 이 문제를 두 가지 방식으로 해결합니다. 첫째, 비동기 결과를 객체로 감싸 `.then()`으로 체인을 이어갈 수 있습니다. 둘째, `.catch()` 하나로 체인 전체의 에러를 처리할 수 있습니다.

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```js
// 콜백 지옥 — 순서 있는 비동기 작업이 중첩될수록 깊어짐
getUser(userId, function (err, user) {
  if (err) {
    handleError(err);
    return;
  }
  getPosts(user.id, function (err, posts) {
    if (err) {
      handleError(err);
      return;
    }
    getComments(posts[0].id, function (err, comments) {
      if (err) {
        handleError(err);
        return;
      }
      // 여기서 comments를 사용
      console.log(comments);
    });
  });
});
```

에러 처리가 각 단계마다 반복되고, 중첩이 깊어질수록 어느 단계에서 문제가 생겼는지 파악하기 어렵습니다. 새 단계를 추가할 때마다 전체 들여쓰기가 한 단계씩 더 깊어집니다.

---

#### 올바른 사용법 (Good Example)

**Promise 체인으로 작성하기**

```js
getUser(userId)
  .then((user) => getPosts(user.id))
  .then((posts) => getComments(posts[0].id))
  .then((comments) => {
    console.log(comments);
  })
  .catch((err) => {
    // 세 단계 중 어디서든 에러가 발생하면 여기서 처리
    handleError(err);
  })
  .finally(() => {
    setLoading(false);
  });
```

`.then()`은 이전 단계의 반환값을 다음 `.then()`으로 전달합니다. `.catch()`는 체인의 어느 단계에서든 에러가 발생하면 실행됩니다. `.finally()`는 성공과 실패에 관계없이 항상 실행돼 로딩 상태 해제 같은 정리 작업에 씁니다.

**async/await로 동기 코드처럼 작성하기**

```ts
async function loadComments(userId: string) {
  try {
    const user = await getUser(userId);
    const posts = await getPosts(user.id);
    const comments = await getComments(posts[0].id);
    return comments;
  } catch (err) {
    handleError(err);
  } finally {
    setLoading(false);
  }
}
```

`async/await`은 Promise를 감싼 문법입니다. `await`은 Promise가 `fulfilled` 또는 `rejected` 상태가 될 때까지 해당 함수의 실행을 멈추고 기다립니다. 메인 스레드는 멈추지 않습니다. `try/catch`로 에러를 처리하므로 동기 코드와 구조가 같아 읽기 쉽습니다.

**여러 비동기 작업을 병렬로 실행하기**

```ts
// 순차 실행 — user 완료 후 posts 시작 (느림)
const user = await getUser(userId);
const posts = await getPosts(userId);

// 병렬 실행 — 두 요청을 동시에 시작 (빠름)
const [user, posts] = await Promise.all([
  getUser(userId),
  getPosts(userId),
]);
```

서로 의존하지 않는 요청을 `await`으로 순서대로 기다리면 이전 요청이 완료될 때까지 다음 요청이 시작되지 않습니다. `Promise.all`은 여러 Promise를 동시에 시작하고 모두 완료될 때 결과를 배열로 반환합니다. 하나라도 실패하면 전체가 `rejected`로 처리됩니다.

---

#### 정리 (Conclusion)

Promise는 비동기 작업을 객체로 표현해 콜백 중첩 문제를 해결합니다. `async/await`은 Promise를 더 읽기 쉽게 만드는 문법이며, 내부적으로는 동일하게 Promise로 동작합니다.

| 방법 | 적합한 상황 |
|------|-------------|
| `.then()` / `.catch()` | 간단한 체인, 함수형 스타일 선호 |
| `async/await` | 순서가 있는 비동기 작업, 조건문·반복문 포함 |
| `Promise.all` | 서로 독립적인 여러 요청을 동시에 실행 |
| `Promise.allSettled` | 일부 실패해도 나머지 결과를 모두 받아야 할 때 |
| `Promise.race` | 여러 요청 중 가장 빠른 결과만 사용할 때 |

`async/await`을 쓸 때 흔히 하는 실수는 독립적인 요청을 불필요하게 순서대로 기다리는 것입니다. 의존 관계가 없다면 `Promise.all`로 병렬 처리해 응답 시간을 줄이는 것이 좋습니다.

---

### 추가 학습 자료 공유합니다.

- [MDN — Promise](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- [MDN — async function](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Statements/async_function)

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
| `{{TITLE}}` | 자바스크립트 Promise는 어떻게 동작하나요? |
| `{{CATEGORY}}` | 프론트엔드 |
| `{{TAGS}}` | JavaScript, Promise, async/await, 비동기, 콜백 |
| `{{DATE}}` | 2026-04-18 |
| `{{SLUG}}` | javascript-promise |
| `{{SUMMARY}}` | Promise는 비동기 작업의 결과를 나타내는 객체로, 콜백 지옥 문제를 해결합니다. .then()/.catch() 체인과 async/await 문법으로 처리하고, Promise.all로 독립적인 요청을 병렬 실행할 수 있습니다. |
| `{{WHY}}` | 콜백 중첩은 순서 있는 비동기 작업에서 코드가 깊어지고 에러 처리가 각 단계마다 반복됩니다. Promise는 결과를 객체로 감싸 체인과 단일 에러 처리를 가능하게 합니다. |
| `{{LANG}}` | js |
| `{{YEAR}}` | 2026 |
