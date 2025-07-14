import fs from 'fs';
import path from 'path';

export async function generateStaticParams() {
  const resourcesDir = path.join(process.cwd(), 'content', 'resources');
  const filenames = fs.readdirSync(resourcesDir);
  
  return filenames.map(filename => ({
    slug: filename.replace(/\.md$/, ''),
  }));
}
