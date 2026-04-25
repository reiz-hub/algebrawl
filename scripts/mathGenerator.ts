// script/mathGenerator.ts

export type Question = {
  equation: string;
  options: string[];
  correctAnswer: string;
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
      // Random offset between -5 and +5, avoiding 0
      let offset = Math.floor(Math.random() * 11) - 5;
      if (offset === 0) offset = 2; 
      distractor = (numAnswer + offset).toString();
    } else {
      // For algebraic terms like "5x", randomize the coefficient
      const match = answer.match(/(\d+)(.*)/);
      if (match) {
        const num = parseInt(match[1], 10);
        const suffix = match[2];
        let offset = Math.floor(Math.random() * 4) + 1;
        distractor = `${num + (Math.random() > 0.5 ? offset : -offset)}${suffix}`;
      } else {
        distractor = answer + "1"; // Fallback
      }
    }
    
    // Only add if it's not already an option
    if (!options.includes(distractor)) {
      options.push(distractor);
    }
  }
  
  return shuffle(options);
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

  switch (currentLevel) {
    case 1: {
      // Level 1: 1-Step Equations (x + a = b)
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 20) + 10;
      equation = `x + ${a} = ${b}`;
      answer = (b - a).toString();
      break;
    }
    case 2: {
      // Level 2: 2-Step Equations (ax + b = c)
      const x = Math.floor(Math.random() * 9) + 2;
      const a = Math.floor(Math.random() * 5) + 2;
      const b = Math.floor(Math.random() * 10) + 1;
      const c = (a * x) + b;
      equation = `${a}x + ${b} = ${c}`;
      answer = x.toString();
      break;
    }
    case 3: {
      // Level 3: Systems of Equations (find x)
      const x = Math.floor(Math.random() * 10) + 5;
      const y = Math.floor(Math.random() * 4) + 1;
      const sum = x + y;
      const diff = x - y;
      equation = `x+y=${sum}, x-y=${diff}. x=?`;
      answer = x.toString();
      break;
    }
    case 4: {
      // Level 4: Combining Like Terms (Polynomials)
      const a = Math.floor(Math.random() * 8) + 2;
      const b = Math.floor(Math.random() * 8) + 2;
      equation = `Simplify: ${a}x + ${b}x`;
      answer = `${a + b}x`;
      isNumeric = false; // Tells the generator to keep the 'x' attached to options
      break;
    }
    case 5: {
      // Level 5: Basic Exponents / Roots
      const x = Math.floor(Math.random() * 9) + 2;
      equation = `If x > 0, x² = ${x * x}`;
      answer = x.toString();
      break;
    }
    case 6: {
      // Level 6: Perfect Square Factoring (Roots of x^2 + 2ax + a^2 = 0)
      const a = Math.floor(Math.random() * 5) + 2;
      const b = 2 * a;
      const c = a * a;
      equation = `Root of: x² + ${b}x + ${c} = 0`;
      // The factored form is (x + a)^2 = 0, so the root is -a
      answer = (-a).toString();
      break;
    }
    default: {
      // Fallback just in case
      equation = `2x = 4`;
      answer = '2';
    }
  }

  return {
    equation,
    options: generateOptions(answer, numChoices, isNumeric),
    correctAnswer: answer,
  };
};