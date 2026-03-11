export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const body = await readBody(event)
  const { url } = body

  if (!url) {
    throw createError({
      statusCode: 400,
      message: 'URL이 필요합니다.'
    })
  }

  // URL 유효성 검사
  try {
    new URL(url)
  } catch {
    throw createError({
      statusCode: 400,
      message: '유효하지 않은 URL입니다.'
    })
  }

  try {
    // 타임아웃 설정 (10초)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    // 뉴스 URL에서 제목과 내용 추출 시도
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`뉴스를 가져올 수 없습니다. (상태 코드: ${response.status})`)
    }

    const html = await response.text()

    // HTML 파싱 - 여러 방법 시도
    let title = ''
    let description = ''

    // 1. Open Graph title
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
    if (ogTitleMatch) {
      title = ogTitleMatch[1].trim()
    }

    // 2. 일반 title 태그
    if (!title) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      if (titleMatch) {
        title = titleMatch[1].trim()
        // 제목에서 불필요한 부분 제거 (예: " - 사이트명")
        title = title.replace(/\s*[-|]\s*.*$/, '').trim()
      }
    }

    // 3. h1 태그
    if (!title) {
      const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
      if (h1Match) {
        title = h1Match[1].trim()
      }
    }

    // 4. Open Graph description
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
    if (ogDescMatch) {
      description = ogDescMatch[1].trim()
    }

    // 5. 일반 description 메타 태그
    if (!description) {
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
      if (descMatch) {
        description = descMatch[1].trim()
      }
    }

    // 6. 기사 본문에서 첫 번째 문단 추출 시도
    if (!description) {
      const articleMatch = html.match(/<article[^>]*>[\s\S]*?<p[^>]*>([^<]+)<\/p>/i) ||
        html.match(/<div[^>]*class=["'][^"']*article["'][^>]*>[\s\S]*?<p[^>]*>([^<]+)<\/p>/i)
      if (articleMatch) {
        description = articleMatch[1].trim().substring(0, 200)
      }
    }

    if (!title) title = '제목을 찾을 수 없습니다'
    if (!description) description = '설명을 찾을 수 없습니다'

    // 기사 본문 전체 추출 시도
    const articleContent = extractArticleContent(html)
    console.log('📄 추출된 본문 길이:', articleContent.length)

    // 키워드 추출 - 본문이 있으면 본문으로, 없으면 제목+설명으로
    let keywords: string[]
    if (articleContent && articleContent.length > 100) {
      // 본문이 충분히 길면 본문으로 키워드 추출
      console.log('🤖 AI로 본문 분석 중...')
      keywords = await extractKeywordsWithGPT(articleContent, config.groqApiKey)
      console.log('🔑 AI로 추출된 키워드:', keywords)
    } else {
      // 본문이 짧거나 없으면 제목+설명으로 키워드 추출
      console.log('⚠️ 본문이 짧아 제목+설명으로 키워드 추출')
      keywords = await extractKeywordsWithGPT(title + ' ' + description, config.groqApiKey)
      console.log('🔑 추출된 키워드:', keywords)
    }

    // 1단계: 원래 키워드로 관련 기사 검색 (키워드 필터링을 위한 샘플)
    const initialArticles = await searchRelatedArticles(keywords, url, title, 50, config.groqApiKey)
    console.log('📰 초기 관련 기사 개수:', initialArticles.length)

    // 2단계: 관련 기사에서 자주 등장하는 키워드만 필터링
    const filteredKeywords = filterKeywordsByFrequency(keywords, initialArticles)
    console.log('🔑 필터링된 키워드:', filteredKeywords)

    // 3단계: 필터링된 키워드로 관련 기사를 다시 검색
    let relatedArticles = initialArticles
    if (filteredKeywords.length > 0 && filteredKeywords.length < keywords.length) {
      // 필터링된 키워드가 원래 키워드와 다르면 다시 검색
      relatedArticles = await searchRelatedArticles(filteredKeywords, url, title, 50, config.groqApiKey)
      console.log('📰 필터링된 키워드로 찾은 관련 기사 개수:', relatedArticles.length)
    }

    return {
      currentNews: {
        title,
        description,
        url
      },
      keywords: filteredKeywords,
      relatedArticles
    }
  } catch (err: any) {
    // 타임아웃 에러 처리
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      throw createError({
        statusCode: 408,
        message: '요청 시간이 초과되었습니다. 다시 시도해주세요.'
      })
    }

    // 네트워크 에러 처리
    if (err.message?.includes('fetch')) {
      throw createError({
        statusCode: 503,
        message: '뉴스 사이트에 연결할 수 없습니다. 네트워크를 확인해주세요.'
      })
    }

    // 기타 에러
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || '뉴스를 처리하는 중 오류가 발생했습니다.'
    })
  }
})

