const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const contentDirs = ['tutorials', 'resources', 'blog'];
const contentBase = path.join(process.cwd(), 'content');
const outputPath = path.join(process.cwd(), 'public', 'search-index.json');

const index = [];

contentDirs.forEach(dir => {
  const dirPath = path.join(contentBase, dir);
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const { data, content: body } = matter(content);
    
    index.push({
      id: file.replace(/\.md$/, ''),
      type: dir,
      title: data.title || 'Untitled',
      description: data.description || '',
      content: body,
      url: `/${dir}/${file.replace(/\.md$/, '')}`
    });
  });
});

fs.writeFileSync(outputPath, JSON.stringify(index));
