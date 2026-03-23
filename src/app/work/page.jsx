import { fetchGithubProjects } from '../../lib/github';
import ProjectRow from '../../components/work/ProjectRow';

export default async function Work() {
  const repos = await fetchGithubProjects();

  return (
    <div className="pt-32 pb-32 px-6 md:px-12 max-w-7xl mx-auto w-full relative">
      <div className="mb-32">
        <h1 className="text-6xl md:text-9xl font-display font-black text-text uppercase tracking-tighter leading-none mb-6">
          Selected <br/><span className="text-accent">Works.</span>
        </h1>
        <p className="text-text-muted text-xl max-w-xl md:ml-2">
          An autonomous sync of live GitHub repositories. Real-world impact shipped from conviction.
        </p>
      </div>

      <div className="flex flex-col gap-32 md:gap-48">
        {repos.map((repo, index) => (
          <ProjectRow key={repo.id} repo={repo} index={index} />
        ))}
      </div>
    </div>
  );
}
