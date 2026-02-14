// Content script for Rocket Math automation
// Uses Fraction.js for robust fraction arithmetic & simplification.
// The game is DOM-based: reads fractions from elements and clicks the on-screen keyboard.

let isRunning = false;
let automationTimer = null;
let processing = false;

// ── messaging ─────────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'start') {
        isRunning = true;
        log('Bot started');
        startAutomation();
        sendResponse({ success: true });
    } else if (request.action === 'stop') {
        isRunning = false;
        stopAutomation();
        log('Bot stopped');
        sendResponse({ success: true });
    }
    return true;
});

function log(msg) {
    console.log(`[RocketBot] ${msg}`);
    try { chrome.runtime.sendMessage({ action: 'log', message: msg }); } catch (_) { }
}

// ── automation loop ───────────────────────────────────────
function startAutomation() {
    stopAutomation();
    runCycle();
    automationTimer = setInterval(() => {
        if (isRunning && !processing) runCycle();
    }, 700); // Polling every 0.7s
}

function stopAutomation() {
    if (automationTimer) { clearInterval(automationTimer); automationTimer = null; }
}

// ── single cycle ──────────────────────────────────────────
async function runCycle() {
    if (processing) return;
    processing = true;

    try {
        const playingScreen = document.querySelector('playing-screen');
        if (!playingScreen || playingScreen.classList.contains('hidden') || playingScreen.style.display === 'none') {
            processing = false;
            return;
        }

        const eqSection = document.querySelector('.problem-details-equivalent-fractions');
        if (!eqSection || eqSection.classList.contains('custom-hide')) {
            processing = false;
            return;
        }

        const numEl = document.querySelector('.equivalent-problem-0');
        const denomEl = document.querySelector('.equivalent-problem-1');
        if (!numEl || !denomEl) {
            processing = false;
            return;
        }

        const numText = numEl.textContent.trim();
        const denomText = denomEl.textContent.trim();
        if (!numText || !denomText) {
            processing = false;
            return;
        }

        const num = parseInt(numText, 10);
        const denom = parseInt(denomText, 10);
        if (isNaN(num) || isNaN(denom) || denom === 0) {
            processing = false;
            return;
        }

        const frac = new Fraction(num, denom);
        const simplifiedNum = Number(frac.n);
        const simplifiedDenom = Number(frac.d);

        const ans0El = document.querySelector('.equivalent-answer-0');
        const ans1El = document.querySelector('.equivalent-answer-1');
        if (!ans0El || !ans1El) {
            processing = false;
            return;
        }

        const ans0Text = ans0El.textContent.trim();
        const ans1Text = ans1El.textContent.trim();

        if (ans0Text && ans1Text) {
            await clickButton('#enter');
            processing = false;
            return;
        }

        log(`🚀 Solving: ${num}/${denom} → ${simplifiedNum}/${simplifiedDenom}`);

        // Typing sequence: Numerator -> Denominator -> Enter
        // Usually typing the numerator automatically shifts focus

        // 1. Type Numerator if not already there
        if (!ans0Text) {
            const nDigits = String(simplifiedNum);
            for (const digit of nDigits) {
                await clickButton(`#number_${digit}`);
                await delay(40);
            }
            await delay(60);
        }

        // 2. Type Denominator if not already there
        const currentAns1 = document.querySelector('.equivalent-answer-1')?.textContent.trim();
        if (!currentAns1) {
            const dDigits = String(simplifiedDenom);
            for (const digit of dDigits) {
                await clickButton(`#number_${digit}`);
                await delay(40);
            }
            await delay(60);
        }

        // 3. Final Enter
        await clickButton('#enter');
        log(`✅ Submitted: ${simplifiedNum}/${simplifiedDenom}`);

        try {
            chrome.runtime.sendMessage({ action: 'updateAnswer', answer: `${simplifiedNum}/${simplifiedDenom}` });
        } catch (_) { }

    } catch (err) {
        log('❌ ' + err.message);
    } finally {
        processing = false;
    }
}

// ── click a keyboard button ───────────────────────────────
function clickButton(selector) {
    return new Promise((resolve) => {
        const btn = document.querySelector(selector);
        if (btn) {
            btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
            btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
            btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        } else {
            log(`⚠ Button not found: ${selector}`);
        }
        setTimeout(resolve, 30);
    });
}

function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
}

// ── auto-resume ───────────────────────────────────────────
chrome.storage.local.get(['isRunning'], (r) => {
    if (r.isRunning) {
        isRunning = true;
        log('🔄 Resuming from previous session');
        startAutomation();
    }
});

log('🎮 Content script loaded (Fraction.js v' + (typeof Fraction !== 'undefined' ? 'OK' : 'MISSING') + ')');
