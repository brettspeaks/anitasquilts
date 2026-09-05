import { GoogleGenerativeAI } from '@google/generative-ai';
import type { GeminiAnalysisResult } from '$lib/types';

const geminiApiKey = process.env.GEMINI_API_KEY || '';

/**
 * Analyzes video content with Gemini 1.5 Flash to extract concert intelligence
 */
export async function analyzeVideoWithGemini(
	videoBufferOrUrl: Buffer | string,
	mimeType: string = 'video/mp4'
): Promise<GeminiAnalysisResult> {
	if (!geminiApiKey) {
		console.warn('GEMINI_API_KEY not set. Returning mock concert analysis.');
		return {
			artist: 'The Lumineers',
			venue: 'Red Rocks Amphitheatre, Outdoor Arena',
			transcript: 'Ho Hey! I belong with you, you belong with me, you\'re my sweetheart...',
			visual_tags: ['Stage Lighting', 'Acoustic Guitar', 'Crowd Singalong', 'Night Atmosphere'],
			summary: 'High-energy acoustic rock performance with vibrant stage lighting and full crowd participation.'
		};
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
You are an expert concert, music, and live performance video intelligence analyzer.
Analyze this video clip and extract the following structured information in valid JSON:

{
  "artist": "Artist or Band name if identifiable from audio/visuals, or null if unknown",
  "venue": "Venue and environment context (e.g. 'Outdoor Stadium', 'Dim Indoor Bar', 'Underground Club', 'Festival Stage', 'Living Room Session')",
  "transcript": "Verbatim or accurate transcription of sung lyrics and spoken words in the video, or null if no speech/lyrics",
  "visual_tags": ["Array of concise 1-3 word visual tags describing lighting, instruments, performance style, shots, e.g. 'Stage Lighting', 'Pyrotechnics', 'Drum Solo', 'Crowd Shot', 'Mosh Pit', 'Acoustic Performance'"],
  "summary": "1-2 sentence high-level summary of the performance clip"
}

Respond ONLY with valid JSON conforming to this structure.
`;

	try {
		let contents: any[];

		if (typeof videoBufferOrUrl === 'string') {
			// Download video stream or pass URL
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
		
		// Clean JSON markdown wrapping if present
		const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
		const parsed = JSON.parse(cleanedText);

		return {
			artist: parsed.artist || null,
			venue: parsed.venue || null,
			transcript: parsed.transcript || null,
			visual_tags: Array.isArray(parsed.visual_tags) ? parsed.visual_tags : [],
			summary: parsed.summary || null
		};
	} catch (error) {
		console.error('Error analyzing video with Gemini 1.5 Flash:', error);
		throw error;
	}
}
