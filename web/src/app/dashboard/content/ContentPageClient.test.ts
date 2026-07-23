import { getMediaType } from './ContentPageClient';

let passed = 0;
let failed = 0;

function test(name: string, actual: unknown, expected: unknown) {
  const ok = actual === expected;
  if (ok) {
    console.log(`  PASS ${name}`);
    passed++;
  } else {
    console.log(`  FAIL ${name} — got '${actual}', expected '${expected}'`);
    failed++;
  }
}

console.log('=== Test getMediaType() ===\n');

test('image/png → image', getMediaType('image/png'), 'image');
test('image/jpeg → image', getMediaType('image/jpeg'), 'image');
test('image/webp → image', getMediaType('image/webp'), 'image');
test('image/gif → image', getMediaType('image/gif'), 'image');
test('image/svg+xml → image', getMediaType('image/svg+xml'), 'image');

test('video/mp4 → video', getMediaType('video/mp4'), 'video');
test('video/webm → video', getMediaType('video/webm'), 'video');
test('video/quicktime → video', getMediaType('video/quicktime'), 'video');

test('application/pdf → pdf', getMediaType('application/pdf'), 'pdf');

test('url → url', getMediaType('url'), 'url');

test('PowerPoint mime → slides',
  getMediaType('application/vnd.openxmlformats-officedocument.presentationml.presentation'),
  'slides');
test('Old PPT mime → slides',
  getMediaType('application/vnd.ms-powerpoint'),
  'slides');

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
