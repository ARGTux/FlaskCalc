/**
 * Calculator State Management & Initialization
 * - Manages display element for showing calculations
 * - Handles angle mode toggle (DEG/RAD)
 * - Maintains calculation memory and evaluation state
 * - Preserves original math.js trig functions for mode switching
 */
const display = document.getElementById("display");
const modeButton = document.getElementById("mode");
let tempMemory = "";
let evaluated = false;
let angleMode = "RAD";
const math = window.math;

/**
 * Cache original math.js trig functions
 * Prevents recursive calls when overriding functions
 * Essential for proper angle mode switching
 */
const original = {
  sin: math.sin,
  cos: math.cos,
  tan: math.tan,
  asin: math.asin,
  acos: math.acos,
  atan: math.atan
};


// Initialize calculator
toggleAngleMode();

/**
 * Expression Parentheses Balancer
 * Ensures mathematical expressions have matching parentheses
 * Uses regex to count opening/closing parentheses
 * Only adds closing parentheses to maintain expression validity
 */
function autoCloseParentheses(expr) {
  let openCount = (expr.match(/\(/g) || []).length;
  let closeCount = (expr.match(/\)/g) || []).length;
  let result = expr;
  while (openCount > closeCount) {
    result += ")";
    closeCount++;
  }
  return result;
}

/**
 * Angle Mode Toggle System
 * Implements DEG/RAD conversion for all trigonometric functions
 * Uses function composition to maintain original function behavior
 * Preserves chainability of math.js operations
 */
function toggleAngleMode() {
  angleMode = (angleMode === "DEG") ? "RAD" : "DEG";

  math.import({
    sin:  x => angleMode === "DEG" ? original.sin(x * Math.PI / 180) : original.sin(x),
    cos:  x => angleMode === "DEG" ? original.cos(x * Math.PI / 180) : original.cos(x),
    tan:  x => angleMode === "DEG" ? original.tan(x * Math.PI / 180) : original.tan(x),
    asin: x => angleMode === "DEG" ? original.asin(x) * 180 / Math.PI : original.asin(x),
    acos: x => angleMode === "DEG" ? original.acos(x) * 180 / Math.PI : original.acos(x),
    atan: x => angleMode === "DEG" ? original.atan(x) * 180 / Math.PI : original.atan(x),
  }, { override: true });

  modeButton.innerText = `Mode: ${angleMode}`;
}


/**
 * Random Function Parser
 * Converts standalone 'random' keywords to function calls
 * Handles edge cases like:
 * - random() already properly formatted
 * - random appearing within other words
 * - case-insensitive matching
 */
