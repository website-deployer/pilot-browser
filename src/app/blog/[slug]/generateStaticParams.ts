import fs from 'fs';
import path from 'path';

export async function generateStaticParams() {
  const blogDir = path.join(process.cwd(), 'content', 'blog');
  const filenames = fs.readdirSync(blogDir);
  
  return filenames.map(filename => ({
    slug: filename.replace(/\.md$/, ''),
  }));
}