// 기사 본문 전체 추출 함수
function extractArticleContent(html: string): string {
  // HTML 태그 제거를 위한 간단한 함수
  const removeHtmlTags = (text: string): string => {
    return text
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // script 태그 제거
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // style 태그 제거
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '') // nav 태그 제거
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '') // footer 태그 제거
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '') // header 태그 제거
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '') // aside 태그 제거
      .replace(/<[^>]+>/g, ' ') // 모든 HTML 태그 제거
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ') // 여러 공백을 하나로
      .trim()
  }

  let content = ''

  // 1. article 태그에서 본문 추출 시도
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
  if (articleMatch) {
    content = removeHtmlTags(articleMatch[1])
    if (content.length > 200) {
      return content
    }
  }

  // 2. 본문 관련 클래스나 ID를 가진 div에서 추출
  const contentSelectors = [
    /<div[^>]*class=["'][^"']*article[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class=["'][^"']*post[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class=["'][^"']*entry[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*id=["']article[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*id=["']content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*id=["']post[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
  ]

  for (const selector of contentSelectors) {
    const matches = html.matchAll(new RegExp(selector.source, 'gi'))
    for (const match of matches) {
      const extracted = removeHtmlTags(match[1])
      if (extracted.length > content.length && extracted.length > 200) {
        content = extracted
      }
    }
  }

  // 3. p 태그들을 모두 모아서 본문으로 사용
  if (content.length < 200) {
    const pMatches = html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)
    const paragraphs: string[] = []
    for (const match of pMatches) {
      const text = removeHtmlTags(match[1])
      if (text.length > 20) { // 너무 짧은 문단 제외
        paragraphs.push(text)
      }
    }
    if (paragraphs.length > 0) {
      content = paragraphs.join(' ')
    }
  }

  // 4. main 태그에서 추출 시도
  if (content.length < 200) {
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
    if (mainMatch) {
      const extracted = removeHtmlTags(mainMatch[1])
      if (extracted.length > content.length) {
        content = extracted
      }
    }
  }

  // 본문이 너무 길면 일부만 사용 (AI 토큰 제한 고려)
  if (content.length > 3000) {
    content = content.substring(0, 3000) + '...'
  }

  return content
}

// Groq API를 사용한 키워드 추출 (무료 GPT)
async function extractKeywordsWithGPT(text: string, groqApiKey?: string): Promise<string[]> {

  // API 키가 없으면 기존 방식 사용
  if (!groqApiKey) {
    console.log('⚠️ GROQ_API_KEY가 설정되지 않아 기본 키워드 추출 방식을 사용합니다.')
    return extractKeywordsFallback(text)
  }

  try {
    // 텍스트 길이에 따라 프롬프트 조정
    const isLongText = text.length > 500
    const textToAnalyze = isLongText ? text.substring(0, 3000) : text.substring(0, 1000)

    const prompt = isLongText
      ? `다음 뉴스 기사 본문을 분석하여 검색에 가장 유용한 핵심 키워드를 5-8개 추출해주세요.
기사의 주요 주제, 인물, 장소, 사건 등을 포함하여 추출하세요.
키워드는 쉼표로 구분하여 한 줄로만 출력해주세요. 설명이나 다른 텍스트는 포함하지 마세요.

기사 본문:
${textToAnalyze}

키워드:`
      : `다음 뉴스 기사 텍스트에서 검색에 유용한 핵심 키워드를 5-8개 추출해주세요. 
키워드는 쉼표로 구분하여 한 줄로만 출력해주세요. 설명이나 다른 텍스트는 포함하지 마세요.

텍스트: ${textToAnalyze}

키워드:`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant', // 무료로 사용 가능한 빠른 모델
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 100
      })
    })

    if (!response.ok) {
      throw new Error(`Groq API 오류: ${response.status}`)
    }

    const data = await response.json()
    const keywordsText = data.choices[0]?.message?.content?.trim() || ''

    if (!keywordsText) {
      throw new Error('키워드 추출 결과가 비어있습니다.')
    }

    // 키워드 파싱 (쉼표로 구분)
    const keywords = keywordsText
      .split(/[,，]/)
      .map((k: string) => k.trim())
      .filter((k: string) => k.length > 0)
      .slice(0, 8) // 최대 8개

    if (keywords.length > 0) {
      console.log('✅ GPT로 키워드 추출 성공')
      return keywords
    } else {
      throw new Error('키워드를 파싱할 수 없습니다.')
    }
  } catch (error) {
    console.error('❌ GPT 키워드 추출 실패, 기본 방식 사용:', error)
    return extractKeywordsFallback(text)
  }
}

