import Groq from 'groq-sdk';

let groqClient = null;

function getGroqClient() {
  if (groqClient) return groqClient;
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY || '';
  groqClient = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  return groqClient;
}

/**
 * Generates a cinematic Unsplash search query based on project metadata
 */
export async function getProjectVisualPrompt(name, description) {
  const groq = getGroqClient();
  
  const prompt = `You are a visual design assistant. Given a software project's name and description, generate a 2-3 word search query for a cinematic, high-quality Unsplash image that represents the project's essence.
  
  PROJECT NAME: ${name}
  DESCRIPTION: ${description || 'A software engineering project'}
  
  Return ONLY a JSON object: { "query": "string" }
  Example for an AI tool: { "query": "neural network" }
  Example for a website: { "query": "minimal architecture" }`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.5
    });
    
    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return result.query || 'technology';
  } catch (err) {
    console.error('Project AI Error:', err);
    return 'technology';
  }
}
