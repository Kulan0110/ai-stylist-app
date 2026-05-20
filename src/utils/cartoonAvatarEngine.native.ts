/**
 * Cartoon Avatar Engine — Native implementation.
 * Uses HuggingFace Inference API (free with token) to generate Pixar-style avatar images.
 * Metro resolves this file on iOS/Android; web uses cartoonAvatarEngine.web.ts.
 */

const HF_TOKEN = process.env.EXPO_PUBLIC_HF_TOKEN ?? '';
const HF_URL   = 'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0';

function _blobToBase64DataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror  = () => reject(new Error('FileReader алдаа'));
    reader.readAsDataURL(blob);
  });
}

export const DEFAULT_PROMPT: string =
  'Full-body 3D character, Disney Pixar animation style. Cute teenage girl with long flowing brown hair, ' +
  'large expressive brown eyes with realistic reflections, gentle smile, soft smooth skin. ' +
  'Wearing an oversized red and black varsity bomber jacket with a white letter D on the sleeve, ' +
  'a plain white t-shirt underneath, slim-fit ripped blue jeans rolled at the ankles, and black casual sneakers. ' +
  'Standing in a relaxed full-body pose holding a classic red and white Pokéball. ' +
  'Neutral light gray studio background, soft cinematic lighting, 3D render, claymation texture, ' +
  'ultra-detailed, 8k resolution, ray tracing, masterpiece.';

interface GenerateCartoonAvatarParams {
  prompt?: string;
  onStep?: (msg: string) => void;
}

interface CartoonAvatarResult {
  url: string;
  revisedPrompt: string;
}

export async function generateCartoonAvatar({
  prompt = DEFAULT_PROMPT,
  onStep,
}: GenerateCartoonAvatarParams = {}): Promise<CartoonAvatarResult> {
  // ── Try HuggingFace SDXL (requires token) ──────────────────────────────────
  if (HF_TOKEN) {
    try {
      onStep?.('HuggingFace холболт хийж байна...');

      const res = await fetch(HF_URL, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${HF_TOKEN}`,
        },
        body: JSON.stringify({ inputs: prompt.slice(0, 500) }),
      });

      onStep?.('Зургийг үүсгэж байна...');

      if (res.status === 503) {
        const data = await res.json().catch(() => ({}));
        const sec  = Math.ceil(data?.estimated_time ?? 30);
        throw new Error(`Model дулааццаж байна — ${sec}с`);
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `HF error ${res.status}`);
      }

      onStep?.('Зураг боловсруулж байна...');
      const blob = await res.blob();
      const url  = await _blobToBase64DataUrl(blob);
      onStep?.('Зураг бэлэн болов!');
      return { url, revisedPrompt: prompt };

    } catch (err: any) {
      console.warn('[cartoonAvatarEngine] HF failed, falling back to Pollinations:', err.message);
      onStep?.('Pollinations руу шилжиж байна...');
    }
  }

  // ── Fallback 1: Pollinations.ai — pre-fetch ──────────────────────────────
  onStep?.('Pollinations.ai ашиглан зург үүсгэж байна...');
  const short   = prompt.slice(0, 200);
  const pollUrl =
    'https://image.pollinations.ai/prompt/' +
    encodeURIComponent(short) +
    '?width=512&height=768&model=turbo&nologo=true&seed=' +
    Date.now();

  try {
    const ctrl2  = new AbortController();
    const timer2 = setTimeout(() => ctrl2.abort(), 60_000);
    try {
      onStep?.('Зургийг татаж байна...');
      const pollRes = await fetch(pollUrl, { signal: ctrl2.signal });
      if (!pollRes.ok) throw new Error(`Pollinations HTTP ${pollRes.status}`);
      const blob = await pollRes.blob();
      onStep?.('Зураг боловсруулж байна...');
      const url = await _blobToBase64DataUrl(blob);
      onStep?.('Зураг бэлэн болов!');
      return { url, revisedPrompt: prompt };
    } finally {
      clearTimeout(timer2);
    }
  } catch (pollErr: any) {
    console.warn('[cartoonAvatarEngine] Pollinations failed:', pollErr.message);
    onStep?.('DiceBear руу шилжиж байна...');
  }

  // ── Fallback 2: DiceBear — Cloudflare CDN, no auth, always works ──────────
  onStep?.('DiceBear аватар үүсгэж байна...');
  const diceBearUrl =
    'https://api.dicebear.com/9.x/adventurer/png?seed=' +
    Date.now() +
    '&size=512&backgroundColor=0a0a1a';
  onStep?.('Зураг бэлэн болов!');
  return { url: diceBearUrl, revisedPrompt: prompt };
}

// Kept for Metro bundle shape parity with cartoonAvatarEngine.web.ts.
export async function buildCartoonScene(): Promise<null> {
  return null;
}
