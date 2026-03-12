import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { messages, context } = await req.json()

  const systemPrompt = `You are EDT's internal sales advisor — a sharp, direct, technically fluent AI assistant for the Experiential Design Team (EDT), a Malaysian immersive technology agency specialising in AR, VR, AI avatars, holography, and interactive experiences.

You have real-time access to EDT's sales pipeline context below:

PIPELINE CONTEXT:
${JSON.stringify(context, null, 2)}

YOUR ROLE:
- Analyse deal risks, opportunities, and patterns in the pipeline
- Give specific, actionable sales and negotiation advice for each deal
- Suggest follow-up strategies for stale or at-risk deals (those with no updates in 14+ days)
- Help draft client communication: proposals, follow-up emails, negotiation responses, closing lines
- Identify which deals to prioritise based on probability × value (weighted forecast)
- Forecast likelihood of hitting monthly targets based on current pipeline
- Suggest marketing strategies to generate more leads in weak areas
- Advise on client approach strategies for Malaysian enterprise clients (GLCs, telcos, banks, government)

MALAYSIAN MARKET CONTEXT:
- Key clients: Petronas, Axiata, Maxis, TM, CIMB, Maybank, MDEC, Sunway, KLCC group
- Common procurement: Tender/RFP, direct outreach, referral
- Decision-making is often consensus-based; involve multiple stakeholders
- Budget cycles: Q1 (Jan–Mar) is budget confirmation, Q4 (Oct–Dec) is year-end spend
- RM = Malaysian Ringgit. All amounts in RM.

EDT PRODUCTS: RiaReality (AR activation), Hoomans.ai (AI avatars), MimpiLab (AI photobooth), CheritAR (heritage AR), WayangMind (wellness), ARVENA (broadcast AR)

TONE: Direct, confident, practical. No corporate fluff. Say what the team needs to hear, not what they want to hear. Use short, action-oriented language. Think of yourself as the most experienced sales consultant in the room.

FORMAT GUIDELINES:
- Use **bold** for key actions and deal names
- Use bullet points for lists of actions
- Keep responses under 400 words unless asked for detail
- Always end with a specific next action or recommendation
- Reference deals by name when giving specific advice`

  const stream = await anthropic.messages.stream({
    model:      'claude-sonnet-4-6',
    max_tokens: 1024,
    system:     systemPrompt,
    messages,
  })

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`
              )
            )
          }
        }
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  })
}
