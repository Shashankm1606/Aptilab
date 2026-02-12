// ===========================
// AptiLab Dashboard JavaScript
// Neo Tech Blue Theme
// ===========================

// Global variable to store selected topic
let selectedTopic = 'Maths';

// Topic Selection Function
function selectTopic(topic) {
    selectedTopic = topic;
    
    // Remove 'selected' class from all chips
    const chips = document.querySelectorAll('.topic-chip');
    chips.forEach(chip => {
        chip.classList.remove('selected');
    });
    
    // Add 'selected' class to clicked chip
    event.target.classList.add('selected');
    
    console.log('Selected topic:', topic);
}

// Start Test Function
function startTest() {
    console.log('Starting test for topic:', selectedTopic);
    localStorage.setItem('aptilabSelectedTopic', selectedTopic);
    window.location.href = 'test.html';
}

// Initialize Performance Chart
let performanceChart = null;

function initializeChart() {
    const ctx = document.getElementById('performanceChart').getContext('2d');
    
    performanceChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Passed', 'Failed'],
            datasets: [{
                data: [0, 0],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(239, 68, 68, 1)',
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#e0f2fe',
                        font: {
                            family: 'Poppins',
                            size: 12
                        },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleFont: {
                        family: 'Poppins',
                        size: 14
                    },
                    bodyFont: {
                        family: 'Poppins',
                        size: 12
                    }
                }
            }
        }
    });
}

// Animate Proficiency Bars
function animateProficiencyBars() {
    const bars = document.querySelectorAll('.proficiency-bar');
    
    bars.forEach((bar, index) => {
        const width = bar.getAttribute('data-width');
        setTimeout(() => {
            bar.style.width = width + '%';
        }, index * 100);
    });
}

// Apply logged-in user name to profile card
function applyLoggedInUser() {
    const displayName = localStorage.getItem('aptilabCurrentUserName');
    const displayEmail = localStorage.getItem('aptilabCurrentUserEmail');
    if (!displayName) {
        return;
    }

    const nameElement = document.querySelector('.dashboard-row .neo-card .card-title');
    const emailElement = document.querySelector('.dashboard-row .neo-card .card-subtitle');
    if (nameElement) {
        nameElement.textContent = displayName;
    }
    if (emailElement && displayEmail) {
        emailElement.textContent = displayEmail;
    }
}

function renderPreviousTests(results) {
    const list = document.getElementById('previousTestsList');
    if (!list) {
        return;
    }

    if (!results || results.length === 0) {
        list.innerHTML = `
            <div class="test-item">
                <span class="test-subject">No tests yet</span>
                <span class="test-score">--</span>
            </div>
        `;
        return;
    }

    const topResults = results.slice(0, 5);
    list.innerHTML = topResults.map((row) => {
        const percentage = typeof row.percentage === 'number' ? Math.round(row.percentage) : '--';
        const topic = row.topic || 'General';
        const score = Number.isFinite(row.score) ? row.score : '--';
        const total = Number.isFinite(row.total_questions) ? row.total_questions : '--';
        const markText = `${score}/${total}`;
        return `
            <div class="test-item">
                <span class="test-subject">${topic}</span>
                <span class="test-score">${markText} (${percentage}%)</span>
            </div>
        `;
    }).join('');
}

function calculateTopicAverages(results) {
    const totals = {};
    const counts = {};

    results.forEach((row) => {
        const topic = row.topic || 'General';
        const percentage = Number(row.percentage);
        if (Number.isNaN(percentage)) {
            return;
        }
        totals[topic] = (totals[topic] || 0) + percentage;
        counts[topic] = (counts[topic] || 0) + 1;
    });

    const averages = {};
    Object.keys(totals).forEach((topic) => {
        averages[topic] = Math.round(totals[topic] / counts[topic]);
    });

    return averages;
}

function updatePerformanceChart(results) {
    if (!performanceChart) {
        return;
    }

    const passThreshold = 50;
    let passed = 0;
    let failed = 0;

    results.forEach((row) => {
        const percentage = Number(row.percentage);
        if (Number.isNaN(percentage)) {
            return;
        }
        if (percentage >= passThreshold) {
            passed += 1;
        } else {
            failed += 1;
        }
    });

    performanceChart.data.datasets[0].data = [passed, failed];
    performanceChart.update();
}

function updateProficiency(averages) {
    const percentElements = document.querySelectorAll('.proficiency-percent');
    percentElements.forEach((element) => {
        const topic = element.getAttribute('data-topic');
        if (!topic || averages[topic] === undefined) {
            return;
        }
        element.textContent = `${averages[topic]}%`;
    });

    const bars = document.querySelectorAll('.proficiency-bar');
    bars.forEach((bar) => {
        const topic = bar.getAttribute('data-topic');
        if (!topic || averages[topic] === undefined) {
            return;
        }
        bar.setAttribute('data-width', averages[topic]);
    });

    animateProficiencyBars();
}

function updateBestTopic(averages) {
    const bestTopicValue = document.getElementById('bestTopicValue');
    if (!bestTopicValue) {
        return;
    }

    const topics = Object.keys(averages);
    if (topics.length === 0) {
        bestTopicValue.textContent = '--';
        return;
    }

    let bestTopic = topics[0];
    topics.forEach((topic) => {
        if (averages[topic] > averages[bestTopic]) {
            bestTopic = topic;
        }
    });

    bestTopicValue.textContent = `${bestTopic} (${averages[bestTopic]}%)`;
}

async function loadDashboardResults() {
    const email = localStorage.getItem('aptilabCurrentUserEmail');
    if (!email) {
        renderPreviousTests([]);
        updatePerformanceChart([]);
        updateBestTopic({});
        return;
    }

    try {
        const response = await fetch(`http://localhost:3307/api/user-results/${encodeURIComponent(email)}`);
        if (!response.ok) {
            throw new Error(`Failed to load results: ${response.status}`);
        }
        const data = await response.json();
        const results = Array.isArray(data.results) ? data.results : [];
        renderPreviousTests(results);
        updatePerformanceChart(results);
        const averages = calculateTopicAverages(results);
        updateProficiency(averages);
        updateBestTopic(averages);
    } catch (error) {
        console.error('Failed to load dashboard results:', error);
    }
}

// Initialize on page load
window.addEventListener('load', () => {
    applyLoggedInUser();
    initializeChart();
    loadDashboardResults();
});
