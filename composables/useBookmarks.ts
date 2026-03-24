interface BookmarkedArticle {
  title: string
  description: string
  url: string
  matchedKeyword: string
  bookmarkedAt: string
}

const STORAGE_KEY = 'news-bookmarks'

export const useBookmarks = () => {
  // 로컬스토리지에서 북마크 목록 불러오기
  const loadBookmarks = (): BookmarkedArticle[] => {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return []
      return JSON.parse(stored) as BookmarkedArticle[]
    } catch (error) {
      console.error('북마크 불러오기 실패:', error)
      return []
    }
  }

  // 로컬스토리지에 북마크 목록 저장하기
  const saveBookmarks = (bookmarks: BookmarkedArticle[]) => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks))
    } catch (error) {
      console.error('북마크 저장 실패:', error)
    }
  }

  // 북마크 목록 (반응형)
  const bookmarks = ref<BookmarkedArticle[]>([])
  
  // 초기화 시 북마크 불러오기
  onMounted(() => {
    bookmarks.value = loadBookmarks()
  })

  // 특정 URL이 북마크되어 있는지 확인
  const isBookmarked = (url: string): boolean => {
    return bookmarks.value.some(bookmark => bookmark.url === url)
  }

  // 북마크 추가
  const addBookmark = (article: {
    title: string
    description: string
    url: string
    matchedKeyword: string
  }) => {
    // 이미 북마크되어 있는지 확인
    if (isBookmarked(article.url)) {
      return false
    }

    const newBookmark: BookmarkedArticle = {
      ...article,
      bookmarkedAt: new Date().toISOString()
    }

    bookmarks.value = [...bookmarks.value, newBookmark]
    saveBookmarks(bookmarks.value)
    return true
  }

  // 북마크 제거
  const removeBookmark = (url: string) => {
    bookmarks.value = bookmarks.value.filter(bookmark => bookmark.url !== url)
    saveBookmarks(bookmarks.value)
  }

  // 북마크 토글 (추가/제거)
  const toggleBookmark = (article: {
    title: string
    description: string
    url: string
    matchedKeyword: string
  }) => {
    if (isBookmarked(article.url)) {
      removeBookmark(article.url)
      return false
    } else {
      addBookmark(article)
      return true
    }
  }

  // 모든 북마크 제거
  const clearAllBookmarks = () => {
    bookmarks.value = []
    saveBookmarks(bookmarks.value)
  }

  // 북마크 목록 새로고침
  const refreshBookmarks = () => {
    if (typeof window !== 'undefined') {
      bookmarks.value = loadBookmarks()
    }
  }

  return {
    bookmarks: readonly(bookmarks),
    isBookmarked,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    clearAllBookmarks,
    refreshBookmarks
  }
}
