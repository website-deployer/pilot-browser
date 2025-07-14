import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';

export default function TutorialsPage() {
  const tutorialsDir = path.join(process.cwd(), 'content', 'tutorials');
  const filenames = fs.readdirSync(tutorialsDir);
  
  const tutorials = filenames.map(filename => {
    const filePath = path.join(tutorialsDir, filename);
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
      <h1 className="text-3xl font-bold mb-8">Tutorials</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tutorials.map(tutorial => (
          <Link
            key={tutorial.slug}
            href={`/tutorials/${tutorial.slug}`}
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-bold text-brand dark:text-brand-light">{tutorial.title}</h2>
            <p className="mt-2 text-gray-700 dark:text-gray-300">{tutorial.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
