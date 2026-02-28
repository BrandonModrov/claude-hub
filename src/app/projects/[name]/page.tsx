import Link from "next/link";
import { ProjectDetail } from "@/components/project-detail";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const projectName = decodeURIComponent(name);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-10">
        <Link
          href="/projects"
          className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
        >
          &larr; Back to projects
        </Link>
        <h1 className="font-black text-5xl tracking-tight mt-3 capitalize">
          {projectName}
        </h1>
        <p className="text-lg text-zinc-400 mt-2">
          Detailed Claude Code usage for this project
        </p>
      </header>
      <ProjectDetail projectName={projectName} />
    </main>
  );
}
