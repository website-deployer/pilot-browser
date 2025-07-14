import { remark } from 'remark';
import html from 'remark-html';
import matter from 'gray-matter';

export async function processMarkdown(content: string) {
  // Parse front matter
  const { data, content: markdownContent } = matter(content);

  // Convert markdown to HTML
  const processedContent = await remark()
    .use(html)
    .process(markdownContent);
  
  return {
    meta: data,
    content: processedContent.toString(),
  };
}
