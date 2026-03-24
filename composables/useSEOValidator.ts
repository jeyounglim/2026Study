export const useSEOValidator = () => {
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

  const fetchHtml = async (url: string): Promise<string> => {
    const proxyServices = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
    ]

    try {
      const directRes = await fetch(url)
      if (directRes.ok) {
        const html = await directRes.text()
        if (html.length > 100) return html
      }
    } catch {
      // CORS 또는 네트워크 실패 시 프록시로 폴백
    }

    for (const proxyUrl of proxyServices) {
      try {
        const res = await fetch(proxyUrl)
        if (!res.ok) continue

        let html = ''
        if (proxyUrl.includes('allorigins.win')) {
          const data = await res.json()
          html = data.contents || ''
        } else {
          html = await res.text()
        }

        if (html.length > 100) return html
      } catch {
        continue
      }
    }

    throw new Error('페이지 HTML을 가져올 수 없습니다. (CORS/네트워크 제한)')
  }

  const analyzeSEO = (html: string, url: string): SEOAnalysis => {
    const issues: SEOIssue[] = []
    const recommendations: string[] = []
    let score = 100

    const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() || ''
    const description = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1]?.trim() || ''
    const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1]?.trim() || ''
    const ogDescription = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1]?.trim() || ''
    const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1]?.trim() || ''
    const canonical = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1]?.trim() || ''
    const hasJsonLd = /<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/i.test(html)
    const h1Count = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].length
    const h2Count = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].length
    const images = [...html.matchAll(/<img[^>]*>/gi)].map(m => m[0])
    const imageCount = images.length
    const imagesWithoutAlt = images.filter(img => {
      const alt = img.match(/alt=["']([^"']*)["']/i)?.[1]?.trim()
      return !alt
    }).length
    const hasViewport = /<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']+)["']/i.test(html)
    const urlLength = url.length

    if (!title) {
      issues.push({ type: 'error', category: '메타 태그', message: '페이지 제목(title)이 없습니다.', suggestion: '<title> 태그를 추가하세요.' })
      score -= 20
    } else if (title.length < 30 || title.length > 60) {
      issues.push({
        type: 'warning',
        category: '메타 태그',
        message: `페이지 제목 길이 권장 범위를 벗어났습니다. (${title.length}자)`,
        suggestion: '제목은 30-60자가 권장됩니다.',
        currentValue: title
      })
      score -= 5
    }

    if (!description) {
      issues.push({ type: 'error', category: '메타 태그', message: '메타 설명(description)이 없습니다.', suggestion: '<meta name="description"> 태그를 추가하세요.' })
      score -= 15
    } else if (description.length < 120 || description.length > 160) {
      issues.push({
        type: 'warning',
        category: '메타 태그',
        message: `메타 설명 길이 권장 범위를 벗어났습니다. (${description.length}자)`,
        suggestion: '메타 설명은 120-160자가 권장됩니다.',
        currentValue: description
      })
      score -= 5
    }

    if (!ogTitle) { issues.push({ type: 'warning', category: '소셜 미디어', message: 'Open Graph 제목(og:title)이 없습니다.', suggestion: '<meta property="og:title">를 추가하세요.' }); score -= 5 }
    if (!ogDescription) { issues.push({ type: 'warning', category: '소셜 미디어', message: 'Open Graph 설명(og:description)이 없습니다.', suggestion: '<meta property="og:description">를 추가하세요.' }); score -= 5 }
    if (!ogImage) { issues.push({ type: 'warning', category: '소셜 미디어', message: 'Open Graph 이미지(og:image)가 없습니다.', suggestion: '<meta property="og:image">를 추가하세요.' }); score -= 5 }
    if (!canonical) { issues.push({ type: 'info', category: 'URL 구조', message: 'Canonical URL이 없습니다.', suggestion: '<link rel="canonical"> 추가를 권장합니다.' }); score -= 3 }
    if (!hasJsonLd) { issues.push({ type: 'warning', category: '구조화된 데이터', message: 'JSON-LD 구조화된 데이터가 없습니다.', suggestion: '구조화된 데이터를 추가하세요.' }); score -= 10 }
    if (h1Count === 0) { issues.push({ type: 'error', category: '콘텐츠 구조', message: 'H1 태그가 없습니다.', suggestion: '페이지에 하나의 H1 태그를 추가하세요.' }); score -= 10 }
    else if (h1Count > 1) { issues.push({ type: 'warning', category: '콘텐츠 구조', message: `H1 태그가 ${h1Count}개입니다.`, suggestion: '페이지당 H1 태그 1개를 권장합니다.' }); score -= 5 }
    if (h2Count === 0) { issues.push({ type: 'info', category: '콘텐츠 구조', message: 'H2 태그가 없습니다.', suggestion: '콘텐츠 섹션 구분을 위해 H2를 사용하세요.' }); score -= 3 }
    if (imageCount > 0 && imagesWithoutAlt > 0) { issues.push({ type: 'warning', category: '접근성', message: `${imagesWithoutAlt}개의 이미지에 alt 속성이 없습니다.`, suggestion: '모든 이미지에 alt를 추가하세요.' }); score -= Math.min(imagesWithoutAlt * 2, 10) }
    if (!hasViewport) { issues.push({ type: 'error', category: '모바일 최적화', message: 'Viewport 메타 태그가 없습니다.', suggestion: '<meta name="viewport">를 추가하세요.' }); score -= 15 }
    if (urlLength > 100) { issues.push({ type: 'warning', category: 'URL 구조', message: `URL이 너무 깁니다. (${urlLength}자)`, suggestion: '짧고 의미 있는 URL을 권장합니다.' }); score -= 5 }

    score = Math.max(0, score)
    if (score < 100) recommendations.push('이슈를 우선순위대로 수정하면 SEO 점수가 개선됩니다.')
    if (!hasJsonLd) recommendations.push('JSON-LD를 추가하면 검색 결과 가시성이 좋아질 수 있습니다.')
    if (imagesWithoutAlt > 0) recommendations.push('이미지 alt 추가로 접근성과 SEO를 함께 개선할 수 있습니다.')

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

  const validateSEO = async (url: string) => {
    if (!url) {
      throw new Error('URL이 필요합니다.')
    }

    try {
      new URL(url)
    } catch {
      throw new Error('유효하지 않은 URL입니다.')
    }

    try {
      const html = await fetchHtml(url)
      return analyzeSEO(html, url)
    } catch (error: any) {
      throw new Error(error.message || 'SEO 검증 중 오류가 발생했습니다.')
    }
  }

  return {
    validateSEO
  }
}
