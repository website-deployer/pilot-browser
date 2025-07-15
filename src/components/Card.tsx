import React from 'react';

interface CardProps {
  title: string;
  description: string;
  href: string;
}

export default function Card({ title, description, href }: CardProps) {
  return (
    <a
      href={href}
      className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all hover:bg-gradient-to-br hover:from-brand/10 hover:to-accent/10"
    >
      <h3 className="text-xl font-bold text-brand dark:text-brand-light">{title}</h3>
      <p className="mt-2 text-gray-700 dark:text-gray-300">{description}</p>
    </a>
  );
}
