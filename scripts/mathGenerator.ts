// script/mathGenerator.ts

export type Question = {
  equation: string;
  options: string[];
  correctAnswer: string;
  hint: string;
};

// Helper to shuffle an array (uses spread [...] to avoid mutating the original array)
const shuffle = (array: string[]) => [...array].sort(() => Math.random() - 0.5);

// Helper to generate distinct wrong answers (distractors)
const generateOptions = (answer: string, numChoices: number, isNumeric: boolean = true): string[] => {
  const options = [answer];

  while (options.length < numChoices) {
    let distractor;

    if (isNumeric) {
      const numAnswer = parseInt(answer, 10);
      let offset = Math.floor(Math.random() * 11) - 5;
      if (offset === 0) offset = 2;
      distractor = (numAnswer + offset).toString();
    } else {
      // For algebraic terms like "5x", randomize the coefficient
      const match = answer.match(/(-?\d+)(.*)/);
      if (match) {
        const num = parseInt(match[1], 10);
        const suffix = match[2];
        let offset = Math.floor(Math.random() * 4) + 1;
        distractor = `${num + (Math.random() > 0.5 ? offset : -offset)}${suffix}`;
      } else {
        distractor = answer + "1"; // Fallback
      }
    }

    if (!options.includes(distractor)) {
      options.push(distractor);
    }
  }

  return shuffle(options);
};

// Randomly picks one of the four operations
type Operation = '+' | '-' | '*' | '/';
const randomOp = (): Operation => {
  const ops: Operation[] = ['+', '-', '*', '/'];
  return ops[Math.floor(Math.random() * ops.length)];
};

// Formats the operation symbol for display
const opSymbol = (op: Operation): string => {
  switch (op) {
    case '+': return '+';
    case '-': return '−';
    case '*': return '×';
    case '/': return '÷';
  }
};

