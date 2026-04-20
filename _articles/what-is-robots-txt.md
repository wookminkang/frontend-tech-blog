# robots.txt는 무엇이고 어떻게 설정하나요?

> **기타에 관련한 질문이에요.**

---

#### 핵심 요약 (Summary)

robots.txt는 검색 엔진 크롤러(봇)에게 "내 사이트의 어느 페이지를 수집해도 되고, 어느 페이지는 수집하지 말라"고 알려주는 텍스트 파일입니다.
사이트 루트에 위치해야 하며(`example.com/robots.txt`), 크롤러는 페이지를 수집하기 전에 이 파일을 먼저 확인합니다.
검색 결과에 노출되길 원하는 페이지는 허용하고, 관리자 페이지나 개인 정보가 담긴 페이지는 차단하는 데 활용합니다.

---

#### 왜 필요한가요? (Why)

Google, Bing 같은 검색 엔진은 봇을 통해 웹을 탐색하며 페이지를 수집합니다. 이 과정을 크롤링이라고 하고, 수집된 페이지는 검색 결과에 노출될 수 있습니다.

robots.txt 없이 모든 페이지를 열어두면 두 가지 문제가 생길 수 있습니다.

첫째, 검색 결과에 노출되면 안 되는 페이지(관리자 대시보드, 결제 완료 페이지, 내부 API 문서)가 인덱싱될 수 있습니다. 둘째, 크롤러가 중요하지 않은 페이지에 크롤링 예산을 낭비해 정작 중요한 페이지가 늦게 인덱싱될 수 있습니다.

반대로 robots.txt를 너무 엄격하게 설정하면 검색 엔진이 사이트 전체를 수집하지 못해 검색 결과에서 사라질 수도 있습니다.

---

#### robots.txt의 기본 구조

robots.txt는 `User-agent`와 `Allow`/`Disallow` 지시어로 구성됩니다.

**User-agent** — 규칙을 적용할 크롤러를 지정합니다. `*`는 모든 크롤러를 의미하고, `Googlebot`처럼 특정 봇을 지정할 수도 있습니다.

**Allow** — 수집을 허용할 경로입니다.

**Disallow** — 수집을 차단할 경로입니다.

**Sitemap** — sitemap.xml의 위치를 알려줍니다. 크롤러가 사이트 구조를 더 효율적으로 파악할 수 있습니다.

일반적인 서비스라면 모든 크롤러에게 전체 접근을 허용하고, sitemap 위치만 알려주는 것이 기본 설정입니다.

---

#### 주의할 점

**robots.txt는 보안 수단이 아닙니다**

robots.txt는 어디까지나 크롤러에 대한 "권고"입니다. 악의적인 봇은 robots.txt를 무시하고 접근할 수 있습니다. 실제로 외부에 노출되면 안 되는 페이지는 robots.txt 차단이 아니라 인증(Authentication) 으로 보호해야 합니다.

**Disallow는 인덱싱 차단이 아닙니다**

크롤링을 차단해도 다른 사이트가 해당 페이지를 링크하고 있다면 Google은 그 페이지를 인덱스에 포함할 수 있습니다. 검색 결과에서 완전히 제외하려면 `noindex` 메타 태그를 함께 사용해야 합니다.

**sitemap.xml과 함께 사용하세요**

robots.txt만으로는 충분하지 않습니다. sitemap.xml에 사이트의 모든 페이지 URL을 명시해두면 크롤러가 빠짐없이 수집할 수 있습니다. robots.txt에서 sitemap.xml 경로를 안내하는 것이 SEO 기본 설정입니다.

---

#### Next.js에서는 어떻게 설정하나요?

Next.js App Router에서는 `public/robots.txt` 파일을 직접 만들거나, `app/robots.ts` 파일을 만드는 두 가지 방법이 있습니다.

`app/robots.ts`로 만들면 Next.js가 빌드 시 자동으로 `/robots.txt` 경로로 서빙해줍니다. TypeScript로 타입 안전하게 작성할 수 있고, 환경 변수나 동적 값도 활용할 수 있어 권장되는 방식입니다. 실제 URL로 접근하면 `.txt` 텍스트 파일로 정상 응답합니다.

sitemap도 마찬가지로 `app/sitemap.ts`를 만들면 Next.js가 `/sitemap.xml`로 자동 변환해 서빙합니다.

---

#### 정리 (Conclusion)

robots.txt는 검색 엔진 크롤러에게 수집 허용/차단 범위를 안내하는 파일입니다.
대부분의 서비스는 전체 허용 + sitemap 경로 안내가 기본 설정이며, 관리자 페이지 같은 민감한 경로만 선택적으로 차단합니다.
robots.txt는 보안 수단이 아니므로 민감한 페이지는 반드시 인증으로 보호해야 하며, sitemap.xml과 함께 설정해야 SEO 효과를 제대로 볼 수 있습니다.

---

### 추가 학습 자료 공유합니다.

- [Google 검색 센터 — robots.txt 소개](https://developers.google.com/search/docs/crawling-indexing/robots/intro?hl=ko)
- [Next.js 공식 문서 — robots.txt](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots)

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
| `{{TITLE}}` | robots.txt는 무엇이고 어떻게 설정하나요? |
| `{{CATEGORY}}` | 기타 |
| `{{TAGS}}` | SEO, robots.txt, sitemap, 크롤링, Next.js |
| `{{DATE}}` | 2026-04-20 |
| `{{SLUG}}` | what-is-robots-txt |
| `{{SUMMARY}}` | robots.txt는 검색 엔진 크롤러에게 수집 허용/차단 범위를 안내하는 파일입니다. sitemap.xml과 함께 설정해야 SEO 효과를 제대로 볼 수 있습니다. |
| `{{WHY}}` | robots.txt 없이 모든 페이지를 열어두면 노출되면 안 되는 페이지가 인덱싱되거나, 크롤링 예산이 낭비될 수 있습니다. |
| `{{LANG}}` | - |
| `{{YEAR}}` | 2026 |
