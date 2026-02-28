import { NewsFeed } from "@/components/news-feed";

export default function NewsPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-10">
        <h1 className="font-black text-5xl tracking-tight">News</h1>
        <p className="text-lg text-zinc-400 mt-2">
          Latest updates from Claude AI & Anthropic
        </p>
      </header>
      <NewsFeed />
    </main>
  );
}
