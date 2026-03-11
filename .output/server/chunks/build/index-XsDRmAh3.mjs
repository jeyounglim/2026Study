import { ref, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrInterpolate, ssrIncludeBooleanAttr, ssrRenderStyle, ssrRenderList, ssrLooseContain, ssrLooseEqual } from 'vue/server-renderer';
import { _ as _export_sfc } from './server.mjs';
import '../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';
import 'vue-router';

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
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-gray-50" }, _attrs))} data-v-338a6914><header class="header" data-v-338a6914><div class="header-content" data-v-338a6914><div class="header-left" data-v-338a6914><div class="header-logo" data-v-338a6914><div class="logo-dot" data-v-338a6914></div><h1 class="header-title" data-v-338a6914>\uB274\uC2A4 \uC2A4\uD06C\uB798\uD37C</h1></div><span class="header-badge" data-v-338a6914>News Analyzer</span></div></div></header><main class="main-content" data-v-338a6914><div class="hero-section" data-v-338a6914><div class="hero-content" data-v-338a6914><h2 class="hero-title" data-v-338a6914> \uB274\uC2A4 URL\uC744 \uC785\uB825\uD558\uBA74 \uAD00\uB828 \uAE30\uC0AC\uB97C \uCC3E\uC544\uB4DC\uB9BD\uB2C8\uB2E4 </h2><p class="hero-description" data-v-338a6914> \uAE30\uC0AC\uC758 \uD575\uC2EC \uD0A4\uC6CC\uB4DC\uB97C \uCD94\uCD9C\uD558\uACE0 \uC720\uC0AC\uD55C \uAE30\uC0AC\uB97C \uC790\uB3D9\uC73C\uB85C \uAC80\uC0C9\uD569\uB2C8\uB2E4 </p></div><div class="search-container" data-v-338a6914><div class="search-wrapper" data-v-338a6914><div class="search-input-wrapper" data-v-338a6914><input${ssrRenderAttr("value", unref(newsUrl))} type="url" placeholder="\uB274\uC2A4 URL\uC744 \uBD99\uC5EC\uB123\uC5B4\uC8FC\uC138\uC694..." class="search-input"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""} data-v-338a6914><svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-338a6914><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" data-v-338a6914></path></svg></div><button${ssrIncludeBooleanAttr(unref(loading) || !unref(newsUrl)) ? " disabled" : ""} class="search-button" data-v-338a6914>${ssrInterpolate(unref(loading) ? "\uAC80\uC0C9 \uC911..." : "\uAC80\uC0C9\uD558\uAE30")}</button></div>`);
      if (unref(loading)) {
        _push(`<div class="loading-bar-container" data-v-338a6914><div class="loading-bar" data-v-338a6914><div class="loading-bar-fill" data-v-338a6914></div></div><p class="loading-text" data-v-338a6914>\uB274\uC2A4\uB97C \uBD84\uC11D\uD558\uACE0 \uAD00\uB828 \uAE30\uC0AC\uB97C \uAC80\uC0C9\uD558\uB294 \uC911...</p></div>`);
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
        _push(`<div class="card" data-v-338a6914><div class="card-header" data-v-338a6914><h2 class="card-title" data-v-338a6914>\uD604\uC7AC \uAE30\uC0AC</h2><span class="card-badge" data-v-338a6914>NEWS</span></div><div class="current-news-content" data-v-338a6914><h3 class="news-title" data-v-338a6914>${ssrInterpolate(unref(currentNews).title)}</h3><p class="news-description" data-v-338a6914>${ssrInterpolate(unref(currentNews).description)}</p>`);
        if (unref(keywords) && unref(keywords).length > 0) {
          _push(`<div class="keywords-section" data-v-338a6914><div class="keywords-header" data-v-338a6914><svg style="${ssrRenderStyle({ "width": "16px", "height": "16px", "color": "#6b7280" })}" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-338a6914><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" data-v-338a6914></path></svg><span class="keywords-label" data-v-338a6914>\uCD94\uCD9C\uB41C \uD0A4\uC6CC\uB4DC</span></div><div class="keywords-list" data-v-338a6914><!--[-->`);
          ssrRenderList(unref(keywords), (keyword, index2) => {
            _push(`<span class="keyword-tag" data-v-338a6914> #${ssrInterpolate(keyword)}</span>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<a${ssrRenderAttr("href", unref(currentNews).url)} target="_blank" rel="noopener noreferrer" class="article-link" data-v-338a6914> \uC6D0\uBB38 \uBCF4\uAE30 <svg style="${ssrRenderStyle({ "width": "16px", "height": "16px" })}" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-338a6914><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" data-v-338a6914></path></svg></a></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(currentNews) && unref(relatedArticles).length > 0) {
        _push(`<div class="card" data-v-338a6914><div class="category-bar" data-v-338a6914><div class="category-left" data-v-338a6914><button class="category-button" data-v-338a6914> \uC804\uCCB4 ${ssrInterpolate(unref(filteredArticles).length)}</button><span class="category-label" data-v-338a6914>\uAD00\uB828 \uAE30\uC0AC</span></div><div class="category-right" data-v-338a6914><div class="category-count" data-v-338a6914> \uCD1D <strong data-v-338a6914>${ssrInterpolate(unref(relatedArticles).length)}</strong>\uAC1C\uC758 \uAE30\uC0AC </div><select class="sort-select" data-v-338a6914><option value="" data-v-338a6914${ssrIncludeBooleanAttr(Array.isArray(unref(selectedKeyword)) ? ssrLooseContain(unref(selectedKeyword), "") : ssrLooseEqual(unref(selectedKeyword), "")) ? " selected" : ""}>\uC804\uCCB4 \uD0A4\uC6CC\uB4DC</option><!--[-->`);
        ssrRenderList(unref(uniqueKeywords), (keyword) => {
          _push(`<option${ssrRenderAttr("value", keyword)} data-v-338a6914${ssrIncludeBooleanAttr(Array.isArray(unref(selectedKeyword)) ? ssrLooseContain(unref(selectedKeyword), keyword) : ssrLooseEqual(unref(selectedKeyword), keyword)) ? " selected" : ""}>${ssrInterpolate(keyword)} (${ssrInterpolate(getKeywordCount(keyword))}) </option>`);
        });
        _push(`<!--]--></select></div></div><div class="articles-grid" data-v-338a6914><!--[-->`);
        ssrRenderList(unref(filteredArticles), (article, index2) => {
          _push(`<article class="article-card" data-v-338a6914><div class="article-badge-row" data-v-338a6914><div class="article-badge-group" data-v-338a6914><span class="article-badge" data-v-338a6914>ARTICLE</span><span class="article-keyword-badge" data-v-338a6914>${ssrInterpolate(article.matchedKeyword || "\uD0A4\uC6CC\uB4DC \uC5C6\uC74C")}</span></div><span class="article-number" data-v-338a6914>#${ssrInterpolate(index2 + 1)}</span></div><h3 class="article-card-title line-clamp-2" data-v-338a6914>${ssrInterpolate(article.title)}</h3><a${ssrRenderAttr("href", article.url)} target="_blank" rel="noopener noreferrer" class="article-link" data-v-338a6914> \uAE30\uC0AC \uBCF4\uAE30 <svg style="${ssrRenderStyle({ "width": "16px", "height": "16px" })}" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-338a6914><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" data-v-338a6914></path></svg></a></article>`);
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(currentNews) && unref(relatedArticles).length === 0 && !unref(loading)) {
        _push(`<div class="card" data-v-338a6914><div class="empty-state" data-v-338a6914><svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-338a6914><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" data-v-338a6914></path></svg><p class="empty-title" data-v-338a6914>\uAD00\uB828 \uAE30\uC0AC\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.</p><p class="empty-subtitle" data-v-338a6914>\uD0A4\uC6CC\uB4DC\uB85C \uAC80\uC0C9\uD588\uC9C0\uB9CC \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.</p></div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (!unref(loading) && !unref(currentNews) && !unref(relatedArticles).length && unref(newsUrl)) {
        _push(`<div class="empty-state" data-v-338a6914><svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" data-v-338a6914><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" data-v-338a6914></path></svg><p class="empty-title" data-v-338a6914>\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.</p><p class="empty-subtitle" data-v-338a6914>\uB2E4\uB978 URL\uC744 \uC2DC\uB3C4\uD574\uBCF4\uC138\uC694.</p></div>`);
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

export { index as default };
//# sourceMappingURL=index-XsDRmAh3.mjs.map
