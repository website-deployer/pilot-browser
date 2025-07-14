import fs from 'fs';
import path from 'path';

export async function generateStaticParams() {
  const tutorialsDir = path.join(process.cwd(), 'content', 'tutorials');
  const filenames = fs.readdirSync(tutorialsDir);
  
  return filenames.map(filename => ({
    slug: filename.replace(/\.md$/, ''),
  }));
}
