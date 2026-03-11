<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <div class="header-left">
          <div class="header-logo">
            <div class="logo-dot"></div>
            <h1 class="header-title">뉴스 스크래퍼</h1>
          </div>
          <span class="header-badge">News Analyzer</span>
        </div>
        <!-- <div class="header-actions">
          <button class="icon-button">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </button>
          <button class="icon-button">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </div> -->
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Hero Section -->
      <div class="hero-section">
        <div class="hero-content">
          <h2 class="hero-title">
            뉴스 URL을 입력하면 관련 기사를 찾아드립니다
          </h2>
          <p class="hero-description">
            기사의 핵심 키워드를 추출하고 유사한 기사를 자동으로 검색합니다
          </p>
        </div>

        <!-- Search Input -->
        <div class="search-container">
          <div class="search-wrapper">
            <div class="search-input-wrapper">
              <input
                v-model="newsUrl"
                type="url"
                placeholder="뉴스 URL을 붙여넣어주세요..."
                class="search-input"
                :disabled="loading"
                @keyup.enter="scrapeNews"
              />
              <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
              </svg>
            </div>
            <button
              @click="scrapeNews"
              :disabled="loading || !newsUrl"
              class="search-button"
            >
              {{ loading ? '검색 중...' : '검색하기' }}
            </button>
          </div>
          
          <!-- Loading Bar -->
          <div v-if="loading" class="loading-bar-container">
            <div class="loading-bar">
              <div class="loading-bar-fill"></div>
            </div>
            <p class="loading-text">뉴스를 분석하고 관련 기사를 검색하는 중...</p>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="error-message">
        <svg class="error-icon" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
        </svg>
        <p class="error-text">{{ error }}</p>
      </div>

      <!-- Current News Section -->
      <div v-if="currentNews" class="card">
        <div class="card-header">
          <h2 class="card-title">현재 기사</h2>
          <span class="card-badge">NEWS</span>
        </div>
        
        <div class="current-news-content">
          <h3 class="news-title">{{ currentNews.title }}</h3>
          <p class="news-description">{{ currentNews.description }}</p>
          
          <!-- Keywords -->
          <div v-if="keywords && keywords.length > 0" class="keywords-section">
            <div class="keywords-header">
              <svg style="width: 16px; height: 16px; color: #6b7280;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
              </svg>
              <span class="keywords-label">추출된 키워드</span>
            </div>
            <div class="keywords-list">
              <span
                v-for="(keyword, index) in keywords"
                :key="index"
                class="keyword-tag"
              >
                #{{ keyword }}
              </span>
            </div>
          </div>
          
          <a
            :href="currentNews.url"
            target="_blank"
            rel="noopener noreferrer"
            class="article-link"
          >
            원문 보기
            <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
          </a>
        </div>
      </div>

      <!-- Related Articles Section -->
      <div v-if="currentNews && relatedArticles.length > 0" class="card">
        <!-- Category Bar -->
        <div class="category-bar">
          <div class="category-left">
            <button class="category-button">
              전체 {{ filteredArticles.length }}
            </button>
            <span class="category-label">관련 기사</span>
          </div>
          <div class="category-right">
            <div class="category-count">
              총 <strong>{{ relatedArticles.length }}</strong>개의 기사
            </div>
            <!-- Sort Dropdown -->
            <select v-model="selectedKeyword" class="sort-select">
              <option value="">전체 키워드</option>
              <option
                v-for="keyword in uniqueKeywords"
                :key="keyword"
                :value="keyword"
              >
                {{ keyword }} ({{ getKeywordCount(keyword) }})
              </option>
            </select>
          </div>
        </div>

        <!-- Articles Grid -->
        <div class="articles-grid">
          <article
            v-for="(article, index) in filteredArticles"
            :key="article.url"
            class="article-card"
          >
            <!-- Article Badge -->
            <div class="article-badge-row">
              <div class="article-badge-group">
                <span class="article-badge">ARTICLE</span>
                <span class="article-keyword-badge">{{ article.matchedKeyword || '키워드 없음' }}</span>
              </div>
              <span class="article-number">#{{ index + 1 }}</span>
            </div>
            
            <!-- Article Title -->
            <h3 class="article-card-title line-clamp-2">
              {{ article.title }}
            </h3>
            
            <!-- Article Description -->
            <!-- <p class="article-card-description line-clamp-3">
              {{ article.description || '설명이 없습니다.' }}
            </p> -->
            
            <!-- Article Link -->
            <a
              :href="article.url"
              target="_blank"
              rel="noopener noreferrer"
              class="article-link"
            >
              기사 보기
              <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
              </svg>
            </a>
          </article>
        </div>
      </div>

      <!-- Related Articles Empty State -->
      <div v-if="currentNews && relatedArticles.length === 0 && !loading" class="card">
        <div class="empty-state">
          <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p class="empty-title">관련 기사를 찾을 수 없습니다.</p>
          <p class="empty-subtitle">키워드로 검색했지만 결과가 없습니다.</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && !currentNews && !relatedArticles.length && newsUrl" class="empty-state">
        <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p class="empty-title">검색 결과가 없습니다.</p>
        <p class="empty-subtitle">다른 URL을 시도해보세요.</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const newsUrl = ref('')
const loading = ref(false)
const error = ref('')
const currentNews = ref(null)
const keywords = ref([])
const relatedArticles = ref([])
const selectedKeyword = ref('')

// 선택된 키워드로 필터링된 기사
const filteredArticles = computed(() => {
  if (!selectedKeyword.value) {
    return relatedArticles.value
  }
  return relatedArticles.value.filter(article => 
    article.matchedKeyword === selectedKeyword.value
  )
})

// 고유한 키워드 목록 추출
const uniqueKeywords = computed(() => {
  const keywords = new Set()
  relatedArticles.value.forEach(article => {
    if (article.matchedKeyword) {
      keywords.add(article.matchedKeyword)
    }
  })
  return Array.from(keywords).sort()
})

// 특정 키워드로 찾은 기사 개수
const getKeywordCount = (keyword) => {
  return relatedArticles.value.filter(article => 
    article.matchedKeyword === keyword
  ).length
}

const { scrapeNews: scrapeNewsFromComposable } = useNewsScraper()

const scrapeNews = async () => {
  if (!newsUrl.value) return

  loading.value = true
  error.value = ''
  currentNews.value = null
  keywords.value = []
  relatedArticles.value = []
  selectedKeyword.value = '' // 정렬 초기화

  try {
    const response = await scrapeNewsFromComposable(newsUrl.value)

    currentNews.value = response.currentNews
    keywords.value = response.keywords || []
    relatedArticles.value = response.relatedArticles || []
    
    // 디버깅용 로그
    console.log('API 응답:', response)
    console.log('관련 기사 개수:', relatedArticles.value.length)
  } catch (err: any) {
    error.value = err.message || '뉴스를 가져오는 중 오류가 발생했습니다.'
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.bg-gray-50 {
  background-color: #f9fafb;
}

.min-h-screen {
  min-height: 100vh;
}

.w-5 {
  width: 1.25rem;
}

.h-5 {
  height: 1.25rem;
}
</style>