// 기존 키워드 추출 방식 (fallback)
function extractKeywordsFallback(text: string): string[] {
  // 개선된 키워드 추출
  const stopWords = [
    '은', '는', '이', '가', '을', '를', '의', '에', '에서', '과', '와', '도', '로', '으로',
    '하다', '있다', '되다', '이다', '이다', '된다', '된다', '한다', '한다',
    '그', '그것', '이것', '저것', '그런', '이런', '저런',
    '때', '때문', '위해', '통해', '대해', '관련', '대한',
    '또한', '또', '그리고', '하지만', '그러나', '그런데',
    '것', '거', '수', '경우', '때문', '이유', '원인',
    '등', '및', '또는', '그래서', '따라서', '그러므로'
  ]

  // 텍스트 정제
  let cleanedText = text
    .replace(/[^\w\s가-힣]/g, ' ')  // 특수문자 제거
    .replace(/\s+/g, ' ')            // 여러 공백을 하나로
    .trim()

  // 단어 추출 및 필터링
  const words = cleanedText
    .split(/\s+/)
    .filter(word => {
      // 2글자 이상, 불용어 제외, 숫자만 있는 것 제외
      return word.length >= 2 &&
        !stopWords.includes(word) &&
        !/^\d+$/.test(word) &&
        !word.match(/^[a-zA-Z]+$/) // 영문 단일 단어 제외 (한글 조합만)
    })
    .map(word => word.trim())
    .filter(word => word.length > 0)

  // 빈도수 기반으로 정렬 (간단한 방법)
  const wordCount: Record<string, number> = {}
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1
  })

  // 빈도수와 길이를 고려하여 정렬
  const sortedWords = Object.keys(wordCount)
    .sort((a, b) => {
      // 빈도수 우선, 같으면 길이 우선
      if (wordCount[b] !== wordCount[a]) {
        return wordCount[b] - wordCount[a]
      }
      return b.length - a.length
    })
    .slice(0, 8) // 상위 8개 선택

  return sortedWords.length > 0 ? sortedWords : words.slice(0, 5)
}

