globalThis.__timing__.logStart('Load chunks/routes/api/scrape.post');import { defineEventHandler, readBody, createError } from 'file://C:/news-scraper/2026Study/node_modules/h3/dist/index.mjs';
import { a as useRuntimeConfig } from '../../_/nitro.mjs';
import 'file://C:/news-scraper/2026Study/node_modules/destr/dist/index.mjs';
import 'file://C:/news-scraper/2026Study/node_modules/hookable/dist/index.mjs';
import 'file://C:/news-scraper/2026Study/node_modules/ofetch/dist/node.mjs';
import 'file://C:/news-scraper/2026Study/node_modules/node-mock-http/dist/index.mjs';
import 'file://C:/news-scraper/2026Study/node_modules/ufo/dist/index.mjs';
import 'file://C:/news-scraper/2026Study/node_modules/unstorage/dist/index.mjs';
import 'file://C:/news-scraper/2026Study/node_modules/unstorage/drivers/fs.mjs';
import 'file:///C:/news-scraper/2026Study/node_modules/nuxt/dist/core/runtime/nitro/utils/cache-driver.js';
import 'file://C:/news-scraper/2026Study/node_modules/unstorage/drivers/fs-lite.mjs';
import 'file://C:/news-scraper/2026Study/node_modules/ohash/dist/index.mjs';
import 'file://C:/news-scraper/2026Study/node_modules/klona/dist/index.mjs';
import 'file://C:/news-scraper/2026Study/node_modules/defu/dist/defu.mjs';
import 'file://C:/news-scraper/2026Study/node_modules/scule/dist/index.mjs';
import 'file://C:/news-scraper/2026Study/node_modules/radix3/dist/index.mjs';
import 'node:fs';
import 'node:url';
import 'file://C:/news-scraper/2026Study/node_modules/pathe/dist/index.mjs';

