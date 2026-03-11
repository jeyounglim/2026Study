# 배포 가이드

## GitHub Pages 배포 시 GROQ API 키 설정

### 1. GitHub Secrets 설정

1. GitHub 저장소로 이동: https://github.com/jeyounglim/2026Study
2. **Settings** → **Secrets and variables** → **Actions** 클릭
3. **New repository secret** 클릭
4. 다음 정보 입력:
   - **Name**: `GROQ_API_KEY`
   - **Value**: Groq API 키 (https://console.groq.com/에서 발급)
5. **Add secret** 클릭

### 2. 배포 확인

GitHub Secrets에 API 키를 설정한 후:
1. 저장소에 푸시하거나
2. GitHub Actions에서 **Actions** 탭 → **Deploy to GitHub Pages** 워크플로우 → **Run workflow** 클릭

### 3. 작동 확인

배포가 완료되면:
1. https://jeyounglim.github.io/2026Study/ 접속
2. 브라우저 개발자 도구(F12) → Console 탭 열기
3. 뉴스 URL을 입력하고 검색
4. 콘솔에서 다음 로그 확인:
   - `🔑 GROQ API 키 확인: ✅ 설정됨` → 정상 작동
   - `🔑 GROQ API 키 확인: ❌ 설정되지 않음` → GitHub Secrets 확인 필요

## ⚠️ 보안 주의사항

**중요**: GitHub Pages는 정적 사이트이므로, GROQ API 키가 클라이언트 사이드 JavaScript에 포함됩니다.

- API 키가 배포된 사이트의 JavaScript 파일에 노출됩니다
- 누구나 브라우저 개발자 도구에서 API 키를 확인할 수 있습니다
- Groq API 사용량 제한이 있다면 남용될 수 있습니다

### 대안

1. **무료 티어 사용**: Groq는 무료 티어를 제공하므로 개인 프로젝트에는 적합합니다
2. **API 키 제한**: Groq Console에서 API 키 사용량을 모니터링하세요
3. **Fallback 방식**: API 키가 없어도 기본 키워드 추출 방식으로 동작합니다
