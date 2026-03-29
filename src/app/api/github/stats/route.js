export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function GET() {
  const GITHUB_USERNAME = 'EmberPhantom';
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ 
      totalCommits: 1432, 
      totalStars: 10, 
      topLanguages: 'JavaScript',
      note: 'Token missing, using baseline' 
    });
  }

  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    ...(GITHUB_TOKEN && { 'Authorization': `token ${GITHUB_TOKEN}` })
  };

  try {
    // 1. Fetch all public repos
    const reposRes = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated`,
      { headers, next: { revalidate: 3600 } }
    );

    if (!reposRes.ok) throw new Error('GitHub API error');
    const repos = await reposRes.json();

    // 2. Aggregate stats
    const totalStars = repos.reduce((acc, repo) => acc + repo.stargazers_count, 0);
    const languages = [...new Set(repos.map(r => r.language).filter(Boolean))];
    
    // 3. For commits, we take a heuristic or fetch activity
    // To keep it fast, we look at the last 100 events or a hardcoded baseline + real recent activity
    const eventsRes = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/events?per_page=100`,
      { headers, next: { revalidate: 3600 } }
    );
    const events = await eventsRes.json();
    const recentCommits = events.filter(e => e.type === 'PushEvent').length * 3; // Heuristic multiplier

    return NextResponse.json({
      totalCommits: 1400 + recentCommits, // Baseline + dynamic activity
      totalStars,
      topLanguages: languages.slice(0, 3).join(', '),
      publicRepos: repos.length
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
