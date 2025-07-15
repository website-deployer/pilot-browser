'use client';

import { useState } from 'react';
import Fuse from 'fuse.js';
import Link from 'next/link';

interface SearchItem {
  id: string;
  type: string;
  title: string;
  description: string;
  url: string;
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  
  const search = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    
    const response = await fetch('/search-index.json');
    const index: SearchItem[] = await response.json();
    
    const fuse = new Fuse(index, {
      keys: ['title', 'description', 'content'],
      includeScore: true,
      threshold: 0.3,
    });
    
    const results = fuse.search(query).map(result => result.item);
    setResults(results);
  };
  
  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search tutorials, resources, blog..."
        className="w-full p-2 border rounded"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          search(e.target.value);
        }}
      />
      
      {results.length > 0 && (
        <div className="absolute z-10 w-full bg-white dark:bg-gray-800 shadow-lg rounded mt-1 max-h-80 overflow-y-auto">
          {results.map(item => (
            <Link
              key={item.id}
              href={item.url}
              className="block p-4 hover:bg-gray-100 dark:hover:bg-gray-700 border-b"
            >
              <div className="text-sm text-brand dark:text-brand-light">{item.type}</div>
              <div className="font-bold">{item.title}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">{item.description}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
