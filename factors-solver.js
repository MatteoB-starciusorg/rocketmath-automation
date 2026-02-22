console.log("factors primes solver loaded")
// Factors & Primes Solver
// Uses selectors verified from the real Rocket Math app.js source.

// Load factors data
let factorsData = null;

async function loadFactorsData() {
    if (factorsData) return factorsData;
    try {
        const response = await fetch(chrome.runtime.getURL('factors_100.json'));
        factorsData = await response.json();
        return factorsData;
    } catch (error) {
        console.error('❌ Failed to load factors data: ' + error.message);
        return null;
    }
}

/**
 * Parse the currently displayed factor pairs from the DOM.
 *
 * The game renders pairs into TWO separate lists:
 *   #problem_1 .factors-primes-list-1  and  #problem_1 .factors-primes-list-2
 *
 * Each displayed pair is a <li> containing two .fp-number divs.
 * The answer slot is a <li class="fp-answer-container"> — we must skip it.
 *
 * Values are stored as .innerHTML (e.g. "1", "12").
 */
function getDisplayedFactorPairs() {
    const pairs = [];
    const listSelectors = [
        '#problem_1 .factors-primes-list-1 li',
        '#problem_1 .factors-primes-list-2 li',
    ];

    for (const sel of listSelectors) {
        const items = document.querySelectorAll(sel);
        for (const li of items) {
            // Skip the answer input row
            if (li.classList.contains('fp-answer-container')) continue;

            const fpNumbers = li.querySelectorAll('.fp-number');
            if (fpNumbers.length >= 2) {
                let a = parseInt(fpNumbers[0].innerHTML.trim(), 10);
                let b = parseInt(fpNumbers[1].innerHTML.trim(), 10);
                if (!isNaN(a) && !isNaN(b)) {
                    // Always store smallest first to match factors_100.json order
                    if (a > b) [a, b] = [b, a];
                    pairs.push(`${a}x${b}`);
                }
            }
        }
    }
    return pairs;
}

/**
 * Determine the next factor pair to type based on what's already displayed.
 */
function getNextFactorPair(n, displayedPairs) {
    if (!factorsData) return null;

    const entry = factorsData.find(item => item.number === n);
    if (!entry) return null;

    const allFactors = entry.factors; // e.g. ["1x6", "2x3", "3x2", "6x1"]

    for (const pair of allFactors) {
        if (!displayedPairs.includes(pair)) {
            const [f1, f2] = pair.split('x').map(Number);
            return { factor1: f1, factor2: f2, isPrime: false };
        }
    }

    // All pairs shown — either prime or complete (click checkmark)
    return { factor1: null, factor2: null, isPrime: true };
}

/**
 * Main solver entry point.
 * Relies on globals from content.js: clickButton, simulateKeyPress, delay, log
 */
