/* 
   ADD THIS CODE TO YOUR result.js FILE
   
   Replace the scoreData initialization with this code
   that retrieves data from sessionStorage
*/

// Load test results from sessionStorage
const testResults = JSON.parse(sessionStorage.getItem('testResults') || '{}');

// Score data extracted from test results
const computedTotal = testResults.total || testResults.totalQuestions || 10;
const computedCorrect = testResults.score || testResults.answeredQuestions || 0;
const scoreData = {
    percentage: testResults.percentage || Math.round((computedCorrect / computedTotal) * 100) || 0,
    correct: computedCorrect,
    total: computedTotal,
    timeTaken: formatTimeSpent(testResults.timeSpent)
};


// Helper function to format time
function formatTimeSpent(seconds) {
    if (!seconds) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
}

// Update the initialization to use the loaded data
window.addEventListener('load', () => {
    if (typeof createNeuralNetwork === 'function') {
        createNeuralNetwork();
    }
    if (typeof createParticles === 'function') {
        createParticles();
    }
    if (typeof animateProgress === 'function') {
        animateProgress();
    }
    
    renderScore(scoreData);
    hydrateFromDatabase();
});

function renderScore(data) {
    const correctEl = document.getElementById('correctAnswers');
    const totalEl = document.getElementById('totalQuestions');
    const timeEl = document.getElementById('timeTaken');
    const percentEl = document.getElementById('scorePercentage');
    if (!correctEl || !totalEl || !timeEl || !percentEl) {
        console.error('Result elements not found in DOM.');
        return;
    }

    correctEl.textContent = data.correct;
    totalEl.textContent = data.total;
    timeEl.textContent = data.timeTaken;
    percentEl.textContent = `${data.percentage}%`;

    const fractionElement = document.getElementById('scoreFraction');
    if (fractionElement) {
        fractionElement.textContent = `${data.correct}/${data.total}`;
    }
}

async function hydrateFromDatabase() {
    const userEmail = localStorage.getItem('aptilabCurrentUserEmail');
    if (!userEmail) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:3307/api/user-results/${encodeURIComponent(userEmail)}`);
        if (!response.ok) {
            return;
        }
        const data = await response.json();
        const latest = data.results && data.results[0];
        if (!latest) {
            return;
        }

        const total = latest.total_questions || scoreData.total;
        const correct = latest.score || scoreData.correct;
        const percentage = latest.percentage || Math.round((correct / total) * 100) || 0;
        const timeTaken = scoreData.timeTaken;

        renderScore({
            total,
            correct,
            percentage,
            timeTaken
        });
    } catch (error) {
        console.error('Failed to load results from database:', error);
    }
}

/* 
   Your existing functions (animateProgress, handleSendEmail, etc.) 
   should work with the updated scoreData object
*/

// Logout -> back to login page
function handleLogout() {
    localStorage.removeItem('aptilabCurrentUserName');
    localStorage.removeItem('aptilabCurrentUserEmail');
    window.location.href = 'login.html';
}

// Retake test -> back to test page
function handleRetakeTest() {
    window.location.href = 'test.html';
}

async function handleSendEmail(event) {
    event.preventDefault();
    const emailInput = document.getElementById('emailInput');
    const successEl = document.getElementById('emailSuccess');
    const errorEl = document.getElementById('emailError');
    const submitBtn = event.target && event.target.querySelector
        ? event.target.querySelector('button[type="submit"]')
        : null;
    const labelEl = submitBtn ? submitBtn.querySelector('.btn-label') : null;
    const defaultLabel = labelEl ? labelEl.textContent : 'Send Report';

    const setSendingState = (isSending) => {
        if (!submitBtn) return;
        submitBtn.disabled = isSending;
        submitBtn.setAttribute('aria-busy', isSending ? 'true' : 'false');
        if (labelEl) {
            labelEl.textContent = isSending ? 'Sending...' : defaultLabel;
        }
    };

    if (successEl) successEl.textContent = '';
    if (errorEl) errorEl.textContent = '';
    setSendingState(true);

    const email = emailInput ? emailInput.value.trim() : '';
    if (!email) {
        if (errorEl) errorEl.textContent = 'Please enter a valid email address.';
        if (!errorEl) alert('Please enter a valid email address.');
        setSendingState(false);
        return;
    }

    try {
        const response = await fetch('http://localhost:3307/api/send-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        let data = {};
        try {
            data = await response.json();
        } catch (parseError) {
            data = {};
        }
        if (!response.ok || !data.success) {
            const serverMessage = data && data.error ? data.error : '';
            const statusMessage = response.ok ? '' : `HTTP ${response.status}`;
            const message = serverMessage || statusMessage || 'Failed to send report.';
            throw new Error(message);
        }

        if (successEl) successEl.textContent = 'Report sent successfully!';
        if (emailInput) emailInput.value = '';
    } catch (error) {
        if (errorEl) errorEl.textContent = error.message || 'Failed to send report.';
        if (!errorEl) alert(error.message || 'Failed to send report.');
    }
    setSendingState(false);
}

// Prefill email input with logged-in user email
window.addEventListener('load', () => {
    const emailInput = document.getElementById('emailInput');
    const storedEmail = localStorage.getItem('aptilabCurrentUserEmail');
    if (emailInput && storedEmail) {
        emailInput.value = storedEmail;
    }
});

window.handleSendEmail = handleSendEmail;
