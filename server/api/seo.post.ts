// 인터페이스 정의를 먼저 선언
interface SEOIssue {
  type: 'error' | 'warning' | 'info'
  category: string
  message: string
  suggestion: string
  currentValue?: string
  recommendedValue?: string
}

interface SEOAnalysis {
  score: number
  issues: SEOIssue[]
  recommendations: string[]
  metadata: {
    title?: string
    description?: string
    ogTitle?: string
    ogDescription?: string
    ogImage?: string
    canonical?: string
    hasJsonLd: boolean
    h1Count: number
    h2Count: number
    imageCount: number
    imagesWithoutAlt: number
    hasViewport: boolean
    urlLength: number
  }
}

// HTML에서 본문 텍스트 추출 함수
function extractPageContent(html: string): string {
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

  // article 태그에서 본문 추출
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
  if (articleMatch) {
    content = removeHtmlTags(articleMatch[1])
    if (content.length > 200) {
      return content
    }
  }

  // main 태그에서 추출
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
  if (mainMatch) {
    const extracted = removeHtmlTags(mainMatch[1])
    if (extracted.length > content.length) {
      content = extracted
    }
  }

  // p 태그들을 모아서 본문으로 사용
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

  // 본문이 너무 길면 일부만 사용
  if (content.length > 2000) {
    content = content.substring(0, 2000) + '...'
  }

  return content
}

// Groq API를 사용한 메타 설명 생성
async function generateMetaDescription(content: string, title: string, groqApiKey?: string): Promise<string | null> {
  if (!groqApiKey) {
    return null
  }

  try {
    // 본문이 너무 길면 일부만 사용
    const textToAnalyze = content.length > 1500 ? content.substring(0, 1500) + '...' : content

    const prompt = `다음 웹페이지의 제목과 내용을 바탕으로 SEO에 최적화된 메타 설명(meta description)을 작성해주세요.

요구사항:
- 120-160자 사이로 작성
- 페이지의 핵심 내용을 간결하게 요약
- 검색 엔진과 사용자에게 매력적으로 보이도록 작성
- 불필요한 수식어나 감정 표현은 제외
- 객관적이고 사실에 기반하여 작성

페이지 제목: ${title}
페이지 내용: ${textToAnalyze}

메타 설명:`

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
    const metaDescription = data.choices[0]?.message?.content?.trim() || ''

    if (!metaDescription) {
      return null
    }

    // 160자로 제한
    const finalDescription = metaDescription.length > 160 
      ? metaDescription.substring(0, 157) + '...' 
      : metaDescription

    console.log('✅ 메타 설명 생성 성공')
    return finalDescription
  } catch (error) {
    console.error('❌ 메타 설명 생성 실패:', error)
    return null
  }
}

