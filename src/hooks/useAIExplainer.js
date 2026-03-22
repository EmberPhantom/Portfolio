import { useState } from 'react'

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
const API_URL = 'https://api.anthropic.com/v1/messages'

export function useAIExplainer() {
  const [loading, setLoading] = useState(false)

  const askQuestion = async (repo, question) => {
    if (!API_KEY || API_KEY === 'sk-ant-xxxx') {
      return getMockResponse(repo.name, question)
    }

    setLoading(true)

    const systemPrompt = `You are a helpful assistant explaining a GitHub repository called "${repo.name}". 
Description: ${repo.description || 'No description'}
Language: ${repo.language || 'Unknown'}
Topics: ${repo.topics?.join(', ') || 'None'}

Answer questions about this project in a friendly, informative way. Keep answers concise but helpful.`

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 500,
          system: systemPrompt,
          messages: [
            { role: 'user', content: question }
          ]
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response from AI')
      }

      const data = await response.json()
      return data.content[0].text
    } catch (error) {
      console.error('AI Error:', error)
      return getMockResponse(repo.name, question)
    } finally {
      setLoading(false)
    }
  }

  return { askQuestion, loading }
}

function getMockResponse(repoName, question) {
  const q = question.toLowerCase()
  
  if (q.includes('what') || q.includes('do') || q.includes('purpose')) {
    return `This is the "${repoName}" project. It's one of Pranay Chandra's GitHub repositories. Unfortunately, I don't have access to the full README, but you can click "View Code" to explore the source code and learn more about what this project does!`
  }
  
  if (q.includes('tech') || q.includes('technology') || q.includes('stack')) {
    return `To see the technologies used in this project, check the GitHub page! The primary language is listed at the top of the repository, and you can explore the codebase to see the full tech stack.`
  }
  
  if (q.includes('how') || q.includes('build') || q.includes('work')) {
    return `To understand how this project works, I'd recommend checking out the README in the repository. You can also explore the code directly on GitHub to see the implementation details.`
  }
  
  return `Great question! For more detailed information about "${repoName}", I recommend checking out the GitHub repository directly. You can read the README, explore the code, and even try running it locally. Let me know if you'd like to know something specific!`
}
