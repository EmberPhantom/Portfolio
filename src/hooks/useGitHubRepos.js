import { useState, useEffect } from 'react'

const GITHUB_USERNAME = 'EmberPhantom'
const CACHE_KEY = 'github_repos_cache'
const CACHE_TTL = 60 * 60 * 1000

function getCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    
    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    return data
  } catch {
    return null
  }
}

function setCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }))
  } catch {}
}

export function useGitHubRepos() {
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const cached = getCache()
    if (cached) {
      setRepos(cached)
      setLoading(false)
      return
    }

    async function fetchRepos() {
      try {
        const response = await fetch(
          `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=20`
        )
        
        if (!response.ok) {
          throw new Error('Failed to fetch repositories')
        }
        
        const data = await response.json()
        const filteredRepos = data.filter(repo => !repo.fork)
        setRepos(filteredRepos)
        setCache(filteredRepos)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchRepos()
  }, [])

  return { repos, loading, error }
}