// analyzeSEO 함수를 먼저 정의
async function analyzeSEO(html: string, url: string, groqApiKey?: string): Promise<SEOAnalysis> {
  if (!html || typeof html !== 'string') {
    throw new Error('HTML 내용이 유효하지 않습니다.')
  }

  if (!url || typeof url !== 'string') {
    throw new Error('URL이 유효하지 않습니다.')
  }

  const issues: SEOIssue[] = []
  const recommendations: string[] = []
  let score = 100

  // 변수 초기화
  let title = ''
  let description = ''
  let ogTitle = ''
  let ogDescription = ''
  let ogImage = ''
  let canonical = ''

  try {
    // 메타 태그 추출
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    title = titleMatch ? titleMatch[1].trim() : ''

    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
    description = descMatch ? descMatch[1].trim() : ''

    // Open Graph 태그
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
    ogTitle = ogTitleMatch ? ogTitleMatch[1].trim() : ''

    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
    ogDescription = ogDescMatch ? ogDescMatch[1].trim() : ''

    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
    ogImage = ogImageMatch ? ogImageMatch[1].trim() : ''

    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)
    canonical = canonicalMatch ? canonicalMatch[1].trim() : ''
  } catch (e) {
    console.warn('메타 태그 추출 중 경고:', e)
    // 계속 진행
  }

  // 구조화된 데이터 (JSON-LD)
  let hasJsonLd = false
  try {
    const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
    hasJsonLd = Array.from(jsonLdMatches).length > 0
  } catch (e) {
    console.warn('JSON-LD 검색 실패:', e)
  }

  // 헤딩 구조
  let h1Count = 0
  let h2Count = 0
  try {
    const h1Matches = html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)
    h1Count = Array.from(h1Matches).length
  } catch (e) {
    console.warn('H1 검색 실패:', e)
  }

  try {
    const h2Matches = html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)
    h2Count = Array.from(h2Matches).length
  } catch (e) {
    console.warn('H2 검색 실패:', e)
  }

  // 이미지 분석
  let imageCount = 0
  let imagesWithoutAlt = 0
  try {
    const imgMatches = html.matchAll(/<img[^>]*>/gi)
    const images = Array.from(imgMatches)
    imageCount = images.length
    imagesWithoutAlt = images.filter(img => {
      try {
        const altMatch = img.match(/alt=["']([^"']*)["']/i)
        return !altMatch || !altMatch[1].trim()
      } catch (e) {
        return true
      }
    }).length
  } catch (e) {
    console.warn('이미지 분석 실패:', e)
  }

  // Viewport 메타 태그
  const viewportMatch = html.match(/<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']+)["']/i)
  const hasViewport = !!viewportMatch

  // URL 길이
  const urlLength = url.length

  // SEO 검증 및 이슈 생성

  // 1. Title 검증
  if (!title) {
    issues.push({
      type: 'error',
      category: '메타 태그',
      message: '페이지 제목(title)이 없습니다.',
      suggestion: '페이지에 <title> 태그를 추가하세요.'
    })
    score -= 20
  } else {
    if (title.length < 30) {
      issues.push({
        type: 'warning',
        category: '메타 태그',
        message: `페이지 제목이 너무 짧습니다. (${title.length}자)`,
        suggestion: '제목은 30-60자 사이가 권장됩니다.',
        currentValue: title,
        recommendedValue: `${title} - 더 자세한 설명 추가`
      })
      score -= 5
    } else if (title.length > 60) {
      issues.push({
        type: 'warning',
        category: '메타 태그',
        message: `페이지 제목이 너무 깁니다. (${title.length}자)`,
        suggestion: '제목은 30-60자 사이가 권장됩니다.',
        currentValue: title,
        recommendedValue: title.substring(0, 60) + '...'
      })
      score -= 5
    }
  }

  // 2. Description 검증
  let recommendedDescription: string | null = null
  if (!description) {
    // 메타 설명이 없으면 AI로 추천 생성 시도
    const pageContent = extractPageContent(html)
    if (pageContent && pageContent.length > 100 && groqApiKey) {
      recommendedDescription = await generateMetaDescription(pageContent, title || '페이지', groqApiKey)
    }

    issues.push({
      type: 'error',
      category: '메타 태그',
      message: '메타 설명(description)이 없습니다.',
      suggestion: '페이지에 <meta name="description"> 태그를 추가하세요.',
      recommendedValue: recommendedDescription || undefined
    })
    score -= 15
  } else {
    if (description.length < 120) {
      // 메타 설명이 짧으면 AI로 개선된 버전 생성 시도
      let improvedDescription: string | null = null
      const pageContent = extractPageContent(html)
      if (pageContent && pageContent.length > 100 && groqApiKey) {
        improvedDescription = await generateMetaDescription(pageContent, title || '페이지', groqApiKey)
      }

      issues.push({
        type: 'warning',
        category: '메타 태그',
        message: `메타 설명이 너무 짧습니다. (${description.length}자)`,
        suggestion: '메타 설명은 120-160자 사이가 권장됩니다.',
        currentValue: description,
        recommendedValue: improvedDescription || (description + ' - 더 자세한 내용 추가')
      })
      score -= 5
    } else if (description.length > 160) {
      issues.push({
        type: 'warning',
        category: '메타 태그',
        message: `메타 설명이 너무 깁니다. (${description.length}자)`,
        suggestion: '메타 설명은 120-160자 사이가 권장됩니다.',
        currentValue: description,
        recommendedValue: description.substring(0, 160) + '...'
      })
      score -= 5
    }
  }

  // 3. Open Graph 태그 검증
  if (!ogTitle) {
    issues.push({
      type: 'warning',
      category: '소셜 미디어',
      message: 'Open Graph 제목(og:title)이 없습니다.',
      suggestion: '소셜 미디어 공유를 위해 <meta property="og:title"> 태그를 추가하세요.'
    })
    score -= 5
  }

  if (!ogDescription) {
    issues.push({
      type: 'warning',
      category: '소셜 미디어',
      message: 'Open Graph 설명(og:description)이 없습니다.',
      suggestion: '소셜 미디어 공유를 위해 <meta property="og:description"> 태그를 추가하세요.'
    })
    score -= 5
  }

  if (!ogImage) {
    issues.push({
      type: 'warning',
      category: '소셜 미디어',
      message: 'Open Graph 이미지(og:image)가 없습니다.',
      suggestion: '소셜 미디어 공유를 위해 <meta property="og:image"> 태그를 추가하세요.'
    })
    score -= 5
  }

  // 4. Canonical URL 검증
  if (!canonical) {
    issues.push({
      type: 'info',
      category: 'URL 구조',
      message: 'Canonical URL이 없습니다.',
      suggestion: '중복 콘텐츠를 방지하기 위해 <link rel="canonical"> 태그를 추가하세요.'
    })
    score -= 3
  }

  // 5. 구조화된 데이터 검증
  if (!hasJsonLd) {
    issues.push({
      type: 'warning',
      category: '구조화된 데이터',
      message: '구조화된 데이터(JSON-LD)가 없습니다.',
      suggestion: '검색 엔진이 콘텐츠를 더 잘 이해할 수 있도록 JSON-LD 구조화된 데이터를 추가하세요.'
    })
    score -= 10
  }

  // 6. 헤딩 구조 검증
  if (h1Count === 0) {
    issues.push({
      type: 'error',
      category: '콘텐츠 구조',
      message: 'H1 태그가 없습니다.',
      suggestion: '페이지에 하나의 <h1> 태그를 추가하여 주요 제목을 표시하세요.'
    })
    score -= 10
  } else if (h1Count > 1) {
    issues.push({
      type: 'warning',
      category: '콘텐츠 구조',
      message: `H1 태그가 ${h1Count}개 있습니다.`,
      suggestion: '페이지당 하나의 H1 태그만 사용하는 것이 권장됩니다.'
    })
    score -= 5
  }

  if (h2Count === 0) {
    issues.push({
      type: 'info',
      category: '콘텐츠 구조',
      message: 'H2 태그가 없습니다.',
      suggestion: '콘텐츠를 섹션으로 나누기 위해 <h2> 태그를 사용하세요.'
    })
    score -= 3
  }

  // 7. 이미지 Alt 태그 검증
  if (imageCount > 0 && imagesWithoutAlt > 0) {
    issues.push({
      type: 'warning',
      category: '접근성',
      message: `${imagesWithoutAlt}개의 이미지에 Alt 속성이 없습니다.`,
      suggestion: '모든 이미지에 의미 있는 alt 속성을 추가하여 접근성과 SEO를 개선하세요.'
    })
    score -= Math.min(imagesWithoutAlt * 2, 10)
  }

  // 8. Viewport 메타 태그 검증
  if (!hasViewport) {
    issues.push({
      type: 'error',
      category: '모바일 최적화',
      message: 'Viewport 메타 태그가 없습니다.',
      suggestion: '모바일 친화적인 페이지를 위해 <meta name="viewport"> 태그를 추가하세요.'
    })
    score -= 15
  }

  // 9. URL 길이 검증
  if (urlLength > 100) {
    issues.push({
      type: 'warning',
      category: 'URL 구조',
      message: `URL이 너무 깁니다. (${urlLength}자)`,
      suggestion: '짧고 의미 있는 URL을 사용하는 것이 SEO에 유리합니다.'
    })
    score -= 5
  }

  // 점수는 0 이상으로 유지
  score = Math.max(0, score)

  // 개선 제안 생성
  if (score < 100) {
    recommendations.push('위의 이슈들을 해결하여 SEO 점수를 개선하세요.')
  }
  if (!hasJsonLd) {
    recommendations.push('구조화된 데이터(JSON-LD)를 추가하여 검색 결과에 리치 스니펫을 표시할 수 있습니다.')
  }
  if (imagesWithoutAlt > 0) {
    recommendations.push('이미지에 Alt 텍스트를 추가하여 접근성과 SEO를 개선하세요.')
  }

  return {
    score,
    issues,
    recommendations,
    metadata: {
      title,
      description,
      ogTitle,
      ogDescription,
      ogImage,
      canonical,
      hasJsonLd,
      h1Count,
      h2Count,
      imageCount,
      imagesWithoutAlt,
      hasViewport,
      urlLength
    }
  }
}

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig(event)
    
    let body: any
    try {
      body = await readBody(event)
    } catch (bodyErr: any) {
      console.error('Body 읽기 실패:', bodyErr)
      throw createError({
        statusCode: 400,
        message: '요청 본문을 읽을 수 없습니다.'
      })
    }

    const { url } = body || {}

    if (!url || typeof url !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'URL이 필요합니다.'
      })
    }

    // URL 유효성 검사
    let validUrl: URL
    try {
      validUrl = new URL(url)
    } catch {
      throw createError({
        statusCode: 400,
        message: '유효하지 않은 URL입니다.'
      })
    }

    // 타임아웃 설정 (15초)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    let html: string = ''
    let fetchError: any = null

    // 서버 사이드에서는 직접 fetch 시도 (CORS 제한 없음)
    try {
      // 다양한 User-Agent로 시도
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
      ]

      for (const userAgent of userAgents) {
        try {
          const directController = new AbortController()
          const directTimeout = setTimeout(() => directController.abort(), 15000)
          
          const response = await fetch(url, {
            headers: {
              'User-Agent': userAgent,
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
              'Accept-Encoding': 'gzip, deflate, br',
              'Connection': 'keep-alive',
              'Upgrade-Insecure-Requests': '1'
            },
            signal: directController.signal,
            redirect: 'follow'
          })

          clearTimeout(directTimeout)

          if (response.ok) {
            html = await response.text()
            if (html && html.length > 100) {
              console.log('✅ 직접 fetch 성공')
              fetchError = null
              break
            }
          }
        } catch (directErr: any) {
          console.log(`직접 fetch 실패 (User-Agent 변경):`, directErr.message)
          continue
        }
      }

      if (!html) {
        throw new Error('모든 User-Agent로 직접 fetch 실패')
      }
    } catch (fetchErr: any) {
      clearTimeout(timeoutId)
      fetchError = fetchErr
      
      // 직접 fetch 실패 시 프록시를 통해 재시도
      console.log('직접 fetch 실패, 프록시 시도:', fetchErr.message)
      
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
          name: 'proxyapi',
          url: `https://api.proxyapi.ru/?url=${encodeURIComponent(url)}`,
          parser: async (response: Response) => {
            return await response.text()
          }
        }
      ]

      for (const proxy of proxyServices) {
        try {
          const proxyController = new AbortController()
          const proxyTimeout = setTimeout(() => proxyController.abort(), 15000)
          
          const proxyResponse = await fetch(proxy.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            signal: proxyController.signal
          })

          clearTimeout(proxyTimeout)

          if (proxyResponse.ok) {
            try {
              html = await proxy.parser(proxyResponse)
              if (html && html.length > 100) {
                fetchError = null
                console.log(`✅ 프록시 ${proxy.name} 성공`)
                break
              }
            } catch (parseErr: any) {
              console.log(`프록시 ${proxy.name} 파싱 실패:`, parseErr.message)
              continue
            }
          } else {
            console.log(`프록시 ${proxy.name} 응답 실패:`, proxyResponse.status)
          }
        } catch (proxyErr: any) {
          console.log(`프록시 ${proxy.name} 실패:`, proxyErr.message)
          continue
        }
      }
    }

    if (!html && fetchError) {
      // 타임아웃 에러 처리
      if (fetchError.name === 'AbortError' || fetchError.name === 'TimeoutError') {
        throw createError({
          statusCode: 408,
          message: '요청 시간이 초과되었습니다. 다시 시도해주세요.'
        })
      }

      // 네트워크 에러 처리
      throw createError({
        statusCode: 503,
        message: `페이지에 연결할 수 없습니다: ${fetchError.message || '네트워크를 확인해주세요.'}`
      })
    }

    if (!html || html.length === 0) {
      throw createError({
        statusCode: 503,
        message: '페이지 내용을 가져올 수 없습니다.'
      })
    }

    // SEO 분석 실행
    let seoAnalysis: SEOAnalysis
    try {
      const groqApiKey = config.groqApiKey
      seoAnalysis = await analyzeSEO(html, url, groqApiKey)
    } catch (analysisErr: any) {
      console.error('SEO 분석 중 에러:', analysisErr)
      throw createError({
        statusCode: 500,
        message: `SEO 분석 중 오류가 발생했습니다: ${analysisErr.message || '알 수 없는 오류'}`
      })
    }

    return seoAnalysis
  } catch (err: any) {
    console.error('SEO API 전체 에러:', {
      message: err.message,
      statusCode: err.statusCode,
      stack: err.stack
    })
    
    // 이미 createError로 처리된 경우
    if (err.statusCode && err.statusCode !== 500) {
      throw err
    }

    // 기타 에러 - 더 자세한 정보 제공
    const errorMessage = err.message || 'SEO 분석 중 오류가 발생했습니다.'
    throw createError({
      statusCode: err.statusCode || 500,
      message: errorMessage,
      data: {
        originalError: process.env.NODE_ENV === 'development' ? err.message : undefined
      }
    })
  }
})
