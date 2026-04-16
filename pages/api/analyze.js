// pages/api/analyze.js
// Secure backend proxy — keeps your ANTHROPIC_API_KEY off the client

// Increase body size limit for base64 images (up to 10MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Anthropic API error:", error);
      return res.status(response.status).json({ error: error.error?.message || "API error" });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("Anthropic API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
