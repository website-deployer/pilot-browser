import Link from 'next/link';
import Search from './Search';

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-brand to-accent shadow">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xl font-bold text-white">
            <Link href="/">ZeroStack</Link>
          </div>
          
          <div className="w-full md:w-96">
            <Search />
          </div>
          
          <ul className="flex space-x-4">
            <li><Link href="/tutorials" className="text-white hover:text-gray-200">Tutorials</Link></li>
            <li><Link href="/resources" className="text-white hover:text-gray-200">Resources</Link></li>
            <li><Link href="/blog" className="text-white hover:text-gray-200">Blog</Link></li>
            <li><Link href="/sponsors" className="text-white hover:text-gray-200">Sponsors</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