function fixRandom(expr) {
  return expr.replace(/\brandom\b(?!\()/gi, "random()");
}

/**
 * Mathematical Expression Parser
 * Converts calculator notation to valid math.js syntax
 * Handles multiple categories of transformations:
 * 1. Basic operators (×, ÷, ^)
 * 2. Inverse trig functions (sin⁻¹, cos⁻¹, tan⁻¹)
 * 3. Roots and powers (√, ³√, ², ³)
 * 4. Logarithmic functions (log, ln)
 * 5. Special constants (π, 𝔦)
 * 6. Scientific notation (₁₀^)
 */
function parseExpression(expr) {
  return expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\^/g, '^')
    .replace(/sin⁻¹\(/g, 'asin(')
    .replace(/cos⁻¹\(/g, 'acos(')
    .replace(/tan⁻¹\(/g, 'atan(')
    .replace(/³√/g, 'cbrt')
    .replace(/√/g, 'sqrt')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/log\(/g, 'log10(')
    .replace(/ln\(/g, 'log(')
    .replace(/\bmod\b/gi, ' mod ')
    .replace(/₁₀\^/g, '10^')
    .replace(/π/g, 'pi')
    .replace(/𝔦/g, 'i');
}

/**
 * Display Input Handler
 * Smart input management with context awareness:
 * - Replaces error states with new input
 * - Handles post-evaluation input logic
 * - Preserves operators after evaluation
 * - Manages display overwrite conditions
 */
function addValue(value) {
  const current = display.innerText;
  if (
    current === "0" ||
    current === "Error" ||
    current === "undefined" ||
    (evaluated && !["+", "-", "×", "÷", "³", "²", "^"].includes(value))
  ) {
    display.innerText = value;
  } else {
    display.innerText += value;
  }
  evaluated = false;
}

/**
 * Resets calculator display and evaluation state
 * Used for CE (Clear Entry) functionality
 */
function clearDisplay() {
  display.innerText = "0";
  evaluated = false;
}

/**
 * Removes last character from display with error handling
 * Resets to "0" if display would be empty after deletion
 * Also resets on error states
 */
function deleteLast() {
  const text = display.innerText;
  display.innerText = (text === "Error" || text === "undefined" || text === "NaN")
    ? "0"
    : text.slice(0, -1) || "0";
  evaluated = false;
}

/**
 * Visual feedback for calculation errors
 * Briefly flashes element background red
 * @param {HTMLElement} el - Element to flash
 */
function flashError(el) {
  const prev = el.style.backgroundColor;
  el.style.backgroundColor = "#300";
  setTimeout(() => { el.style.backgroundColor = prev; }, 250);
}

/**
 * Core Calculation Engine
 * Multi-stage expression processing pipeline:
 * 1. Symbol normalization via parseExpression
 * 2. Random function formatting
 * 3. Parentheses validation and correction
 * 4. Mathematical evaluation using math.js
 * 
 * Error Handling:
 * - Catches syntax errors, domain errors, and undefined functions
 * - Provides visual feedback for errors
 * - Maintains calculator state on failure
 * - Logs errors for debugging
 * 
 * @returns {number|string} Formatted calculation result or NaN
 * @throws {Error} Caught and handled internally
 */
function calculate() {
  try {
    let parsedExpr = display.innerText;
    console.log(parsedExpr);
    
    parsedExpr = parseExpression(parsedExpr);
    console.log(parsedExpr);
    
    parsedExpr = fixRandom(parsedExpr);
    console.log(parsedExpr);
    
    parsedExpr = autoCloseParentheses(parsedExpr);
    console.log(parsedExpr);

    const result = math.format(math.evaluate(parsedExpr), { precision: 12 })
                     .replace(/i/g, '𝔦');

    display.innerText = result;
    evaluated = true;

    return result;

  } catch (error) {
    console.error(error);

    display.innerText = "Error";

    flashError(display);

    evaluated = false;
    return NaN;
  }
}

/**
 * Memory System Implementation
 * Provides M+, MR, MC functionality:
 * - M+ captures current calculation result
 * - MR recalls stored value
 * - MC clears memory
 * 
 * Safety Features:
 * - Only stores valid calculation results
 * - Handles empty memory conditions
 * - Preserves numeric precision
 */
function saveMemory() {
  const result = calculate();
  if (!isNaN(result)) tempMemory = result;
}

function useMemory() {
  if (tempMemory !== "") addValue(tempMemory.toString());
}

function clearMemory() {
  tempMemory = "";
}

/**
 * Keyboard Input Management System
 * Comprehensive key mapping for calculator operations:
 * 
 * Direct Input:
 * - Numbers (0-9)
 * - Basic operators (+, -, *, /, ^)
 * - Parentheses
 * - Decimal point
 * 
 * Special Functions:
 * - Trigonometric (s, c, t)
 * - Logarithmic (l, g)
 * - Powers and roots (r, q)
 * 
 * Control Keys:
 * - Enter: Evaluate
 * - Backspace: Delete
 * - Escape: Clear
 * 
 * Memory Operations:
 * - M: Store
 * - U: Recall
 * 
 * Mode Toggle:
 * - A: Switch DEG/RAD
 * 
 * @param {KeyboardEvent} event Keyboard input event
 */
document.addEventListener("keydown", handleKeyPress);

function handleKeyPress(event) {
  const key = event.key;
  // Ctrl + C → Copy display content
  if (event.ctrlKey && key.toLowerCase() === "c") {
      event.preventDefault();
      navigator.clipboard.writeText(display.innerText).catch(() => {});
      return;
  }
  // Ctrl + V → Paste only if valid expression
  if (event.ctrlKey && key.toLowerCase() === "v") {
      event.preventDefault();
      navigator.clipboard.readText().then(text => {
          const cleaned = text.trim();

          // Allowed characters for a valid expression
          const allowed = /^[0-9+\-*/^(). ×÷πei𝔦sqrtcbrtlogln\s]+$/i;

          if (!allowed.test(cleaned)) {
              showPasteError("Pasted text contains invalid characters");
              return;
          }

          try {
              // Try parsing through your real pipeline
              let parsed = parseExpression(cleaned);
              parsed = fixRandom(parsed);
              parsed = autoCloseParentheses(parsed);

              math.evaluate(parsed);  // If this fails, expression is invalid

              display.innerText = cleaned;
              evaluated = false;
          } catch (err) {
              showPasteError("Expression is invalid or cannot be evaluated");
          }
      });

      return;
  }
  if (key === "Enter") { event.preventDefault(); calculate(); }
  else if (key === "Backspace") { deleteLast(); }
  else if (key === "Escape") { clearDisplay(); }
  else if (!isNaN(key)) { addValue(key); }
  else if (key === ".") { addValue("."); }
  else if (key === "+") { addValue("+"); }
  else if (key === "-") { addValue("-"); }
  else if (key === "*") { addValue("×"); }
  else if (key === "/" || key === "\\") { addValue("÷"); }
  else if (key === "^") { addValue("^"); }
  else if (key === "(" || key === ")") { addValue(key); }
  else if (key.toLowerCase() === "p") { addValue("π"); }
  else if (key.toLowerCase() === "e") { addValue("e"); }
  else if (key.toLowerCase() === "i") { addValue("𝔦"); }
  else if (key.toLowerCase() === "s") { addValue("²"); }
  else if (key.toLowerCase() === "r") { addValue("√("); }
  else if (key.toLowerCase() === "c") { addValue("³"); }
  else if (key.toLowerCase() === "q") { addValue("³√("); }
  else if (key.toLowerCase() === "l") { addValue("ln("); }
  else if (key.toLowerCase() === "g") { addValue("log("); }
  else if (key.toLowerCase() === "m") { saveMemory(); }
  else if (key.toLowerCase() === "u") { useMemory(); }
  else if (key.toLowerCase() === "a") { toggleAngleMode(); }
}


const overlay = document.getElementById("overlay");
const openOverlay = document.getElementById("openOverlay");
const closeOverlay = document.getElementById("closeOverlay");

if (overlay && openOverlay && closeOverlay) {
  openOverlay.addEventListener("click", () => {
    overlay.style.display = "flex";
  });

  closeOverlay.addEventListener("click", () => {
    overlay.style.display = "none";
  });
}

// Global click handler for calculator buttons
document.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-action]");
  if (!btn) {
    return;
  }

  const action = btn.dataset.action;

  switch (action) {
    case "calculate()":
      calculate();
      break;
    case "clearDisplay()":
      clearDisplay();
      break;
    case "deleteLast()":
      deleteLast();
      break;
    case "saveMemory()":
      saveMemory();
      break;
    case "useMemory()":
      useMemory();
      break;
    case "clearMemory()":
      clearMemory();
      break;
    case "toggleAngleMode()":
      toggleAngleMode();
      break;
    default:
      addValue(action);
  }
});
