import Groq from "groq-sdk";

// Initialize the Groq client lazily
let groqClient = null;

function getGroqClient() {
  if (groqClient) return groqClient;
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || process.env.GROQ_API_KEY || "";
  if (!apiKey) {
    console.warn("Groq API key is missing. AI features will be disabled.");
  } else {
    console.log("Groq Engine: API Key detected (Length:", apiKey.length, ")");
  }
  // dangerouslyAllowBrowser is required because AIAssistant runs on the client
  groqClient = new Groq({ apiKey, dangerouslyAllowBrowser: true });
  return groqClient;
}

const SYSTEM_PROMPT = `
You are an elite Senior Technical Writer and UI/UX Architect for Pranay Chandra's premium portfolio ("EmberOS").
Your job is to analyze the provided GitHub repository metadata and README, and generate a highly engaging, unique "Case Study" JSON payload.

The portfolio is cinematic, dark-themed, and focuses on "building systems from first principles."

You must return ONLY a raw JSON object string with the following schema:
{
  "hero": {
    "type": "Select ONE: 'cinematic', 'minimal', or 'split'",
    "headline": "A punchy, 3-5 word headline",
    "subheadline": "A 1-2 sentence compelling tagline"
  },
  "story": {
    "title": "The specific problem this project solves",
    "paragraphs": ["Paragraph 1 of the narrative...", "Paragraph 2..."]
  },
  "architecture": [
    {
      "concept": "Concept Name (e.g., 'Real-time WebSocket Layer')",
      "description": "How it works in this project"
    }
  ],
  "challenges": [
    {
      "problem": "Specific technical hurdle",
      "solution": "How it was uniquely solved"
    }
  ],
  "techStack": [ "Array", "of", "technologies", "used" ]
}

Rules:
1. DO NOT wrap the output in markdown code blocks like \`\`\`json. Output ONLY the raw JSON string.
2. Ensure the tone is confident, technical, and slightly cinematic.
3. If the README is empty or sparse, infer the best you can from the repo name, language, and topics.
`;

export async function generateProjectStory(repoMetadata, readmeText) {
  try {
    const groq = getGroqClient();

    const prompt = `
      Repository Name: ${repoMetadata.name}
      Description: ${repoMetadata.description || 'No description provided'}
      Language: ${repoMetadata.language || 'Unknown'}
      Topics: ${repoMetadata.topics ? repoMetadata.topics.join(', ') : 'None'}
      
      README CONTENT:
      ${readmeText ? readmeText.substring(0, 15000) : "No README available."}
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0]?.message?.content || "{}";
    
    // Safety parse just in case the model wraps it
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanText);

  } catch (error) {
    console.warn("Groq Generation API Notice:", error.message);
    // Return a graceful fallback layout so the page doesn't crash
    return {
      hero: { type: 'minimal', headline: repoMetadata.name?.replace(/-/g, ' ') || "Project", subheadline: repoMetadata.description || "A technical exploration." },
      story: { title: "Engine Cooldown", paragraphs: ["The EmberOS AI engine has temporarily reached its processing capacity.", "Please wait a moment and refresh the page to generate this deep-dive case study."] },
      architecture: [],
      challenges: [],
      techStack: [repoMetadata.language].filter(Boolean)
    };
  }
}

export async function generateAIResponse(prompt, systemContext) {
  try {
    const groq = getGroqClient();

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemContext },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || "I'm not sure how to respond to that.";
  } catch (error) {
    console.warn("Groq Chat API Notice:", error.message);
    return "I've temporarily reached my processing limit. Give my neural nets a minute to cool down!";
  }
}
