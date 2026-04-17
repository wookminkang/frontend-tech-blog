# 브라우저는 HTML을 받아서 화면에 어떻게 그리나요?

> **기타에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

브라우저가 HTML 파일을 받아 화면에 그리기까지 여섯 단계를 거칩니다. HTML을 파싱해 DOM을 만들고, CSS를 파싱해 CSSOM을 만든 뒤 두 트리를 합쳐 Render Tree를 구성합니다. 그 다음 각 요소의 크기와 위치를 계산하는 Layout, 색상과 스타일을 입히는 Paint, 레이어를 합치는 Composite 순서로 진행됩니다. 이 과정에서 DOM이나 스타일을 변경하면 Layout부터 다시 계산하는 Reflow가 발생할 수 있어 성능에 직접 영향을 줍니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

렌더링 과정을 모르면 코드가 왜 느린지 파악하기 어렵습니다. 특히 두 가지 상황에서 성능 문제가 반복됩니다.

**첫째, Reflow를 불필요하게 유발합니다.** `element.style.width`를 읽으면 브라우저는 최신 Layout 값을 계산하기 위해 렌더링 파이프라인을 강제로 실행합니다. 루프 안에서 스타일을 읽고 쓰는 작업을 반복하면 매 반복마다 Reflow가 발생해 수십 배 느려집니다. 이를 Layout Thrashing이라 합니다.

**둘째, Paint가 필요 없는데 Paint를 유발합니다.** `transform`과 `opacity`는 Composite 단계만 사용하기 때문에 CPU가 아닌 GPU에서 처리됩니다. 그러나 `top`, `left`, `width`를 변경하면 Layout → Paint → Composite 전 과정이 다시 실행됩니다. 애니메이션에 `top` 대신 `transform`을 쓰는 이유가 여기에 있습니다.

브라우저 렌더링 파이프라인 전체 흐름입니다.

```
HTML 수신
    │
    ▼
1. DOM 생성       HTML 파싱 → 노드 트리
2. CSSOM 생성     CSS 파싱 → 스타일 트리
    │
    ▼
3. Render Tree    DOM + CSSOM 결합 (display:none 제외)
    │
    ▼
4. Layout         각 노드의 크기, 위치 계산 (Reflow)
    │
    ▼
5. Paint          색상, 배경, 텍스트 등 픽셀 그리기
    │
    ▼
6. Composite      레이어를 합쳐 최종 화면 출력
```

DOM이나 CSS가 변경되면 변경 범위에 따라 파이프라인의 특정 단계부터 다시 실행됩니다.

| 변경 종류 | 재실행 시작 단계 | 비용 |
|----------|--------------|------|
| 크기, 위치 변경 (`width`, `margin`, `top`) | Layout | 높음 |
| 색상, 배경 변경 (`color`, `background`) | Paint | 중간 |
| 변형, 투명도 (`transform`, `opacity`) | Composite | 낮음 |
| `display: none` 토글 | Layout | 높음 |

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```javascript
// Layout Thrashing — 루프 안에서 스타일 읽기와 쓰기를 반복하는 경우
// 읽기(offsetWidth)마다 브라우저가 강제로 Layout을 재계산합니다.

const items = document.querySelectorAll('.item');

items.forEach((item) => {
  const width = item.offsetWidth;          // Layout 강제 실행 (읽기)
  item.style.width = width * 1.2 + 'px';  // Layout 무효화 (쓰기)
  // 다음 반복의 읽기가 다시 Layout을 강제로 실행합니다.
});
// items가 100개면 Layout이 100번 실행됩니다.
```

```css
/* top/left로 애니메이션 — Layout → Paint → Composite 전 과정 재실행 */

.box {
  position: absolute;
  top: 0;
  transition: top 0.3s ease; /* top 변경은 Layout을 유발합니다. */
}
.box.moved {
  top: 200px;
}
```

---

#### 올바른 사용법 (Good Example)

