/**
 * Graphing Calculator Configuration
 * Manages multiple function plots with dynamic updates
 */
let funcCount = 6;
let radianMode = true;

/**
 * Default mathematical functions to display
 * Provides initial examples of various function types
 */
const defaultExpressions = [
    "x*x", "x**3", "x", "x+5", "sin(x)", "log(x)"
];

/**
 * Supported mathematical functions
 * Used for preprocessing expressions before evaluation
 * All functions are mapped to their Math object equivalents
 */
const mathFunctions = [
    "sin", "cos", "tan", "asin", "acos", "atan", "log", "sqrt", "abs",
    "exp", "floor", "ceil", "round", "max", "min", "pow", "PI"
];

/**
 * Initialization Handler
 * Sets up UI components and event listeners
 * Configures responsive plot resizing
 */
window.onload = () => {
    generateInputs();
    setupEventListeners();
    window.addEventListener('resize', () => {
        Plotly.Plots.resize(document.getElementById('plotly'));
    });
};

/**
 * Expression Preprocessor
 * Converts mathematical notation to JavaScript
 * Uses regex to identify and replace function names
 * Preserves method calls (avoids replacing .sin with .Math.sin)
 */
function preprocess(expr) {
    // Only replace whole words not preceded by a dot
    return mathFunctions.reduce((e, fn) => e.replace(new RegExp(`(?<!\\.)\\b${fn}\\b`, "g"), `Math.${fn}`), expr);
}

/**
 * Dynamic Input Generator
 * Creates function input fields with:
 * - Unique labels (f, g, h, etc.)
 * - Enable/disable toggles
 * - Error message display
 * - Default function values
 */
function generateInputs() {
    const container = document.getElementById('functionInputs');
    container.innerHTML = '';

    for (let i = 0; i < funcCount; i++) {
        const label = String.fromCharCode(102 + i);
        const value = defaultExpressions[i] || "x";

        const wrapper = document.createElement('div');
        wrapper.className = "functionWrapper";
        wrapper.style.visibility = i < funcCount ? 'visible' : 'hidden';

        wrapper.innerHTML = `
            <label for="funcInput${i}">Function ${label}(x):</label>
            <div style="display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" id="enableCheckbox${i}" ${(i == 0) || (i == 3) ? 'checked' : ''} onchange="toggleFunctionEnabled(${i})" />
                <input id="funcInput${i}" class="function-input" data-label="${label}(x)" value="${value}" placeholder="e.g., x*x, sin(x), x+5" title="Enter a function of x." />
            </div>
            <div class="error-message" id="funcInput${i}-error"></div>
        `;

        container.appendChild(wrapper);
    }

    // Directly call toggleFunctionEnabled for visible inputs
    document.querySelectorAll('.functionWrapper').forEach((wrapper, i) => {
        if (i < funcCount) toggleFunctionEnabled(i);
    });
}

/**
 * Event Handler Setup
 * Configures form submission and plot updates
 */
function setupEventListeners() {
    document.getElementById('plotForm').addEventListener('submit', e => {
        e.preventDefault();
        validateAndPlot();
    });
    document.getElementById('radianToggle').addEventListener('change', () => {
        radianMode = document.getElementById('radianToggle').checked;
        validateAndPlot();
    });

}

/**
 * Input Visibility Manager
 * Shows/hides function inputs based on current count
 */
function updateVisibility() {
    document.querySelectorAll('.functionWrapper').forEach((el, idx) => {
        el.style.visibility = idx < funcCount ? 'visible' : 'hidden';
    });
}

/**
 * Function Toggle Handler
 * Controls individual function visibility
 * Updates plot when functions are enabled/disabled
 */
function toggleFunctionEnabled(i) {
    const input = document.getElementById(`funcInput${i}`);
    const checked = document.getElementById(`enableCheckbox${i}`).checked;
    input.disabled = !checked;
    input.style.opacity = checked ? 1 : 0.5;
    validateAndPlot();
}

/**
 * Safe Expression Evaluator
 * Evaluates mathematical expressions in isolated scope
 * Uses Function constructor for better performance
 * Includes all Math object functions
 */
function safeEval(expr, x) {
    // Use Function constructor for fast evaluation
    return Function("x", `with (Math) { return ${preprocess(expr)}; }`)(x);
}

/**
 * Error Message Generator
 * Provides user-friendly error messages
 * Handles common syntax and math errors
 */
function getErrorMessage(msg) {
    if (msg.includes("Unexpected identifier")) return "There’s a typo or missing operator.";
    if (msg.includes("Unexpected token")) return "Check for invalid characters.";
    if (msg.includes("is not defined")) return "Use valid math functions (e.g., sin, cos, sqrt).";
    return msg;
}

/**
 * Zero-Point Evaluator
 * Calculates function value at x=0
 * Used for determining initial y-axis range
 * Returns 0 for invalid/undefined results
 */
function evaluateAtZero(expr) {
    try {
        const r = safeEval(expr, 0);
        return isFinite(r) ? r : 0;
    } catch { return 0; }
}

/**
 * Function Validator and Plot Trigger
 * Validates all visible and enabled functions
 * Updates default expressions for valid inputs
 * Triggers plot update if all functions are valid
 */
function validateAndPlot() {
    const inputs = document.querySelectorAll('.function-input');
    let anyError = false;

    inputs.forEach((input, i) => {
        const wrapper = input.closest('.functionWrapper');
        if (wrapper.style.visibility !== 'visible' || input.disabled) return;

        const expr = input.value;
        const errBox = document.getElementById(input.id + '-error');

        input.classList.remove('error');
        errBox.textContent = '';

        try {
            safeEval(expr, 1);
            defaultExpressions[i] = expr;
        } catch (e) {
            input.classList.add('error');
            errBox.textContent = getErrorMessage(e.message);
            anyError = true;
        }
    });

    if (!anyError) drawPlot();
}