const scrape_post = defineEventHandler(async (event) => {
  var _a;
  const config = useRuntimeConfig(event);
  const body = await readBody(event);
  const { url } = body;
  if (!url) {
    throw createError({
      statusCode: 400,
      message: "URL\uC774 \uD544\uC694\uD569\uB2C8\uB2E4."
    });
  }
  try {
    new URL(url);
  } catch {
    throw createError({
      statusCode: 400,
      message: "\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 URL\uC785\uB2C8\uB2E4."
    });
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1e4);
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`\uB274\uC2A4\uB97C \uAC00\uC838\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. (\uC0C1\uD0DC \uCF54\uB4DC: ${response.status})`);
    }
    const html = await response.text();
    let title = "";
    let description = "";
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    if (ogTitleMatch) {
      title = ogTitleMatch[1].trim();
    }
    if (!title) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        title = titleMatch[1].trim();
        title = title.replace(/\s*[-|]\s*.*$/, "").trim();
      }
    }
    if (!title) {
      const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      if (h1Match) {
        title = h1Match[1].trim();
      }
    }
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    if (ogDescMatch) {
      description = ogDescMatch[1].trim();
    }
    if (!description) {
      const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      if (descMatch) {
        description = descMatch[1].trim();
      }
    }
    if (!description) {
      const articleMatch = html.match(/<article[^>]*>[\s\S]*?<p[^>]*>([^<]+)<\/p>/i) || html.match(/<div[^>]*class=["'][^"']*article["'][^>]*>[\s\S]*?<p[^>]*>([^<]+)<\/p>/i);
      if (articleMatch) {
        description = articleMatch[1].trim().substring(0, 200);
      }
    }
    if (!title) title = "\uC81C\uBAA9\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4";
    if (!description) description = "\uC124\uBA85\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4";
    const articleContent = extractArticleContent(html);
    console.log("\u{1F4C4} \uCD94\uCD9C\uB41C \uBCF8\uBB38 \uAE38\uC774:", articleContent.length);
    let keywords;
    if (articleContent && articleContent.length > 100) {
      console.log("\u{1F916} AI\uB85C \uBCF8\uBB38 \uBD84\uC11D \uC911...");
      keywords = await extractKeywordsWithGPT(articleContent, config.groqApiKey);
      console.log("\u{1F511} AI\uB85C \uCD94\uCD9C\uB41C \uD0A4\uC6CC\uB4DC:", keywords);
    } else {
      console.log("\u26A0\uFE0F \uBCF8\uBB38\uC774 \uC9E7\uC544 \uC81C\uBAA9+\uC124\uBA85\uC73C\uB85C \uD0A4\uC6CC\uB4DC \uCD94\uCD9C");
      keywords = await extractKeywordsWithGPT(title + " " + description, config.groqApiKey);
      console.log("\u{1F511} \uCD94\uCD9C\uB41C \uD0A4\uC6CC\uB4DC:", keywords);
    }
    const initialArticles = await searchRelatedArticles(keywords, url, title, 50, config.groqApiKey);
    console.log("\u{1F4F0} \uCD08\uAE30 \uAD00\uB828 \uAE30\uC0AC \uAC1C\uC218:", initialArticles.length);
    const filteredKeywords = filterKeywordsByFrequency(keywords, initialArticles);
    console.log("\u{1F511} \uD544\uD130\uB9C1\uB41C \uD0A4\uC6CC\uB4DC:", filteredKeywords);
    let relatedArticles = initialArticles;
    if (filteredKeywords.length > 0 && filteredKeywords.length < keywords.length) {
      relatedArticles = await searchRelatedArticles(filteredKeywords, url, title, 50, config.groqApiKey);
      console.log("\u{1F4F0} \uD544\uD130\uB9C1\uB41C \uD0A4\uC6CC\uB4DC\uB85C \uCC3E\uC740 \uAD00\uB828 \uAE30\uC0AC \uAC1C\uC218:", relatedArticles.length);
    }
    return {
      currentNews: {
        title,
        description,
        url
      },
      keywords: filteredKeywords,
      relatedArticles
    };
  } catch (err) {
    if (err.name === "AbortError" || err.name === "TimeoutError") {
      throw createError({
        statusCode: 408,
        message: "\uC694\uCCAD \uC2DC\uAC04\uC774 \uCD08\uACFC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694."
      });
    }
    if ((_a = err.message) == null ? void 0 : _a.includes("fetch")) {
      throw createError({
        statusCode: 503,
        message: "\uB274\uC2A4 \uC0AC\uC774\uD2B8\uC5D0 \uC5F0\uACB0\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uB124\uD2B8\uC6CC\uD06C\uB97C \uD655\uC778\uD574\uC8FC\uC138\uC694."
      });
    }
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || "\uB274\uC2A4\uB97C \uCC98\uB9AC\uD558\uB294 \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
    });
  }
});
function extractArticleContent(html) {
  const removeHtmlTags = (text) => {
    return text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "").replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "").replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "").replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
  };
  let content = "";
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    content = removeHtmlTags(articleMatch[1]);
    if (content.length > 200) {
      return content;
    }
  }
  const contentSelectors = [
    /<div[^>]*class=["'][^"']*article[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class=["'][^"']*post[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class=["'][^"']*entry[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*id=["']article[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*id=["']content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*id=["']post[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
  ];
  for (const selector of contentSelectors) {
    const matches = html.matchAll(new RegExp(selector.source, "gi"));
    for (const match of matches) {
      const extracted = removeHtmlTags(match[1]);
      if (extracted.length > content.length && extracted.length > 200) {
        content = extracted;
      }
    }
  }
  if (content.length < 200) {
    const pMatches = html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi);
    const paragraphs = [];
    for (const match of pMatches) {
      const text = removeHtmlTags(match[1]);
      if (text.length > 20) {
        paragraphs.push(text);
      }
    }
    if (paragraphs.length > 0) {
      content = paragraphs.join(" ");
    }
  }
  if (content.length < 200) {
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (mainMatch) {
      const extracted = removeHtmlTags(mainMatch[1]);
      if (extracted.length > content.length) {
        content = extracted;
      }
    }
  }
  if (content.length > 3e3) {
    content = content.substring(0, 3e3) + "...";
  }
  return content;
}
async function extractKeywordsWithGPT(text, groqApiKey) {
  var _a, _b, _c;
  if (!groqApiKey) {
    console.log("\u26A0\uFE0F GROQ_API_KEY\uAC00 \uC124\uC815\uB418\uC9C0 \uC54A\uC544 \uAE30\uBCF8 \uD0A4\uC6CC\uB4DC \uCD94\uCD9C \uBC29\uC2DD\uC744 \uC0AC\uC6A9\uD569\uB2C8\uB2E4.");
    return extractKeywordsFallback(text);
  }
  try {
    const isLongText = text.length > 500;
    const textToAnalyze = isLongText ? text.substring(0, 3e3) : text.substring(0, 1e3);
    const prompt = isLongText ? `\uB2E4\uC74C \uB274\uC2A4 \uAE30\uC0AC \uBCF8\uBB38\uC744 \uBD84\uC11D\uD558\uC5EC \uAC80\uC0C9\uC5D0 \uAC00\uC7A5 \uC720\uC6A9\uD55C \uD575\uC2EC \uD0A4\uC6CC\uB4DC\uB97C 5-8\uAC1C \uCD94\uCD9C\uD574\uC8FC\uC138\uC694.
\uAE30\uC0AC\uC758 \uC8FC\uC694 \uC8FC\uC81C, \uC778\uBB3C, \uC7A5\uC18C, \uC0AC\uAC74 \uB4F1\uC744 \uD3EC\uD568\uD558\uC5EC \uCD94\uCD9C\uD558\uC138\uC694.
\uD0A4\uC6CC\uB4DC\uB294 \uC27C\uD45C\uB85C \uAD6C\uBD84\uD558\uC5EC \uD55C \uC904\uB85C\uB9CC \uCD9C\uB825\uD574\uC8FC\uC138\uC694. \uC124\uBA85\uC774\uB098 \uB2E4\uB978 \uD14D\uC2A4\uD2B8\uB294 \uD3EC\uD568\uD558\uC9C0 \uB9C8\uC138\uC694.

\uAE30\uC0AC \uBCF8\uBB38:
${textToAnalyze}

\uD0A4\uC6CC\uB4DC:` : `\uB2E4\uC74C \uB274\uC2A4 \uAE30\uC0AC \uD14D\uC2A4\uD2B8\uC5D0\uC11C \uAC80\uC0C9\uC5D0 \uC720\uC6A9\uD55C \uD575\uC2EC \uD0A4\uC6CC\uB4DC\uB97C 5-8\uAC1C \uCD94\uCD9C\uD574\uC8FC\uC138\uC694. 
\uD0A4\uC6CC\uB4DC\uB294 \uC27C\uD45C\uB85C \uAD6C\uBD84\uD558\uC5EC \uD55C \uC904\uB85C\uB9CC \uCD9C\uB825\uD574\uC8FC\uC138\uC694. \uC124\uBA85\uC774\uB098 \uB2E4\uB978 \uD14D\uC2A4\uD2B8\uB294 \uD3EC\uD568\uD558\uC9C0 \uB9C8\uC138\uC694.

\uD14D\uC2A4\uD2B8: ${textToAnalyze}

\uD0A4\uC6CC\uB4DC:`;
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        // 무료로 사용 가능한 빠른 모델
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 100
      })
    });
    if (!response.ok) {
      throw new Error(`Groq API \uC624\uB958: ${response.status}`);
    }
    const data = await response.json();
    const keywordsText = ((_c = (_b = (_a = data.choices[0]) == null ? void 0 : _a.message) == null ? void 0 : _b.content) == null ? void 0 : _c.trim()) || "";
    if (!keywordsText) {
      throw new Error("\uD0A4\uC6CC\uB4DC \uCD94\uCD9C \uACB0\uACFC\uAC00 \uBE44\uC5B4\uC788\uC2B5\uB2C8\uB2E4.");
    }
    const keywords = keywordsText.split(/[,，]/).map((k) => k.trim()).filter((k) => k.length > 0).slice(0, 8);
    if (keywords.length > 0) {
      console.log("\u2705 GPT\uB85C \uD0A4\uC6CC\uB4DC \uCD94\uCD9C \uC131\uACF5");
      return keywords;
    } else {
      throw new Error("\uD0A4\uC6CC\uB4DC\uB97C \uD30C\uC2F1\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.");
    }
  } catch (error) {
    console.error("\u274C GPT \uD0A4\uC6CC\uB4DC \uCD94\uCD9C \uC2E4\uD328, \uAE30\uBCF8 \uBC29\uC2DD \uC0AC\uC6A9:", error);
    return extractKeywordsFallback(text);
  }
}
function extractKeywordsFallback(text) {
  const stopWords = [
    "\uC740",
    "\uB294",
    "\uC774",
    "\uAC00",
    "\uC744",
    "\uB97C",
    "\uC758",
    "\uC5D0",
    "\uC5D0\uC11C",
    "\uACFC",
    "\uC640",
    "\uB3C4",
    "\uB85C",
    "\uC73C\uB85C",
    "\uD558\uB2E4",
    "\uC788\uB2E4",
    "\uB418\uB2E4",
    "\uC774\uB2E4",
    "\uC774\uB2E4",
    "\uB41C\uB2E4",
    "\uB41C\uB2E4",
    "\uD55C\uB2E4",
    "\uD55C\uB2E4",
    "\uADF8",
    "\uADF8\uAC83",
    "\uC774\uAC83",
    "\uC800\uAC83",
    "\uADF8\uB7F0",
    "\uC774\uB7F0",
    "\uC800\uB7F0",
    "\uB54C",
    "\uB54C\uBB38",
    "\uC704\uD574",
    "\uD1B5\uD574",
    "\uB300\uD574",
    "\uAD00\uB828",
    "\uB300\uD55C",
    "\uB610\uD55C",
    "\uB610",
    "\uADF8\uB9AC\uACE0",
    "\uD558\uC9C0\uB9CC",
    "\uADF8\uB7EC\uB098",
    "\uADF8\uB7F0\uB370",
    "\uAC83",
    "\uAC70",
    "\uC218",
    "\uACBD\uC6B0",
    "\uB54C\uBB38",
    "\uC774\uC720",
    "\uC6D0\uC778",
    "\uB4F1",
    "\uBC0F",
    "\uB610\uB294",
    "\uADF8\uB798\uC11C",
    "\uB530\uB77C\uC11C",
    "\uADF8\uB7EC\uBBC0\uB85C"
  ];
  let cleanedText = text.replace(/[^\w\s가-힣]/g, " ").replace(/\s+/g, " ").trim();
  const words = cleanedText.split(/\s+/).filter((word) => {
    return word.length >= 2 && !stopWords.includes(word) && !/^\d+$/.test(word) && !word.match(/^[a-zA-Z]+$/);
  }).map((word) => word.trim()).filter((word) => word.length > 0);
  const wordCount = {};
  words.forEach((word) => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  const sortedWords = Object.keys(wordCount).sort((a, b) => {
    if (wordCount[b] !== wordCount[a]) {
      return wordCount[b] - wordCount[a];
    }
    return b.length - a.length;
  }).slice(0, 8);
  return sortedWords.length > 0 ? sortedWords : words.slice(0, 5);
}
async function searchRelatedArticles(keywords, excludeUrl, title, maxArticles = 20, groqApiKey) {
  if (!keywords || keywords.length === 0) {
    if (title) {
      keywords = await extractKeywordsWithGPT(title, groqApiKey);
      console.log("\u26A0\uFE0F \uD0A4\uC6CC\uB4DC\uAC00 \uC5C6\uC5B4 \uC81C\uBAA9\uC5D0\uC11C \uCD94\uCD9C:", keywords);
    } else {
      console.error("\u274C \uAC80\uC0C9\uD560 \uD0A4\uC6CC\uB4DC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4");
      return [];
    }
  }
  const searchQueries = [];
  keywords.forEach((keyword) => {
    if (keyword && keyword.length > 0) {
      searchQueries.push(keyword);
    }
  });
  if (keywords.length >= 2) {
    searchQueries.push(keywords.slice(0, 2).join(" "));
    if (keywords.length >= 3) {
      searchQueries.push(keywords.slice(0, 3).join(" "));
    }
    if (keywords.length >= 4) {
      searchQueries.push(keywords.slice(0, 4).join(" "));
    }
    if (keywords.length >= 2) {
      searchQueries.push(keywords.slice(0, 2).reverse().join(" "));
    }
    if (keywords.length >= 3) {
      searchQueries.push(keywords.slice(1, 3).join(" "));
    }
    if (keywords.length >= 4) {
      searchQueries.push(keywords.slice(1, 4).join(" "));
    }
  }
  const uniqueQueries = Array.from(new Set(searchQueries.filter((q) => q.length > 0)));
  console.log("\u{1F50D} \uC0DD\uC131\uB41C \uAC80\uC0C9 \uCFFC\uB9AC:", uniqueQueries);
  console.log("\u{1F50D} \uAD00\uB828 \uAE30\uC0AC \uAC80\uC0C9 \uC2DC\uC791:", { keywords, searchQueries: uniqueQueries, excludeUrl, maxArticles });
  let allItems = [];
  const targetArticles = maxArticles * 3;
  for (const query of uniqueQueries) {
    if (allItems.length >= targetArticles) break;
    try {
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}+\uC5B8\uC5B4:ko&hl=ko&gl=KR&ceid=KR:ko`;
      console.log("\u{1F4E1} RSS URL:", rssUrl);
      const response = await fetch(rssUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });
      if (!response.ok) {
        console.error("\u274C RSS \uC751\uB2F5 \uC2E4\uD328:", response.status, response.statusText);
        continue;
      }
      const xml = await response.text();
      console.log("\u2705 RSS \uC751\uB2F5 \uBC1B\uC74C, XML \uAE38\uC774:", xml.length);
      const decodeHtml = (str) => {
        return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
      };
      const items = [];
      const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
      for (const itemMatch of itemMatches) {
        const itemContent = itemMatch[1];
        const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/i) || itemContent.match(/<title>(.*?)<\/title>/i);
        const articleTitle = titleMatch ? decodeHtml(titleMatch[1].trim()) : "";
        const linkMatch = itemContent.match(/<link>(.*?)<\/link>/i);
        let articleUrl = linkMatch ? linkMatch[1].trim() : "";
        if (articleUrl && articleUrl.includes("news.google.com")) {
          const urlMatch = articleUrl.match(/url=([^&]+)/);
          if (urlMatch) {
            articleUrl = decodeURIComponent(urlMatch[1]);
          }
        }
        const descMatch = itemContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/i) || itemContent.match(/<description>(.*?)<\/description>/i);
        const articleDescription = descMatch ? decodeHtml(descMatch[1].trim().replace(/<[^>]+>/g, "")) : "";
        if (articleTitle && articleUrl) {
          try {
            const excludeHostname = new URL(excludeUrl).hostname;
            const articleHostname = new URL(articleUrl).hostname;
            if (articleHostname !== excludeHostname) {
              items.push({
                title: articleTitle || "\uC81C\uBAA9 \uC5C6\uC74C",
                description: articleDescription || "",
                url: articleUrl,
                matchedKeyword: query
                // 어떤 키워드로 검색되었는지 저장
              });
            }
          } catch (e) {
            if (!articleUrl.includes(excludeUrl)) {
              items.push({
                title: articleTitle || "\uC81C\uBAA9 \uC5C6\uC74C",
                description: articleDescription || "",
                url: articleUrl,
                matchedKeyword: query
                // 어떤 키워드로 검색되었는지 저장
              });
            }
          }
        }
        if (items.length >= 50) break;
      }
      const existingUrls = new Set(allItems.map((item) => item.url));
      for (const item of items) {
        if (allItems.length >= targetArticles) break;
        if (!existingUrls.has(item.url)) {
          allItems.push(item);
          existingUrls.add(item.url);
        }
      }
      console.log(`\u{1F4CA} \uCFFC\uB9AC "${query}"\uB85C ${items.length}\uAC1C \uAE30\uC0AC \uCC3E\uC74C, \uCD1D ${allItems.length}\uAC1C`);
    } catch (error) {
      console.error(`\u274C \uCFFC\uB9AC "${query}" \uAC80\uC0C9 \uC624\uB958:`, error);
      continue;
    }
  }
  console.log("\u{1F4CA} \uCD5C\uC885 \uD30C\uC2F1\uB41C \uAE30\uC0AC \uAC1C\uC218:", allItems.length);
  const shuffled = [...allItems].sort(() => Math.random() - 0.5);
  const finalResults = shuffled.slice(0, maxArticles);
  console.log("\u{1F4CA} \uCD5C\uC885 \uBC18\uD658 \uAE30\uC0AC \uAC1C\uC218:", finalResults.length);
  console.log(
    "\u{1F4CA} \uD0A4\uC6CC\uB4DC\uBCC4 \uAE30\uC0AC \uBD84\uD3EC:",
    finalResults.reduce((acc, item) => {
      acc[item.matchedKeyword] = (acc[item.matchedKeyword] || 0) + 1;
      return acc;
    }, {})
  );
  return finalResults.length > 0 ? finalResults : [];
}
function filterKeywordsByFrequency(keywords, relatedArticles) {
  if (!keywords || keywords.length === 0 || !relatedArticles || relatedArticles.length === 0) {
    return keywords;
  }
  const allText = relatedArticles.map((article) => `${article.title} ${article.description}`).join(" ").toLowerCase();
  const keywordFrequency = keywords.map((keyword) => {
    const keywordLower = keyword.toLowerCase();
    const regex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    const matches = allText.match(regex);
    const count = matches ? matches.length : 0;
    return { keyword, count };
  });
  console.log("\u{1F4CA} \uD0A4\uC6CC\uB4DC \uB4F1\uC7A5 \uBE48\uB3C4:", keywordFrequency);
  const frequentKeywords = keywordFrequency.filter((item) => item.count >= 2).sort((a, b) => b.count - a.count).map((item) => item.keyword);
  if (frequentKeywords.length > 0) {
    return frequentKeywords.slice(0, 6);
  }
  const atLeastOnce = keywordFrequency.filter((item) => item.count >= 1).sort((a, b) => b.count - a.count).map((item) => item.keyword).slice(0, 5);
  return atLeastOnce.length > 0 ? atLeastOnce : keywords.slice(0, 5);
}

export { scrape_post as default };;globalThis.__timing__.logEnd('Load chunks/routes/api/scrape.post');
//# sourceMappingURL=scrape.post.mjs.map
