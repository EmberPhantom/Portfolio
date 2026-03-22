export async function fetchGithubProjects() {
  const GITHUB_USERNAME = 'EmberPhantom';
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    ...(GITHUB_TOKEN && { 'Authorization': `token ${GITHUB_TOKEN}` })
  };

  try {
    const response = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`,
      {
        headers,
        // Revalidate every 24 hours or if forces refreshing via webhook
        next: { revalidate: 86400 } 
      }
    );

    if (!response.ok) {
      if (response.status === 403) {
         console.error('GitHub API rate limit exceeded. Please add a GITHUB_TOKEN to .env.local');
         return [];
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const repos = await response.json();

    // Filter out forks and focus on projects that might be portfolio-worthy.
    // In the future, this could look for a specific topic like 'portfolio-project'
    const validProjects = repos.filter(repo => !repo.fork);

    // Sort by stars and prioritize EmberOS if it exists
    return validProjects.sort((a, b) => {
      if (a.name.toLowerCase() === 'emberos') return -1;
      if (b.name.toLowerCase() === 'emberos') return 1;
      return b.stargazers_count - a.stargazers_count;
    });

  } catch (error) {
    console.error('Failed to fetch GitHub projects:', error);
    return [];
  }
}

export async function fetchRepoReadme(repoName) {
  const GITHUB_USERNAME = 'EmberPhantom';
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  const headers = {
    'Accept': 'application/vnd.github.v3.raw',
    ...(GITHUB_TOKEN && { 'Authorization': `token ${GITHUB_TOKEN}` })
  };

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_USERNAME}/${repoName}/readme`,
      { 
        headers: {
            ...headers,
             'Accept': 'application/vnd.github.v3.raw'
        },
        next: { revalidate: 86400 } 
      }
    );

    if (!response.ok) {
      if (response.status === 404) return null; // No readme
      throw new Error(`GitHub README error: ${response.status}`);
    }

    const text = await response.text();
    return text;
  } catch (error) {
    console.error(`Failed to fetch README for ${repoName}:`, error);
    return null;
  }
}
