import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GeminiAnalysisResult, SyncedLyricLine, LoreLink, PerformerDetails } from '$lib/types';

const geminiApiKey = process.env.GEMINI_API_KEY || '';

/**
 * Analyzes video content with Gemini 1.5 Flash to extract concert intelligence:
 * 1. Performer & Artist Identification (visual & audio cues, confidence, genre)
 * 2. Time-Synced Lyrics & Spoken Transcripts
 * 3. Domain Tags (stage lighting, instruments, crowd, visual dynamics)
 * 4. Wikipedia / Lore Context Links (track background, historical tour trivia)
 * 5. Venue & Stage atmosphere
 */
export async function analyzeVideoWithGemini(
	videoBufferOrUrl: Buffer | string,
	mimeType: string = 'video/mp4'
): Promise<GeminiAnalysisResult> {
	if (!geminiApiKey) {
		console.warn('GEMINI_API_KEY not set. Returning rich mock concert intelligence.');
		return getMockConcertAnalysis();
	}

	const genAI = new GoogleGenerativeAI(geminiApiKey);
	const model = genAI.getGenerativeModel({
		model: 'gemini-1.5-flash',
		generationConfig: {
			responseMimeType: 'application/json',
			temperature: 0.2
		}
	});

	const prompt = `
You are an expert concert, music, and live performance video intelligence extraction engine.
Analyze this live concert performance clip and output structured intelligence adhering STRICTLY to this JSON format:

{
  "artist": "Identified Artist or Band name (e.g., 'Coldplay', 'Taylor Swift', 'The Lumineers', or null if completely unrecognizable)",
  "performer_details": {
    "name": "Primary performer or band name",
    "confidence": 0.95,
    "genre": "e.g., 'Indie Rock', 'Pop / Stadium Rock', 'Synthwave', 'Acoustic Folk'",
    "role": "e.g., 'Lead Vocals & Acoustic Guitar', 'Frontman / Keyboards'",
    "visualCues": ["Characteristic costume or stage presence notes", "Instrument setup"]
  },
  "venue": "Venue name, stage setup, and environment context (e.g. 'Red Rocks Amphitheatre, Outdoor Arena', 'Dim Underground Club, Austin', 'Glastonbury Pyramid Stage')",
  "lyrics_synced": [
    {
      "timestamp": "0:04",
      "text": "First line of sung lyrics or spoken intro",
      "speaker": "Lead Vocalist"
    },
    {
      "timestamp": "0:12",
      "text": "Second line of sung lyrics or crowd chant",
      "speaker": "Lead Vocalist"
    }
  ],
  "transcript": "Continuous full verbatim transcription of all sung lyrics and spoken crowd interactions.",
  "visual_tags": [
    "Array of concise 1-3 word domain tags covering lighting (e.g. 'Strobe Lighting', 'Laser Array', 'Golden Hour Glow'), instruments (e.g. 'Fender Stratocaster', 'Grand Piano'), crowd dynamics ('Crowd Singalong', 'Mosh Pit', 'Phone Flashlights'), and performance type ('Acoustic Encore', 'Stadium Anthem')"
  ],
  "lore_links": [
    {
      "title": "Wikipedia or Lore Page Title (e.g., 'Fix You - Wikipedia', 'Live Aid 1985 Historical Lore')",
      "url": "https://en.wikipedia.org/wiki/...",
      "description": "Historical trivia, album background, or significance of this live performance.",
      "category": "wikipedia"
    }
  ],
  "summary": "1-2 sentence high-level executive summary highlighting the peak musical moment and audience atmosphere."
}

Ensure all JSON keys match this specification exactly.
`;

	try {
		let contents: any[];

		if (typeof videoBufferOrUrl === 'string') {
			const response = await fetch(videoBufferOrUrl);
			if (!response.ok) {
				throw new Error(`Failed to download video from URL: ${response.statusText}`);
			}
			const arrayBuffer = await response.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);
			const base64Data = buffer.toString('base64');

			contents = [
				{
					inlineData: {
						data: base64Data,
						mimeType: mimeType || 'video/mp4'
					}
				},
				prompt
			];
		} else {
			const base64Data = videoBufferOrUrl.toString('base64');
			contents = [
				{
					inlineData: {
						data: base64Data,
						mimeType: mimeType || 'video/mp4'
					}
				},
				prompt
			];
		}

		const result = await model.generateContent(contents);
		const responseText = result.response.text();

		// Clean JSON formatting if markdown wraps exist
		const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
		const parsed = JSON.parse(cleanedText);

		return {
			artist: parsed.artist || parsed.performer_details?.name || null,
			performer_details: parsed.performer_details || null,
			venue: parsed.venue || null,
			lyrics_synced: Array.isArray(parsed.lyrics_synced) ? parsed.lyrics_synced : [],
			transcript: parsed.transcript || null,
			visual_tags: Array.isArray(parsed.visual_tags) ? parsed.visual_tags : [],
			lore_links: Array.isArray(parsed.lore_links) ? parsed.lore_links : [],
			summary: parsed.summary || null
		};
	} catch (error) {
		console.error('Error in analyzeVideoWithGemini:', error);
		throw error;
	}
}

function getMockConcertAnalysis(): GeminiAnalysisResult {
	return {
		artist: 'Coldplay',
		performer_details: {
			name: 'Coldplay (Chris Martin)',
			confidence: 0.98,
			genre: 'Alternative / Stadium Rock',
			role: 'Lead Vocals & Piano',
			visualCues: ['LED wristband synchronization', 'Upright painted piano', 'Confetti cannons']
		},
		venue: 'Estádio Cidade de Coimbra, Music of the Spheres World Tour',
		lyrics_synced: [
			{ timestamp: '0:03', text: 'When you try your best, but you don\'t succeed...', speaker: 'Chris Martin' },
			{ timestamp: '0:14', text: 'When you get what you want, but not what you need...', speaker: 'Chris Martin' },
			{ timestamp: '0:25', text: 'Lights will guide you home, and ignite your bones!', speaker: 'Chris Martin & Crowd' },
			{ timestamp: '0:38', text: 'And I will try to fix you...', speaker: 'Chris Martin' }
		],
		transcript: 'When you try your best, but you don\'t succeed... When you get what you want, but not what you need... Lights will guide you home, and ignite your bones! And I will try to fix you...',
		visual_tags: [
			'LED Wristbands',
			'Laser Canopy',
			'Stadium Singalong',
			'Grand Piano',
			'Confetti Storm',
			'Pyrotechnics'
		],
		lore_links: [
			{
				title: 'Fix You (Song) - Wikipedia',
				url: 'https://en.wikipedia.org/wiki/Fix_You',
				description: 'Written by all four band members for Gwyneth Paltrow following the passing of her father Bruce Paltrow.',
				category: 'wikipedia'
			},
			{
				title: 'Music of the Spheres World Tour Lore',
				url: 'https://en.wikipedia.org/wiki/Music_of_the_Spheres_World_Tour',
				description: 'Known for kinetic energy dance floors and 100% compostable plant-based LED wristbands.',
				category: 'tour'
			}
		],
		summary: 'Soaring stadium rock performance with 60,000 synchronized LED wristbands lighting up during the climatic guitar explosion.'
	};
}
