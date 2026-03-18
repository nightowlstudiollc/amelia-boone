import type { Config } from "@netlify/functions";
import Parser from "rss-parser";
import { Octokit } from "@octokit/rest";

const REPO_OWNER = "nightowlstudiollc";
const REPO_NAME = "amelia-boone";
const CONTENT_PATH = "src/data/blog";

export default async function handler() {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  if (!GITHUB_TOKEN) throw new Error("GITHUB_TOKEN env var not set");

  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  const parser = new Parser();

  const feed = await parser.parseURL("https://ameliaboone.substack.com/feed");

  const { data: existingFiles } = await octokit.repos.getContent({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    path: CONTENT_PATH,
  });

  if (!Array.isArray(existingFiles)) {
    throw new Error(`Expected directory listing for ${CONTENT_PATH}, got unexpected response type`);
  }

  const substackFiles = existingFiles.filter((f) => f.name.startsWith("substack-"));

  const existingSlugs = new Set(substackFiles.map((f) => f.name.replace(".md", "")));

  // Build a set of originalUrls already in the repo by reading file contents.
  // Keying on URL (not filename) means manually-imported files with title-based
  // slugs are correctly recognised as duplicates of their auto-synced counterparts.
  const importedUrls = new Set<string>();
  await Promise.all(
    substackFiles.map(async (f) => {
      const { data } = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: `${CONTENT_PATH}/${f.name}`,
      });
      if ("content" in data && typeof data.content === "string") {
        const text = Buffer.from(data.content, "base64").toString("utf-8");
        const match = text.match(/^originalUrl:\s*"([^"]+)"/m);
        if (match) importedUrls.add(match[1]);
      }
    })
  );

  let synced = 0;
  for (const item of feed.items) {
    const urlSlug = item.link?.split("/p/")[1]?.replace(/\/$/, "") ?? "";
    if (!urlSlug) continue;

    const filename = `substack-${urlSlug}`;
    if (existingSlugs.has(filename) || importedUrls.has(item.link ?? "")) continue;

    const fullContent =
      (item as Record<string, string>)["content:encoded"] ??
      item.content ??
      item.summary ??
      "";
    const markdownBody = htmlToMarkdown(fullContent);

    const pubDatetime = new Date(item.pubDate || item.isoDate || Date.now())
      .toISOString()
      .replace(/\.\d{3}Z$/, "Z");
    const description = stripHtml(item.summary || item.contentSnippet || "")
      .replace(/\n/g, " ")
      .substring(0, 148)
      .trim()
      .replace(/"/g, '\\"');
    const title = (item.title || "")
      .replace(/\n/g, " ")
      .replace(/"/g, '\\"');

    const fileContent = `---
title: "${title}"
pubDatetime: ${pubDatetime}
description: "${description}"
source: substack
originalUrl: "${item.link || ""}"
tags:
  - essays
draft: false
featured: false
---

${markdownBody}
`;

    try {
      await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: `${CONTENT_PATH}/${filename}.md`,
        message: `chore: sync Substack post "${item.title}"`,
        content: Buffer.from(fileContent).toString("base64"),
      });
      synced++;
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 422) {
        // File already exists (concurrent execution) — skip silently
      } else {
        throw err;
      }
    }
  }

  return new Response(`Sync complete. ${synced} new posts.`, { status: 200 });
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function htmlToMarkdown(html: string): string {
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
    .replace(/<p[^>]*>(.*?)<\/p>/gis, "$1\n\n")
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "_$1_")
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, "![$2]($1)")
    .replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, "![]($1)")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#8230;/g, "…")
    .replace(/&#8220;/g, "\u201C")
    .replace(/&#8221;/g, "\u201D")
    // Fix footnote content: [N](#footnote-anchor-N) → block-level anchor matching
    // the working format used by manually-imported posts. Must be on its own line
    // (surrounded by blank lines) so Prettier treats it as block HTML and preserves
    // the double-quoted id attribute without converting to typographic quotes.
    .replace(
      /^\[(\d+)\]\(#footnote-anchor-(\d+)\) */gm,
      '<a href="#footnote-anchor-$2" id="footnote-$1" class="footnote-number">$1</a>\n\n'
    )
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const config: Config = {
  schedule: "@hourly",
};
