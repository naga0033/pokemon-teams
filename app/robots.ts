// 悪質なスクレイピング bot を弾いて Supabase Disk IO を節約する
// 通常の検索エンジン (Googlebot / Bingbot) はクロール間隔を制限
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 主要検索エンジンは許可するがクロール間隔を 10 秒に制限
      {
        userAgent: ["Googlebot", "Bingbot", "DuckDuckBot"],
        allow: "/",
        crawlDelay: 10,
        disallow: ["/api/", "/admin/"],
      },
      // AI 学習系クローラは全面ブロック (DB 負荷の主犯)
      {
        userAgent: [
          "GPTBot",
          "ClaudeBot",
          "anthropic-ai",
          "CCBot",
          "Google-Extended",
          "PerplexityBot",
          "Bytespider",
          "Amazonbot",
          "Applebot-Extended",
          "cohere-ai",
          "Diffbot",
          "FacebookBot",
          "ImagesiftBot",
          "Omgilibot",
          "Omgili",
          "YouBot",
        ],
        disallow: "/",
      },
      // それ以外のボットはデフォルト許可 (非登録ユーザーのアクセスは妨げない)
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
    ],
  };
}
