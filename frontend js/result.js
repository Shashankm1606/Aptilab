const testResults = JSON.parse(sessionStorage.getItem('testResults') || '{}');

function formatTimeSpent(seconds) {
    if (!Number.isFinite(seconds)) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
}

function buildScoreData() {
    const total = Number(testResults.total || testResults.totalQuestions || 0);
    const correct = Number(testResults.score || 0);
    const computedPercentage = total > 0 ? Math.round((correct / total) * 100) : 0;
    return {
        total,
        correct,
        percentage: Number.isFinite(testResults.percentage) ? Number(testResults.percentage) : computedPercentage,
        timeTaken: formatTimeSpent(Number(testResults.timeSpent))
    };
}

function renderScore(data) {
    const correctEl = document.getElementById('correctAnswers');
    const totalEl = document.getElementById('totalQuestions');
    const timeEl = document.getElementById('timeTaken');
    const percentEl = document.getElementById('scorePercentage');
    const fractionEl = document.getElementById('scoreFraction');

    if (correctEl) correctEl.textContent = String(data.correct);
    if (totalEl) totalEl.textContent = String(data.total);
    if (timeEl) timeEl.textContent = data.timeTaken;
    if (percentEl) percentEl.textContent = `${data.percentage}%`;
    if (fractionEl) fractionEl.textContent = `${data.correct}/${data.total}`;
}

function animateProgress(percentage) {
    const circle = document.getElementById('progressCircle');
    if (!circle) return;
    const radius = Number(circle.getAttribute('r')) || 85;
    const circumference = 2 * Math.PI * radius;
    circle.style.strokeDasharray = String(circumference);
    const offset = circumference * (1 - (Math.max(0, Math.min(percentage, 100)) / 100));
    circle.style.strokeDashoffset = String(offset);
}

function renderAnswerReview() {
    const list = document.getElementById('answerReviewList');
    if (!list) return;

    const details = Array.isArray(testResults.answerDetails) ? testResults.answerDetails : [];
    if (details.length === 0) {
        list.innerHTML = '<div class="answer-item"><div class="answer-q">No detailed answer data available for this test.</div></div>';
        return;
    }

    list.innerHTML = details.map((item, index) => {
        const statusClass = item.is_correct ? 'correct' : 'wrong';
        const userText = item.selected_option
            ? `${item.selected_option}) ${item.selected_text || ''}`
            : 'Not answered';
        const correctText = `${item.correct_option}) ${item.correct_text || ''}`;
        const statusTag = item.is_correct
            ? '<span class="correct-tag">Correct</span>'
            : '<span class="wrong-tag">Wrong</span>';

        return `
            <div class="answer-item ${statusClass}">
                <div class="answer-q"><strong>Q${index + 1}.</strong> ${item.question}</div>
                <div class="answer-meta">
                    <span>Your Answer: ${userText}</span>
                    <span>Correct Answer: ${correctText}</span>
                    ${statusTag}
                </div>
            </div>
        `;
    }).join('');
}

function handleLogout() {
    localStorage.removeItem('aptilabCurrentUserName');
    localStorage.removeItem('aptilabCurrentUserEmail');
    sessionStorage.removeItem('testResults');
    window.location.href = 'login.html';
}

function handleRetakeTest() {
    window.location.href = 'test.html';
}

async function handleSendEmail(event) {
    event.preventDefault();
    const emailInput = document.getElementById('emailInput');
    const successEl = document.getElementById('emailSuccess');
    const errorEl = document.getElementById('emailError');
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const labelEl = submitBtn ? submitBtn.querySelector('.btn-label') : null;

    if (successEl) {
        successEl.classList.remove('show');
        successEl.textContent = '';
    }
    if (errorEl) {
        errorEl.classList.remove('show');
        errorEl.textContent = '';
    }

    const email = emailInput ? emailInput.value.trim() : '';
    if (!email) {
        if (errorEl) {
            errorEl.textContent = 'Please enter a valid email address.';
            errorEl.classList.add('show');
        }
        return;
    }

    if (submitBtn) submitBtn.disabled = true;
    if (labelEl) labelEl.textContent = 'Sending...';

    try {
        const response = await fetch('http://localhost:3307/api/send-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to send report.');
        }
        if (successEl) {
            successEl.textContent = 'Report sent successfully!';
            successEl.classList.add('show');
        }
    } catch (error) {
        if (errorEl) {
            errorEl.textContent = error.message || 'Failed to send report.';
            errorEl.classList.add('show');
        }
    } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (labelEl) labelEl.textContent = 'Send Report';
    }
}

window.addEventListener('load', () => {
    const scoreData = buildScoreData();
    renderScore(scoreData);
    animateProgress(scoreData.percentage);
    renderAnswerReview();

    const emailInput = document.getElementById('emailInput');
    const userEmail = localStorage.getItem('aptilabCurrentUserEmail');
    if (emailInput && userEmail) {
        emailInput.value = userEmail;
    }
});

window.handleLogout = handleLogout;
window.handleRetakeTest = handleRetakeTest;
window.handleSendEmail = handleSendEmail;
