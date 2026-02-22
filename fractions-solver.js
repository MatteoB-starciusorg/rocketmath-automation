// Equivalent Fractions Solver
// Handles .problem-details-equivalent-fractions problems

/**
 * Solves equivalent fractions problems
 * @param {boolean} raceMode - Whether race mode is enabled
 * @returns {Promise<boolean>} - True if problem was solved, false otherwise
 */
async function solveEquivalentFractions(raceMode) {
    const eqSection = document.querySelector('.problem-details-equivalent-fractions');
    if (!eqSection || eqSection.classList.contains('custom-hide')) {
        return false;
    }

    const numEl = document.querySelector('.equivalent-problem-0');
    const denomEl = document.querySelector('.equivalent-problem-1');
    if (!numEl || !denomEl) {
        return false;
    }

    const numText = numEl.textContent.trim();
    const denomText = denomEl.textContent.trim();
    if (!numText || !denomText) {
        return false;
    }

    const num = parseInt(numText, 10);
    const denom = parseInt(denomText, 10);
    if (isNaN(num) || isNaN(denom) || denom === 0) {
        return false;
    }

    const frac = new Fraction(num, denom);
    const simplifiedNum = Number(frac.n);
    const simplifiedDenom = Number(frac.d);

    const ans0El = document.querySelector('.equivalent-answer-0');
    const ans1El = document.querySelector('.equivalent-answer-1');
    if (!ans0El || !ans1El) {
        return false;
    }

    const ans0Text = ans0El.textContent.trim();
    const ans1Text = ans1El.textContent.trim();

    // Check if the current values are CORRECT
    const correctAns0 = String(simplifiedNum);
    const correctAns1 = String(simplifiedDenom);

    if (ans0Text === correctAns0 && ans1Text === correctAns1) {
        // Both fields have the CORRECT answer
        log(`✅ Correct answer already in fields: ${simplifiedNum}/${simplifiedDenom}`);
        if (!raceMode) {
            await clickButton('#enter');
            simulateKeyPress('Enter');
        }
        return true;
    }

    // If fields have WRONG values, clear them
    if (ans0Text || ans1Text) {
        log(`⚠ Clearing incorrect values: (${ans0Text}/${ans1Text}) expected (${simplifiedNum}/${simplifiedDenom})`);
        // Clear both fields (using #arrow for backspace)
        // We typically need to backspace enough times to clear both fields
        for (let i = 0; i < 6; i++) {
            await clickButton('#arrow');
            simulateKeyPress('Backspace');
            await delay(50);
        }
        await delay(150);
    }

    // Race mode: wait a random 450–500 ms before typing
    if (raceMode) {
        const raceDelay = 450 + Math.random() * 50; // 450-500ms
        log(`🏁 Waiting ${Math.round(raceDelay)}ms…`);
        await delay(raceDelay);
    }

    log(`🚀 Solving: ${num}/${denom} → ${simplifiedNum}/${simplifiedDenom}`);

    /**
     * Helper to type a number robustly
     */
    const typeRobustly = async (val) => {
        const digits = String(val);
        for (const digit of digits) {
            await clickButton(`#number_${digit}`);
            simulateKeyPress(digit);
            await delay(50);
        }
        await delay(60);
    };

    // 1. Type Numerator
    const currentAns0 = document.querySelector('.equivalent-answer-0')?.textContent.trim();
    if (currentAns0 !== correctAns0) {
        await typeRobustly(simplifiedNum);
    }

    // 2. Type Denominator
    const currentAns1 = document.querySelector('.equivalent-answer-1')?.textContent.trim();
    if (currentAns1 !== correctAns1) {
        await typeRobustly(simplifiedDenom);
    }

    if (raceMode) {
        // Don't press Enter — tell the popup to show prompt
        log(`🏁 Answer typed, press Enter!`);
        try { chrome.runtime.sendMessage({ action: 'pressEnter' }); } catch (_) { }
        log(`✅ Typed: ${simplifiedNum}/${simplifiedDenom}`);
    } else {
        // 3. Final Enter
        await clickButton('#enter');
        simulateKeyPress('Enter');
        log(`✅ Submitted: ${simplifiedNum}/${simplifiedDenom}`);
    }

    try {
        chrome.runtime.sendMessage({ action: 'updateAnswer', answer: `${simplifiedNum}/${simplifiedDenom}` });
    } catch (_) { }

    return true;
}
