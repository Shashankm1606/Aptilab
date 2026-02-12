const CONFIG = {
    apiBaseUrl: 'http://localhost:3307',
    testDurationMinutes: 2,
    totalQuestions: 10,
    resultPageUrl: 'result.html'
};

const STATE = {
    timerInterval: null,
    remainingSeconds: CONFIG.testDurationMinutes * 60,
    startTime: null,
    answers: {},
    questions: [],
    totalQuestions: CONFIG.totalQuestions,
    topic: localStorage.getItem('aptilabSelectedTopic') || 'Maths'
};

const DOM = {
    welcomeScreen: document.getElementById('welcomeScreen'),
    testScreen: document.getElementById('testScreen'),
    startTestBtn: document.getElementById('startTestBtn'),
    submitTestBtn: document.getElementById('submitTestBtn'),
    timerDisplay: document.getElementById('timerDisplay'),
    timerContainer: document.getElementById('timerContainer'),
    questionsContainer: document.getElementById('questionsContainer'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    timeUpModal: document.getElementById('timeUpModal')
};

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function updateTimerDisplay() {
    DOM.timerDisplay.textContent = formatTime(STATE.remainingSeconds);
    if (STATE.remainingSeconds <= 30) {
        DOM.timerContainer.classList.add('warning');
    }
}

function startTimer() {
    STATE.startTime = Date.now();
    updateTimerDisplay();

    STATE.timerInterval = setInterval(() => {
        STATE.remainingSeconds -= 1;
        updateTimerDisplay();
        if (STATE.remainingSeconds <= 0) {
            handleTimeUp();
        }
    }, 1000);
}

function stopTimer() {
    if (STATE.timerInterval) {
        clearInterval(STATE.timerInterval);
        STATE.timerInterval = null;
    }
}

function showTimeUpModal() {
    DOM.timeUpModal.classList.remove('hidden');
}

function handleTimeUp() {
    stopTimer();
    showTimeUpModal();
    setTimeout(() => submitTest(true), 1500);
}

async function fetchAiQuestions() {
    const url = `${CONFIG.apiBaseUrl}/api/questions?count=${CONFIG.totalQuestions}&topic=${encodeURIComponent(STATE.topic)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || data.detail || `Failed to fetch questions (${response.status})`);
    }

    if (!Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('AI returned no questions');
    }

    STATE.totalQuestions = data.questions.length;
    return data.questions;
}

function renderQuestions(questions) {
    STATE.questions = questions;
    DOM.questionsContainer.innerHTML = '';

    questions.forEach((question, index) => {
        const card = document.createElement('div');
        card.className = 'question-card';
        card.setAttribute('data-question-id', String(question.id));

        card.innerHTML = `
            <div class="question-header">
                <div class="question-number">${index + 1}</div>
                <div class="question-text">${question.question}</div>
            </div>
            <div class="options-container">
                ${question.options.map((option, optionIndex) => `
                    <label class="option-label">
                        <input type="radio" name="question-${question.id}" value="${optionIndex}" data-question-id="${question.id}">
                        <span class="option-text">${option}</span>
                    </label>
                `).join('')}
            </div>
        `;

        card.querySelectorAll('input[type="radio"]').forEach((radio) => {
            radio.addEventListener('change', handleAnswerSelection);
        });

        DOM.questionsContainer.appendChild(card);
    });
}

function handleAnswerSelection(event) {
    const questionId = event.target.getAttribute('data-question-id');
    const selectedValue = event.target.value;
    STATE.answers[questionId] = selectedValue;

    const questionCard = event.target.closest('.question-card');
    questionCard.querySelectorAll('.option-label').forEach((label) => label.classList.remove('selected'));
    event.target.closest('.option-label').classList.add('selected');

    updateProgress();
}

function updateProgress() {
    const answeredCount = Object.keys(STATE.answers).length;
    const progress = (answeredCount / STATE.totalQuestions) * 100;
    DOM.progressBar.style.width = `${progress}%`;
    DOM.progressText.textContent = `${answeredCount}/${STATE.totalQuestions} Answered`;
}

function calculateScoreAndDetails() {
    let score = 0;
    const answerDetails = STATE.questions.map((question) => {
        const selectedIndexRaw = STATE.answers[String(question.id)];
        const selectedIndex = selectedIndexRaw !== undefined ? parseInt(selectedIndexRaw, 10) : null;
        const selectedOption = selectedIndex !== null ? ['A', 'B', 'C', 'D'][selectedIndex] : null;
        const isCorrect = selectedOption === question.correct_option;

        if (isCorrect) {
            score += 1;
        }

        return {
            id: question.id,
            question: question.question,
            options: question.options,
            selected_option: selectedOption,
            correct_option: question.correct_option,
            selected_text: selectedIndex !== null ? question.options[selectedIndex] : null,
            correct_text: question.options[['A', 'B', 'C', 'D'].indexOf(question.correct_option)],
            is_correct: isCorrect
        };
    });

    return { score, answerDetails };
}

function prepareResultsData(score, answerDetails) {
    const endTime = Date.now();
    const totalTimeSpent = Math.floor((endTime - STATE.startTime) / 1000);
    const percentage = Math.round((score / STATE.totalQuestions) * 100);

    return {
        topic: STATE.topic,
        score,
        total: STATE.totalQuestions,
        totalQuestions: STATE.totalQuestions,
        answeredQuestions: Object.keys(STATE.answers).length,
        percentage,
        timeSpent: totalTimeSpent,
        submittedAt: new Date().toISOString(),
        answers: STATE.answers,
        questions: STATE.questions,
        answerDetails
    };
}

async function submitTest(autoSubmit = false) {
    stopTimer();

    if (!autoSubmit) {
        const answeredCount = Object.keys(STATE.answers).length;
        if (answeredCount !== STATE.totalQuestions) {
            const unanswered = STATE.totalQuestions - answeredCount;
            const ok = confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`);
            if (!ok) {
                startTimer();
                return;
            }
        }
    }

    const { score, answerDetails } = calculateScoreAndDetails();
    const testResults = prepareResultsData(score, answerDetails);

    try {
        const response = await fetch(`${CONFIG.apiBaseUrl}/api/submit-test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_email: localStorage.getItem('aptilabCurrentUserEmail') || 'anonymous@aptilab.local',
                user_name: localStorage.getItem('aptilabCurrentUserName') || 'Anonymous',
                score,
                total_questions: STATE.totalQuestions,
                topic: STATE.topic,
                time_spent: testResults.timeSpent,
                answers: answerDetails
            })
        });

        const data = await response.json();
        if (response.ok && data.success) {
            testResults.percentage = data.percentage;
        }
    } catch (error) {
        console.error('Failed to save test result:', error);
    }

    sessionStorage.setItem('testResults', JSON.stringify(testResults));
    window.location.href = CONFIG.resultPageUrl;
}

async function startTest() {
    DOM.startTestBtn.disabled = true;
    DOM.startTestBtn.querySelector('span').textContent = 'Generating AI Questions...';

    try {
        const questions = await fetchAiQuestions();
        DOM.welcomeScreen.classList.add('hidden');
        renderQuestions(questions);
        DOM.testScreen.classList.remove('hidden');
        updateProgress();
        startTimer();
    } catch (error) {
        alert(`Could not generate AI questions for ${STATE.topic}. ${error.message}`);
        DOM.startTestBtn.disabled = false;
        DOM.startTestBtn.querySelector('span').textContent = 'Start Test';
    }
}

function initEventListeners() {
    DOM.startTestBtn.addEventListener('click', startTest);
    DOM.submitTestBtn.addEventListener('click', () => submitTest(false));
    window.addEventListener('beforeunload', (event) => {
        if (STATE.timerInterval !== null) {
            event.preventDefault();
            event.returnValue = '';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const welcomeText = document.querySelector('.welcome-text');
    if (welcomeText) {
        welcomeText.innerHTML = `This assessment contains <strong>${CONFIG.totalQuestions} AI-generated ${STATE.topic}</strong> questions and you'll have <strong>${CONFIG.testDurationMinutes} minutes</strong> to complete it.`;
    }
    initEventListeners();
});
