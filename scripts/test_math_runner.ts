import { generateQuestion } from './mathGenerator';

console.log('=== RANDOM OPERATOR & PROGRESSIVE COMPARISON ===\n');

const levelLimits = [10, 20, 20, 30, 30, 50, 100];

for (let lvl = 1; lvl <= 7; lvl++) {
  const maxQs = levelLimits[lvl - 1];
  console.log(`--- LEVEL ${lvl} (Total Qs: ${maxQs}) ---`);

  // First question (questionIndex = 0, progress = 0)
  const qFirst = generateQuestion(lvl, 0, maxQs);
  console.log(`  1st Question (Q1):`);
  console.log(`    Equation:       ${qFirst.equation}`);
  console.log(`    Correct Answer: ${qFirst.correctAnswer}`);
  console.log(`    Options:        [${qFirst.options.join(', ')}]`);
  console.log(`    Hint:           ${qFirst.hint}`);

  // Last question (questionIndex = maxQs - 1, progress = 1)
  const qLast = generateQuestion(lvl, maxQs - 1, maxQs);
  console.log(`  Last Question (Q${maxQs}):`);
  console.log(`    Equation:       ${qLast.equation}`);
  console.log(`    Correct Answer: ${qLast.correctAnswer}`);
  console.log(`    Options:        [${qLast.options.join(', ')}]`);
  console.log(`    Hint:           ${qLast.hint}\n`);
}
