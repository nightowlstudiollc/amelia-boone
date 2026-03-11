// TODO (Andrew): Set GITHUB_TOKEN in Netlify environment variables.
// Netlify UI > amelia-boone-archive > Site configuration > Environment variables
// Value: the nightowlstudiollc PAT from the project auth file

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

  const existingSlugs = new Set(
    existingFiles
      .filter((f) => f.name.startsWith("substack-"))
      .map((f) => f.name.replace(".md", ""))
  );

  let synced = 0;
  for (const item of feed.items) {
    const urlSlug = item.link?.split("/p/")[1]?.replace(/\/$/, "") ?? "";
    if (!urlSlug) continue;

    const filename = `substack-${urlSlug}`;
    if (existingSlugs.has(filename)) continue;

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
      .substring(0, 148)
      .trim()
      .replace(/"/g, '\\"');
    const title = (item.title || "").replace(/"/g, '\\"');

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

    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: `${CONTENT_PATH}/${filename}.md`,
      message: `chore: sync Substack post "${item.title}"`,
      content: Buffer.from(fileContent).toString("base64"),
    });

    synced++;
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
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
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
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const config: Config = {
  schedule: "@hourly",
};
