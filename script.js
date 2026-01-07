async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

function launchConfetti() {
    const duration = 5000;
    const end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 7,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#667eea', '#764ba2', '#f093fb', '#4CAF50', '#FF9800']
        });
        confetti({
            particleCount: 7,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#667eea', '#764ba2', '#f093fb', '#4CAF50', '#FF9800']
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}

let solvedChallenges = JSON.parse(localStorage.getItem('solvedChallenges')) || [];

document.addEventListener('DOMContentLoaded', () => {
    updateScore();
    loadSolvedChallenges();
    checkAndUnlockChallenges();
    setupEventListeners();
    setupResetButton();
    createModal();
    
    const completionMsg = document.getElementById('completionMessage');
    if (completionMsg) {
        completionMsg.addEventListener('click', (e) => {
            if (e.target.id === 'completionMessage') {
                completionMsg.classList.remove('show');
            }
        });
    }
});

function setupEventListeners() {
    document.querySelectorAll('.submit-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const card = e.target.closest('.challenge-card');
            
            if (card.classList.contains('locked')) {
                return;
            }
            
            const challengeId = card.dataset.challenge;
            const input = card.querySelector('.flag-input');
            const result = card.querySelector('.result');
            
            const userFlag = input.value.trim().toLowerCase();  // ← ADDED .toLowerCase()
            if (!userFlag) {
                showResult(result, 'Please enter a flag', false);
                return;
            }
            
            const userHash = await sha256(userFlag);
            
            if (userHash === challenges[challengeId]) {
                if (!solvedChallenges.includes(challengeId)) {
                    solvedChallenges.push(challengeId);
                    localStorage.setItem('solvedChallenges', JSON.stringify(solvedChallenges));
                    updateScore();
                }
                
                card.classList.add('solved');
                showResult(result, '✓ Correct! Challenge solved!', true);
                input.disabled = true;

                checkAndUnlockChallenges();
                
                if (solvedChallenges.length === 24) {
                    setTimeout(() => {
                        launchConfetti();
                        document.getElementById('completionMessage').classList.add('show');
                    }, 500);
                }
            } else {
                showResult(result, '✗ Incorrect flag. Try again!', false);
            }
        });
    });
}

function setupResetButton() {
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            showResetModal();
        });
    }
}

function createModal() {
    const modalHTML = `
        <div id="resetModal" class="modal-overlay">
            <div class="modal-content">
                <h3>⚠️ Reset Progress?</h3>
                <p>Are you sure you want to reset all your progress? This will clear all solved challenges and your score.</p>
                <div class="modal-buttons">
                    <button class="modal-btn confirm" id="confirmReset">Yes, Reset</button>
                    <button class="modal-btn cancel" id="cancelReset">Cancel</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    document.getElementById('confirmReset').addEventListener('click', confirmReset);
    document.getElementById('cancelReset').addEventListener('click', hideResetModal);
    document.getElementById('resetModal').addEventListener('click', (e) => {
        if (e.target.id === 'resetModal') {
            hideResetModal();
        }
    });
}

function showResetModal() {
    document.getElementById('resetModal').classList.add('show');
}

function hideResetModal() {
    document.getElementById('resetModal').classList.remove('show');
}

function confirmReset() {
    localStorage.clear();
    hideResetModal();
    setTimeout(() => {
        location.reload();
    }, 300);
}

function showResult(element, message, isSuccess) {
    element.textContent = message;
    element.className = 'result ' + (isSuccess ? 'success' : 'error');
    element.style.display = 'block';
    
    setTimeout(() => {
        if (!isSuccess) {
            element.style.display = 'none';
        }
    }, 3000);
}

function updateScore() {
    document.getElementById('score').textContent = solvedChallenges.length;
}

function loadSolvedChallenges() {
    solvedChallenges.forEach(challengeId => {
        const card = document.querySelector(`[data-challenge="${challengeId}"]`);
        if (card) {
            card.classList.add('solved');
            const input = card.querySelector('.flag-input');
            const result = card.querySelector('.result');
            if (input) input.disabled = true;
            showResult(result, '✓ Already solved!', true);
        }
    });
    
    if (solvedChallenges.length === 24) {
        document.getElementById('completionMessage').classList.add('show');
        launchConfetti();
    }
}

function checkAndUnlockChallenges() {
    document.querySelectorAll('.challenge-card[data-requires]').forEach(card => {
        const requires = card.dataset.requires;
        if (requires) {
            const requiredChallenges = requires.split(',');
            const allCompleted = requiredChallenges.every(id => solvedChallenges.includes(id));
            
            if (allCompleted) {
                card.classList.remove('locked');
            } else {
                if (!card.classList.contains('locked')) {
                    card.classList.add('locked');
                }
            }
        }
    });
}

function resetProgress() {
    localStorage.clear();
    location.reload();
}
