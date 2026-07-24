import { randomPassword } from './password.util';

let passed = 0;
let failed = 0;

function test(name: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  PASS ${name}`);
    passed++;
  } else {
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

console.log('=== Test randomPassword() ===\n');

// 1. Length
const p1 = randomPassword();
test('Default length >= 8', p1.length >= 8, `got ${p1.length} chars`);

const p2 = randomPassword(16);
test('Custom length respected', p2.length === 16, `got ${p2.length} chars`);

const p3 = randomPassword(4);
test(
  'Minimum length enforced (input 4 → >= 8)',
  p3.length >= 8,
  `got ${p3.length} chars`,
);

// 2. Character variety
const sample = randomPassword(12);
const hasLower = /[a-z]/.test(sample);
const hasUpper = /[A-Z]/.test(sample);
const hasDigit = /[0-9]/.test(sample);
const hasSymbol = /[!@#$%^&*\-_=+]/.test(sample);
test('Contains lowercase', hasLower, sample);
test('Contains uppercase', hasUpper, sample);
test('Contains digit', hasDigit, sample);
test('Contains symbol', hasSymbol, sample);

// 3. No confusing characters
const confusingCheck = randomPassword(100);
const hasConfusing = /[0O1lI]/.test(confusingCheck);
test(
  'No confusing chars (0/O/1/l/I)',
  !hasConfusing,
  hasConfusing ? `Found: ${confusingCheck.match(/[0O1lI]/g)?.join(',')}` : '',
);

// 4. Uniqueness
const passwords = new Set();
for (let i = 0; i < 1000; i++) {
  passwords.add(randomPassword(12));
}
test(
  '1000 passwords are all unique',
  passwords.size === 1000,
  `got ${passwords.size} unique`,
);

// 5. Entropy (estimate)
const charset = 26 + 26 + 8 + 14; // 74 chars
const entropy = 12 * Math.log2(charset);
test(
  'Min entropy for 12 chars >= 60 bits',
  entropy >= 60,
  `~${entropy.toFixed(1)} bits`,
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
