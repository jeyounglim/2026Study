<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <div class="header-left">
          <div class="header-logo">
            <div class="logo-dot"></div>
            <h1 class="header-title">url 스크래퍼 seo분석</h1>
          </div>
          <span class="header-badge">News Analyzer</span>
        </div>
        <div class="header-actions">
          <button 
            @click="showBookmarksModal = true"
            class="icon-button bookmark-header-button"
            :class="{ 'has-bookmarks': bookmarks.length > 0 }"
            :title="`북마크 (${bookmarks.length})`"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
            </svg>
            <span v-if="bookmarks.length > 0" class="bookmark-count">{{ bookmarks.length }}</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Hero Section -->
      <div class="hero-section">
        <div class="hero-content">
          <h2 class="hero-title">
            URL을 입력하면 기사내용 요약및 SEO 분석해드립니다
          </h2>
          <p class="hero-description">
            기사의 핵심 키워드를 추출하고 SEO를 분석합니다
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
            <p class="loading-text">뉴스를 분석하고 SEO를 검증하는 중...</p>
          </div>
        </div>
      </div>


      <!-- SEO Error Message -->
      <div v-if="seoError && currentNews" class="error-message">
        <svg class="error-icon" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
        </svg>
        <p class="error-text">SEO 검증 오류: {{ seoError }}</p>
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
          
          <!-- Summary -->
          <div v-if="currentNews.summary" class="summary-section">
            <div class="summary-header">
              <svg style="width: 16px; height: 16px; color: #6b7280;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span class="summary-label">AI 요약</span>
            </div>
            <div class="summary-content">
              {{ currentNews.summary }}
            </div>
          </div>
          
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

      <!-- SEO Results Section -->
      <div v-if="seoResult && currentNews" class="card seo-results-card">
        <div class="card-header">
          <h2 class="card-title">SEO 검증 결과</h2>
          <span class="card-badge">SEO</span>
        </div>
        
        <div class="seo-results">
          <!-- SEO Score -->
          <div class="seo-score-card">
            <div class="seo-score-header">
              <h3 class="seo-score-title">SEO 점수</h3>
              <div class="seo-score-circle" :class="getScoreClass(seoResult.score)">
                <span class="seo-score-number">{{ seoResult.score }}</span>
                <span class="seo-score-label">점</span>
              </div>
            </div>
            <div class="seo-score-bar">
              <div 
                class="seo-score-fill" 
                :class="getScoreClass(seoResult.score)"
                :style="{ width: `${seoResult.score}%` }"
              ></div>
            </div>
          </div>

          <!-- SEO Issues -->
          <div v-if="seoResult.issues && seoResult.issues.length > 0" class="seo-issues">
            <h3 class="seo-issues-title">발견된 이슈 ({{ seoResult.issues.length }}개)</h3>
            <div class="seo-issues-list">
              <div
                v-for="(issue, index) in seoResult.issues"
                :key="index"
                class="seo-issue-item"
                :class="`seo-issue-${issue.type}`"
              >
                <div class="seo-issue-header">
                  <div class="seo-issue-icon-wrapper">
                    <svg 
                      v-if="issue.type === 'error'"
                      style="width: 20px; height: 20px;" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                    </svg>
                    <svg 
                      v-else-if="issue.type === 'warning'"
                      style="width: 20px; height: 20px;" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                    <svg 
                      v-else
                      style="width: 20px; height: 20px;" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                  <div class="seo-issue-content">
                    <div class="seo-issue-category">{{ issue.category }}</div>
                    <div class="seo-issue-message">{{ issue.message }}</div>
                    <div class="seo-issue-suggestion">{{ issue.suggestion }}</div>
                    <div v-if="issue.currentValue" class="seo-issue-values">
                      <div class="seo-issue-value">
                        <span class="seo-issue-value-label">현재:</span>
                        <span class="seo-issue-value-text">{{ issue.currentValue }}</span>
                      </div>
                      <div v-if="issue.recommendedValue" class="seo-issue-value">
                        <span class="seo-issue-value-label">권장:</span>
                        <span class="seo-issue-value-text recommended">{{ issue.recommendedValue }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- SEO Recommendations -->
          <div v-if="seoResult.recommendations && seoResult.recommendations.length > 0" class="seo-recommendations">
            <h3 class="seo-recommendations-title">개선 제안</h3>
            <ul class="seo-recommendations-list">
              <li v-for="(rec, index) in seoResult.recommendations" :key="index" class="seo-recommendation-item">
                {{ rec }}
              </li>
            </ul>
          </div>

          <!-- SEO Metadata -->
          <div v-if="seoResult.metadata" class="seo-metadata">
            <h3 class="seo-metadata-title">페이지 메타데이터</h3>
            <div class="seo-metadata-grid">
              <div v-if="seoResult.metadata.title" class="seo-metadata-item">
                <span class="seo-metadata-label">제목:</span>
                <span class="seo-metadata-value">{{ seoResult.metadata.title }}</span>
              </div>
              <div v-if="seoResult.metadata.description" class="seo-metadata-item">
                <span class="seo-metadata-label">설명:</span>
                <span class="seo-metadata-value">{{ seoResult.metadata.description }}</span>
              </div>
              <div class="seo-metadata-item">
                <span class="seo-metadata-label">H1 태그:</span>
                <span class="seo-metadata-value">{{ seoResult.metadata.h1Count }}개</span>
              </div>
              <div class="seo-metadata-item">
                <span class="seo-metadata-label">H2 태그:</span>
                <span class="seo-metadata-value">{{ seoResult.metadata.h2Count }}개</span>
              </div>
              <div class="seo-metadata-item">
                <span class="seo-metadata-label">이미지:</span>
                <span class="seo-metadata-value">{{ seoResult.metadata.imageCount }}개</span>
              </div>
              <div class="seo-metadata-item">
                <span class="seo-metadata-label">Alt 없는 이미지:</span>
                <span class="seo-metadata-value">{{ seoResult.metadata.imagesWithoutAlt }}개</span>
              </div>
              <div class="seo-metadata-item">
                <span class="seo-metadata-label">구조화된 데이터:</span>
                <span class="seo-metadata-value">{{ seoResult.metadata.hasJsonLd ? '있음' : '없음' }}</span>
              </div>
              <div class="seo-metadata-item">
                <span class="seo-metadata-label">모바일 최적화:</span>
                <span class="seo-metadata-value">{{ seoResult.metadata.hasViewport ? '적용됨' : '미적용' }}</span>
              </div>
            </div>
          </div>
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
              <div class="article-actions">
                <button
                  @click.stop="toggleBookmark(article)"
                  class="bookmark-button"
                  :class="{ 'bookmarked': isBookmarked(article.url) }"
                  :title="isBookmarked(article.url) ? '북마크 제거' : '북마크 추가'"
                >
                  <svg 
                    v-if="isBookmarked(article.url)"
                    style="width: 18px; height: 18px;" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                  </svg>
                  <svg 
                    v-else
                    style="width: 18px; height: 18px;" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                  </svg>
                </button>
                <span class="article-number">#{{ index + 1 }}</span>
              </div>
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

    <!-- Bookmarks Modal -->
    <div v-if="showBookmarksModal" class="modal-overlay" @click="showBookmarksModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">북마크 목록</h2>
          <button @click="showBookmarksModal = false" class="modal-close-button">
            <svg style="width: 24px; height: 24px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <!-- 북마크가 있을 때 -->
          <div v-if="bookmarks.length > 0" class="bookmarks-list">
            <article
              v-for="(bookmark, index) in bookmarks"
              :key="bookmark.url"
              class="bookmark-card"
            >
              <div class="bookmark-card-header">
                <div class="bookmark-badge-group">
                  <span class="bookmark-badge">BOOKMARK</span>
                  <span class="bookmark-keyword-badge">{{ bookmark.matchedKeyword || '키워드 없음' }}</span>
                </div>
                <button
                  @click="removeBookmark(bookmark.url)"
                  class="bookmark-remove-button"
                  title="북마크 제거"
                >
                  <svg style="width: 18px; height: 18px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              
              <h3 class="bookmark-card-title line-clamp-2">
                {{ bookmark.title }}
              </h3>
              
              <p v-if="bookmark.description" class="bookmark-card-description line-clamp-2">
                {{ bookmark.description }}
              </p>
              
              <div class="bookmark-card-footer">
                <a
                  :href="bookmark.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="article-link"
                >
                  기사 보기
                  <svg style="width: 16px; height: 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                  </svg>
                </a>
                <span class="bookmark-date">
                  {{ formatDate(bookmark.bookmarkedAt) }}
                </span>
              </div>
            </article>
          </div>
          
          <!-- 북마크가 없을 때 -->
          <div v-else class="bookmarks-empty">
            <svg class="bookmarks-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
            </svg>
            <p class="bookmarks-empty-title">저장된 북마크가 없습니다</p>
            <p class="bookmarks-empty-subtitle">관련 기사에서 북마크를 추가해보세요!</p>
          </div>
        </div>
        
        <div v-if="bookmarks.length > 0" class="modal-footer">
          <button @click="clearAllBookmarks" class="clear-all-button">
            전체 삭제
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Article {
  title: string
  description: string
  url: string
  matchedKeyword: string
}

interface News {
  title: string
  description: string
  url: string
  summary?: string | null
}

const newsUrl = ref('')
const loading = ref(false)
const error = ref('')
const currentNews = ref<News | null>(null)
const keywords = ref<string[]>([])
const relatedArticles = ref<Article[]>([])
const selectedKeyword = ref('')

// SEO 검증 관련
const seoError = ref('')
const seoResult = ref<any>(null)

// 선택된 키워드로 필터링된 기사
const filteredArticles = computed(() => {
  if (!selectedKeyword.value) {
    return relatedArticles.value
  }
  // matchedKeyword에 선택된 키워드가 포함되어 있는지 확인
  // (단일 키워드 또는 키워드 조합 모두 매칭)
  return relatedArticles.value.filter(article => {
    if (!article.matchedKeyword) return false
    // 정확히 일치하거나, 키워드가 포함되어 있는지 확인
    const matched = article.matchedKeyword === selectedKeyword.value ||
                    article.matchedKeyword.includes(selectedKeyword.value)
    return matched
  })
})

// 고유한 키워드 목록 추출 (단일 키워드만)
const uniqueKeywords = computed(() => {
  const keywordSet = new Set<string>()
  relatedArticles.value.forEach(article => {
    if (article.matchedKeyword) {
      // matchedKeyword가 여러 키워드 조합일 수 있으므로 분리
      const matchedKeywords = article.matchedKeyword.split(' ')
      matchedKeywords.forEach(kw => {
        if (kw && kw.length > 0) {
          keywordSet.add(kw.trim())
        }
      })
    }
  })
  // 실제 추출된 키워드 목록과 교집합 (표시된 키워드만)
  return Array.from(keywordSet)
    .filter(kw => keywords.value.includes(kw))
    .sort()
})

// 특정 키워드로 찾은 기사 개수
const getKeywordCount = (keyword: string) => {
  return relatedArticles.value.filter(article => {
    if (!article.matchedKeyword) return false
    return article.matchedKeyword === keyword || 
           article.matchedKeyword.includes(keyword)
  }).length
}

const { bookmarks, isBookmarked, toggleBookmark, removeBookmark, clearAllBookmarks, refreshBookmarks } = useBookmarks()
const { validateSEO: validateSEOFromComposable } = useSEOValidator()

// 서버 API를 직접 호출하는 함수
const scrapeNewsFromAPI = async (url: string) => {
  const response = await $fetch('/api/scrape', {
    method: 'POST',
    body: { url }
  })
  return response
}

const showBookmarksModal = ref(false)

// 모달이 열릴 때 북마크 목록 새로고침
watch(showBookmarksModal, (isOpen) => {
  if (isOpen) {
    refreshBookmarks()
  }
})

// 날짜 포맷팅 함수
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`
  
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const scrapeNews = async () => {
  if (!newsUrl.value) return

  loading.value = true
  error.value = ''
  seoError.value = ''
  currentNews.value = null
  keywords.value = []
  relatedArticles.value = []
  selectedKeyword.value = '' // 정렬 초기화
  seoResult.value = null // SEO 결과 초기화

  try {
    // 뉴스 스크래핑과 SEO 검증을 동시에 실행
    const [newsResponse, seoResponse] = await Promise.allSettled([
      scrapeNewsFromAPI(newsUrl.value),
      validateSEOFromComposable(newsUrl.value)
    ])

    // 뉴스 스크래핑 결과 처리
    if (newsResponse.status === 'fulfilled') {
      const newsData = newsResponse.value as any
      if (newsData.currentNews) {
        currentNews.value = {
          title: newsData.currentNews.title || '',
          description: newsData.currentNews.description || '',
          url: newsData.currentNews.url || newsUrl.value,
          summary: newsData.currentNews.summary || null
        }
      }
      keywords.value = newsData.keywords || []
      
      // relatedArticles 처리 - 더 자세한 로그
      const receivedArticles = (newsData.relatedArticles || []) as Article[]
      console.log('📥 클라이언트 수신 데이터:')
      console.log('  - receivedArticles 타입:', Array.isArray(receivedArticles) ? 'Array' : typeof receivedArticles)
      console.log('  - receivedArticles 개수:', receivedArticles.length)
      console.log('  - receivedArticles 샘플:', receivedArticles.slice(0, 2))
      
      relatedArticles.value = receivedArticles
      
      console.log('✅ 관련 기사 설정 완료:', relatedArticles.value.length, '개')
      console.log('📊 전체 API 응답:', {
        currentNews: !!newsResponse.value.currentNews,
        keywords: newsResponse.value.keywords?.length || 0,
        relatedArticles: receivedArticles.length
      })
    } else {
      error.value = newsResponse.reason?.message || '뉴스를 가져오는 중 오류가 발생했습니다.'
      console.error('뉴스 스크래핑 오류:', newsResponse.reason)
    }

    // SEO 검증 결과 처리
    if (seoResponse.status === 'fulfilled') {
      seoResult.value = seoResponse.value
      console.log('SEO 검증 완료:', seoResponse.value)
    } else {
      seoError.value = seoResponse.reason?.message || 'SEO 검증 중 오류가 발생했습니다.'
      console.error('SEO 검증 오류:', seoResponse.reason)
    }
  } catch (err: any) {
    error.value = err.message || '처리 중 오류가 발생했습니다.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

// SEO 점수에 따른 클래스 반환
const getScoreClass = (score: number) => {
  if (score >= 80) return 'score-excellent'
  if (score >= 60) return 'score-good'
  if (score >= 40) return 'score-fair'
  return 'score-poor'
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
