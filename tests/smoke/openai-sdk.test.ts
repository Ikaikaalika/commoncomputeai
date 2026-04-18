// Smoke test 1: OpenAI SDK drop-in compatibility
// Requires a real Mac running the provider daemon against staging.
// Run: pnpm smoke

import { openai, assert, assertShape } from './helpers';
import * as fs from 'fs';
import * as path from 'path';

export async function testOpenAISDKDropIn(): Promise<void> {
  console.log('  [1a] Audio transcription (1-min mp3)…');
  const audioPath = path.resolve(__dirname, '../fixtures/sample-1min.mp3');
  if (!fs.existsSync(audioPath)) {
    console.warn('      SKIP: fixtures/sample-1min.mp3 not found');
  } else {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath) as any,
      model: 'whisper-large-v3',
    });
    assertShape(transcription, ['text'], 'transcription');
    assert(typeof transcription.text === 'string' && transcription.text.length > 0, 'transcript non-empty');
    console.log('      ✓ transcript length:', transcription.text.length);
  }

  console.log('  [1b] Embeddings (100 texts)…');
  const texts = Array.from({ length: 100 }, (_, i) => `Text sample ${i + 1}: common compute test`);
  const embedResult = await openai.embeddings.create({
    input: texts,
    model: 'bge-small',
  });
  assertShape(embedResult, ['data'], 'embeddings');
  assert(embedResult.data.length === 100, '100 embeddings returned');
  assert(Array.isArray(embedResult.data[0].embedding), 'embedding is array');
  assert(embedResult.data[0].embedding.length > 0, 'embedding non-empty');
  console.log('      ✓', embedResult.data.length, 'embeddings, dim:', embedResult.data[0].embedding.length);

  console.log('  [1c] Chat completions (streaming)…');
  const stream = openai.beta.chat.completions.stream({
    model: 'llama-3.1-8b',
    messages: [{ role: 'user', content: 'Say hello in one sentence.' }],
  });
  let tokens = 0;
  for await (const chunk of stream) {
    if (chunk.choices[0]?.delta?.content) tokens++;
  }
  const completion = await stream.finalChatCompletion();
  assert(tokens > 0, 'received streaming tokens');
  assert(completion.choices[0]?.message?.content?.length > 0, 'final completion non-empty');
  console.log('      ✓ streamed', tokens, 'chunks');

  console.log('  [1d] Image generation…');
  const image = await openai.images.generate({
    prompt: 'A mac studio on a desk, minimalist',
    model: 'sdxl-base',
  });
  assertShape(image, ['data'], 'image response');
  assert(image.data.length > 0, 'at least one image returned');
  console.log('      ✓ image URL:', image.data[0].url);
}
