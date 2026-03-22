import WorkDeepDive from '../../../components/WorkDeepDive';
import { fetchGithubProjects, fetchRepoReadme } from '../../../lib/github';
import { generateProjectStory } from '../../../lib/groq';

// Optional: If you want Next.js to dynamically render this page on every request
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  // Try to find the repo description for metadata
  const repos = await fetchGithubProjects();
  const repo = repos.find(r => r.name === slug);

  return {
    title: `${repo?.name?.replace(/-/g, ' ').toUpperCase() || slug.toUpperCase()} | EmberOS Case Study`,
    description: repo?.description || 'A deep dive into the architecture and execution of this project.',
  };
}

export default async function ProjectPage({ params }) {
  const { slug } = await params;
  
  // 1. Fetch live repository metadata
  const repos = await fetchGithubProjects();
  const repoMetadata = repos.find(r => r.name === slug) || { name: slug, description: '' };

  // 2. Fetch the raw README markdown
  const readmeText = await fetchRepoReadme(slug);

  // 3. Generate the unique, structured UI configuration via Gemini 2.5 Pro
  const storyData = await generateProjectStory(repoMetadata, readmeText);

  // 4. Pass the AI-generated story to the dynamic component renderer
  return <WorkDeepDive slug={slug} projectInitialData={repoMetadata} storyData={storyData} />;
}