```javascript
// 읽기를 먼저 모아두고, 쓰기를 한 번에 처리합니다.
// Layout은 한 번만 실행됩니다.

const items = document.querySelectorAll('.item');

// 1단계: 읽기 일괄 처리
const widths = Array.from(items).map((item) => item.offsetWidth);

// 2단계: 쓰기 일괄 처리
items.forEach((item, i) => {
  item.style.width = widths[i] * 1.2 + 'px';
});
```

```javascript
// requestAnimationFrame으로 렌더링 타이밍에 맞춰 DOM 변경
// 브라우저가 다음 프레임을 그리기 직전에 실행되어 불필요한 재계산을 줄입니다.

function animate() {
  requestAnimationFrame(() => {
    element.style.transform = `translateX(${x}px)`;
    x += 2;
    if (x < 300) animate();
  });
}
animate();
```

```css
/* transform으로 애니메이션 — Composite 단계만 실행, GPU 처리 */

.box {
  position: absolute;
  transform: translateY(0);
  transition: transform 0.3s ease; /* Layout, Paint 없이 GPU에서 처리 */
}
.box.moved {
  transform: translateY(200px);
}
```

```css
/* will-change로 레이어 분리 예고
   브라우저가 미리 GPU 레이어를 만들어 애니메이션 시 Composite만 실행합니다.
   남용하면 메모리 사용량이 늘어나므로 실제로 애니메이션이 있는 요소에만 사용합니다. */

.animated-card {
  will-change: transform;
}
```

```javascript
// IntersectionObserver — scroll 이벤트 대신 사용
// scroll 이벤트는 스크롤마다 Layout을 유발할 수 있습니다.
// IntersectionObserver는 요소가 뷰포트에 진입/이탈할 때만 콜백을 실행합니다.

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
});

document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
```

---

#### 정리 (Conclusion)

브라우저 렌더링은 DOM 생성 → CSSOM 생성 → Render Tree → Layout → Paint → Composite 순서로 진행됩니다. DOM이나 CSS가 변경되면 변경 종류에 따라 Layout부터 다시 실행되는 Reflow가 발생합니다. 성능을 최적화하려면 Layout을 유발하는 속성 읽기/쓰기를 분리하고, 애니메이션에는 `transform`과 `opacity`를 우선적으로 사용해 Composite 단계만 거치도록 하는 것이 핵심입니다.

| 원칙 | 방법 |
|------|------|
| Layout Thrashing 방지 | 스타일 읽기와 쓰기를 루프 밖으로 분리 |
| 애니메이션 성능 | `top/left` 대신 `transform`, `opacity` 사용 |
| 렌더링 타이밍 | DOM 변경은 `requestAnimationFrame` 안에서 처리 |
| 스크롤 이벤트 최적화 | `scroll` 대신 `IntersectionObserver` 활용 |
| GPU 레이어 힌트 | 애니메이션 요소에만 `will-change: transform` 제한적 사용 |

---

### 추가 학습 자료 공유합니다.

- [Google Developers — 렌더링 성능](https://web.dev/articles/rendering-performance)
- [MDN — 브라우저는 어떻게 작동하는가](https://developer.mozilla.org/ko/docs/Web/Performance/How_browsers_work)

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
| `{{TITLE}}` | 브라우저는 HTML을 받아서 화면에 어떻게 그리나요? |
| `{{CATEGORY}}` | 기타 |
| `{{TAGS}}` | 브라우저 렌더링, Reflow, Layout Thrashing, transform, 성능 최적화 |
| `{{DATE}}` | 2026-04-17 |
| `{{SLUG}}` | browser-rendering-process |
| `{{SUMMARY}}` | HTML → DOM → CSSOM → Render Tree → Layout → Paint → Composite 순서로 렌더링됩니다. DOM/CSS 변경 시 Layout부터 재실행되는 Reflow 비용을 줄이는 것이 프론트엔드 성능 최적화의 핵심입니다. |
| `{{WHY}}` | 렌더링 파이프라인을 모르면 Layout Thrashing이나 불필요한 Reflow를 유발하는 코드를 작성하게 됩니다. |
| `{{LANG}}` | javascript |
| `{{YEAR}}` | 2026 |
