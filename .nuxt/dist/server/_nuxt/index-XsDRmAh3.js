import { ref, computed, mergeProps, unref, useSSRContext } from "vue";
import { ssrRenderAttrs, ssrRenderAttr, ssrInterpolate, ssrIncludeBooleanAttr, ssrRenderStyle, ssrRenderList, ssrLooseContain, ssrLooseEqual } from "vue/server-renderer";
import { _ as _export_sfc } from "../server.mjs";
import "ofetch";
import "#internal/nuxt/paths";
import "C:/news-scraper/2026Study/node_modules/hookable/dist/index.mjs";
import "C:/news-scraper/2026Study/node_modules/unctx/dist/index.mjs";
import "C:/news-scraper/2026Study/node_modules/h3/dist/index.mjs";
import "vue-router";
import "C:/news-scraper/2026Study/node_modules/radix3/dist/index.mjs";
import "C:/news-scraper/2026Study/node_modules/defu/dist/defu.mjs";
import "C:/news-scraper/2026Study/node_modules/ufo/dist/index.mjs";
const _sfc_main = {
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const newsUrl = ref("");
    const loading = ref(false);
    const error = ref("");
    const currentNews = ref(null);
    const keywords = ref([]);
    const relatedArticles = ref([]);
    const selectedKeyword = ref("");
    const filteredArticles = computed(() => {
      if (!selectedKeyword.value) {
        return relatedArticles.value;
      }
      return relatedArticles.value.filter(
        (article) => article.matchedKeyword === selectedKeyword.value
      );
    });
    const uniqueKeywords = computed(() => {
      const keywords2 = /* @__PURE__ */ new Set();
      relatedArticles.value.forEach((article) => {
        if (article.matchedKeyword) {
          keywords2.add(article.matchedKeyword);
        }
      });
      return Array.from(keywords2).sort();
    });
    const getKeywordCount = (keyword) => {
      return relatedArticles.value.filter(
        (article) => article.matchedKeyword === keyword
      ).length;
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-gray-50" }, _attrs))} data-v-338a6914><header class="header" data-v-338a6914><div class="header-content" data-v-338a6914><div class="header-left" data-v-338a6914><div class="header-logo" data-v-338a6914><div class="logo-dot" data-v-338a6914></div><h1 class="header-title" data-v-338a6914>뉴스 스크래퍼</h1></div><span class="header-badge" data-v-338a6914>News Analyzer</span></div></div></header><main class="main-content" data-v-338a6914><div class="hero-section" data-v-338a6914><div class="hero-content" data-v-338a6914><h2 class="hero-title" data-v-338a6914> 뉴스 URL을 입력하면 관련 기사를 찾아드립니다 </h2><p class="hero-description" data-v-338a6914> 기사의 핵심 키워드를 추출하고 유사한 기사를 자동으로 검색합니다 </p></div><div class="search-container" data-v-338a6914><div class="search-wrapper" data-v-338a6914><div class="search-input-wrapper" data-v-338a6914><input${ssrRenderAttr("value", unref(newsUrl))} type="url" placeholder="뉴스 URL을 붙여넣어주세요..." class="search-input"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} data-v-338a6914><svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-338a6914><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" data-v-338a6914></path></svg></div><button${ssrIncludeBooleanAttr(unref(loading) || !unref(newsUrl)) ? " disabled" : ""} class="search-button" data-v-338a6914>${ssrInterpolate(unref(loading) ? "검색 중..." : "검색하기")}</button></div>`);
      if (unref(loading)) {
        _push(`<div class="loading-bar-container" data-v-338a6914><div class="loading-bar" data-v-338a6914><div class="loading-bar-fill" data-v-338a6914></div></div><p class="loading-text" data-v-338a6914>뉴스를 분석하고 관련 기사를 검색하는 중...</p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
      if (unref(error)) {
        _push(`<div class="error-message" data-v-338a6914><svg class="error-icon" fill="currentColor" viewBox="0 0 20 20" data-v-338a6914><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" data-v-338a6914></path></svg><p class="error-text" data-v-338a6914>${ssrInterpolate(unref(error))}</p></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(currentNews)) {
        _push(`<div class="card" data-v-338a6914><div class="card-header" data-v-338a6914><h2 class="card-title" data-v-338a6914>현재 기사</h2><span class="card-badge" data-v-338a6914>NEWS</span></div><div class="current-news-content" data-v-338a6914><h3 class="news-title" data-v-338a6914>${ssrInterpolate(unref(currentNews).title)}</h3><p class="news-description" data-v-338a6914>${ssrInterpolate(unref(currentNews).description)}</p>`);
        if (unref(keywords) && unref(keywords).length > 0) {
          _push(`<div class="keywords-section" data-v-338a6914><div class="keywords-header" data-v-338a6914><svg style="${ssrRenderStyle({ "width": "16px", "height": "16px", "color": "#6b7280" })}" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-338a6914><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" data-v-338a6914></path></svg><span class="keywords-label" data-v-338a6914>추출된 키워드</span></div><div class="keywords-list" data-v-338a6914><!--[-->`);
          ssrRenderList(unref(keywords), (keyword, index2) => {
            _push(`<span class="keyword-tag" data-v-338a6914> #${ssrInterpolate(keyword)}</span>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<a${ssrRenderAttr("href", unref(currentNews).url)} target="_blank" rel="noopener noreferrer" class="article-link" data-v-338a6914> 원문 보기 <svg style="${ssrRenderStyle({ "width": "16px", "height": "16px" })}" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-338a6914><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" data-v-338a6914></path></svg></a></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(currentNews) && unref(relatedArticles).length > 0) {
        _push(`<div class="card" data-v-338a6914><div class="category-bar" data-v-338a6914><div class="category-left" data-v-338a6914><button class="category-button" data-v-338a6914> 전체 ${ssrInterpolate(unref(filteredArticles).length)}</button><span class="category-label" data-v-338a6914>관련 기사</span></div><div class="category-right" data-v-338a6914><div class="category-count" data-v-338a6914> 총 <strong data-v-338a6914>${ssrInterpolate(unref(relatedArticles).length)}</strong>개의 기사 </div><select class="sort-select" data-v-338a6914><option value="" data-v-338a6914${ssrIncludeBooleanAttr(Array.isArray(unref(selectedKeyword)) ? ssrLooseContain(unref(selectedKeyword), "") : ssrLooseEqual(unref(selectedKeyword), "")) ? " selected" : ""}>전체 키워드</option><!--[-->`);
        ssrRenderList(unref(uniqueKeywords), (keyword) => {
          _push(`<option${ssrRenderAttr("value", keyword)} data-v-338a6914${ssrIncludeBooleanAttr(Array.isArray(unref(selectedKeyword)) ? ssrLooseContain(unref(selectedKeyword), keyword) : ssrLooseEqual(unref(selectedKeyword), keyword)) ? " selected" : ""}>${ssrInterpolate(keyword)} (${ssrInterpolate(getKeywordCount(keyword))}) </option>`);
        });
        _push(`<!--]--></select></div></div><div class="articles-grid" data-v-338a6914><!--[-->`);
        ssrRenderList(unref(filteredArticles), (article, index2) => {
          _push(`<article class="article-card" data-v-338a6914><div class="article-badge-row" data-v-338a6914><div class="article-badge-group" data-v-338a6914><span class="article-badge" data-v-338a6914>ARTICLE</span><span class="article-keyword-badge" data-v-338a6914>${ssrInterpolate(article.matchedKeyword || "키워드 없음")}</span></div><span class="article-number" data-v-338a6914>#${ssrInterpolate(index2 + 1)}</span></div><h3 class="article-card-title line-clamp-2" data-v-338a6914>${ssrInterpolate(article.title)}</h3><a${ssrRenderAttr("href", article.url)} target="_blank" rel="noopener noreferrer" class="article-link" data-v-338a6914> 기사 보기 <svg style="${ssrRenderStyle({ "width": "16px", "height": "16px" })}" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-338a6914><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" data-v-338a6914></path></svg></a></article>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(currentNews) && unref(relatedArticles).length === 0 && !unref(loading)) {
        _push(`<div class="card" data-v-338a6914><div class="empty-state" data-v-338a6914><svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-338a6914><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" data-v-338a6914></path></svg><p class="empty-title" data-v-338a6914>관련 기사를 찾을 수 없습니다.</p><p class="empty-subtitle" data-v-338a6914>키워드로 검색했지만 결과가 없습니다.</p></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (!unref(loading) && !unref(currentNews) && !unref(relatedArticles).length && unref(newsUrl)) {
        _push(`<div class="empty-state" data-v-338a6914><svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-338a6914><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" data-v-338a6914></path></svg><p class="empty-title" data-v-338a6914>검색 결과가 없습니다.</p><p class="empty-subtitle" data-v-338a6914>다른 URL을 시도해보세요.</p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</main></div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-338a6914"]]);
export {
  index as default
};
//# sourceMappingURL=index-XsDRmAh3.js.map
