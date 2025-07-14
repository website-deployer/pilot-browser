import { processMarkdown } from '@/lib/markdown';
import fs from 'fs';
import path from 'path';

interface ResourcePageProps {
  params: {
    slug: string;
  };
}

export default async function ResourcePage({ params }: ResourcePageProps) {
  const { slug } = params;
  const filePath = path.join(process.cwd(), 'content', 'resources', `${slug}.md`);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { meta, content } = await processMarkdown(fileContents);

  return (
    <article className="prose dark:prose-invert max-w-4xl mx-auto py-8">
      <h1>{meta.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </article>
  );
}
