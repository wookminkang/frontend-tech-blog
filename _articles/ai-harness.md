# AI 하네스(Harness)는 무엇이고 왜 필요한가요?

> **AI에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

AI 하네스(Harness)는 LLM(대형 언어 모델)의 출력을 평가하고 테스트하기 위한 프레임워크입니다. 일반 코드는 입력이 같으면 출력이 항상 같지만, AI는 같은 입력에도 매번 다른 결과를 반환할 수 있습니다. 하네스는 이 비결정적인 출력을 체계적으로 검증하고, 프롬프트가 바뀌거나 모델이 업데이트될 때 품질이 유지되는지 측정하는 역할을 합니다. AI 기능을 서비스에 통합할 때 테스트 전략 없이 배포하면 출력 품질을 보장할 수 없습니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

AI를 서비스에 통합할 때 두 가지 문제가 반복됩니다.

**첫째, 프롬프트를 수정했더니 다른 기능이 망가집니다.** 블로그 요약 기능의 프롬프트를 개선했는데, 태그 추출 기능의 품질이 떨어지는 경우입니다. 모든 AI 기능이 프롬프트와 모델에 의존하기 때문에 한 곳의 변경이 다른 곳에 영향을 줄 수 있지만, 테스트가 없으면 배포 후에야 발견합니다.

**둘째, 모델이 업데이트되면 기존 동작이 달라집니다.** OpenAI나 Anthropic이 모델을 업데이트하면 같은 프롬프트에 대한 응답 형식이나 품질이 바뀔 수 있습니다. 하네스 없이는 이 변화를 감지할 방법이 없습니다.

일반 코드 테스트와 AI 하네스의 차이를 비교하면 다음과 같습니다.

| 항목 | 일반 테스트 | AI 하네스 |
|------|-----------|----------|
| 출력 특성 | 결정적 (항상 동일) | 비결정적 (매번 다를 수 있음) |
| 검증 방식 | 정확한 값 비교 (`toBe`) | 패턴, 형식, 의미적 유사도 검증 |
| 실패 기준 | 값이 다르면 실패 | 품질 점수가 임계값 미달이면 실패 |
| 비용 | 무료 | API 호출 비용 발생 |
| 속도 | 빠름 | 느림 (네트워크 지연) |

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```typescript
// AI 출력을 테스트 없이 그대로 사용하는 경우
// 프롬프트가 바뀌거나 모델이 업데이트되면 출력 형식이 달라질 수 있습니다.

async function extractTags(content: string): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: `다음 글에서 태그를 추출해줘:\n\n${content}`,
        // 출력 형식을 지정하지 않아 "React, Next.js, TypeScript"가 될 수도
        // ["React", "Next.js", "TypeScript"]가 될 수도 있습니다.
      },
    ],
  });

  // 어떤 형식으로 오든 그냥 split — 형식이 바뀌면 런타임 에러
  return response.choices[0].message.content!.split(', ');
}
```

```typescript
// 프롬프트를 바꿀 때마다 수동으로 확인하는 경우
// 어떤 케이스가 잘 동작하고 어떤 케이스가 망가졌는지 추적할 수 없습니다.

// 개발자가 콘솔에서 직접 호출해 결과를 눈으로 확인
const result = await extractTags('React hooks에 대한 글입니다.');
console.log(result); // 매번 다를 수 있고, 히스토리가 남지 않습니다.
```

---

#### 올바른 사용법 (Good Example)

```typescript
// 1단계 — 출력 형식을 구조화해 비결정성을 줄입니다.
// JSON 형식을 강제하면 파싱 실패를 방지할 수 있습니다.

async function extractTags(content: string): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: '태그를 추출하면 반드시 JSON 배열 형식으로만 응답하세요. 예: ["React", "TypeScript"]',
      },
      {
        role: 'user',
        content: `다음 글에서 관련 태그를 최대 5개 추출해주세요:\n\n${content}`,
      },
    ],
    response_format: { type: 'json_object' }, // 구조화된 출력 강제
  });

  const parsed = JSON.parse(response.choices[0].message.content!);
  return parsed.tags ?? [];
}
```

