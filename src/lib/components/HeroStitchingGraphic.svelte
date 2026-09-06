<script lang="ts">
	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();
</script>

<div class="relative w-full max-w-6xl mx-auto overflow-hidden rounded-2xl border border-zinc-800/80 bg-[#07080c] shadow-2xl {className}">
	<!-- Cloudflare R2 Style Corner Squares -->
	<div class="pointer-events-none absolute -top-1.5 -left-1.5 w-3 h-3 border border-zinc-600 bg-[#07080c] z-30 rounded-[2px]" aria-hidden="true"></div>
	<div class="pointer-events-none absolute -top-1.5 -right-1.5 w-3 h-3 border border-zinc-600 bg-[#07080c] z-30 rounded-[2px]" aria-hidden="true"></div>
	<div class="pointer-events-none absolute -bottom-1.5 -left-1.5 w-3 h-3 border border-zinc-600 bg-[#07080c] z-30 rounded-[2px]" aria-hidden="true"></div>
	<div class="pointer-events-none absolute -bottom-1.5 -right-1.5 w-3 h-3 border border-zinc-600 bg-[#07080c] z-30 rounded-[2px]" aria-hidden="true"></div>

	<!-- Background Glow & Radial Lighting -->
	<div class="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30 z-0">
		<div class="w-[500px] h-[300px] bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-amber-500/20 blur-[100px] rounded-full"></div>
	</div>

	<!-- Main SVG Stitching Canvas -->
	<div class="relative w-full aspect-[16/9] sm:aspect-[2.4/1] min-h-[360px] sm:min-h-[420px] flex items-center justify-center">
		<svg
			class="absolute inset-0 w-full h-full z-10"
			viewBox="0 0 1200 440"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			preserveAspectRatio="xMidYMid meet"
		>
			<defs>
				<!-- Cloudflare Dot Grid Pattern -->
				<pattern id="cf-dot-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
					<circle cx="10" cy="10" r="1" fill="#3f3f46" opacity="0.4" />
				</pattern>

				<!-- Mask to softly fade dot grid at edges -->
				<mask id="grid-edge-fade">
					<rect width="1200" height="440" fill="white" />
					<radialGradient id="fade-grad" cx="50%" cy="50%" r="50%">
						<stop offset="60%" stop-color="white" stop-opacity="1" />
						<stop offset="100%" stop-color="white" stop-opacity="0" />
					</radialGradient>
				</mask>

				<!-- Gradients for Stitch Lines -->
				<linearGradient id="stitch-in-1" x1="160" y1="100" x2="520" y2="200" gradientUnits="userSpaceOnUse">
					<stop offset="0%" stop-color="#34d399" stop-opacity="0.9" />
					<stop offset="60%" stop-color="#10b981" stop-opacity="0.8" />
					<stop offset="100%" stop-color="#059669" stop-opacity="0.9" />
				</linearGradient>

				<linearGradient id="stitch-in-2" x1="160" y1="220" x2="520" y2="220" gradientUnits="userSpaceOnUse">
					<stop offset="0%" stop-color="#38bdf8" stop-opacity="0.9" />
					<stop offset="60%" stop-color="#2dd4bf" stop-opacity="0.8" />
					<stop offset="100%" stop-color="#10b981" stop-opacity="0.9" />
				</linearGradient>

				<linearGradient id="stitch-in-3" x1="160" y1="340" x2="520" y2="240" gradientUnits="userSpaceOnUse">
					<stop offset="0%" stop-color="#a78bfa" stop-opacity="0.9" />
					<stop offset="60%" stop-color="#818cf8" stop-opacity="0.8" />
					<stop offset="100%" stop-color="#10b981" stop-opacity="0.9" />
				</linearGradient>

				<linearGradient id="stitch-out-1" x1="680" y1="200" x2="1040" y2="120" gradientUnits="userSpaceOnUse">
					<stop offset="0%" stop-color="#10b981" stop-opacity="0.9" />
					<stop offset="50%" stop-color="#f59e0b" stop-opacity="0.85" />
					<stop offset="100%" stop-color="#fbbf24" stop-opacity="0.9" />
				</linearGradient>

				<linearGradient id="stitch-out-2" x1="680" y1="240" x2="1040" y2="320" gradientUnits="userSpaceOnUse">
					<stop offset="0%" stop-color="#10b981" stop-opacity="0.9" />
					<stop offset="50%" stop-color="#06b6d4" stop-opacity="0.85" />
					<stop offset="100%" stop-color="#38bdf8" stop-opacity="0.9" />
				</linearGradient>

				<!-- Glow Filter for Active Stitches -->
				<filter id="stitch-glow" x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur stdDeviation="2.5" result="blur" />
					<feMerge>
						<feMergeNode in="blur" />
						<feMergeNode in="SourceGraphic" />
					</feMerge>
				</filter>
			</defs>

			<!-- 1. Background Dot Grid -->
			<rect width="1200" height="440" fill="url(#cf-dot-grid)" mask="url(#grid-edge-fade)" />

			<!-- 2. Quilt Fabric Section Lines (Geometric Diamond Stitches) -->
			<g opacity="0.12" stroke="#71717a" stroke-width="1" stroke-dasharray="4 8">
				<line x1="100" y1="0" x2="400" y2="440" />
				<line x1="300" y1="0" x2="600" y2="440" />
				<line x1="500" y1="0" x2="800" y2="440" />
				<line x1="700" y1="0" x2="1000" y2="440" />
				<line x1="900" y1="0" x2="1200" y2="440" />
				
				<line x1="300" y1="440" x2="0" y2="0" />
				<line x1="500" y1="440" x2="200" y2="0" />
				<line x1="700" y1="440" x2="400" y2="0" />
				<line x1="900" y1="440" x2="600" y2="0" />
				<line x1="1100" y1="440" x2="800" y2="0" />
			</g>

			<!-- 3. Underlying Solid Guide Tracks -->
			<g stroke="#27272a" stroke-width="1.5" fill="none" opacity="0.6">
				<path id="guide-in-1" d="M 210,110 C 340,110 400,190 520,205" />
				<path id="guide-in-2" d="M 210,220 C 330,220 400,220 520,220" />
				<path id="guide-in-3" d="M 210,330 C 340,330 400,250 520,235" />
				<path id="guide-out-1" d="M 680,205 C 790,190 870,120 990,120" />
				<path id="guide-out-2" d="M 680,235 C 790,250 870,320 990,320" />
			</g>

			<!-- 4. Moving Dash Stitching Lines (Cloudflare R2 dashdraw animation) -->
			<g fill="none" stroke-width="2.5" stroke-linecap="round">
				<!-- Input 1: iOS Favorites -->
				<path
					class="running-stitch"
					d="M 210,110 C 340,110 400,190 520,205"
					stroke="url(#stitch-in-1)"
					stroke-dasharray="7 7"
				/>

				<!-- Input 2: Cloud Storage (Google Drive / Dropbox) -->
				<path
					class="running-stitch-fast"
					d="M 210,220 C 330,220 400,220 520,220"
					stroke="url(#stitch-in-2)"
					stroke-dasharray="6 6"
				/>

				<!-- Input 3: OneDrive / Direct Streams -->
				<path
					class="running-stitch"
					d="M 210,330 C 340,330 400,250 520,235"
					stroke="url(#stitch-in-3)"
					stroke-dasharray="7 7"
				/>

				<!-- Output 1: Cloudflare R2 Storage -->
				<path
					class="running-stitch-fast"
					d="M 680,205 C 790,190 870,120 990,120"
					stroke="url(#stitch-out-1)"
					stroke-dasharray="6 6"
				/>

				<!-- Output 2: Realtime Live Quilt Stream -->
				<path
					class="running-stitch"
					d="M 680,235 C 790,250 870,320 990,320"
					stroke="url(#stitch-out-2)"
					stroke-dasharray="7 7"
				/>
			</g>

			<!-- 5. Animated Thread Data Packets / Pulses traveling along stitches -->
			<g filter="url(#stitch-glow)">
				<!-- Packet 1 -->
				<circle r="4" fill="#6ee7b7">
					<animateMotion
						path="M 210,110 C 340,110 400,190 520,205"
						dur="2.4s"
						repeatCount="indefinite"
					/>
					<animate attributeName="opacity" values="0;1;1;0" dur="2.4s" repeatCount="indefinite" />
				</circle>

				<!-- Packet 2 -->
				<circle r="3.5" fill="#38bdf8">
					<animateMotion
						path="M 210,220 C 330,220 400,220 520,220"
						dur="1.8s"
						repeatCount="indefinite"
					/>
					<animate attributeName="opacity" values="0;1;1;0" dur="1.8s" repeatCount="indefinite" />
				</circle>

				<!-- Packet 3 -->
				<circle r="4" fill="#a78bfa">
					<animateMotion
						path="M 210,330 C 340,330 400,250 520,235"
						dur="2.6s"
						repeatCount="indefinite"
					/>
					<animate attributeName="opacity" values="0;1;1;0" dur="2.6s" repeatCount="indefinite" />
				</circle>

				<!-- Packet 4: To R2 -->
				<circle r="4" fill="#fbbf24">
					<animateMotion
						path="M 680,205 C 790,190 870,120 990,120"
						dur="2.1s"
						repeatCount="indefinite"
					/>
					<animate attributeName="opacity" values="0;1;1;0" dur="2.1s" repeatCount="indefinite" />
				</circle>

				<!-- Packet 5: To Quilt Stream -->
				<circle r="3.5" fill="#22d3ee">
					<animateMotion
						path="M 680,235 C 790,250 870,320 990,320"
						dur="2.3s"
						repeatCount="indefinite"
					/>
					<animate attributeName="opacity" values="0;1;1;0" dur="2.3s" repeatCount="indefinite" />
				</circle>
			</g>

			<!-- 6. Stitch Piercing Points / Quilt Needle Holes with Pulse Rings -->
			<g>
				<!-- Converge Entrance Hole -->
				<circle cx="520" cy="220" r="5" fill="#090a0f" stroke="#10b981" stroke-width="2" />
				<circle cx="520" cy="220" r="10" fill="none" stroke="#10b981" stroke-width="1" opacity="0.4" class="animate-ping" style="transform-origin: 520px 220px;" />

				<!-- Converge Exit Hole -->
				<circle cx="680" cy="220" r="5" fill="#090a0f" stroke="#f59e0b" stroke-width="2" />
				<circle cx="680" cy="220" r="10" fill="none" stroke="#f59e0b" stroke-width="1" opacity="0.4" class="animate-ping" style="transform-origin: 680px 220px; animation-delay: 0.5s;" />
			</g>

			<!-- 7. THE AU SEWING NEEDLE EMBLEM ACTIVELY STITCHING (Center Stage) -->
			<g class="au-stitching-assembly" transform="translate(600, 220)">
				<!-- Ambient Soft Backing Aura -->
				<circle cx="0" cy="0" r="58" fill="#090a0f" stroke="#27272a" stroke-width="1.5" />
				<circle cx="0" cy="0" r="52" fill="#0c0e17" stroke="#3f3f46" stroke-width="1" stroke-dasharray="3 3" />
				
				<!-- Subtle Quilt Seam cross within emblem -->
				<line x1="-52" y1="0" x2="52" y2="0" stroke="#27272a" stroke-width="1" stroke-dasharray="2 4" />
				<line x1="0" y1="-52" x2="0" y2="52" stroke="#27272a" stroke-width="1" stroke-dasharray="2 4" />

				<!-- Active Stitching Thread Loop originating from needle eye -->
				<path
					class="active-thread-loop"
					d="M 22,-24 C 36,-44 14,-46 0,-34 C -14,-22 4,-12 18,-20 C 26,-26 22,-36 10,-32"
					stroke="#34d399"
					stroke-width="2"
					stroke-linecap="round"
					fill="none"
					filter="url(#stitch-glow)"
				/>

				<!-- Sewing Needle (Silver & Chromium with piercing point) -->
				<g class="needle-motion">
					<!-- Needle Shadow -->
					<line x1="28" y1="-30" x2="-26" y2="34" stroke="#000" stroke-width="4" opacity="0.4" stroke-linecap="round" />
					
					<!-- Needle Body -->
					<line x1="26" y1="-28" x2="-28" y2="32" stroke="#f4f4f5" stroke-width="3" stroke-linecap="round" />
					<!-- Needle Point Shading -->
					<line x1="-20" y1="22" x2="-28" y2="32" stroke="#a1a1aa" stroke-width="2" stroke-linecap="round" />
					
					<!-- Needle Eye (Oval cutout) -->
					<ellipse cx="20" cy="-21" rx="1.5" ry="4.5" transform="rotate(-45 20 -21)" fill="#090a0f" stroke="#a1a1aa" stroke-width="1" />
					<!-- Thread passing through needle eye -->
					<circle cx="20" cy="-21" r="1.5" fill="#34d399" />
				</g>

				<!-- Classic "AU" Monogram Typography -->
				<text
					x="0"
					y="18"
					font-family="ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif"
					font-size="24"
					font-weight="bold"
					fill="#f4f4f5"
					text-anchor="middle"
					letter-spacing="2"
					style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));"
				>AU</text>

				<!-- Sub-label: ANITA'S UNDERGROUND -->
				<text
					x="0"
					y="34"
					font-family="ui-monospace, monospace"
					font-size="6.5"
					font-weight="700"
					fill="#10b981"
					text-anchor="middle"
					letter-spacing="1.5"
				>STITCH ENGINE</text>
			</g>
		</svg>

		<!-- 8. Interactive Node Overlays (Cloudflare R2 Product Architecture Style) -->
		<div class="pointer-events-none absolute inset-0 max-w-full h-full flex flex-col justify-between p-4 sm:p-6 select-none z-20">
			<!-- Top Row Nodes -->
			<div class="w-full flex items-start justify-between">
				<!-- Source Node 1: iOS Favorites -->
				<div class="pointer-events-auto group relative flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#0c0d14]/90 hover:bg-[#12131d] border border-zinc-800 hover:border-emerald-500/50 shadow-lg backdrop-blur-md transition-all duration-200">
					<!-- Corner Squares -->
					<div class="absolute -top-1 -left-1 w-2 h-2 border border-zinc-700 bg-zinc-900"></div>
					<div class="absolute -bottom-1 -right-1 w-2 h-2 border border-zinc-700 bg-zinc-900"></div>
					<div class="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-200 group-hover:text-emerald-400 group-hover:border-emerald-500/40 transition-colors">
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
							<path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-2 .6-2.64 1.35-.56.65-1.06 1.7-0.93 2.73 1.01.08 2.03-.49 2.64-1.23z" />
						</svg>
					</div>
					<div>
						<div class="flex items-center gap-1.5">
							<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
							<span class="text-[10px] font-mono uppercase tracking-wider text-emerald-400/90 font-semibold">PASSIVE SOURCE</span>
						</div>
						<span class="text-xs font-semibold text-zinc-100">iOS Favorites</span>
					</div>
				</div>

				<!-- Destination Node 1: Cloudflare R2 -->
				<div class="pointer-events-auto group relative flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#0c0d14]/90 hover:bg-[#12131d] border border-zinc-800 hover:border-amber-500/50 shadow-lg backdrop-blur-md transition-all duration-200">
					<!-- Corner Squares -->
					<div class="absolute -top-1 -right-1 w-2 h-2 border border-zinc-700 bg-zinc-900"></div>
					<div class="absolute -bottom-1 -left-1 w-2 h-2 border border-zinc-700 bg-zinc-900"></div>
					<div class="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-amber-400 group-hover:border-amber-500/40 transition-colors">
						<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
						</svg>
					</div>
					<div class="text-right sm:text-left">
						<div class="flex items-center justify-end sm:justify-start gap-1.5">
							<span class="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold">STORAGE</span>
							<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
						</div>
						<span class="text-xs font-semibold text-zinc-100">Cloudflare R2</span>
					</div>
				</div>
			</div>

			<!-- Middle Row: Gemini 1.5 Flash AI Pill -->
			<div class="w-full flex items-center justify-between px-2 sm:px-4">
				<!-- Source Node 2: Multi-Cloud Drives -->
				<div class="pointer-events-auto group relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#0c0d14]/90 hover:bg-[#12131d] border border-zinc-800 hover:border-sky-500/50 shadow-md backdrop-blur-md transition-all duration-200">
					<div class="flex -space-x-1">
						<span class="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-zinc-900" title="Google Drive"></span>
						<span class="w-2.5 h-2.5 rounded-full bg-sky-400 border border-zinc-900" title="Dropbox"></span>
						<span class="w-2.5 h-2.5 rounded-full bg-teal-400 border border-zinc-900" title="OneDrive"></span>
					</div>
					<span class="text-[11px] font-mono text-zinc-300">Cloud Ingest</span>
				</div>

				<!-- AI Inference Tag -->
				<div class="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/40 shadow-sm backdrop-blur-md">
					<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
					<span class="text-[11px] font-mono text-emerald-300 font-medium">GEMINI 1.5 FLASH • LIVE INFERENCE</span>
				</div>

				<!-- Quilt Live Stream Badge -->
				<div class="pointer-events-auto group relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#0c0d14]/90 hover:bg-[#12131d] border border-zinc-800 hover:border-cyan-500/50 shadow-md backdrop-blur-md transition-all duration-200">
					<span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
					<span class="text-[11px] font-mono text-zinc-300">Quilt Stream</span>
				</div>
			</div>

			<!-- Bottom Status Bar -->
			<div class="w-full flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-2 border-t border-zinc-800/60">
				<div class="flex items-center gap-2">
					<span class="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
					<span>ZERO-FRICTION PASSIVE STREAM</span>
				</div>
				<div class="hidden sm:flex items-center gap-4 text-zinc-400">
					<span>ZERO EGRESS FEES</span>
					<span>•</span>
					<span>REAL-TIME MULTI-ANGLE TAGGING</span>
				</div>
				<div class="text-zinc-300">
					<span>ACTIVE SYNC</span>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	/* Cloudflare R2 Style Moving Dash Stitch Animation */
	@keyframes dashdraw {
		from {
			stroke-dashoffset: 0;
		}
		to {
			stroke-dashoffset: -28;
		}
	}

	@keyframes dashdrawFast {
		from {
			stroke-dashoffset: 0;
		}
		to {
			stroke-dashoffset: -36;
		}
	}

	.running-stitch {
		animation: dashdraw 0.9s linear infinite;
	}

	.running-stitch-fast {
		animation: dashdrawFast 0.65s linear infinite;
	}

	/* Needle Stitching Cadence & Dip Motion */
	@keyframes needleStitch {
		0%, 100% {
			transform: translate(0, 0) rotate(0deg);
		}
		20% {
			transform: translate(2px, -3px) rotate(-3deg);
		}
		45% {
			transform: translate(-1px, 4px) rotate(4deg);
		}
		70% {
			transform: translate(3px, -1px) rotate(-1deg);
		}
		85% {
			transform: translate(-1px, 2px) rotate(2deg);
		}
	}

	.needle-motion {
		animation: needleStitch 1.8s ease-in-out infinite;
		transform-origin: 0px 0px;
	}

	/* Active Thread Loop Bobbing */
	@keyframes threadPulse {
		0%, 100% {
			stroke-dashoffset: 0;
			opacity: 0.85;
		}
		50% {
			stroke-dashoffset: 14;
			opacity: 1;
		}
	}

	.active-thread-loop {
		stroke-dasharray: 4 2;
		animation: threadPulse 2.4s ease-in-out infinite;
	}

	/* Emblem Assembly Ambient Glow Breathing */
	@keyframes emblemFloat {
		0%, 100% {
			transform: translate(600px, 220px) scale(1);
		}
		50% {
			transform: translate(600px, 218px) scale(1.015);
		}
	}

	.au-stitching-assembly {
		animation: emblemFloat 4s ease-in-out infinite;
	}
</style>
