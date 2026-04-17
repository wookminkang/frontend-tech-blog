# 모노레포는 무엇이고 언제 도입하나요?

> **기타에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

모노레포(Monorepo)는 여러 프로젝트나 패키지를 하나의 git 저장소에서 관리하는 방식입니다. 각 프로젝트를 별도 저장소로 나눈 멀티레포(Multirepo)와 반대되는 개념입니다. 공통 코드를 패키지로 추출해 재사용하고, 변경 사항이 여러 프로젝트에 미치는 영향을 한 번에 파악할 수 있습니다. 대표적인 도구로 Turborepo, Nx, pnpm workspaces가 있으며, 프론트엔드에서는 Turborepo + pnpm 조합이 많이 쓰입니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

프로젝트 규모가 커지면 멀티레포 방식에서 두 가지 문제가 반복됩니다.

**첫째, 공통 코드가 중복됩니다.** 웹 앱과 모바일 앱이 같은 유틸 함수, 타입 정의, UI 컴포넌트를 사용할 때, 저장소가 분리되어 있으면 코드를 복사하거나 npm 패키지로 배포해야 합니다. 공통 코드를 수정할 때마다 패키지를 새 버전으로 배포하고 각 저장소에서 버전을 올리는 과정이 반복됩니다.

**둘째, 변경 영향 범위를 추적하기 어렵습니다.** API 타입이 바뀌면 프론트엔드, 어드민, 모바일 앱 모두 영향을 받습니다. 저장소가 나뉘어 있으면 어떤 프로젝트가 영향을 받는지 파악하기 위해 각 저장소를 직접 확인해야 합니다.

모노레포는 이 두 문제를 구조로 해결합니다.

| 비교 항목 | 멀티레포 | 모노레포 |
|----------|---------|---------|
| 공통 코드 관리 | 패키지 배포 후 버전 업 | 로컬 패키지로 바로 참조 |
| 변경 영향 파악 | 저장소별 직접 확인 | 단일 저장소에서 한 번에 파악 |
| 의존성 설치 | 저장소마다 개별 설치 | 루트에서 한 번에 설치 |
| CI/CD | 저장소별 파이프라인 | 변경된 패키지만 선택적 빌드 |
| 초기 설정 비용 | 낮음 | 높음 |

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```bash
# 멀티레포 방식 — 공통 유틸을 각 저장소에 복사하는 경우

# 저장소 A (웹 앱)
my-web-app/
└── src/utils/formatDate.ts   ← 직접 작성

# 저장소 B (어드민)
my-admin/
└── src/utils/formatDate.ts   ← 동일한 함수를 복사

# formatDate 버그 수정 시 두 저장소를 모두 수정해야 합니다.
# 저장소가 늘어날수록 수정 범위가 계속 커집니다.
```

```bash
# npm 패키지로 분리했지만 버전 관리가 번거로운 경우

# 1. 공통 패키지 수정
cd packages/shared-utils
npm version patch       # 버전 올리기
npm publish             # npm에 배포

# 2. 각 저장소에서 버전 업데이트
cd ../my-web-app && npm install shared-utils@1.0.1
cd ../my-admin && npm install shared-utils@1.0.1

# 공통 코드를 한 줄 바꿀 때마다 이 과정을 반복해야 합니다.
```

---

#### 올바른 사용법 (Good Example)

```
# Turborepo + pnpm 기반 모노레포 기본 구조

my-monorepo/
├── apps/
│   ├── web/          ← Next.js 웹 앱
│   └── admin/        ← React 어드민
├── packages/
│   ├── ui/           ← 공통 UI 컴포넌트
│   ├── utils/        ← 공통 유틸 함수
│   └── tsconfig/     ← 공통 TypeScript 설정
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

```yaml
# pnpm-workspace.yaml
# pnpm이 apps/와 packages/ 아래 폴더를 워크스페이스로 인식합니다.

packages:
  - 'apps/*'
  - 'packages/*'
```

```json
// packages/utils/package.json
// 로컬 패키지로 선언합니다. npm에 배포하지 않아도 됩니다.

{
  "name": "@my-app/utils",
  "version": "0.0.0",
  "main": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  }
}
```

```json
// apps/web/package.json
// 로컬 패키지를 workspace 프로토콜로 참조합니다.
// 버전 배포 없이 packages/utils의 코드를 바로 사용합니다.

{
  "name": "web",
  "dependencies": {
    "@my-app/utils": "workspace:*",
    "@my-app/ui": "workspace:*"
  }
}
```

```json
// turbo.json
// 어떤 태스크가 어떤 태스크에 의존하는지 정의합니다.
// 변경되지 않은 패키지는 캐시를 사용해 빌드를 건너뜁니다.

{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],  // 의존 패키지를 먼저 빌드
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": {}
  }
}
```

```bash
# 루트에서 전체 빌드 — Turborepo가 의존성 그래프를 분석해 병렬 실행합니다.
pnpm turbo build

# 특정 앱만 실행
pnpm turbo dev --filter=web

# packages/utils가 변경됐을 때 영향받는 앱만 빌드
pnpm turbo build --filter=...@my-app/utils
```

`workspace:*`로 참조한 패키지는 npm 배포 없이 로컬 파일을 직접 읽습니다. `packages/utils`의 코드를 수정하면 `apps/web`에 즉시 반영됩니다.

---

#### 정리 (Conclusion)

모노레포는 공통 코드 중복과 변경 영향 추적 문제를 구조로 해결합니다. 단일 저장소에서 모든 프로젝트를 관리하고, 로컬 패키지 참조로 배포 없이 공통 코드를 공유합니다. 초기 설정 비용이 있어 프로젝트가 하나뿐이거나 공유 코드가 거의 없다면 오버엔지니어링이 될 수 있습니다. 공통 코드가 생기기 시작하거나 앱이 2개 이상으로 늘어날 시점이 도입을 검토할 적기입니다.

| 상황 | 선택 |
|------|------|
| 프로젝트가 1개, 공유 코드 없음 | 멀티레포 (단일 저장소) 유지 |
| 앱이 2개 이상, 공통 컴포넌트/유틸 존재 | 모노레포 도입 검토 |
| 팀 규모가 작고 빠른 초기 설정 필요 | pnpm workspaces만 먼저 적용 |
| CI 빌드 속도가 중요한 경우 | Turborepo 캐시 활용 |

---

### 추가 학습 자료 공유합니다.

- [Turborepo 공식 문서 — Getting Started](https://turbo.build/repo/docs)
- [pnpm 공식 문서 — Workspaces](https://pnpm.io/workspaces)

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
| `{{TITLE}}` | 모노레포는 무엇이고 언제 도입하나요? |
| `{{CATEGORY}}` | 기타 |
| `{{TAGS}}` | 모노레포, Turborepo, pnpm, Monorepo, 패키지 관리 |
| `{{DATE}}` | 2026-04-17 |
| `{{SLUG}}` | monorepo-basics |
| `{{SUMMARY}}` | 모노레포는 여러 프로젝트를 하나의 저장소에서 관리하는 방식입니다. 공통 코드를 로컬 패키지로 공유하고, Turborepo로 변경된 패키지만 선택적으로 빌드합니다. |
| `{{WHY}}` | 멀티레포에서는 공통 코드를 복사하거나 npm에 배포해야 하고, 변경 영향 범위를 저장소마다 직접 확인해야 합니다. |
| `{{LANG}}` | bash |
| `{{YEAR}}` | 2026 |