```typescript
// 2단계 — 하네스 테스트 케이스 작성
// 실제 API를 호출하는 통합 테스트와 모킹을 사용하는 단위 테스트를 분리합니다.

// harness/tag-extraction.test.ts

describe('태그 추출 하네스', () => {
  // 단위 테스트 — API 모킹으로 형식과 처리 로직만 검증
  test('JSON 배열을 올바르게 파싱한다', async () => {
    vi.mocked(openai.chat.completions.create).mockResolvedValue({
      choices: [{ message: { content: '{"tags": ["React", "TypeScript"]}' } }],
    } as any);

    const tags = await extractTags('React와 TypeScript에 대한 글');
    expect(tags).toEqual(['React', 'TypeScript']);
    expect(Array.isArray(tags)).toBe(true);
  });

  // 통합 테스트 — 실제 API 호출 (CI에서는 스킵, 배포 전 수동 실행)
  test.skipIf(!process.env.RUN_AI_TESTS)(
    '실제 API: 프론트엔드 글에서 관련 태그를 반환한다',
    async () => {
      const tags = await extractTags(
        'useEffect에서 비동기 함수를 직접 사용하면 안 되는 이유'
      );

      // 정확한 값 비교 대신 형식과 최소 품질 기준만 검증
      expect(tags.length).toBeGreaterThan(0);
      expect(tags.length).toBeLessThanOrEqual(5);
      expect(tags.every((t) => typeof t === 'string')).toBe(true);

      // 의미적 관련성 — 핵심 키워드 포함 여부
      const lowerTags = tags.map((t) => t.toLowerCase());
      const hasRelevantTag = lowerTags.some((t) =>
        ['react', 'useeffect', 'async', '비동기'].includes(t)
      );
      expect(hasRelevantTag).toBe(true);
    },
    30_000 // AI 응답 대기 타임아웃
  );
});
```

```typescript
// 3단계 — 골든 데이터셋으로 회귀 테스트
// 프롬프트나 모델을 바꿀 때 기준 케이스 대비 품질을 측정합니다.

const GOLDEN_DATASET = [
  {
    input: 'React의 useState와 useReducer의 차이점',
    expectedTags: ['React', 'useState', 'useReducer'],
    minMatchCount: 2, // 3개 중 최소 2개는 포함되어야 합니다.
  },
  {
    input: 'Next.js App Router에서 서버 컴포넌트 사용법',
    expectedTags: ['Next.js', 'App Router', 'Server Component'],
    minMatchCount: 2,
  },
];

async function runRegressionTest() {
  let passed = 0;

  for (const { input, expectedTags, minMatchCount } of GOLDEN_DATASET) {
    const tags = await extractTags(input);
    const lowerTags = tags.map((t) => t.toLowerCase());
    const matchCount = expectedTags.filter((e) =>
      lowerTags.some((t) => t.includes(e.toLowerCase()))
    ).length;

    const ok = matchCount >= minMatchCount;
    console.log(`${ok ? 'PASS' : 'FAIL'} | "${input}" → ${tags.join(', ')}`);
    if (ok) passed++;
  }

  const score = (passed / GOLDEN_DATASET.length) * 100;
  console.log(`\n통과율: ${score}% (${passed}/${GOLDEN_DATASET.length})`);

  if (score < 80) {
    throw new Error('AI 품질 기준 미달 — 프롬프트를 검토하세요.');
  }
}
```

골든 데이터셋 기반 회귀 테스트를 배포 파이프라인에 연결하면, 프롬프트나 모델이 바뀔 때 품질 저하를 자동으로 감지할 수 있습니다.

---

#### 정리 (Conclusion)

AI 하네스는 비결정적인 LLM 출력을 체계적으로 검증하는 테스트 전략입니다. 정확한 값 비교가 아닌 형식, 형태, 의미적 관련성을 기준으로 검증합니다. 출력 형식을 구조화해 비결정성을 줄이고, 골든 데이터셋으로 회귀 테스트를 운영하면 프롬프트나 모델 변경에 안전하게 대응할 수 있습니다.

| 전략 | 방법 | 목적 |
|------|------|------|
| 출력 구조화 | `response_format: json_object` | 파싱 안정성 확보 |
| 단위 테스트 | API 모킹 + 형식 검증 | 빠른 피드백, CI 통합 |
| 통합 테스트 | 실제 API 호출 + 품질 기준 | 실제 동작 검증 |
| 회귀 테스트 | 골든 데이터셋 + 통과율 측정 | 프롬프트/모델 변경 감지 |

---

### 추가 학습 자료 공유합니다.

- [EleutherAI — LM Evaluation Harness](https://github.com/EleutherAI/lm-evaluation-harness)
- [OpenAI — Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)

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
| `{{TITLE}}` | AI 하네스(Harness)는 무엇이고 왜 필요한가요? |
| `{{CATEGORY}}` | AI |
| `{{TAGS}}` | AI, LLM, 하네스, 테스트, 프롬프트 평가 |
| `{{DATE}}` | 2026-04-17 |
| `{{SLUG}}` | ai-harness |
| `{{SUMMARY}}` | AI 하네스는 LLM의 비결정적 출력을 체계적으로 검증하는 테스트 프레임워크입니다. 출력 구조화, 단위 테스트, 골든 데이터셋 회귀 테스트를 조합해 프롬프트나 모델 변경에 안전하게 대응합니다. |
| `{{WHY}}` | AI 출력은 비결정적이라 프롬프트나 모델이 바뀌면 품질이 저하되어도 테스트 없이는 감지할 수 없습니다. |
| `{{LANG}}` | typescript |
| `{{YEAR}}` | 2026 |
