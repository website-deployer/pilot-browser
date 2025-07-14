import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';

export default function ResourcesPage() {
  const resourcesDir = path.join(process.cwd(), 'content', 'resources');
  const filenames = fs.readdirSync(resourcesDir);
  
  const resources = filenames.map(filename => {
    const filePath = path.join(resourcesDir, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data: frontMatter } = matter(fileContents);
    return {
      slug: filename.replace(/\.md$/, ''),
      title: frontMatter.title || 'Untitled',
      description: frontMatter.description || '',
    };
  });

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Resources</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resources.map(resource => (
          <Link
            key={resource.slug}
            href={`/resources/${resource.slug}`}
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-bold text-brand dark:text-brand-light">{resource.title}</h2>
            <p className="mt-2 text-gray-700 dark:text-gray-300">{resource.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
