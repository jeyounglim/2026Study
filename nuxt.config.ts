// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    // 서버 사이드에서만 접근 가능한 환경 변수
    groqApiKey: process.env.GROQ_API_KEY || '',
    public: {
      // 클라이언트에서도 접근 가능한 환경 변수
      groqApiKey: process.env.GROQ_API_KEY || '',
    }
  },
  app: {
    baseURL: '/2026Study/',
    head: {
      title: '뉴스 스크래퍼',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '뉴스 URL을 입력하면 관련 기사를 찾아드립니다' }
      ]
    }
  },
  ssr: false, // GitHub Pages는 정적 사이트만 지원하므로 SPA 모드로 설정
  nitro: {
    prerender: {
      routes: ['/']
    }
  }
})