function isTrig(expr) {
    const e = expr.toLowerCase();
    return e.includes("sin") || e.includes("cos") || e.includes("tan") ||
           e.includes("asin") || e.includes("acos") || e.includes("atan");
}

function toPiFraction(x) {
    const pi = Math.PI;
    const k = Math.round((x / pi) * 12);
    const num = k;
    const den = 12;

    const g = (a, b) => b ? g(b, a % b) : Math.abs(a);
    const gcd = g(num, den);

    const n = num / gcd;
    const d = den / gcd;

    if (n === 0) return "0";
    if (d === 1) {
        if (n === 1) return "π";
        if (n === -1) return "-π";
        return n + "π";
    }
    if (n === 1) return "π/" + d;
    if (n === -1) return "-π/" + d;
    return n + "π/" + d;
}

function snapAngle(x) {
    const pi = Math.PI;

    const k = Math.round((x / pi) * 12);
    const snapped = (k * pi) / 12;

    return { 
        raw: x,
        snappedValue: snapped,
        snappedLabel: toPiFraction(snapped)
    };
}

function toPiFraction(x) {
    const pi = Math.PI;

    // Snap to multiples of pi/12 so values like pi/2, pi/3, pi/4 appear cleanly
    const k = Math.round((x / pi) * 12);
    const num = k;
    const den = 12;

    // Convert to reduced fraction
    const g = (a, b) => b ? g(b, a % b) : Math.abs(a);
    const gcd = g(num, den);

    const n = num / gcd;
    const d = den / gcd;

    if (n === 0) return "0";

    // Format output
    if (d === 1) {
        if (n === 1) return "π";
        if (n === -1) return "-π";
        return n + "π";
    }

    if (n === 1) return "π/" + d;
    if (n === -1) return "-π/" + d;

    return n + "π/" + d;
}

function simplifyTrigY(v) {
    if (!isFinite(v)) return "undefined";

    const known = [
        { val:  0, txt: "0" },
        { val:  1, txt: "1" },
        { val: -1, txt: "-1" },
        { val:  Math.SQRT1_2, txt: "√2/2" },
        { val: -Math.SQRT1_2, txt: "-√2/2" },
        { val:  Math.sqrt(3)/2, txt: "√3/2" },
        { val: -Math.sqrt(3)/2, txt: "-√3/2" }
    ];

    for (const k of known) {
        if (Math.abs(v - k.val) < 1e-4) return k.txt;
    }

    return v.toFixed(4);
}

/**
 * Plot Renderer
 * Creates and updates function plots using Plotly
 * Features:
 * - Multiple function traces
 * - Dynamic y-axis scaling
 * - Responsive layout
 * - Interactive legend
 * - Error handling for invalid functions
 * 
 * Plot Configuration:
 * - X range: [-5, 5]
 * - Y range: [min-5, max+5]
 * - 20001 points for smooth curves
 * - Horizontal legend
 */
function drawPlot() {
    const inputs = document.querySelectorAll('.function-input');
    const traces = [];

    const x = new Array(20001);
    for (let i = 0; i < 20001; i++) x[i] = (i - 10000) / 100;

    let yMin = Infinity;
    let yMax = -Infinity;
    let foundValidZero = false;

    inputs.forEach(input => {
        const wrapper = input.closest('.functionWrapper');
        if (wrapper.style.visibility !== 'visible' || input.disabled) return;

        const expr = input.value;
        const label = input.dataset.label;

        let fn;
        try {
            fn = Function("x", `with (Math) { return ${preprocess(expr)}; }`);
        } catch {
            return;
        }

        // generate y-values normally for drawing the curve
        const y = x.map(v => {
            try {
                const val = fn(v);
                return isFinite(val) ? val : NaN;
            } catch {
                return NaN;
            }
        });

        // old zoom logic: sample f(0)
        try {
            const y0 = fn(0);
            if (isFinite(y0)) {
                yMin = Math.min(yMin, y0);
                yMax = Math.max(yMax, y0);
                foundValidZero = true;
            }
        } catch {}

        const trigMode = isTrig(expr);

        let customdata;

        if (trigMode && radianMode) {
            // radians + snapping mode
            customdata = x.map((v, i) => {
                const snap = snapAngle(v);

                let ySnap;
                try { ySnap = fn(snap.snappedValue); }
                catch { ySnap = NaN; }

                const yLabel = simplifyTrigY(ySnap);
                return [snap.snappedLabel, yLabel];
            });

        } else {
            // decimal mode (for non-trig OR toggle off)
            customdata = x.map((v, i) => [v.toFixed(4), y[i].toFixed(4)]);
        }

        traces.push({
            x,
            y,
            mode: "lines",
            name: label,
            customdata,
            hovertemplate: "x: %{customdata[0]}<br>y: %{customdata[1]}<extra></extra>"
        });

    });

    // fallback if f(0) invalid for all functions (like 1/x)
    if (!foundValidZero) {
        yMin = -10;
        yMax = 10;
    }

    const layout = {
        xaxis: { range: [-5, 5], autorange: false },
        yaxis: { range: [yMin - 5, yMax + 5], autorange: false },
        autosize: true,
        margin: { l: 40, r: 20, t: 20, b: 40 },
        legend: { orientation: "h" }
    };

    Plotly.newPlot('plotly', traces, layout, { responsive: true });
}
