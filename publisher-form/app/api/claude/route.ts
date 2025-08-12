import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    
    const { 
      companyName, 
      offerId, 
      creativeType, 
      notes, 
      creativeContent,
      creativeFileName,
      creativeIndex,
      timestamp
    } = await request.json();
    


    if (!companyName || !offerId) {
      return NextResponse.json({ error: 'Missing required fields: companyName and offerId are required' }, { status: 400 });
    }

    if (!process.env.CLAUDE_API_KEY) {
      return NextResponse.json({ error: 'Claude API key not configured' }, { status: 500 });
    }

    const currentTimestamp = timestamp || new Date().toISOString();
    const creativeContext = creativeFileName ? `Creative: ${creativeFileName}` : 'Creative: Unnamed';
    const indexContext = creativeIndex ? `(Index: ${creativeIndex})` : '';
    
    const prompt = `
You are an expert email marketer specializing in high-converting email campaigns.

🎯 CAMPAIGN DETAILS:
- Creative Type: ${creativeType || "N/A"}
- Creative File: ${creativeContext} ${indexContext}
- Request Time: ${currentTimestamp}
- Notes: ${notes || "None"}

📄 CREATIVE CONTENT:
"""
${creativeContent || "No meaningful content was extracted from the creative. This appears to be only footer/unsubscribe content."}
"""

⚠️ CRITICAL REQUIREMENTS:
Imagine that you are a professional copywriter, digital marketer and email marketing expert with an experience of 10+ years. I want you to perform these tasks accordingly one by one without making any errors. Don't make it sound like Artificial intelligence. I want you to write it as a human that would get most conversions. These are the details of the task - 
1. Generate suggestions that are SPECIFIC to THIS creative's content and style
2. Avoid generic, one-size-fits-all suggestions
3. Each suggestion should reflect the unique elements of this creative
4. Ensure suggestions are brand-safe and non-clickbaity
5. Make suggestions compelling and engaging for the target audience

Please suggest:
1. 15 unique, brand-safe, non-clickbaity "From" lines
2. 15 compelling, engaging "Subject" lines

Format your response EXACTLY as follows:

From Lines:
1. ...
2. ...
3. ...
4. ...
5. ...
6. ...
7. ...
8. ...
9. ...
10. ...
11. ...
12. ...
13. ...
14. ...
15. ...

Subject Lines:
1. ...
2. ...
3. ...
4. ...
5. ...
6. ...
7. ...
8. ...
9. ...
10. ...
11. ...
12. ...
13. ...
14. ...
15. ...
    `;

    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.CLAUDE_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      })
    });


    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ 
        error: `Claude API error: ${response.status} ${response.statusText}`,
        details: errorText
      }, { status: response.status });
    }

    const data = await response.json();
    
    const text = data?.content?.[0]?.text;
    if (!text) {
      return NextResponse.json({ error: 'No suggestions generated from Claude API' }, { status: 500 });
    }

    return NextResponse.json({ suggestions: text });
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Claude API request failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 