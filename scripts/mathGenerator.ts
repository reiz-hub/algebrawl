// script/mathGenerator.ts

export type Question = {
  equation: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  sourceLevel: number;
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
      // PROGRESSIVE: Early = small sums with +/- → Late = larger numbers with product/quotient pairs
      const op = progressOp(progress);

      const x = scaledRand(3, 5, progress, 12);  // 3-7 → 15-19
      const y = scaledRand(1, 3, progress, 5);    // 1-3 → 6-8

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
        const yAdj = Math.floor(Math.random() * (2 + Math.floor(progress * 3))) + 2;
        const xAdj = yAdj * (Math.floor(Math.random() * (3 + Math.floor(progress * 4))) + 2); // ensure divisible
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