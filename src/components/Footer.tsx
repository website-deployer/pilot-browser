export default function Footer() {
  return (
    <footer className="mt-auto p-4 bg-gray-100 dark:bg-gray-800">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold">Sponsors</h3>
            <p>Become a sponsor and get your logo here.</p>
            <a href="/sponsors" className="text-blue-600 dark:text-blue-400">Learn more</a>
          </div>
          <div>
            <h3 className="font-bold">Recommended Tools</h3>
            <p>Coming soon: Amazon developer tools recommendations.</p>
          </div>
          <div>
            <p>&copy; {new Date().getFullYear()} ZeroStack</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
