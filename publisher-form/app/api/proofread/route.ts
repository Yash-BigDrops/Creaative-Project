import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Debug logging
    console.log("Proofread API called");
    console.log("API Key exists:", !!process.env.OPENAI_API_KEY);
    console.log("API Key length:", process.env.OPENAI_API_KEY?.length || 0);
    
    const { text } = await req.json();
    console.log("Text received length:", text?.length || 0);

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "No text to proofread." }, { status: 400 });
    }

    const prompt = `
You are a professional copy editor with an experience of 10+ years. Review the text for:
- spelling
- grammar (subject–verb agreement, tense, punctuation)
- clarity/conciseness (light)
Return ONLY JSON:
{
  "corrected": "full corrected version",
  "edits": [
    {
      "start": <number>,    
      "end": <number>,      
      "original": "…",
      "suggestion": "…",
      "reason": "…",        
      "severity": "minor" | "major"
    }
  ]
}
Text:
"""${text}"""`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Return strict JSON only." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `OpenAI error: ${err}` }, { status: 500 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { corrected: "", edits: [] };
    }

    return NextResponse.json(parsed);
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}


