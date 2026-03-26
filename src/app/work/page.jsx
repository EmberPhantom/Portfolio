import { fetchGithubProjects } from '../../lib/github';
import ProjectRow from '../../components/work/ProjectRow';

export default async function Work() {
  const repos = await fetchGithubProjects();

  return (
    <div className="pt-32 pb-32 px-10 md:px-20 lg:px-32 w-full relative">
      <div className="mb-32 max-w-5xl">
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black text-text uppercase tracking-tighter leading-none mb-6">
          Selected <br/><span className="text-accent">Works.</span>
        </h1>
        <p className="text-text-muted text-xl max-w-xl md:ml-1">
          An autonomous sync of live GitHub repositories. Real-world impact shipped from conviction.
        </p>
      </div>

      <div className="flex flex-col gap-32 md:gap-64">
        {repos.map((repo, index) => (
          <ProjectRow key={repo.id} repo={repo} index={index} />
        ))}
      </div>
    </div>
  );
}
