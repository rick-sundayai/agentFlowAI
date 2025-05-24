import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-white">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 sm:px-20 text-center">
        <h1 className="text-6xl font-bold mb-8">
          <span className="text-indigo-600 dark:text-indigo-400">Agent</span>Flow AI
        </h1>
        
        <p className="text-xl mb-12 max-w-md">
          The intelligent workflow automation platform powered by AI
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/login"
            className="px-8 py-3 rounded-md bg-indigo-600 text-white font-medium text-lg hover:bg-indigo-500 transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            Login
          </Link>
        </div>
      </main>
    </div>
  );
}
