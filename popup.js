// Vanilla JS popup controller
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggleBtn');
  const statusBadge = document.getElementById('statusBadge');
  const lastAnswerSec = document.getElementById('lastAnswerSection');
  const lastAnswerEl = document.getElementById('lastAnswer');
  const errorSection = document.getElementById('errorSection');
  const errorMessage = document.getElementById('errorMessage');
  const logArea = document.getElementById('logArea');

  let isRunning = false;

  function setRunningUI(running) {
    isRunning = running;
    if (running) {
      statusBadge.textContent = 'Running';
      statusBadge.className = 'status-badge status-running';
      toggleBtn.textContent = 'Stop Bot';
      toggleBtn.className = 'toggle-btn btn-stop';
    } else {
      statusBadge.textContent = 'Stopped';
      statusBadge.className = 'status-badge status-stopped';
      toggleBtn.textContent = 'Start Bot';
      toggleBtn.className = 'toggle-btn btn-start';
    }
  }

  function addLog(msg) {
    const p = document.createElement('p');
    p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logArea.prepend(p);
    while (logArea.children.length > 30) logArea.lastChild.remove();
  }

  // Load saved state
  chrome.storage.local.get(['isRunning'], (result) => {
    if (result.isRunning) setRunningUI(true);
  });

  // Toggle bot
  toggleBtn.addEventListener('click', () => {
    errorSection.style.display = 'none';
    const newState = !isRunning;
    setRunningUI(newState);
    chrome.storage.local.set({ isRunning: newState });
    addLog(newState ? 'Starting bot…' : 'Stopping bot…');

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: newState ? 'start' : 'stop' },
        (response) => {
          if (chrome.runtime.lastError) {
            addLog('Error: ' + chrome.runtime.lastError.message);
            errorSection.style.display = '';
            errorMessage.textContent =
              'Could not reach content script. Make sure you are on play.rocketmath.com and refresh the page.';
            setRunningUI(false);
            chrome.storage.local.set({ isRunning: false });
          } else {
            addLog(newState ? 'Bot started ✅' : 'Bot stopped 🛑');
          }
        }
      );
    });
  });

  // Listen for updates from content script
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'updateAnswer') {
      lastAnswerSec.style.display = '';
      lastAnswerEl.textContent = msg.answer;
      addLog('Answer: ' + msg.answer);
    } else if (msg.action === 'error') {
      errorSection.style.display = '';
      errorMessage.textContent = msg.message;
      addLog('Error: ' + msg.message);
    } else if (msg.action === 'log') {
      addLog(msg.message);
    }
  });
});
