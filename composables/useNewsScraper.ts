// 클라이언트 사이드에서 실행되는 뉴스 스크래퍼
export const useNewsScraper = () => {
  const config = useRuntimeConfig()

  // 기사 본문 전체 추출 함수
  const extractArticleContent = (html: string): string => {
    const removeHtmlTags = (text: string): string => {
      return text
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
        .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim()
    }

    let content = ''

    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
    if (articleMatch) {
      content = removeHtmlTags(articleMatch[1])
      if (content.length > 200) {
        return content
      }
    }

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

    if (content.length < 200) {
      const pMatches = html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)
      const paragraphs: string[] = []
      for (const match of pMatches) {
        const text = removeHtmlTags(match[1])
        if (text.length > 20) {
          paragraphs.push(text)
        }
      }
      if (paragraphs.length > 0) {
        content = paragraphs.join(' ')
      }
    }

    if (content.length < 200) {
      const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
      if (mainMatch) {
        const extracted = removeHtmlTags(mainMatch[1])
        if (extracted.length > content.length) {
          content = extracted
        }
      }
    }

    if (content.length > 3000) {
      content = content.substring(0, 3000) + '...'
    }

    return content
  }

  // Groq API를 사용한 키워드 추출
  const extractKeywordsWithGPT = async (text: string, groqApiKey?: string): Promise<string[]> => {
    if (!groqApiKey) {
      console.log('⚠️ GROQ_API_KEY가 설정되지 않아 기본 키워드 추출 방식을 사용합니다.')
      return extractKeywordsFallback(text)
    }

    try {
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
          model: 'llama-3.1-8b-instant',
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

      const keywords = keywordsText
        .split(/[,，]/)
        .map((k: string) => k.trim())
        .filter((k: string) => k.length > 0)
        .slice(0, 8)

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

  // 기본 키워드 추출 방식
  const extractKeywordsFallback = (text: string): string[] => {
    const stopWords = [
      '은', '는', '이', '가', '을', '를', '의', '에', '에서', '과', '와', '도', '로', '으로',
      '하다', '있다', '되다', '이다', '된다', '한다',
      '그', '그것', '이것', '저것', '그런', '이런', '저런',
      '때', '때문', '위해', '통해', '대해', '관련', '대한',
      '또한', '또', '그리고', '하지만', '그러나', '그런데',
      '것', '거', '수', '경우', '때문', '이유', '원인',
      '등', '및', '또는', '그래서', '따라서', '그러므로'
    ]

    let cleanedText = text
      .replace(/[^\w\s가-힣]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const words = cleanedText
      .split(/\s+/)
      .filter(word => {
        return word.length >= 2 &&
          !stopWords.includes(word) &&
          !/^\d+$/.test(word) &&
          !word.match(/^[a-zA-Z]+$/)
      })
      .map(word => word.trim())
      .filter(word => word.length > 0)

    const wordCount: Record<string, number> = {}
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1
    })

    const sortedWords = Object.keys(wordCount)
      .sort((a, b) => {
        if (wordCount[b] !== wordCount[a]) {
          return wordCount[b] - wordCount[a]
        }
        return b.length - a.length
      })
      .slice(0, 8)

    return sortedWords.length > 0 ? sortedWords : words.slice(0, 5)
  }

  // 관련 기사 검색
  const searchRelatedArticles = async (
    keywords: string[],
    excludeUrl: string,
    title?: string,
    maxArticles: number = 20,
    groqApiKey?: string
  ) => {
    if (!keywords || keywords.length === 0) {
      if (title) {
        keywords = await extractKeywordsWithGPT(title, groqApiKey)
        console.log('⚠️ 키워드가 없어 제목에서 추출:', keywords)
      } else {
        console.error('❌ 검색할 키워드가 없습니다')
        return []
      }
    }

    const searchQueries: string[] = []

    keywords.forEach(keyword => {
      if (keyword && keyword.length > 0) {
        searchQueries.push(keyword)
      }
    })

    if (keywords.length >= 2) {
      searchQueries.push(keywords.slice(0, 2).join(' '))
      if (keywords.length >= 3) {
        searchQueries.push(keywords.slice(0, 3).join(' '))
      }
      if (keywords.length >= 4) {
        searchQueries.push(keywords.slice(0, 4).join(' '))
      }
      if (keywords.length >= 2) {
        searchQueries.push(keywords.slice(0, 2).reverse().join(' '))
      }
      if (keywords.length >= 3) {
        searchQueries.push(keywords.slice(1, 3).join(' '))
      }
      if (keywords.length >= 4) {
        searchQueries.push(keywords.slice(1, 4).join(' '))
      }
    }

    const uniqueQueries = Array.from(new Set(searchQueries.filter(q => q.length > 0)))
    console.log('🔍 생성된 검색 쿼리:', uniqueQueries)

    let allItems: Array<{ title: string; description: string; url: string; matchedKeyword: string }> = []
    const targetArticles = maxArticles * 3

    for (const query of uniqueQueries) {
      if (allItems.length >= targetArticles) break

      try {
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}+언어:ko&hl=ko&gl=KR&ceid=KR:ko`

        const response = await fetch(rssUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })

        if (!response.ok) {
          console.error('❌ RSS 응답 실패:', response.status, response.statusText)
          continue
        }

        const xml = await response.text()

        const decodeHtml = (str: string) => {
          return str
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ')
        }

        const items: Array<{ title: string; description: string; url: string; matchedKeyword: string }> = []
        const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)

        for (const itemMatch of itemMatches) {
          const itemContent = itemMatch[1]

          const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/i) ||
            itemContent.match(/<title>(.*?)<\/title>/i)
          const articleTitle = titleMatch ? decodeHtml(titleMatch[1].trim()) : ''

          const linkMatch = itemContent.match(/<link>(.*?)<\/link>/i)
          let articleUrl = linkMatch ? linkMatch[1].trim() : ''

          if (articleUrl && articleUrl.includes('news.google.com')) {
            const urlMatch = articleUrl.match(/url=([^&]+)/)
            if (urlMatch) {
              articleUrl = decodeURIComponent(urlMatch[1])
            }
          }

          const descMatch = itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/i) ||
            itemContent.match(/<description>(.*?)<\/description>/i)
          const articleDescription = descMatch ? decodeHtml(descMatch[1].trim().replace(/<[^>]+>/g, '')) : ''

          if (articleTitle && articleUrl) {
            try {
              const excludeHostname = new URL(excludeUrl).hostname
              const articleHostname = new URL(articleUrl).hostname

              if (articleHostname !== excludeHostname) {
                items.push({
                  title: articleTitle || '제목 없음',
                  description: articleDescription || '',
                  url: articleUrl,
                  matchedKeyword: query
                })
              }
            } catch (e) {
              if (!articleUrl.includes(excludeUrl)) {
                items.push({
                  title: articleTitle || '제목 없음',
                  description: articleDescription || '',
                  url: articleUrl,
                  matchedKeyword: query
                })
              }
            }
          }

          if (items.length >= 50) break
        }

        const existingUrls = new Set(allItems.map(item => item.url))

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
        continue
      }
    }

    const shuffled = [...allItems].sort(() => Math.random() - 0.5)
    const finalResults = shuffled.slice(0, maxArticles)

    return finalResults.length > 0 ? finalResults : []
  }

  // 키워드 필터링
  const filterKeywordsByFrequency = (
    keywords: string[],
    relatedArticles: Array<{ title: string; description: string; url: string; matchedKeyword: string }>
  ): string[] => {
    if (!keywords || keywords.length === 0 || !relatedArticles || relatedArticles.length === 0) {
      return keywords
    }

    const allText = relatedArticles
      .map(article => `${article.title} ${article.description}`)
      .join(' ')
      .toLowerCase()

    const keywordFrequency: Array<{ keyword: string; count: number }> = keywords.map(keyword => {
      const keywordLower = keyword.toLowerCase()
      const regex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
      const matches = allText.match(regex)
      const count = matches ? matches.length : 0

      return { keyword, count }
    })

    const frequentKeywords = keywordFrequency
      .filter(item => item.count >= 2)
      .sort((a, b) => b.count - a.count)
      .map(item => item.keyword)

    if (frequentKeywords.length > 0) {
      return frequentKeywords.slice(0, 6)
    }

    const atLeastOnce = keywordFrequency
      .filter(item => item.count >= 1)
      .sort((a, b) => b.count - a.count)
      .map(item => item.keyword)
      .slice(0, 5)

    return atLeastOnce.length > 0 ? atLeastOnce : keywords.slice(0, 5)
  }

  // 메인 스크래핑 함수
  const scrapeNews = async (url: string) => {
    if (!url) {
      throw new Error('URL이 필요합니다.')
    }

    try {
      new URL(url)
    } catch {
      throw new Error('유효하지 않은 URL입니다.')
    }

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      let html: string = ''

      // 여러 프록시 옵션
      const proxyServices = [
        {
          name: 'allorigins',
          url: `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
          parser: async (response: Response) => {
            const data = await response.json()
            return data.contents || ''
          }
        },
        {
          name: 'codetabs',
          url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
          parser: async (response: Response) => {
            return await response.text()
          }
        },
        {
          name: 'corsproxy',
          url: `https://corsproxy.io/?${encodeURIComponent(url)}`,
          parser: async (response: Response) => {
            return await response.text()
          }
        }
      ]

      // 먼저 직접 fetch 시도
      try {
        const directResponse = await fetch(url, {
          mode: 'cors',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          signal: controller.signal
        })
        
        if (directResponse.ok) {
          html = await directResponse.text()
        } else {
          throw new Error(`HTTP ${directResponse.status}`)
        }
      } catch (directError: any) {
        console.log('직접 fetch 실패, 프록시 시도:', directError.message)
        
        // 프록시 서비스를 순차적으로 시도
        for (const proxy of proxyServices) {
          try {
            console.log(`프록시 시도: ${proxy.name}`)
            const proxyResponse = await fetch(proxy.url, {
              signal: controller.signal,
              headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
              }
            })

            if (proxyResponse.ok) {
              html = await proxy.parser(proxyResponse)
              if (html && html.length > 100) {
                console.log(`✅ 프록시 성공: ${proxy.name}`)
                break
              }
            }
          } catch (proxyError: any) {
            console.log(`프록시 ${proxy.name} 실패:`, proxyError.message)
            continue
          }
        }
      }

      clearTimeout(timeoutId)

      if (!html || html.length < 50) {
        throw new Error('뉴스를 가져올 수 없습니다. CORS 정책으로 인해 일부 사이트는 접근할 수 없습니다.')
      }

      let title = ''
      let description = ''

      const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
      if (ogTitleMatch) {
        title = ogTitleMatch[1].trim()
      }

      if (!title) {
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
        if (titleMatch) {
          title = titleMatch[1].trim().replace(/\s*[-|]\s*.*$/, '').trim()
        }
      }

      if (!title) {
        const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
        if (h1Match) {
          title = h1Match[1].trim()
        }
      }

      const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
      if (ogDescMatch) {
        description = ogDescMatch[1].trim()
      }

      if (!description) {
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
        if (descMatch) {
          description = descMatch[1].trim()
        }
      }

      if (!description) {
        const articleMatch = html.match(/<article[^>]*>[\s\S]*?<p[^>]*>([^<]+)<\/p>/i) ||
          html.match(/<div[^>]*class=["'][^"']*article["'][^>]*>[\s\S]*?<p[^>]*>([^<]+)<\/p>/i)
        if (articleMatch) {
          description = articleMatch[1].trim().substring(0, 200)
        }
      }

      if (!title) title = '제목을 찾을 수 없습니다'
      if (!description) description = '설명을 찾을 수 없습니다'

      const articleContent = extractArticleContent(html)
      console.log('📄 추출된 본문 길이:', articleContent.length)

      const groqApiKey = config.public.groqApiKey || ''
      let keywords: string[]

      if (articleContent && articleContent.length > 100) {
        console.log('🤖 AI로 본문 분석 중...')
        keywords = await extractKeywordsWithGPT(articleContent, groqApiKey)
        console.log('🔑 AI로 추출된 키워드:', keywords)
      } else {
        console.log('⚠️ 본문이 짧아 제목+설명으로 키워드 추출')
        keywords = await extractKeywordsWithGPT(title + ' ' + description, groqApiKey)
        console.log('🔑 추출된 키워드:', keywords)
      }

      const initialArticles = await searchRelatedArticles(keywords, url, title, 50, groqApiKey)
      console.log('📰 초기 관련 기사 개수:', initialArticles.length)

      const filteredKeywords = filterKeywordsByFrequency(keywords, initialArticles)
      console.log('🔑 필터링된 키워드:', filteredKeywords)

      let relatedArticles = initialArticles
      if (filteredKeywords.length > 0 && filteredKeywords.length < keywords.length) {
        relatedArticles = await searchRelatedArticles(filteredKeywords, url, title, 50, groqApiKey)
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
      if (err.name === 'AbortError' || err.name === 'TimeoutError') {
        throw new Error('요청 시간이 초과되었습니다. 다시 시도해주세요.')
      }

      if (err.message?.includes('fetch')) {
        throw new Error('뉴스 사이트에 연결할 수 없습니다. 네트워크를 확인해주세요.')
      }

      throw new Error(err.message || '뉴스를 처리하는 중 오류가 발생했습니다.')
    }
  }

  return {
    scrapeNews
  }
}
