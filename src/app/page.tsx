import Card from '@/components/Card';

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-full max-w-4xl">
        <h1 className="text-3xl font-bold">Welcome to ZeroStack</h1>
        <p className="text-lg">A curated directory of developer resources.</p>

        <section className="flex flex-col gap-4 w-full">
          <h2 className="text-2xl font-bold">Featured Tutorials</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card 
              title="Getting Started with Next.js" 
              description="Learn the basics of Next.js by building a simple project."
              href="/tutorials/getting-started-with-nextjs"
            />
            <Card 
              title="Mastering Tailwind CSS" 
              description="A comprehensive guide to styling with Tailwind CSS."
              href="/tutorials/mastering-tailwind-css"
            />
          </div>
        </section>

        <section className="flex flex-col gap-4 w-full">
          <h2 className="text-2xl font-bold">Featured Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card 
              title="Next.js Documentation" 
              description="Official Next.js documentation for in-depth learning."
              href="https://nextjs.org/docs"
            />
            <Card 
              title="Tailwind CSS Documentation" 
              description="Official Tailwind CSS documentation for reference."
              href="https://tailwindcss.com/docs"
            />
          </div>
        </section>

        <section className="flex flex-col gap-4 w-full">
          <h2 className="text-2xl font-bold">Latest Blog Posts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card 
              title="The Future of Web Development" 
              description="Exploring the latest trends in web development."
              href="/blog/future-of-web-development"
            />
            <Card 
              title="Why ZeroStack?" 
              description="The story behind ZeroStack and our mission."
              href="/blog/why-zerostack"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
