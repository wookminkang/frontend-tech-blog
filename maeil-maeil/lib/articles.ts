import fs from 'fs';
import path from 'path';
import type { Article, ArticleMeta } from '@/types/article';

const articlesDir = path.join(process.cwd(), '../_articles');

function parseMetaTable(content: string): Record<string, string> {
  const meta: Record<string, string> = {};
  const tableRegex = /\|\s*`\{\{(\w+)\}\}`\s*\|\s*(.+?)\s*\|/g;
  let match;
  while ((match = tableRegex.exec(content)) !== null) {
    meta[match[1]] = match[2].trim();
  }
  return meta;
}

function parseCodeBlockMeta(content: string): Record<string, string> {
  const meta: Record<string, string> = {};
  const codeBlockMatch = content.match(/```\n([\s\S]*?)```/);
  if (!codeBlockMatch) return meta;
  for (const line of codeBlockMatch[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx !== -1) {
      const key = line.substring(0, colonIdx).trim();
      const value = line.substring(colonIdx + 1).trim();
      if (key) meta[key] = value;
    }
  }
  return meta;
}

function extractContent(fileContent: string, isTemplate: boolean): string {
  if (isTemplate) return '';
  let content = fileContent;

  // Strip from ### [ACTIONS] onwards (includes FOOTER and 키워드 변수 정의)
  const actionsIdx = content.indexOf('### [ACTIONS]');
  if (actionsIdx !== -1) content = content.substring(0, actionsIdx).trim();

  // Fallback: strip 키워드 변수 정의 section
  const kwIdx = content.indexOf('## 키워드 변수 정의');
  if (kwIdx !== -1) content = content.substring(0, kwIdx).trim();

  // Strip the first H1 heading (title shown separately in the page header)
  content = content.replace(/^#\s+.+\n?/, '').trim();

  // Strip the category blockquote (> **카테고리에 관련한 질문이에요.**)
  content = content.replace(/^>\s+\*\*.+\*\*\s*\n?/, '').trim();

  return content;
}

function parseFile(slug: string): ArticleMeta {
  const fullPath = path.join(articlesDir, `${slug}.md`);
  const fileContent = fs.readFileSync(fullPath, 'utf8');
  const isTemplate = fileContent.startsWith('# 블로그 상세 페이지 템플릿');

  let title = '';
  let category = '프론트엔드';
  let date = '';
  let summary = '';
  let tags: string[] = [];

  if (isTemplate) {
    const codeMeta = parseCodeBlockMeta(fileContent);
    title = codeMeta['title'] || '';
    category = codeMeta['category'] || '프론트엔드';
    date = codeMeta['published_at'] || '';
    const tableMeta = parseMetaTable(fileContent);
    summary = tableMeta['SUMMARY'] || '';
    tags = tableMeta['TAGS'] ? tableMeta['TAGS'].split(',').map((t) => t.trim()) : [];
  } else {
    const tableMeta = parseMetaTable(fileContent);
    title = tableMeta['TITLE'] || '';
    category = tableMeta['CATEGORY'] || '프론트엔드';
    date = tableMeta['DATE'] || '';
    summary = tableMeta['SUMMARY'] || '';
    tags = tableMeta['TAGS'] ? tableMeta['TAGS'].split(',').map((t) => t.trim()) : [];
  }

  return {
    slug,
    title,
    category: category as ArticleMeta['category'],
    date,
    summary,
    tags,
    isTemplate,
  };
}

export function getAllArticles(): ArticleMeta[] {
  if (!fs.existsSync(articlesDir)) return [];
  const fileNames = fs.readdirSync(articlesDir).filter((f) => f.endsWith('.md'));
  const articles = fileNames.map((fileName) => parseFile(fileName.replace(/\.md$/, '')));
  return articles.sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0));
}

export function getArticleBySlug(slug: string): Article | null {
  const fullPath = path.join(articlesDir, `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;
  const fileContent = fs.readFileSync(fullPath, 'utf8');
  const isTemplate = fileContent.startsWith('# 블로그 상세 페이지 템플릿');
  const meta = parseFile(slug);
  const content = extractContent(fileContent, isTemplate);
  return { ...meta, content };
}

export function getAllSlugs(): string[] {
  if (!fs.existsSync(articlesDir)) return [];
  return fs
    .readdirSync(articlesDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''));
}
