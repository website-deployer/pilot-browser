import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex justify-between items-center">
          <div className="text-xl font-bold text-brand dark:text-brand-light">
            <Link href="/">ZeroStack</Link>
          </div>
          <ul className="flex space-x-4">
            <li><Link href="/tutorials" className="hover:text-brand dark:hover:text-brand-light">Tutorials</Link></li>
            <li><Link href="/resources" className="hover:text-brand dark:hover:text-brand-light">Resources</Link></li>
            <li><Link href="/blog" className="hover:text-brand dark:hover:text-brand-light">Blog</Link></li>
            <li><Link href="/sponsors" className="hover:text-brand dark:hover:text-brand-light">Sponsors</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
