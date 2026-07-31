// Quick test script — run with: npm run build && node dist/services/test-ai.js
// Delete this file when you're done testing!

import { detectContentType } from "./aiDetector.js";

console.log("\n🧪 Testing detectContentType():\n");

const testUrls = [
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "https://youtu.be/dQw4w9WgXcQ",
  "https://youtube.com/shorts/abc123",
  "https://x.com/elonmusk/status/123456",
  "https://twitter.com/someone/status/789",
  "https://arxiv.org/pdf/2301.00001.pdf",
  "https://example.com/report.pdf?download=true",
  "https://i.imgur.com/photo.png",
  "https://example.com/image.jpg",
  "https://open.spotify.com/episode/abc123",
  "https://medium.com/some-great-article",
  "https://dev.to/how-to-build-a-rest-api",
  "https://random-website.com",
];

for (const url of testUrls) {
  const type = await detectContentType(url);
  console.log(`  ${type.padEnd(8)} ← ${url}`);
}

console.log("\n✅ Done!\n");