export const generateQuestion = (level: number): Question => {
  // L1-L3 have 4 choices, L4-L7 have 6 choices
  const numChoices = level <= 3 ? 4 : 6;
  let currentLevel = level;

  // Level 7: Adaptive Random (Mix of Levels 1-6)
  if (currentLevel >= 7) {
    currentLevel = Math.floor(Math.random() * 6) + 1;
  }

  let equation = '';
  let answer = '';
  let isNumeric = true;
  let hint = '';

  switch (currentLevel) {
    case 1: {
      // Level 1: 1-Step Equations — randomized operation
      // Form: x OP a = b  →  solve for x
      const op = randomOp();
      const a = Math.floor(Math.random() * 10) + 1;

      if (op === '+') {
        // x + a = b
        const x = Math.floor(Math.random() * 15) + 5;
        const b = x + a;
        equation = `x ${opSymbol(op)} ${a} = ${b}`;
        answer = x.toString();
        hint = `Subtract ${a} from both sides`;
      } else if (op === '-') {
        // x − a = b  (ensure x > a so answer stays positive)
        const x = Math.floor(Math.random() * 15) + a + 1;
        const b = x - a;
        equation = `x ${opSymbol(op)} ${a} = ${b}`;
        answer = x.toString();
        hint = `Add ${a} to both sides`;
      } else if (op === '*') {
        // x × a = b
        const x = Math.floor(Math.random() * 10) + 2;
        const b = x * a;
        equation = `x ${opSymbol(op)} ${a} = ${b}`;
        answer = x.toString();
        hint = `Divide both sides by ${a}`;
      } else {
        // x ÷ a = b  (build from known quotient to avoid fractions)
        const x = (Math.floor(Math.random() * 10) + 2) * a;
        const b = x / a;
        equation = `x ${opSymbol(op)} ${a} = ${b}`;
        answer = x.toString();
        hint = `Multiply both sides by ${a}`;
      }
      break;
    }

    case 2: {
      // Level 2: 2-Step Equations — randomized secondary operation
      // Form: ax OP b = c  →  solve for x
      const op = randomOp();
      const x = Math.floor(Math.random() * 9) + 2;
      const a = Math.floor(Math.random() * 5) + 2;
      const b = Math.floor(Math.random() * 10) + 1;

      if (op === '+') {
        const c = a * x + b;
        equation = `${a}x ${opSymbol(op)} ${b} = ${c}`;
        hint = `Subtract ${b}, then divide by ${a}`;
      } else if (op === '-') {
        const c = a * x - b;
        equation = `${a}x ${opSymbol(op)} ${b} = ${c}`;
        hint = `Add ${b}, then divide by ${a}`;
      } else if (op === '*') {
        // (ax) × b = c
        const c = a * x * b;
        equation = `${a}x ${opSymbol(op)} ${b} = ${c}`;
        hint = `Divide both sides by ${a * b}`;
      } else {
        // (ax) ÷ b = c  — pick x so ax is divisible by b
        const xAdj = (Math.floor(Math.random() * 5) + 1) * b;
        const c = (a * xAdj) / b;
        equation = `${a}x ${opSymbol(op)} ${b} = ${c}`;
        answer = xAdj.toString();
        hint = `Multiply both sides by ${b}, then divide by ${a}`;
        break; // answer already set
      }

      answer = x.toString();
      break;
    }

    case 3: {
      // Level 3: Systems of Equations — randomized pair operation
      // Classic sum/difference stays, but we also offer product/quotient pairs
      const op = randomOp();
      const x = Math.floor(Math.random() * 10) + 5;
      const y = Math.floor(Math.random() * 4) + 1;

      if (op === '+' || op === '-') {
        // x+y=sum, x-y=diff  →  find x
        const sum = x + y;
        const diff = x - y;
        equation = `x+y=${sum}, x−y=${diff}. x=?`;
        hint = `Add both equations, then divide by 2`;
      } else if (op === '*') {
        // x×y=product, x+y=sum  →  find x
        const product = x * y;
        const sum = x + y;
        equation = `x×y=${product}, x+y=${sum}. x=?`;
        hint = `Find two numbers with that sum and product`;
      } else {
        // x÷y=quotient (integer), x−y=diff  →  find x
        const yAdj = Math.floor(Math.random() * 3) + 2;
        const xAdj = yAdj * (Math.floor(Math.random() * 4) + 2); // ensure divisible
        const quotient = xAdj / yAdj;
        const diff = xAdj - yAdj;
        equation = `x÷y=${quotient}, x−y=${diff}. x=?`;
        answer = xAdj.toString();
        hint = `Express x = quotient × y, then substitute into x − y`;
        break;
      }

      answer = x.toString();
      break;
    }

    case 4: {
      // Level 4: Combining Like Terms — randomized operation
      const op = randomOp();
      const a = Math.floor(Math.random() * 8) + 2;
      const b = Math.floor(Math.random() * 8) + 2;
      isNumeric = false;

      if (op === '+') {
        equation = `Simplify: ${a}x + ${b}x`;
        answer = `${a + b}x`;
        hint = `Add the coefficients`;
      } else if (op === '-') {
        // Ensure a >= b so coefficient stays non-negative
        const [big, small] = a >= b ? [a, b] : [b, a];
        equation = `Simplify: ${big}x − ${small}x`;
        answer = `${big - small}x`;
        hint = `Subtract the coefficients`;
      } else if (op === '*') {
        equation = `Simplify: ${a}x × ${b}`;
        answer = `${a * b}x`;
        hint = `Multiply the coefficient by ${b}`;
      } else {
        // Pick a & b so a*b÷b = a (clean division)
        equation = `Simplify: ${a * b}x ÷ ${b}`;
        answer = `${a}x`;
        hint = `Divide the coefficient by ${b}`;
      }
      break;
    }

    case 5: {
      // Level 5: Basic Exponents / Roots — randomized operation around squares
      const op = randomOp();
      const x = Math.floor(Math.random() * 9) + 2;

      if (op === '+' || op === '-') {
        // x² OP k = result  →  find x
        const k = Math.floor(Math.random() * 10) + 1;
        if (op === '+') {
          equation = `If x > 0, x² + ${k} = ${x * x + k}`;
          hint = `Subtract ${k}, then take the square root`;
        } else {
          equation = `If x > 0, x² − ${k} = ${x * x - k}`;
          hint = `Add ${k}, then take the square root`;
        }
        answer = x.toString();
      } else if (op === '*') {
        // k × x² = result  →  find x
        const k = Math.floor(Math.random() * 4) + 2;
        equation = `If x > 0, ${k}x² = ${k * x * x}`;
        answer = x.toString();
        hint = `Divide by ${k}, then take the square root`;
      } else {
        // x² ÷ k = result  →  find x (choose k that divides x²)
        const k = Math.floor(Math.random() * 3) + 2;
        const xAdj = k * (Math.floor(Math.random() * 4) + 2);
        equation = `If x > 0, x² ÷ ${k} = ${(xAdj * xAdj) / k}`;
        answer = xAdj.toString();
        hint = `Multiply by ${k}, then take the square root`;
      }
      break;
    }

    case 6: {
      // Level 6: Perfect Square Factoring — randomized operation on root finding
      const op = randomOp();
      const a = Math.floor(Math.random() * 5) + 2;

      if (op === '+' || op === '-') {
        // Standard: x² ± 2ax + a² = 0  →  root = ∓a
        const b = 2 * a;
        const c = a * a;
        if (op === '+') {
          equation = `Root of: x² + ${b}x + ${c} = 0`;
          answer = (-a).toString();
          hint = `Factor as (x + ${a})², set equal to 0`;
        } else {
          // (x − a)² = 0  →  root = +a
          equation = `Root of: x² − ${b}x + ${c} = 0`;
          answer = a.toString();
          hint = `Factor as (x − ${a})², set equal to 0`;
        }
      } else if (op === '*') {
        // k(x + a)² = 0  →  root still = -a (k ≠ 0)
        const k = Math.floor(Math.random() * 4) + 2;
        const b = 2 * a;
        const c = a * a;
        equation = `Root of: ${k}(x² + ${b}x + ${c}) = 0`;
        answer = (-a).toString();
        hint = `Divide by ${k}, factor the perfect square`;
      } else {
        // (x + a)² / k = 0  →  root still = -a
        const k = Math.floor(Math.random() * 4) + 2;
        const b = 2 * a;
        const c = a * a;
        equation = `Root of: (x² + ${b}x + ${c}) ÷ ${k} = 0`;
        answer = (-a).toString();
        hint = `Multiply by ${k}, factor the perfect square`;
      }
      break;
    }

    default: {
      equation = `2x = 4`;
      answer = '2';
      hint = 'Divide both sides by 2';
    }
  }

  return {
    equation,
    options: generateOptions(answer, numChoices, isNumeric),
    correctAnswer: answer,
    hint,
  };
};