async function searchRelatedArticles(keywords: string[], excludeUrl: string, title?: string, maxArticles: number = 20, groqApiKey?: string) {
  // 키워드가 없으면 제목 사용
  if (!keywords || keywords.length === 0) {
    if (title) {
      keywords = await extractKeywordsWithGPT(title, groqApiKey)
      console.log('⚠️ 키워드가 없어 제목에서 추출:', keywords)
    } else {
      console.error('❌ 검색할 키워드가 없습니다')
      return []
    }
  }

  // 더 다양한 검색 쿼리 생성
  const searchQueries: string[] = []
  
  // 1. 각 키워드를 개별적으로 검색 (더 다양한 결과를 위해)
  keywords.forEach(keyword => {
    if (keyword && keyword.length > 0) {
      searchQueries.push(keyword)
    }
  })
  
  // 2. 키워드 조합 검색 (2개씩, 3개씩)
  if (keywords.length >= 2) {
    // 상위 2개 키워드
    searchQueries.push(keywords.slice(0, 2).join(' '))
    // 상위 3개 키워드
    if (keywords.length >= 3) {
      searchQueries.push(keywords.slice(0, 3).join(' '))
    }
    // 상위 4개 키워드
    if (keywords.length >= 4) {
      searchQueries.push(keywords.slice(0, 4).join(' '))
    }
    // 키워드 순서를 바꿔서 검색 (다양성 확보)
    if (keywords.length >= 2) {
      searchQueries.push(keywords.slice(0, 2).reverse().join(' '))
    }
    // 중간 키워드 조합
    if (keywords.length >= 3) {
      searchQueries.push(keywords.slice(1, 3).join(' '))
    }
    if (keywords.length >= 4) {
      searchQueries.push(keywords.slice(1, 4).join(' '))
    }
  }
  
  // 중복 제거
  const uniqueQueries = Array.from(new Set(searchQueries.filter(q => q.length > 0)))
  
  console.log('🔍 생성된 검색 쿼리:', uniqueQueries)

  console.log('🔍 관련 기사 검색 시작:', { keywords, searchQueries: uniqueQueries, excludeUrl, maxArticles })

  let allItems: Array<{ title: string; description: string; url: string; matchedKeyword: string }> = []

  // 여러 쿼리로 시도 (더 많은 결과를 위해 maxArticles보다 더 많이 수집)
  // 각 키워드별로 충분한 기사를 수집하기 위해 더 많이 수집
  const targetArticles = maxArticles * 3 // 최종적으로 더 다양한 결과를 위해 3배 수집
  
  for (const query of uniqueQueries) {
    if (allItems.length >= targetArticles) break // 충분한 결과가 있으면 중단

    try {
      // Google News RSS 피드 검색
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}+언어:ko&hl=ko&gl=KR&ceid=KR:ko`

      console.log('📡 RSS URL:', rssUrl)

      const response = await fetch(rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      if (!response.ok) {
        console.error('❌ RSS 응답 실패:', response.status, response.statusText)
        continue // 다음 쿼리 시도
      }

      const xml = await response.text()
      console.log('✅ RSS 응답 받음, XML 길이:', xml.length)

      // HTML 엔티티 디코딩 함수
      const decodeHtml = (str: string) => {
        return str
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&nbsp;/g, ' ')
      }

      // 간단한 RSS 파싱
      const items: Array<{ title: string; description: string; url: string; matchedKeyword: string }> = []

      // item 태그로 분리하여 파싱
      const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)

      for (const itemMatch of itemMatches) {
        const itemContent = itemMatch[1]

        // title 추출
        const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/i) ||
          itemContent.match(/<title>(.*?)<\/title>/i)
        const articleTitle = titleMatch ? decodeHtml(titleMatch[1].trim()) : ''

        // link 추출 (Google News는 URL 파라미터에 실제 URL이 있음)
        const linkMatch = itemContent.match(/<link>(.*?)<\/link>/i)
        let articleUrl = linkMatch ? linkMatch[1].trim() : ''

        // Google News 링크에서 실제 URL 추출 시도
        if (articleUrl && articleUrl.includes('news.google.com')) {
          const urlMatch = articleUrl.match(/url=([^&]+)/)
          if (urlMatch) {
            articleUrl = decodeURIComponent(urlMatch[1])
          }
        }

        // description 추출
        const descMatch = itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/i) ||
          itemContent.match(/<description>(.*?)<\/description>/i)
        const articleDescription = descMatch ? decodeHtml(descMatch[1].trim().replace(/<[^>]+>/g, '')) : ''

        // 원본 URL과 다른 기사만 포함
        if (articleTitle && articleUrl) {
          try {
            const excludeHostname = new URL(excludeUrl).hostname
            const articleHostname = new URL(articleUrl).hostname

            if (articleHostname !== excludeHostname) {
              items.push({
                title: articleTitle || '제목 없음',
                description: articleDescription || '',
                url: articleUrl,
                matchedKeyword: query // 어떤 키워드로 검색되었는지 저장
              })
            }
          } catch (e) {
            // URL 파싱 실패 시에도 추가 (상대 URL 등)
            if (!articleUrl.includes(excludeUrl)) {
              items.push({
                title: articleTitle || '제목 없음',
                description: articleDescription || '',
                url: articleUrl,
                matchedKeyword: query // 어떤 키워드로 검색되었는지 저장
              })
            }
          }
        }

        // 각 쿼리별로 충분한 기사를 수집 (쿼리별로는 더 많이 수집 후 중복 제거)
        // 각 키워드별로 최소 10개씩은 수집할 수 있도록 충분히 수집
        if (items.length >= 50) break
      }

      // 중복 제거를 위한 URL Set
      const existingUrls = new Set(allItems.map(item => item.url))

      // 새로운 기사만 추가 (더 많은 결과를 위해 targetArticles까지 수집)
      for (const item of items) {
        if (allItems.length >= targetArticles) break
        if (!existingUrls.has(item.url)) {
          allItems.push(item)
          existingUrls.add(item.url)
        }
      }

      console.log(`📊 쿼리 "${query}"로 ${items.length}개 기사 찾음, 총 ${allItems.length}개`)

    } catch (error) {
      console.error(`❌ 쿼리 "${query}" 검색 오류:`, error)
      continue // 다음 쿼리 시도
    }
  }

  console.log('📊 최종 파싱된 기사 개수:', allItems.length)

  // 결과를 셔플하여 더 다양한 순서로 제공 (같은 키워드로 찾은 기사들이 몰리지 않도록)
  const shuffled = [...allItems].sort(() => Math.random() - 0.5)
  
  // 최종적으로 요청한 개수만큼만 반환 (더 많은 기사를 보여주기 위해 제한 완화)
  // maxArticles보다 더 많이 반환하여 각 키워드별로 충분한 기사 제공
  const finalResults = shuffled.slice(0, maxArticles)
  
  console.log('📊 최종 반환 기사 개수:', finalResults.length)
  console.log('📊 키워드별 기사 분포:', 
    finalResults.reduce((acc, item) => {
      acc[item.matchedKeyword] = (acc[item.matchedKeyword] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  )

  // 결과가 있으면 반환, 없으면 빈 배열 반환
  return finalResults.length > 0 ? finalResults : []
}

// 관련 기사에서 자주 등장하는 키워드만 필터링
function filterKeywordsByFrequency(keywords: string[], relatedArticles: Array<{ title: string; description: string; url: string; matchedKeyword: string }>): string[] {
  if (!keywords || keywords.length === 0 || !relatedArticles || relatedArticles.length === 0) {
    return keywords
  }

  // 관련 기사들의 제목과 설명을 합친 텍스트
  const allText = relatedArticles
    .map(article => `${article.title} ${article.description}`)
    .join(' ')
    .toLowerCase()

  // 각 키워드의 등장 빈도 계산
  const keywordFrequency: Array<{ keyword: string; count: number }> = keywords.map(keyword => {
    // 키워드를 소문자로 변환하여 검색
    const keywordLower = keyword.toLowerCase()
    // 정규식으로 단어 단위로 매칭 (부분 문자열이 아닌)
    const regex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    const matches = allText.match(regex)
    const count = matches ? matches.length : 0
    
    return { keyword, count }
  })

  console.log('📊 키워드 등장 빈도:', keywordFrequency)

  // 등장 빈도가 2번 이상인 키워드만 필터링
  const frequentKeywords = keywordFrequency
    .filter(item => item.count >= 2)
    .sort((a, b) => b.count - a.count) // 빈도순 정렬
    .map(item => item.keyword)

  // 자주 등장하는 키워드가 있으면 그것만 반환, 없으면 원래 키워드 반환
  if (frequentKeywords.length > 0) {
    // 최대 6개까지만 반환 (너무 많으면 제한)
    return frequentKeywords.slice(0, 6)
  }

  // 자주 등장하는 키워드가 없으면, 등장 빈도가 1번 이상인 키워드 중 상위 5개 반환
  const atLeastOnce = keywordFrequency
    .filter(item => item.count >= 1)
    .sort((a, b) => b.count - a.count)
    .map(item => item.keyword)
    .slice(0, 5)

  return atLeastOnce.length > 0 ? atLeastOnce : keywords.slice(0, 5)
}
