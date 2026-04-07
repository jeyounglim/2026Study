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

  // Groq API를 사용한 기사 요약 생성
  const generateSummaryWithGPT = async (text: string, groqApiKey: string): Promise<string | null> => {
    try {
      const textToSummarize = text.length > 3000 ? text.substring(0, 3000) + '...' : text

      const prompt = `다음 뉴스 기사를 2-3문장으로 핵심 내용만 간결하게 요약해주세요.
요약은 객관적이고 사실에 기반하여 작성해주세요.
불필요한 수식어나 감정 표현은 제외하고, 기사의 주요 사실과 내용만 포함해주세요.

기사 본문:
${textToSummarize}

요약:`

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
          max_tokens: 200
        })
      })

      if (!response.ok) {
        throw new Error(`Groq API 오류: ${response.status}`)
      }

      const data = await response.json()
      const summaryText = data.choices[0]?.message?.content?.trim() || ''

      if (!summaryText) {
        throw new Error('요약 결과가 비어있습니다.')
      }

      console.log('✅ GPT로 요약 생성 성공')
      return summaryText
    } catch (error) {
      console.error('❌ GPT 요약 생성 실패:', error)
      return null
    }
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

    // AI로 추출된 키워드들을 필터링 (빈 문자열 제외)
    const validKeywords = keywords.filter(k => k && k.length > 0)
    
    if (validKeywords.length === 0) {
      console.error('❌ 검색할 키워드가 없습니다')
      return []
    }

    console.log('🔍 AI 추출 키워드:', validKeywords)

    let allItems: Array<{ title: string; description: string; url: string; matchedKeyword: string }> = []

    // 각 키워드를 개별적으로 검색
    for (const keyword of validKeywords) {
      if (allItems.length >= maxArticles) break // 충분한 결과가 있으면 중단

      try {
        // Google News RSS: 언어/지역은 hl/gl/ceid로 지정하고, 쿼리에는 when:7d로 최근 기사 가중
        const query = `${keyword} when:7d`
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`

        // 타임아웃 설정
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)

        let response: Response
        let xml: string

        try {
          // 직접 fetch 시도
          response = await fetch(rssUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'application/rss+xml, application/xml, text/xml, */*'
            },
            signal: controller.signal
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            console.error('❌ RSS 응답 실패:', response.status, response.statusText)
            continue // 다음 키워드 시도
          }

          xml = await response.text()
        } catch (fetchError: any) {
          clearTimeout(timeoutId)
          
          // CORS 오류나 네트워크 오류 시 프록시 사용
          if (fetchError.name === 'AbortError' || fetchError.name === 'TypeError') {
            console.log(`⚠️ 직접 fetch 실패, 프록시 시도: ${keyword}`)
            
            const proxyServices = [
              `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`,
              `https://corsproxy.io/?${encodeURIComponent(rssUrl)}`,
              `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rssUrl)}`
            ]

            let proxySuccess = false
            for (const proxyUrl of proxyServices) {
              try {
                const proxyController = new AbortController()
                const proxyTimeout = setTimeout(() => proxyController.abort(), 8000)
                
                const proxyResponse = await fetch(proxyUrl, {
                  signal: proxyController.signal,
                  headers: {
                    'Accept': 'application/rss+xml, application/xml, text/xml, */*'
                  }
                })

                clearTimeout(proxyTimeout)

                if (proxyResponse.ok) {
                  if (proxyUrl.includes('allorigins.win')) {
                    const data = await proxyResponse.json()
                    xml = data.contents || ''
                  } else {
                    xml = await proxyResponse.text()
                  }
                  
                  if (xml && xml.length > 100) {
                    proxySuccess = true
                    console.log(`✅ 프록시로 RSS 가져오기 성공: ${keyword}`)
                    break
                  }
                }
              } catch (proxyError) {
                continue
              }
            }

            if (!proxySuccess) {
              console.error(`❌ 모든 프록시 실패: ${keyword}`)
              continue // 다음 키워드 시도
            }
          } else {
            throw fetchError
          }
        }

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
                  matchedKeyword: keyword // 어떤 키워드로 검색되었는지 저장
                })
              }
            } catch (e) {
              if (!articleUrl.includes(excludeUrl)) {
                items.push({
                  title: articleTitle || '제목 없음',
                  description: articleDescription || '',
                  url: articleUrl,
                  matchedKeyword: keyword // 어떤 키워드로 검색되었는지 저장
                })
              }
            }
          }

          if (items.length >= 50) break
        }

        const existingUrls = new Set(allItems.map(item => item.url))

        for (const item of items) {
          if (allItems.length >= maxArticles) break
          if (!existingUrls.has(item.url)) {
            allItems.push(item)
            existingUrls.add(item.url)
          }
        }

        console.log(`📊 키워드 "${keyword}"로 ${items.length}개 기사 찾음, 총 ${allItems.length}개`)

      } catch (error) {
        console.error(`❌ 키워드 "${keyword}" 검색 오류:`, error)
        continue // 다음 키워드 시도
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
    if (!keywords || keywords.length === 0) {
      return keywords
    }

    // 관련 기사가 없으면 원래 키워드 반환
    if (!relatedArticles || relatedArticles.length === 0) {
      return keywords.slice(0, 5)
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

    // 등장 빈도가 2번 이상인 키워드 우선 선택
    const frequentKeywords = keywordFrequency
      .filter(item => item.count >= 2)
      .sort((a, b) => b.count - a.count)
      .map(item => item.keyword)

    if (frequentKeywords.length > 0) {
      // 최소 3개 이상의 키워드가 있으면 반환, 없으면 원래 키워드와 병합
      if (frequentKeywords.length >= 3) {
        return frequentKeywords.slice(0, 6)
      } else {
        // 빈도 높은 키워드 + 원래 키워드 중 상위 키워드 병합
        const remainingKeywords = keywords
          .filter(k => !frequentKeywords.includes(k))
          .slice(0, 6 - frequentKeywords.length)
        return [...frequentKeywords, ...remainingKeywords].slice(0, 6)
      }
    }

    // 등장 빈도가 1번 이상인 키워드
    const atLeastOnce = keywordFrequency
      .filter(item => item.count >= 1)
      .sort((a, b) => b.count - a.count)
      .map(item => item.keyword)
      .slice(0, 5)

    // 최소 2개 이상의 키워드가 있으면 반환, 없으면 원래 키워드 사용
    return atLeastOnce.length >= 2 ? atLeastOnce : keywords.slice(0, 5)
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

      // 여러 프록시 옵션 (더 많은 옵션 추가)
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
          name: 'corsproxy',
          url: `https://corsproxy.io/?${encodeURIComponent(url)}`,
          parser: async (response: Response) => {
            return await response.text()
          }
        },
        {
          name: 'cors-anywhere',
          url: `https://cors-anywhere.herokuapp.com/${url}`,
          parser: async (response: Response) => {
            return await response.text()
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
          name: 'thingproxy',
          url: `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(url)}`,
          parser: async (response: Response) => {
            return await response.text()
          }
        },
        {
          name: 'proxy',
          url: `https://proxy.cors.sh/${url}`,
          parser: async (response: Response) => {
            return await response.text()
          }
        }
      ]

      // 먼저 직접 fetch 시도
      let directSuccess = false
      try {
        const directResponse = await fetch(url, {
          mode: 'cors',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          },
          signal: controller.signal
        })
        
        if (directResponse.ok) {
          html = await directResponse.text()
          if (html && html.length > 100) {
            console.log('✅ 직접 fetch 성공')
            directSuccess = true
          }
        }
      } catch (directError: any) {
        if (!directSuccess) {
          console.log('직접 fetch 실패, 프록시 시도:', directError?.message || 'CORS 오류')
        }
      }
      
      // 직접 fetch 실패 시 프록시 서비스를 순차적으로 시도
      if (!directSuccess && html.length < 100) {
        let proxySuccess = false
        for (const proxy of proxyServices) {
          if (proxySuccess) break
          
          try {
            console.log(`프록시 시도: ${proxy.name}`)
            
            // 각 프록시마다 개별 AbortController 생성
            const proxyController = new AbortController()
            const proxyTimeout = setTimeout(() => proxyController.abort(), 10000)
            
            const proxyResponse = await fetch(proxy.url, {
              signal: proxyController.signal,
              headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            })

            clearTimeout(proxyTimeout)

            if (proxyResponse.ok) {
              const parsedHtml = await proxy.parser(proxyResponse)
              if (parsedHtml && parsedHtml.length > 100) {
                html = parsedHtml
                console.log(`✅ 프록시 성공: ${proxy.name}`)
                proxySuccess = true
                break
              } else {
                console.log(`프록시 ${proxy.name} 응답이 너무 짧음: ${parsedHtml?.length || 0}자`)
              }
            } else {
              console.log(`프록시 ${proxy.name} HTTP 오류: ${proxyResponse.status}`)
            }
          } catch (proxyError: any) {
            if (proxyError.name === 'AbortError') {
              console.log(`프록시 ${proxy.name} 타임아웃`)
            } else {
              console.log(`프록시 ${proxy.name} 실패:`, proxyError.message)
            }
            continue
          }
        }
        
        // 모든 프록시 실패 시
        if (!proxySuccess && html.length < 100) {
          throw new Error('뉴스를 가져올 수 없습니다. CORS 정책으로 인해 일부 사이트는 접근할 수 없습니다. 다른 뉴스 URL을 시도해보세요.')
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
      console.log('🔑 GROQ API 키 확인:', groqApiKey ? '✅ 설정됨' : '❌ 설정되지 않음')
      let keywords: string[]

      // 기사 요약 생성 (본문이 충분히 있을 때만)
      let summary: string | null = null
      if (articleContent && articleContent.length > 200 && groqApiKey) {
        console.log('📝 AI로 기사 요약 생성 중...')
        summary = await generateSummaryWithGPT(articleContent, groqApiKey)
        console.log('✅ 요약 생성 완료')
      }

      if (articleContent && articleContent.length > 100) {
        console.log('🤖 AI로 본문 분석 중...')
        keywords = await extractKeywordsWithGPT(articleContent, groqApiKey)
        console.log('🔑 AI로 추출된 키워드:', keywords)
      } else {
        console.log('⚠️ 본문이 짧아 제목+설명으로 키워드 추출')
        keywords = await extractKeywordsWithGPT(title + ' ' + description, groqApiKey)
        console.log('🔑 추출된 키워드:', keywords)
      }

      // 1단계: 초기 키워드로 관련 기사 검색
      const initialArticles = await searchRelatedArticles(keywords, url, title, 50, groqApiKey)
      console.log('📰 초기 관련 기사 개수:', initialArticles.length)

      // 2단계: 관련 기사에서 자주 등장하는 키워드만 필터링
      const filteredKeywords = filterKeywordsByFrequency(keywords, initialArticles)
      console.log('🔑 필터링된 키워드:', filteredKeywords)
      console.log('🔑 원래 키워드:', keywords)

      // 3단계: 필터링된 키워드로 항상 재검색 (더 정확한 결과를 위해)
      let relatedArticles = initialArticles
      
      if (filteredKeywords.length > 0) {
        console.log('🔄 필터링된 키워드로 재검색 시작...')
        const refinedArticles = await searchRelatedArticles(filteredKeywords, url, title, 50, groqApiKey)
        console.log('📰 필터링된 키워드로 찾은 관련 기사 개수:', refinedArticles.length)
        
        if (refinedArticles.length > 0) {
          // 필터링된 키워드로 찾은 기사가 있으면 우선 사용
          relatedArticles = refinedArticles
          
          // 필터링된 키워드로 찾은 기사가 적으면 초기 결과와 병합
          if (refinedArticles.length < 20 && initialArticles.length > 0) {
            console.log('⚠️ 필터링된 키워드로 찾은 기사가 적어 초기 결과와 병합')
            const existingUrls = new Set(refinedArticles.map(a => a.url))
            const additionalArticles = initialArticles
              .filter(a => !existingUrls.has(a.url))
              .slice(0, 30) // 최대 30개만 추가
            relatedArticles = [...refinedArticles, ...additionalArticles].slice(0, 50)
            console.log('📰 병합 후 총 기사 개수:', relatedArticles.length)
          }
        } else {
          console.log('⚠️ 필터링된 키워드로 기사를 찾지 못해 초기 결과 사용')
          // 필터링된 키워드로 기사를 찾지 못했으면 초기 결과 사용
          relatedArticles = initialArticles
        }
      } else {
        console.log('⚠️ 필터링된 키워드가 없어 초기 결과 사용')
        // 필터링된 키워드가 없으면 초기 결과 사용
        relatedArticles = initialArticles
      }

      // 4단계: 여전히 결과가 없으면 제목/상위 키워드 조합으로 폴백 검색
      if ((!relatedArticles || relatedArticles.length === 0) && (title || keywords.length > 0)) {
        console.log('🛟 폴백 검색 시작 (제목/상위 키워드 조합)')
        const topKeywords = (keywords || []).slice(0, 2)
        const fallbackQueries: string[] = []
        if (title) fallbackQueries.push(`"${title}"`)
        if (topKeywords.length >= 2) fallbackQueries.push(`${topKeywords[0]} ${topKeywords[1]}`)
        if (topKeywords.length === 1) fallbackQueries.push(topKeywords[0])

        let fallbackResults: typeof relatedArticles = []
        for (const q of fallbackQueries) {
          if (fallbackResults.length > 0) break
          try {
            const fr = await searchRelatedArticles([q], url, title, 30, groqApiKey)
            if (fr.length > 0) {
              fallbackResults = fr
              console.log(`✅ 폴백 쿼리 성공: ${q} -> ${fr.length}건`)
            }
          } catch (e) {
            // 다음 폴백으로 진행
          }
        }

        if (fallbackResults.length > 0) {
          relatedArticles = fallbackResults
        }
      }

      return {
        currentNews: {
          title,
          description,
          url,
          summary
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
