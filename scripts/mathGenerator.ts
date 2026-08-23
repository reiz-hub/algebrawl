// script/mathGenerator.ts

export type Question = {
  equation: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  sourceLevel: number;
};

// ─── Seeded RNG for Multiplayer ─────────────────────────────
// Mulberry32: a fast, deterministic 32-bit PRNG.
// Given the same seed, it always produces the same sequence of numbers.
// This is used in online multiplayer so both players get identical questions.

/**
 * Create a seeded random number generator using the Mulberry32 algorithm.
 * Returns a function that produces a new random number (0-1) each call.
 */
export function createSeededRng(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate a batch of deterministic questions for online multiplayer.
 * Both players call this with the same seed and get identical questions.
 *
 * @param seed - Shared random seed (stored in match_rooms.question_seed)
 * @param count - Number of questions to generate
 * @param topics - Optional array of level IDs (1-7) to generate questions from
 * @returns Array of Questions in deterministic order
 */
export function generateSeededQuestions(seed: number, count: number, topics?: number[]): Question[] {
  const rng = createSeededRng(seed);
  const questions: Question[] = [];
  const allowedTopics = topics && topics.length > 0 ? topics : [1, 2, 3, 4, 5, 6, 7];

  for (let i = 0; i < count; i++) {
    // Pick a topic from the allowed topics list using the seeded RNG
    const topicIdx = Math.floor(rng() * allowedTopics.length);
    const level = allowedTopics[topicIdx];
    // Use a question index to get balanced difficulty questions
    const questionIndex = Math.floor(rng() * 20) + 5;
    // Generate the question (this uses Math.random internally,
    // but we override it temporarily)
    const originalRandom = Math.random;
    Math.random = rng;
    try {
      questions.push(generateQuestion(level, questionIndex));
    } finally {
      Math.random = originalRandom;
    }
  }

  return questions;
}

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
      let candidate = numAnswer + offset;
      if (numAnswer > 0 && candidate <= 0) {
        candidate = numAnswer + Math.abs(offset) + 1;
      }
      distractor = candidate.toString();
    } else {
      // For algebraic terms like "5x", randomize the coefficient
      const match = answer.match(/^(-?\d+)(.*)/);
      if (match) {
        const num = parseInt(match[1], 10);
        const suffix = match[2];
        let offset = Math.floor(Math.random() * 4) + 1;
        distractor = `${num + (Math.random() > 0.5 ? offset : -offset)}${suffix}`;
      } else {
        // Fallback for factored forms like (x + 2)(x + 3) or a(x + b)
        const numbers = answer.match(/\d+/g);
        if (numbers && numbers.length > 0) {
          const target = numbers[Math.floor(Math.random() * numbers.length)];
          const num = parseInt(target, 10);
          const offset = Math.floor(Math.random() * 3) + 1;
          const newNum = num + (Math.random() > 0.5 ? offset : -offset) || 1;
          distractor = answer.replace(target, newNum.toString());
        } else {
          distractor = answer + "1"; // Fallback
        }
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

// Pick an operation randomly across all four operations (+, -, *, /)
const progressOp = (_progress: number): Operation => {
  return randomOp();
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

// Scale a value range based on progress (0→1)
// Returns a random int in [min + progress*(maxBoost), min + range + progress*(maxBoost)]
const scaledRand = (min: number, range: number, progress: number, maxBoost: number): number => {
  const boost = Math.floor(progress * maxBoost);
  return Math.floor(Math.random() * range) + min + boost;
};

/**
 * Generate a question with progressive difficulty within each level.
 * @param level - The current game level (1-7)
 * @param questionIndex - The index of the current question within the level (0-based)
 * @param totalQuestions - Total number of questions in the level. If omitted, uses phase definitions.
 * @param difficulty - Optional difficulty for Level 7 ('easy' | 'medium' | 'hard')
 */
export const generateQuestion = (level: number, questionIndex: number = 0, totalQuestions?: number, difficulty?: 'easy' | 'medium' | 'hard'): Question => {
  const levelLimits = [10, 20, 20, 30, 30, 50, 100];
  const maxQs = totalQuestions ?? levelLimits[level - 1] ?? 10;
  // Progress within this level: 0 = first question (easiest), 1 = last question (hardest)
  const progress = maxQs > 1 ? questionIndex / (maxQs - 1) : 0;

  const numChoices = level <= 3 ? 4 : 6;
  let currentLevel = level;

  // Level 7: Adaptive Random (Mix of Levels 1-6) — biased by difficulty and progress
  if (currentLevel >= 7) {
    const diff = difficulty || 'medium';
    let minLevel: number;
    let maxLevel: number;

    if (diff === 'easy') {
      // Easy: mostly levels 1-3, occasionally 4 as progress increases
      minLevel = 1;
      maxLevel = Math.min(3 + Math.floor(progress * 1.5), 4); // caps at 4
    } else if (diff === 'hard') {
      // Hard: starts at level 2, quickly ramps to 4-6
      minLevel = Math.max(2, Math.floor(progress * 3) + 2); // 2→5
      maxLevel = 6;
    } else {
      // Medium (default): current behavior — progresses from 1→5, max 6
      minLevel = Math.max(1, Math.floor(progress * 4) + 1);
      maxLevel = 6;
    }

    currentLevel = Math.floor(Math.random() * (maxLevel - minLevel + 1)) + minLevel;
  }

  let equation = '';
  let answer = '';
  let isNumeric = true;
  let hint = '';

  switch (currentLevel) {
    case 1: {
      // Level 1: Variables and Expressions
      // PROGRESSIVE: starts easy, gets harder
      isNumeric = true;
      const op = progressOp(progress);
      const x = scaledRand(2, 5, progress, 10);
      const a = scaledRand(1, 5, progress, 10);

      if (op === '+') {
        const coeff = scaledRand(2, 4, progress, 5);
        equation = `Evaluate ${coeff}x + ${a} for x = ${x}`;
        answer = (coeff * x + a).toString();
        hint = `Substitute ${x} for x and evaluate`;
      } else if (op === '-') {
        const coeff = scaledRand(2, 4, progress, 5);
        // ensure positive answer
        const adjA = Math.min(a, coeff * x - 1);
        const finalA = adjA > 0 ? adjA : 1;
        equation = `Evaluate ${coeff}x − ${finalA} for x = ${x}`;
        answer = (coeff * x - finalA).toString();
        hint = `Substitute ${x} for x and evaluate`;
      } else if (op === '*') {
        const b = scaledRand(2, 3, progress, 5);
        equation = `Evaluate ${a}x(${b}) for x = ${x}`;
        answer = (a * x * b).toString();
        hint = `Substitute ${x} for x and multiply`;
      } else {
        const divisor = scaledRand(2, 4, progress, 5);
        const xAdj = divisor * scaledRand(2, 3, progress, 4);
        equation = `Evaluate ${a}x ÷ ${divisor} for x = ${xAdj}`;
        answer = ((a * xAdj) / divisor).toString();
        hint = `Substitute ${xAdj} for x, multiply by ${a}, then divide by ${divisor}`;
      }
      break;
    }

    case 2: {
      // Level 2: Equations and Inequalities
      const op = progressOp(progress);
      const x = scaledRand(2, 5, progress, 8);
      const a = scaledRand(2, 4, progress, 5);
      const b = scaledRand(1, 5, progress, 10);

      // Mix of equations and simple inequalities
      if (Math.random() > 0.3) {
        // Equation
        if (op === '+') {
          const c = a * x + b;
          equation = `Solve for x: ${a}x + ${b} = ${c}`;
          hint = `Subtract ${b}, then divide by ${a}`;
        } else if (op === '-') {
          const c = a * x - b;
          equation = `Solve for x: ${a}x − ${b} = ${c}`;
          hint = `Add ${b}, then divide by ${a}`;
        } else if (op === '*') {
          const c = a * x * b;
          equation = `Solve for x: ${a}x × ${b} = ${c}`;
          hint = `Divide both sides by ${a * b}`;
        } else {
          const bAdj = scaledRand(2, 3, progress, 3);
          const xAdj = (Math.floor(Math.random() * (3 + Math.floor(progress * 3))) + 1) * bAdj;
          const c = (a * xAdj) / bAdj;
          equation = `Solve for x: ${a}x ÷ ${bAdj} = ${c}`;
          answer = xAdj.toString();
          hint = `Multiply both sides by ${bAdj}, then divide by ${a}`;
          break;
        }
        answer = x.toString();
      } else {
        // Inequality (simple, asking for the boundary value)
        const c = a * x + b;
        equation = `Solve for x: ${a}x + ${b} > ${c}`;
        answer = `x>${x}`;
        isNumeric = false;
        hint = `Solve exactly like an equation: subtract ${b}, divide by ${a}`;
      }
      break;
    }

    case 3: {
      // Level 3: Polynomials
      // PROGRESSIVE: Combining like terms -> multiplying binomials
      isNumeric = false;
      if (progress < 0.5) {
        // Add / Subtract Polynomials
        const a1 = scaledRand(2, 5, progress, 5);
        const a2 = scaledRand(2, 5, progress, 5);
        const b1 = scaledRand(1, 5, progress, 5);
        const b2 = scaledRand(1, 5, progress, 5);
        const choice = Math.random() > 0.5 ? '+' : '-';
        if (choice === '+') {
          equation = `Simplify: (${a1}x + ${b1}) + (${a2}x + ${b2})`;
          answer = `${a1 + a2}x+${b1 + b2}`;
          hint = `Combine the x terms and the constant terms`;
        } else {
          // ensure positive x coeff
          const bigA = Math.max(a1, a2) + 2;
          const smallA = Math.min(a1, a2);
          const bigB = Math.max(b1, b2) + 2;
          const smallB = Math.min(b1, b2);
          equation = `Simplify: (${bigA}x + ${bigB}) − (${smallA}x + ${smallB})`;
          answer = `${bigA - smallA}x+${bigB - smallB}`;
          hint = `Distribute the negative sign, then combine like terms`;
        }
      } else {
        // Multiply Polynomials (FOIL)
        // (x + a)(x + b)
        const a = scaledRand(2, 5, progress, 6);
        const b = scaledRand(2, 5, progress, 6);
        equation = `Expand: (x + ${a})(x + ${b})`;
        const mid = a + b;
        const last = a * b;
        answer = `x^2+${mid}x+${last}`;
        hint = `Use FOIL: First, Outer, Inner, Last`;
      }
      break;
    }

    case 4: {
      // Level 4: Factoring (GCF and simple trinomials)
      // PROGRESSIVE: Early = simple GCF → Late = harder trinomials with larger numbers
      isNumeric = false;

      if (progress < 0.35) {
        // EASY: Simple GCF factoring with small numbers
        const sign = Math.random() > 0.5 ? '+' : '-';
        const a = Math.floor(Math.random() * 4) + 2;   // 2-5
        const b = Math.floor(Math.random() * 5) + 2;   // 2-6
        if (sign === '+') {
          equation = `Factor: ${a}x + ${a * b}`;
          answer = `${a}(x + ${b})`;
        } else {
          equation = `Factor: ${a}x − ${a * b}`;
          answer = `${a}(x − ${b})`;
        }
        hint = `Factor out the Greatest Common Factor (GCF)`;
      } else if (progress < 0.65) {
        // MEDIUM: GCF with larger numbers OR simple trinomial
        if (Math.random() > 0.5) {
          // Larger GCF
          const a = Math.floor(Math.random() * 6) + 4;   // 4-9
          const b = Math.floor(Math.random() * 8) + 3;   // 3-10
          const sign = Math.random() > 0.5 ? '+' : '-';
          if (sign === '+') {
            equation = `Factor: ${a}x + ${a * b}`;
            answer = `${a}(x + ${b})`;
          } else {
            equation = `Factor: ${a}x − ${a * b}`;
            answer = `${a}(x − ${b})`;
          }
          hint = `Factor out the Greatest Common Factor (GCF)`;
        } else {
          // Simple trinomial: x^2 + (b+c)x + bc -> (x + b)(x + c)
          const b = Math.floor(Math.random() * 3) + 1;  // 1-3
          const c = Math.floor(Math.random() * 3) + 1;  // 1-3
          equation = `Factor: x² + ${b + c}x + ${b * c}`;
          answer = `(x + ${b})(x + ${c})`;
          hint = `Find two numbers that multiply to ${b * c} and add to ${b + c}`;
        }
      } else {
        // HARD: Trinomials with larger numbers or mixed signs
        if (Math.random() > 0.4) {
          // Trinomial with minus: x^2 + (b-c)x - bc -> (x + b)(x - c)
          const b = Math.floor(Math.random() * 5) + 3;  // 3-7
          const c = Math.floor(Math.random() * (b - 1)) + 1; // 1 to b-1
          equation = `Factor: x² + ${b - c}x − ${b * c}`;
          answer = `(x + ${b})(x − ${c})`;
          hint = `Find two numbers that multiply to -${b * c} and add to ${b - c}`;
        } else {
          // Trinomial with larger positive: x^2 + (b+c)x + bc
          const b = Math.floor(Math.random() * 5) + 3;  // 3-7
          const c = Math.floor(Math.random() * 5) + 3;  // 3-7
          equation = `Factor: x² + ${b + c}x + ${b * c}`;
          answer = `(x + ${b})(x + ${c})`;
          hint = `Find two numbers that multiply to ${b * c} and add to ${b + c}`;
        }
      }
      break;
    }

    case 5: {
      // Level 5: Systems of Equations
      // PROGRESSIVE:
      // - Phase 1 (0 to 0.35): Basic Linear Systems / Elimination (x+y=S, x-y=D or 2x+y=A, x+y=B)
      // - Phase 2 (0.35 to 0.70): Substitution Systems (y=mx, x+y=A or y=x+k, 2x+y=A)
      // - Phase 3 (0.70 to 1.0): Advanced Linear Systems with Coefficients (3x+y=A, x-y=B or 3x+2y=A, x+2y=B)
      isNumeric = true;

      if (progress < 0.35) {
        // PHASE 1: Basic Elimination
        const x = scaledRand(3, 4, progress, 5); // 3 to 7
        const y = scaledRand(1, 3, progress, 4); // 1 to 5
        const askForX = Math.random() > 0.35;

        if (Math.random() > 0.4) {
          // Standard x+y and x-y
          const sum = x + y;
          const diff = x - y;
          if (askForX) {
            equation = `x + y = ${sum}, x − y = ${diff}. x = ?`;
            answer = x.toString();
            hint = `Add both equations to eliminate y: 2x = ${sum + diff}`;
          } else {
            equation = `x + y = ${sum}, x − y = ${diff}. y = ?`;
            answer = y.toString();
            hint = `Subtract the second equation from the first: 2y = ${sum - diff}`;
          }
        } else {
          // 2x + y = A, x + y = B
          const eq1 = 2 * x + y;
          const eq2 = x + y;
          if (askForX) {
            equation = `2x + y = ${eq1}, x + y = ${eq2}. x = ?`;
            answer = x.toString();
            hint = `Subtract the second equation from the first: (2x − x) = ${eq1} − ${eq2}`;
          } else {
            equation = `2x + y = ${eq1}, x + y = ${eq2}. y = ?`;
            answer = y.toString();
            hint = `Find x first (${eq1} − ${eq2} = ${x}), then subtract from ${eq2}`;
          }
        }
      } else if (progress < 0.70) {
        // PHASE 2: Substitution Systems
        if (Math.random() > 0.5) {
          // y = m * x, a*x + b*y = C
          const m = Math.floor(Math.random() * 2) + 2; // 2 or 3
          const x = scaledRand(2, 4, progress, 5); // 2 to 7
          const y = m * x;
          const coeffX = Math.floor(Math.random() * 2) + 1; // 1 or 2
          const total = coeffX * x + y;
          const askForX = Math.random() > 0.35;

          if (askForX) {
            equation = `y = ${m}x, ${coeffX > 1 ? `${coeffX}x + ` : 'x + '}y = ${total}. x = ?`;
            answer = x.toString();
            hint = `Substitute ${m}x for y: ${coeffX + m}x = ${total}`;
          } else {
            equation = `y = ${m}x, ${coeffX > 1 ? `${coeffX}x + ` : 'x + '}y = ${total}. y = ?`;
            answer = y.toString();
            hint = `Find x = ${x} first, then calculate y = ${m}(${x})`;
          }
        } else {
          // y = x + k, x + y = C
          const k = Math.floor(Math.random() * 4) + 1; // 1 to 4
          const x = scaledRand(2, 4, progress, 6); // 2 to 8
          const y = x + k;
          const total = x + y; // 2x + k
          const askForX = Math.random() > 0.35;

          if (askForX) {
            equation = `y = x + ${k}, x + y = ${total}. x = ?`;
            answer = x.toString();
            hint = `Substitute (x + ${k}) for y: 2x + ${k} = ${total}`;
          } else {
            equation = `y = x + ${k}, x + y = ${total}. y = ?`;
            answer = y.toString();
            hint = `Find x = ${x} first, then calculate ${x} + ${k}`;
          }
        }
      } else {
        // PHASE 3: Advanced Linear Systems (Multi-step Elimination)
        const x = scaledRand(3, 5, progress, 8); // 3 to 12
        const y = scaledRand(2, 4, progress, 6); // 2 to 9

        const type = Math.random();
        if (type < 0.35) {
          // 3x + y = A, x - y = B
          const eq1 = 3 * x + y;
          const eq2 = x - y;
          equation = `3x + y = ${eq1}, x − y = ${eq2}. x = ?`;
          answer = x.toString();
          hint = `Add both equations: 4x = ${eq1 + eq2}`;
        } else if (type < 0.70) {
          // 3x + 2y = A, x + 2y = B  (elimination of 2y)
          const eq1 = 3 * x + 2 * y;
          const eq2 = x + 2 * y;
          equation = `3x + 2y = ${eq1}, x + 2y = ${eq2}. x = ?`;
          answer = x.toString();
          hint = `Subtract equation 2 from equation 1: 2x = ${eq1 - eq2}`;
        } else {
          // 2x + 3y = A, 2x + y = B  (elimination of 2x)
          const eq1 = 2 * x + 3 * y;
          const eq2 = 2 * x + y;
          equation = `2x + 3y = ${eq1}, 2x + y = ${eq2}. y = ?`;
          answer = y.toString();
          hint = `Subtract equation 2 from equation 1: 2y = ${eq1 - eq2}`;
        }
      }
      break;
    }

    case 6: {
      // Level 6: Exponents and Roots
      // Mix of solving perfect squares, exponent properties, and root finding
      if (progress < 0.4) {
        // Exponents: x² OP k = result
        const op = progressOp(progress);
        const x = scaledRand(2, 4, progress, 8); // 2-5 → 10-13

        if (op === '+' || op === '-') {
          const k = scaledRand(1, 5, progress, 15);
          if (op === '+') {
            equation = `If x > 0, x² + ${k} = ${x * x + k}`;
            hint = `Subtract ${k}, then take the square root`;
          } else {
            equation = `If x > 0, x² − ${k} = ${x * x - k}`;
            hint = `Add ${k}, then take the square root`;
          }
          answer = x.toString();
        } else if (op === '*') {
          const k = scaledRand(2, 3, progress, 5);
          equation = `If x > 0, ${k}x² = ${k * x * x}`;
          answer = x.toString();
          hint = `Divide by ${k}, then take the square root`;
        } else {
          const k = Math.floor(Math.random() * (2 + Math.floor(progress * 3))) + 2;
          const xAdj = k * (Math.floor(Math.random() * (3 + Math.floor(progress * 4))) + 2);
          equation = `If x > 0, x² ÷ ${k} = ${(xAdj * xAdj) / k}`;
          answer = xAdj.toString();
          hint = `Multiply by ${k}, then take the square root`;
        }
      } else {
        // Perfect Square Factoring / Roots
        const a = scaledRand(2, 3, progress, 6);
        const b = 2 * a;
        const c = a * a;

        if (progress > 0.7 && Math.random() > 0.5) {
          // With multiplier
          const k = Math.floor(Math.random() * 4) + 2;
          const sign = Math.random() > 0.5 ? '+' : '-';
          if (sign === '+') {
            equation = `Root of: ${k}(x² + ${b}x + ${c}) = 0`;
            answer = (-a).toString();
            hint = `Divide by ${k}, factor the perfect square (x + ${a})²`;
          } else {
            equation = `Root of: ${k}(x² − ${b}x + ${c}) = 0`;
            answer = a.toString();
            hint = `Divide by ${k}, factor the perfect square (x − ${a})²`;
          }
        } else {
          // Standard
          const sign = Math.random() > 0.5 ? '+' : '-';
          if (sign === '+') {
            equation = `Root of: x² + ${b}x + ${c} = 0`;
            answer = (-a).toString();
            hint = `Factor as (x + ${a})², set equal to 0`;
          } else {
            equation = `Root of: x² − ${b}x + ${c} = 0`;
            answer = a.toString();
            hint = `Factor as (x − ${a})², set equal to 0`;
          }
        }
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
    sourceLevel: currentLevel,
  };
};