import WorkDeepDive from '../../../components/WorkDeepDive';
import { fetchGithubProjects, fetchRepoReadme } from '../../../lib/github';
import { generateProjectStory } from '../../../lib/groq';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  let title = slug.replace(/-/g, ' ').toUpperCase();
  let description = 'A deep dive into the architecture and execution of this project.';

  if (supabase) {
    const { data } = await supabase
      .from('clone_projects')
      .select('name, description')
      .eq('slug', slug)
      .maybeSingle();
    if (data) {
      title = data.name;
      description = data.description || description;
    }
  }

  return {
    title: `${title} | EmberOS Case Study`,
    description,
  };
}

export default async function ProjectPage({ params }) {
  const { slug } = await params;
  
  // 1. Fetch live DB record from Supabase
  let dbProject = null;
  if (supabase) {
    const { data } = await supabase
      .from('clone_projects')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    dbProject = data;
  }

  // 2. Fetch live repository metadata from GitHub API
  const repos = await fetchGithubProjects();
  const repoMetadata = repos.find(r => r.name === slug) || { name: slug, description: '' };

  // Merge DB attributes into project metadata
  const mergedProject = {
    ...repoMetadata,
    title: dbProject?.name || repoMetadata.name || slug,
    description: dbProject?.description || repoMetadata.description,
    live_url: dbProject?.live_url || repoMetadata.homepage || null,
    github_repo_url: dbProject?.github_repo_url || repoMetadata.html_url || null,
    is_public_buildable: dbProject?.is_public_buildable || false,
    db_id: dbProject?.id || null,
    status: dbProject?.status || null
  };

  // 3. Fetch the raw README markdown
  const readmeText = await fetchRepoReadme(slug);

  // 4. Generate AI case study
  const storyData = await generateProjectStory(mergedProject, readmeText);

  return <WorkDeepDive slug={slug} projectInitialData={mergedProject} storyData={storyData} />;
}
