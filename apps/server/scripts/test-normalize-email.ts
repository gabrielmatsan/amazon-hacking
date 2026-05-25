import { normalizeEmail } from "../src/shared/utils/normalize-email";

const cases = [
  // Gmail dot trick
  { input: "g.a.b.r.i.e.l@gmail.com", expected: "gabriel@gmail.com" },
  { input: "Gabriel@Gmail.com", expected: "gabriel@gmail.com" },
  // Gmail + trick
  { input: "gabriel+spam@gmail.com", expected: "gabriel@gmail.com" },
  { input: "g.a.b+test@gmail.com", expected: "gab@gmail.com" },
  // Googlemail alias
  { input: "user@googlemail.com", expected: "user@googlemail.com" },
  { input: "u.s.e.r+tag@googlemail.com", expected: "user@googlemail.com" },
  // Non-Gmail: dots are NOT removed, but + is stripped
  { input: "gabriel.matsan@hotmail.com", expected: "gabriel.matsan@hotmail.com" },
  { input: "gabriel+test@hotmail.com", expected: "gabriel@hotmail.com" },
  { input: "user@aluno.cesupa.br", expected: "user@aluno.cesupa.br" },
  { input: "user+123@aluno.cesupa.br", expected: "user@aluno.cesupa.br" },
  // Edge cases
  { input: "  User@Gmail.COM  ", expected: "user@gmail.com" },
  { input: "USER@OUTLOOK.COM", expected: "user@outlook.com" },
];

console.log("=== Teste de normalização de email ===\n");

let passed = 0;
let failed = 0;

for (const { input, expected } of cases) {
  const result = normalizeEmail(input);
  const ok = result === expected;

  if (ok) {
    passed++;
    console.log(`  ✓ ${input} → ${result}`);
  } else {
    failed++;
    console.log(`  ✗ ${input} → ${result} (expected: ${expected})`);
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