async function solveFactorsPrimes(raceMode) {
    // The container must exist and be visible
    const container = document.querySelector('#problem_1 .problem-details-factors-primes');
    if (!container) return false;
    if (container.classList.contains('custom-hide') || container.style.display === 'none') return false;

    // Ensure factors data is loaded
    await loadFactorsData();
    if (!factorsData) return false;

    // ── 1. Get the target number from the title ──────────────────────────────
    // The game sets: .factors-title.innerHTML = "Factors of " + number
    const titleEl = document.querySelector('#problem_1 .factors-title');
    if (!titleEl) { log('⚠️ factors-title not found'); return false; }

    const titleText = titleEl.innerHTML.trim(); // e.g. "Factors of 12"
    const match = titleText.match(/(\d+)/);
    if (!match) { log('⚠️ Could not parse number from: ' + titleText); return false; }

    const number = parseInt(match[1], 10);
    if (isNaN(number)) return false;

    // ── 2. Read currently displayed pairs ────────────────────────────────────
    const displayedPairs = getDisplayedFactorPairs();
    log(`🔢 Factors of ${number} — displayed: [${displayedPairs.join(', ')}]`);

    // ── 3. Determine next pair to type ───────────────────────────────────────
    const nextPair = getNextFactorPair(number, displayedPairs);
    if (!nextPair) { log('⚠️ Could not determine next pair'); return false; }

    const { factor1, factor2, isPrime } = nextPair;

    // Helper: click on-screen number button for each digit.
    // NOTE: Do NOT call simulateKeyPress here. After the game auto-advances focus
    // from field0 to field1, a simulateKeyPress would fire into field1 and corrupt
    // it before we intentionally type factor2. Button clicks alone are sufficient.
    const inputNumber = async (num) => {
        const digits = String(num);
        for (const digit of digits) {
            await clickButton(`#number_${digit}`);
            await delay(60);
        }
    };

    // ── 4. Handle Prime / Checkmark state ────────────────────────────────────
    if (isPrime) {
        log('✅ All pairs shown — submitting checkmark');

        // Make sure both answer fields are empty before submitting
        const ans0 = document.querySelector('#problem_1 .factor-answer-0');
        const ans1 = document.querySelector('#problem_1 .factor-answer-1');
        const hasText = (ans0 && ans0.innerHTML.trim()) || (ans1 && ans1.innerHTML.trim());

        if (hasText) {
            await clickButton('#arrow');
            await delay(100);
        }

        if (raceMode) {
            await delay(500);
            try { chrome.runtime.sendMessage({ action: 'pressEnter' }); } catch (_) { }
        } else {
            await clickButton('#enter');
            simulateKeyPress('Enter');
        }
        return true;
    }

    // ── 5. Get the live answer fields ────────────────────────────────────────
    const ans0 = document.querySelector('#problem_1 .factor-answer-0');
    const ans1 = document.querySelector('#problem_1 .factor-answer-1');
    if (!ans0 || !ans1) { log('⚠️ Answer divs not found'); return false; }

    const val0 = ans0.innerHTML.trim();
    const val1 = ans1.innerHTML.trim();

    // Already correctly filled — just submit
    if (val0 == factor1 && val1 == factor2) {
        log(`✅ Already filled: ${factor1}x${factor2} — submitting`);
        if (raceMode) {
            await delay(100);
            try { chrome.runtime.sendMessage({ action: 'pressEnter' }); } catch (_) { }
        } else {
            await clickButton('#enter');
            simulateKeyPress('Enter');
        }
        return true;
    }

    log(`⌨️ Typing: ${factor1} x ${factor2}`);

    // ── 6. Input factor 1 (if not already correct) ───────────────────────────
    if (val0 !== String(factor1)) {
        if (val0 !== '') {
            // Wrong content — clear it
            await clickButton('#arrow');
            await delay(80);
        }
        await inputNumber(factor1);
        // The game auto-advances focus to field 1 once field 0 is full.
        // Wait briefly for that internal transition to complete.
        await delay(raceMode ? 500 : 150);
    }

    // ── 7. Input factor 2 ────────────────────────────────────────────────────
    const val1After = document.querySelector('#problem_1 .factor-answer-1').innerHTML.trim();
    if (val1After !== String(factor2)) {
        await inputNumber(factor2);
        await delay(80);
    }

    // ── 8. Submit if both fields match ───────────────────────────────────────
    const finalVal0 = document.querySelector('#problem_1 .factor-answer-0').innerHTML.trim();
    const finalVal1 = document.querySelector('#problem_1 .factor-answer-1').innerHTML.trim();

    if (finalVal0 == factor1 && finalVal1 == factor2) {
        if (raceMode) {
            try { chrome.runtime.sendMessage({ action: 'pressEnter' }); } catch (_) { }
        } else {
            await clickButton('#enter');
            simulateKeyPress('Enter');
        }
    } else {
        log(`⚠️ Values after input: [${finalVal0}] x [${finalVal1}] — expected ${factor1}x${factor2}`);
    }

    return true;
}
