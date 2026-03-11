# 뉴스 스크래퍼 (News Scraper)

뉴스 URL을 입력하면 기사의 핵심 키워드를 추출하고 관련 기사를 자동으로 검색해주는 웹 애플리케이션입니다.

## 주요 기능

- 📰 **뉴스 스크래핑**: 뉴스 URL에서 제목, 설명, 본문 자동 추출
- 🤖 **AI 키워드 추출**: Groq API를 활용한 지능형 키워드 추출 (GPT 기반)
- 🔍 **관련 기사 검색**: 추출된 키워드로 Google News RSS를 통한 관련 기사 검색
- 🎨 **모던 UI**: 반응형 디자인으로 모바일, 태블릿, 데스크톱 지원
- ⚡ **빠른 성능**: Nuxt 3 기반의 서버 사이드 렌더링

## 기술 스택

- **프레임워크**: [Nuxt 3](https://nuxt.com/)
- **언어**: TypeScript
- **UI**: Vue 3
- **스타일링**: Custom CSS (반응형 디자인)
- **AI API**: [Groq API](https://groq.com/) (Llama 3.1 모델)
- **뉴스 검색**: Google News RSS

## 시작하기

### 필수 요구사항

- Node.js 18.x 이상
- npm 또는 yarn

### 설치

1. 저장소 클론:
```bash
git clone <repository-url>
cd news-scraper
```

2. 의존성 설치:
```bash
npm install
```

3. 환경 변수 설정:
`.env` 파일을 생성하고 다음 내용을 추가하세요:
```env
GROQ_API_KEY=your_groq_api_key_here
```

> **참고**: Groq API 키는 [Groq Console](https://console.groq.com/)에서 무료로 발급받을 수 있습니다. API 키가 없어도 기본 키워드 추출 방식으로 동작합니다.

### 개발 서버 실행

```bash
npm run dev
```

개발 서버가 실행되면 브라우저에서 `http://localhost:3000`으로 접속하세요.

### 프로덕션 빌드

```bash
# 빌드
npm run build

# 프리뷰
npm run preview
```

## 사용 방법

1. 웹 브라우저에서 애플리케이션에 접속합니다.
2. 뉴스 기사의 URL을 입력 필드에 붙여넣습니다.
3. "검색하기" 버튼을 클릭하거나 Enter 키를 누릅니다.
4. 기사의 제목, 설명, 추출된 키워드가 표시됩니다.
5. 관련 기사 목록이 자동으로 검색되어 표시됩니다.
6. 키워드별로 필터링하여 관련 기사를 확인할 수 있습니다.

## 프로젝트 구조

```
news-scraper/
├── server/
│   └── api/
│       └── scrape.post.ts    # 뉴스 스크래핑 API 엔드포인트
├── pages/
│   └── index.vue             # 메인 페이지
├── assets/
│   └── css/
│       └── main.css          # 스타일시트
├── app.vue                    # 루트 컴포넌트
├── nuxt.config.ts             # Nuxt 설정
└── package.json               # 프로젝트 의존성
```

## API 엔드포인트

### POST `/api/scrape`

뉴스 URL을 받아서 제목, 설명, 키워드, 관련 기사를 반환합니다.

**요청:**
```json
{
  "url": "https://example.com/news/article"
}
```

**응답:**
```json
{
  "currentNews": {
    "title": "기사 제목",
    "description": "기사 설명",
    "url": "https://example.com/news/article"
  },
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "relatedArticles": [
    {
      "title": "관련 기사 제목",
      "description": "관련 기사 설명",
      "url": "https://example.com/related-article",
      "matchedKeyword": "키워드1"
    }
  ]
}
```

## 주요 기능 설명

### 1. 뉴스 스크래핑
- Open Graph 메타 태그 우선 추출
- HTML 파싱을 통한 제목/본문 추출
- 다양한 뉴스 사이트 구조 지원

### 2. 키워드 추출
- **AI 방식**: Groq API의 Llama 3.1 모델을 사용한 지능형 키워드 추출
- **Fallback 방식**: API 키가 없을 경우 빈도수 기반 키워드 추출

### 3. 관련 기사 검색
- Google News RSS 피드를 활용한 검색
- 여러 키워드 조합으로 검색 시도
- 중복 제거 및 호스트네임 필터링

## 환경 변수

| 변수명 | 설명 | 필수 |
|--------|------|------|
| `GROQ_API_KEY` | Groq API 키 (AI 키워드 추출용) | 선택 |

## 스크립트

- `npm run dev`: 개발 서버 실행
- `npm run build`: 프로덕션 빌드
- `npm run generate`: 정적 사이트 생성
- `npm run preview`: 빌드된 앱 프리뷰

## 브라우저 지원

- Chrome (최신 버전)
- Firefox (최신 버전)
- Safari (최신 버전)
- Edge (최신 버전)

## 라이선스

이 프로젝트는 개인 사용 목적으로 제작되었습니다.

## 기여

버그 리포트나 기능 제안은 이슈로 등록해주세요.

## 문제 해결

### API 키 오류
- Groq API 키가 올바르게 설정되었는지 확인하세요.
- API 키가 없어도 기본 키워드 추출 방식으로 동작합니다.

### 관련 기사를 찾을 수 없음
- Google News RSS가 해당 키워드로 결과를 반환하지 않을 수 있습니다.
- 다른 뉴스 URL을 시도해보세요.

### 타임아웃 오류
- 네트워크 연결을 확인하세요.
- 일부 사이트는 스크래핑을 차단할 수 있습니다.

## 향후 개선 계획

- [ ] AI를 통한 분석 추가
- [ ] 더 많은 뉴스 소스 지원
- [ ] 키워드 추출 정확도 개선
- [ ] 캐싱 기능 추가
- [ ] 다국어 지원
- [ ] 북마크 기능 (로그인 기능 구현)
