export const useSEOValidator = () => {
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
      const response = await $fetch('/api/seo', {
        method: 'POST',
        body: { url }
      })

      return response
    } catch (error: any) {
      throw new Error(error.message || 'SEO 검증 중 오류가 발생했습니다.')
    }
  }

  return {
    validateSEO
  }
}
