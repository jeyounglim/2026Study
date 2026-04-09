# 뉴스 URL 스크래퍼 · SEO 분석

뉴스(또는 기사) URL을 입력하면 **본문 기반 키워드 추출**, **AI 요약**, **Google News 관련 기사 검색**, **페이지 SEO 점수·이슈 분석**을 한 화면에서 제공하는 [Nuxt 3](https://nuxt.com/) 웹 앱입니다.

## 핵심 기능

| 구분 | 설명 |
|------|------|
| **스크래핑** | 브라우저에서 HTML을 가져와 제목·설명·본문 후보를 추출 (직접 `fetch` 실패 시 CORS 우회용 공개 프록시 순차 시도) |
| **AI 요약** | Groq(`llama-3.1-8b-instant`)로 2~3문장 요약 (API 키·본문 길이 조건 충족 시) |
| **키워드** | Groq로 5~8개 추출, 없으면 한국어 불용어·빈도 기반 폴백 |
| **관련 기사** | 키워드별 Google News RSS 검색 → 관련 기사 제목에서 키워드 빈도로 재필터·재검색, 최대 다수 수집 후 키워드 칩으로 필터 |
| **SEO 검증** | 동일 URL에 대해 HTML을 가져와 메타·헤딩·이미지 alt·JSON-LD 등을 점검하고 점수·이슈·권장사항 표시 (`useSEOValidator`) |
| **북마크** | 관련 기사를 **로컬 스토리지**에 저장·목록·삭제 (로그인 없음) |

## 배포·실행 방식 (중요)

- **`ssr: false`**: 정적 호스팅(예: GitHub Pages)에 맞춘 **SPA** 모드입니다. 뉴스 처리·SEO 분석의 주 경로는 **`composables`** 입니다.
- **`app.baseURL`**: `/2026Study/` 로 설정되어 있습니다. 다른 경로에 올릴 때는 `nuxt.config.ts`의 `baseURL`을 함께 수정하세요.
- **`server/api/*.ts`**: Nitro API로 빌드에 포함되나, **현재 UI는 `/api/scrape`, `/api/seo`를 호출하지 않고** 클라이언트 composable만 사용합니다. Node 서버에 올려 서버 사이드에서 쓰려면 해당 엔드포인트를 직접 호출하면 됩니다.

## 기술 스택

- **프레임워크**: Nuxt 3 · Vue 3 · TypeScript  
- **스타일**: `assets/css/main.css` + 일부 유틸리티용 scoped 클래스  
- **AI**: [Groq API](https://groq.com/) — 채팅 완성 API, 모델 `llama-3.1-8b-instant`  
- **관련 기사**: Google News RSS (`hl=ko`, `gl=KR`, 최근 기사 가중 쿼리 등)

## 시작하기

### 요구 사항

- Node.js 18 이상  
- npm 또는 호환 패키지 매니저

### 설치

```bash
git clone <repository-url>
cd 2026Study
npm install
```

### 환경 변수

프로젝트 루트에 `.env`를 두고 다음을 설정합니다.

```env
GROQ_API_KEY=your_groq_api_key_here
```

`nuxt.config.ts`에서 `runtimeConfig`의 `groqApiKey` / `public.groqApiKey`로 읽습니다. 키가 없어도 키워드 폴백·스크래핑·SEO(규칙 기반)는 동작하지만, **AI 요약·Groq 키워드**는 제한됩니다.

키 발급: [Groq Console](https://console.groq.com/)

### 개발 서버

```bash
npm run dev
```

브라우저에서 로컬 주소(보통 `http://localhost:3000`)로 접속합니다. `baseURL`이 있으면 경로가 `/2026Study/` 아래로 붙을 수 있습니다.

### 프로덕션

```bash
npm run build
npm run preview
```

정적 배포 시 `npm run generate` 사용 여부는 호스팅 방식에 맞게 선택하면 됩니다.

## 사용 방법

1. 상단 입력란에 **기사 URL**을 넣고 **검색하기**를 누릅니다.  
2. **뉴스 분석**과 **SEO 검증**이 병렬로 진행됩니다.  
3. **현재 기사** 영역에 제목·설명·(가능 시) **AI 요약**이 표시됩니다.  
4. **키워드**로 관련 기사를 모은 뒤, 칩으로 **키워드별 필터**가 가능합니다.  
5. **SEO 검증 결과**에 점수, 이슈, 개선 제안, 메타데이터 요약이 표시됩니다.  
6. 관련 기사 카드에서 **북마크**를 쓰면 브라우저에만 저장됩니다.

## 프로젝트 구조

```
2026Study/
├── app.vue
├── nuxt.config.ts
├── pages/
│   └── index.vue              # 메인 UI (검색, SEO, 북마크 모달)
├── composables/
│   ├── useNewsScraper.ts      # 클라이언트 스크래핑·요약·키워드·RSS 관련 기사
│   ├── useSEOValidator.ts     # 클라이언트 SEO 분석 (HTML fetch + 규칙)
│   └── useBookmarks.ts        # 로컬 스토리지 북마크
├── server/api/
│   ├── scrape.post.ts         # (선택) 서버 사이드 스크래핑 API
│   └── seo.post.ts            # (선택) 서버 사이드 SEO API
└── assets/css/
    └── main.css
```

## 참고: Nitro API 응답 형태 (서버 호출 시)

### `POST /api/scrape`

요청 본문: `{ "url": "https://..." }`  

응답에 포함되는 예:

- `currentNews`: `title`, `description`, `url`, `summary` (선택)  
- `keywords`: 필터링된 키워드 배열  
- `relatedArticles`: `title`, `description`, `url`, `matchedKeyword`  

클라이언트 composable 쪽도 동일한 형태로 화면에 맞춥니다(관련 기사 개수·검색 단계 로직은 구현 차이가 있을 수 있음).

### `POST /api/seo`

URL 기반 SEO 분석(서버 측 구현). 프론트는 현재 `useSEOValidator`를 사용합니다.

## 환경 변수 요약

| 변수 | 설명 | 필수 |
|------|------|------|
| `GROQ_API_KEY` | Groq API 키 (AI 요약·키워드) | 선택 |

## npm 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run generate` | 정적 생성 |
| `npm run preview` | 빌드 미리보기 |

## 문제 해결

- **Groq 관련 오류**: 키·할당량·네트워크를 확인합니다. 키가 없으면 폴백 키워드만 사용됩니다.  
- **뉴스를 가져올 수 없음**: 대상 사이트 CORS·차단으로 브라우저에서 막힐 수 있습니다. 다른 URL을 시도하세요.  
- **관련 기사 없음**: RSS에 결과가 없거나 키워드가 너무 좁을 수 있습니다.  
- **SEO만 실패**: `useSEOValidator`도 HTML fetch에 의존하므로, CORS/프록시 한계로 HTML을 못 받으면 오류가 날 수 있습니다.  
- **배포 경로 404**: `baseURL`과 실제 호스팅 서브경로가 일치하는지 확인하세요.

## 라이선스 · 기여

개인 학습·실험 목적 프로젝트로 두었습니다. 이슈·PR은 저장소 정책에 맞게 환영합니다.

## 향후 개선 아이디어

- [ ] 뉴스 소스·RSS 옵션 확장 
- [ ] 키워드·요약 품질 튜닝 및 캐싱  
- [ ] 로그인 기능 추가
