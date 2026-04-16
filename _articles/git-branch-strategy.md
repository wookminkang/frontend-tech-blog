# Git 브랜치 전략은 어떻게 선택하나요?

> **기타에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

브랜치 전략은 팀이 코드를 어떻게 나누고, 합치고, 배포할지 결정하는 규칙입니다. 가장 많이 쓰이는 세 가지는 Git Flow, GitHub Flow, Trunk-Based Development입니다. 팀 규모, 배포 주기, 서비스 특성에 따라 전략이 달라지며, 복잡한 전략이 항상 좋은 것은 아닙니다. 소규모 팀이나 빠른 배포 환경에서는 단순한 전략이 더 효과적입니다.

---

#### 왜 이런 문제가 발생하나요? (Why)

브랜치 전략 없이 개발하면 두 가지 문제가 반복됩니다.

**첫째, main 브랜치가 망가집니다.** 모든 팀원이 main에 직접 push하면 미완성 코드나 버그가 배포 브랜치에 섞입니다. 특정 커밋을 되돌리려고 해도 다른 작업과 뒤엉켜 롤백이 어렵습니다.

**둘째, 병렬 작업 중 충돌이 잦아집니다.** 기능 개발, 버그 수정, 긴급 핫픽스가 같은 브랜치에서 이루어지면 코드 충돌을 매번 수동으로 해결해야 합니다. 브랜치 전략은 이 흐름을 역할별로 분리해줍니다.

세 가지 전략의 특성을 비교하면 다음과 같습니다.

| 전략 | 브랜치 복잡도 | 배포 주기 | 적합한 팀 |
|------|-------------|-----------|----------|
| Git Flow | 높음 | 주기적 (버전 릴리즈) | 앱, 라이브러리, 버전 관리가 필요한 프로젝트 |
| GitHub Flow | 낮음 | 수시 배포 | 소규모 팀, 웹 서비스, CI/CD 환경 |
| Trunk-Based | 매우 낮음 | 하루에도 여러 번 | 대규모 팀, 피처 플래그를 활용하는 서비스 |

---

#### 예시 코드 — 잘못된 사용 (Bad Example)

```bash
# 전략 없이 main에 직접 작업하는 경우

git checkout main
git pull origin main

# 기능 개발, 버그 수정, 실험을 모두 main에서 진행
git add .
git commit -m "기능 추가 및 버그 수정"
git push origin main

# 문제: 미완성 기능과 버그 수정이 섞여 롤백이 불가능합니다.
# 특정 기능만 되돌리려면 커밋 전체 히스토리를 뒤져야 합니다.
```

```bash
# 브랜치를 만들지만 네이밍 규칙이 없는 경우

git checkout -b fix           # 어떤 수정인지 알 수 없음
git checkout -b my-branch     # 작업 내용을 알 수 없음
git checkout -b test2         # 이전 test는 어디에?

# 브랜치가 쌓이면 어느 것이 활성 브랜치인지 파악이 안 됩니다.
```

---

#### 올바른 사용법 (Good Example)

**GitHub Flow** — 빠른 배포 환경에 적합한 단순한 전략입니다.

```bash
# 1. main에서 기능 브랜치를 만듭니다.
#    네이밍 규칙: {타입}/{작업-내용}
git checkout main
git pull origin main
git checkout -b feat/add-login-page

# 2. 작업 후 커밋합니다.
git add .
git commit -m "feat: 로그인 페이지 UI 추가"

# 3. 원격에 push하고 Pull Request를 엽니다.
git push origin feat/add-login-page
# GitHub에서 PR 생성 → 코드 리뷰 → main에 머지

# 4. 머지 후 브랜치를 삭제합니다.
git branch -d feat/add-login-page
git push origin --delete feat/add-login-page
```

**Git Flow** — 버전 릴리즈가 있는 프로젝트에 적합합니다.

```bash
# 주요 브랜치 구조
# main      — 배포된 코드 (태그로 버전 관리)
# develop   — 다음 릴리즈를 위한 통합 브랜치
# feature/* — 기능 개발 (develop에서 분기, develop으로 머지)
# release/* — 배포 준비 (develop에서 분기, main + develop으로 머지)
# hotfix/*  — 긴급 수정 (main에서 분기, main + develop으로 머지)

# 기능 개발 시작
git checkout develop
git checkout -b feature/user-auth

# 기능 완료 후 develop으로 머지
git checkout develop
git merge --no-ff feature/user-auth
git branch -d feature/user-auth

# 릴리즈 준비
git checkout -b release/1.2.0
# 버전 번호 업데이트, QA 후
git checkout main
git merge --no-ff release/1.2.0
git tag -a v1.2.0 -m "Release 1.2.0"
```

**브랜치 네이밍 컨벤션** — 어떤 전략을 쓰든 일관된 네이밍이 중요합니다.

```bash
feat/로그인-기능-추가         # 새 기능
fix/헤더-레이아웃-버그        # 버그 수정
chore/의존성-업데이트         # 설정, 패키지 관리
docs/리드미-업데이트          # 문서
refactor/유저-컴포넌트-분리   # 리팩토링
hotfix/결제-오류-긴급수정     # 핫픽스
```

---

#### 정리 (Conclusion)

브랜치 전략은 팀 상황에 맞게 선택해야 합니다. 소규모 팀이나 지속적 배포 환경이라면 GitHub Flow처럼 단순한 전략이 오히려 빠릅니다. Git Flow는 버전 관리가 필요한 앱이나 라이브러리에 적합하지만, 브랜치가 많아 관리 비용이 있습니다. 어떤 전략을 선택하든 브랜치 네이밍 규칙을 팀 전체가 동의하고 일관되게 지키는 것이 핵심입니다.

| 상황 | 추천 전략 |
|------|----------|
| 1~3인 소규모 팀, 웹 서비스 | GitHub Flow |
| 모바일 앱, 라이브러리, 버전 릴리즈 필요 | Git Flow |
| 대규모 팀, 하루 수십 번 배포 | Trunk-Based Development |
| 팀 규칙이 없어 혼란스러울 때 | 먼저 GitHub Flow로 시작 |

---

### 추가 학습 자료 공유합니다.

- [Atlassian — Git Flow 워크플로우](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
- [GitHub Docs — GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow)

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
| `{{TITLE}}` | Git 브랜치 전략은 어떻게 선택하나요? |
| `{{CATEGORY}}` | 기타 |
| `{{TAGS}}` | Git, 브랜치 전략, Git Flow, GitHub Flow, Trunk-Based |
| `{{DATE}}` | 2026-04-16 |
| `{{SLUG}}` | git-branch-strategy |
| `{{SUMMARY}}` | Git Flow, GitHub Flow, Trunk-Based Development 세 가지 전략을 팀 규모와 배포 주기에 맞게 선택합니다. 소규모 팀이나 빠른 배포 환경에서는 GitHub Flow가 가장 단순하고 효과적입니다. |
| `{{WHY}}` | 전략 없이 main에 직접 push하면 미완성 코드가 섞이고 롤백이 어려워집니다. |
| `{{LANG}}` | bash |
| `{{YEAR}}` | 2026 |
