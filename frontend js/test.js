/* ========================================
   TEST PAGE - MAIN JAVASCRIPT
   UPDATED WITH API INTEGRATION
   ======================================== */

// ========================================
// CONFIGURATION & STATE
// ========================================

const CONFIG = {
    testDurationMinutes: 2,
    totalQuestions: 10,
    optionsPerQuestion: 4,
    resultPageUrl: 'result.html'
};

const STATE = {
    timerInterval: null,
    remainingSeconds: CONFIG.testDurationMinutes * 60,
    startTime: null,
    answers: {},
    questions: [],
    totalQuestions: CONFIG.totalQuestions
};

// ========================================
// DOM ELEMENTS
// ========================================

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

// ========================================
// PLACEHOLDER QUESTIONS
// ========================================

/**
 * Fetches questions from the Gemini API backend
 */
async function fetchQuestionsFromAPI() {
    try {
        const topic = localStorage.getItem('aptilabSelectedTopic') || 'General';
        const desiredCount = getDesiredQuestionCount(topic);
        console.log(`🔍 Fetching ${desiredCount} questions for topic: ${topic}`);
        
        const userEmail = localStorage.getItem('aptilabCurrentUserEmail') || 'anonymous';
        const response = await fetch(
            `http://localhost:3307/api/questions?count=${desiredCount}&topic=${encodeURIComponent(topic)}&user_email=${encodeURIComponent(userEmail)}`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`✅ Received ${data.questions.length} questions from API`);
        if (!Array.isArray(data.questions) || data.questions.length === 0) {
            throw new Error('No questions returned from API');
        }
        STATE.totalQuestions = data.questions.length;
        return data.questions;
    } catch (error) {
        console.error('❌ Error fetching questions from API:', error);
        alert('Could not connect to server. Using demo questions. Make sure backend is running!');
        const fallback = getPlaceholderQuestions();
        STATE.totalQuestions = fallback.length;
        return fallback;
    }
}

function getPlaceholderQuestions() {
    const topic = localStorage.getItem('aptilabSelectedTopic') || 'General';
    
    // Cloud Computing questions - 50 MCQs
    if (topic.toLowerCase() === 'cloud' || topic.toLowerCase() === 'cloud computing') {
        return [
            { id: 1, question: "What is Cloud Computing?", options: ["Storing data on local servers", "Using remote servers over the internet", "Using only private networks", "Using hardware without software"], correct_option: "B" },
            { id: 2, question: "Which of the following is a cloud service model?", options: ["LAN", "WAN", "IaaS", "VPN"], correct_option: "C" },
            { id: 3, question: "What does IaaS stand for?", options: ["Internet as a Service", "Infrastructure as a Service", "Information as a Service", "Instance as a Service"], correct_option: "B" },
            { id: 4, question: "Which cloud model provides virtual machines?", options: ["SaaS", "PaaS", "IaaS", "FaaS"], correct_option: "C" },
            { id: 5, question: "What does PaaS provide?", options: ["Only applications", "Hardware only", "Platform to develop applications", "Network cables"], correct_option: "C" },
            { id: 6, question: "Which service model provides ready-to-use applications?", options: ["IaaS", "PaaS", "SaaS", "DaaS"], correct_option: "C" },
            { id: 7, question: "Which is an example of SaaS?", options: ["AWS EC2", "Google Docs", "Docker", "Kubernetes"], correct_option: "B" },
            { id: 8, question: "Which cloud deployment model is shared by multiple organizations?", options: ["Private cloud", "Public cloud", "Hybrid cloud", "Community cloud"], correct_option: "D" },
            { id: 9, question: "What is a Public Cloud?", options: ["Used by one organization only", "Accessible over the internet", "Installed on personal computers", "Works without internet"], correct_option: "B" },
            { id: 10, question: "Which cloud is a combination of public and private clouds?", options: ["Community cloud", "Public cloud", "Private cloud", "Hybrid cloud"], correct_option: "D" },
            { id: 11, question: "Which company provides AWS?", options: ["Microsoft", "Google", "Amazon", "IBM"], correct_option: "C" },
            { id: 12, question: "What does AWS EC2 provide?", options: ["Storage", "Virtual servers", "Databases", "Email service"], correct_option: "B" },
            { id: 13, question: "Which service is used for cloud storage?", options: ["EC2", "S3", "Lambda", "VPC"], correct_option: "B" },
            { id: 14, question: "What does S3 stand for?", options: ["Simple Storage Service", "Secure Storage System", "Server Storage Setup", "Shared System Storage"], correct_option: "A" },
            { id: 15, question: "Which cloud feature allows automatic resource scaling?", options: ["Virtualization", "Elasticity", "Redundancy", "Encryption"], correct_option: "B" },
            { id: 16, question: "What is virtualization?", options: ["Running one OS on one machine", "Running multiple OS on one machine", "Removing hardware", "Increasing network speed"], correct_option: "B" },
            { id: 17, question: "Which component enables virtualization?", options: ["Router", "Switch", "Hypervisor", "Firewall"], correct_option: "C" },
            { id: 18, question: "Which hypervisor runs directly on hardware?", options: ["Type 1", "Type 2", "Type 3", "Virtual OS"], correct_option: "A" },
            { id: 19, question: "What is pay-as-you-go pricing?", options: ["Fixed monthly payment", "Free services", "Pay only for used resources", "Lifetime license"], correct_option: "C" },
            { id: 20, question: "Which cloud benefit reduces hardware costs?", options: ["Scalability", "High latency", "On-premise servers", "Manual maintenance"], correct_option: "A" },
            { id: 21, question: "What is cloud availability?", options: ["Speed of the server", "Percentage of uptime", "Number of users", "Amount of storage"], correct_option: "B" },
            { id: 22, question: "Which region concept improves fault tolerance?", options: ["Availability zones", "Databases", "Containers", "Billing"], correct_option: "A" },
            { id: 23, question: "What is multi-tenancy?", options: ["One user per server", "Multiple users sharing resources", "Private ownership", "Local hosting"], correct_option: "B" },
            { id: 24, question: "Which service is serverless?", options: ["EC2", "RDS", "Lambda", "VPC"], correct_option: "C" },
            { id: 25, question: "Serverless means:", options: ["No servers exist", "User manages servers", "Cloud provider manages servers", "Application runs offline"], correct_option: "C" },
            { id: 26, question: "Which cloud service is used for managed databases?", options: ["EC2", "RDS", "S3", "CloudFront"], correct_option: "B" },
            { id: 27, question: "What does RDS stand for?", options: ["Relational Data Storage", "Remote Database Service", "Relational Database Service", "Redundant Data Service"], correct_option: "C" },
            { id: 28, question: "Which cloud feature ensures data backup?", options: ["Scalability", "Redundancy", "Latency", "Load balancing"], correct_option: "B" },
            { id: 29, question: "Which tool distributes traffic across servers?", options: ["Firewall", "Load balancer", "Router", "Gateway"], correct_option: "B" },
            { id: 30, question: "What is cloud elasticity?", options: ["Fixed resources", "Manual scaling", "Automatic scaling", "Data compression"], correct_option: "C" },
            { id: 31, question: "Which cloud provider is owned by Microsoft?", options: ["AWS", "Azure", "GCP", "Oracle Cloud"], correct_option: "B" },
            { id: 32, question: "Which Google cloud service provides virtual machines?", options: ["App Engine", "Compute Engine", "Cloud Storage", "BigQuery"], correct_option: "B" },
            { id: 33, question: "Which cloud model is most secure?", options: ["Public", "Private", "Community", "Hybrid"], correct_option: "B" },
            { id: 34, question: "What is a VPC?", options: ["Virtual Private Cloud", "Virtual Public Connection", "Verified Private Channel", "Virtual Processing Core"], correct_option: "A" },
            { id: 35, question: "Which cloud risk involves data exposure?", options: ["Scalability", "Data breach", "Redundancy", "Elasticity"], correct_option: "B" },
            { id: 36, question: "What does cloud migration mean?", options: ["Creating cloud", "Moving applications to cloud", "Removing servers", "Buying hardware"], correct_option: "B" },
            { id: 37, question: "Which factor improves performance?", options: ["Latency", "High traffic", "Load balancing", "Downtime"], correct_option: "C" },
            { id: 38, question: "What is latency?", options: ["Storage size", "Network delay", "Server uptime", "Cost of service"], correct_option: "B" },
            { id: 39, question: "Which service is used for content delivery?", options: ["S3", "EC2", "CDN", "RDS"], correct_option: "C" },
            { id: 40, question: "Which cloud feature provides high availability?", options: ["Single server", "Multiple zones", "Manual backups", "Local storage"], correct_option: "B" },
            { id: 41, question: "What is on-demand self-service?", options: ["Manual resource request", "Automatic provisioning", "Hardware installation", "Offline access"], correct_option: "B" },
            { id: 42, question: "Which model allows full control over infrastructure?", options: ["SaaS", "PaaS", "IaaS", "FaaS"], correct_option: "C" },
            { id: 43, question: "What does CAPEX reduction mean?", options: ["Higher investment", "Reduced upfront cost", "Increased maintenance", "Hardware purchase"], correct_option: "B" },
            { id: 44, question: "Which cloud benefit improves business agility?", options: ["Fixed capacity", "Scalability", "Downtime", "Hardware lock-in"], correct_option: "B" },
            { id: 45, question: "Which service stores unstructured data?", options: ["RDS", "EC2", "S3", "Lambda"], correct_option: "C" },
            { id: 46, question: "Which cloud feature allows global access?", options: ["Local servers", "Internet-based access", "Manual deployment", "Offline hosting"], correct_option: "B" },
            { id: 47, question: "Which cloud computing characteristic allows resource pooling?", options: ["Multi-tenancy", "Latency", "Downtime", "Bandwidth"], correct_option: "A" },
            { id: 48, question: "What is cloud compliance?", options: ["Speed testing", "Following regulations", "Resource scaling", "Cost optimization"], correct_option: "B" },
            { id: 49, question: "Which cloud service reduces operational overhead?", options: ["On-premise servers", "Manual maintenance", "Managed services", "Local databases"], correct_option: "C" },
            { id: 50, question: "What is the main advantage of cloud computing?", options: ["Limited scalability", "High upfront cost", "Flexibility and scalability", "Hardware dependency"], correct_option: "C" }
        ];
    }
    
    // Networking questions - 50 MCQs
    if (topic.toLowerCase() === 'networking') {
        return [
            { id: 1, question: "Which device operates at the Physical Layer of the OSI model?", options: ["Router", "Switch", "Hub", "Bridge"], correct_option: "C" },
            { id: 2, question: "How many layers are there in the OSI model?", options: ["5", "6", "7", "8"], correct_option: "C" },
            { id: 3, question: "Which protocol is used to transfer web pages?", options: ["FTP", "HTTP", "SMTP", "SNMP"], correct_option: "B" },
            { id: 4, question: "Which device is used to connect two different networks?", options: ["Switch", "Hub", "Router", "Repeater"], correct_option: "C" },
            { id: 5, question: "What is the default port number of HTTP?", options: ["21", "23", "80", "443"], correct_option: "C" },
            { id: 6, question: "Which protocol is used to send emails?", options: ["POP3", "IMAP", "SMTP", "FTP"], correct_option: "C" },
            { id: 7, question: "Which layer of the OSI model is responsible for encryption and compression?", options: ["Application", "Session", "Presentation", "Transport"], correct_option: "C" },
            { id: 8, question: "What does IP stand for?", options: ["Internet Program", "Internet Protocol", "Internal Process", "Interface Protocol"], correct_option: "B" },
            { id: 9, question: "Which device works at the Data Link Layer?", options: ["Router", "Switch", "Hub", "Modem"], correct_option: "B" },
            { id: 10, question: "Which address is used to uniquely identify a device in a network?", options: ["Port address", "IP address", "MAC address", "URL"], correct_option: "C" },
            { id: 11, question: "Which protocol converts domain names to IP addresses?", options: ["DHCP", "FTP", "DNS", "SNMP"], correct_option: "C" },
            { id: 12, question: "Which topology has a central device?", options: ["Ring", "Bus", "Star", "Mesh"], correct_option: "C" },
            { id: 13, question: "What is the full form of LAN?", options: ["Local Area Network", "Large Area Network", "Logical Area Network", "Light Access Network"], correct_option: "A" },
            { id: 14, question: "Which protocol assigns IP addresses automatically?", options: ["DNS", "DHCP", "FTP", "SNMP"], correct_option: "B" },
            { id: 15, question: "Which cable type is used in Ethernet networks?", options: ["Coaxial", "Fiber optic", "Twisted pair", "Serial"], correct_option: "C" },
            { id: 16, question: "What is the maximum length of a UTP cable segment?", options: ["50 meters", "100 meters", "150 meters", "200 meters"], correct_option: "B" },
            { id: 17, question: "Which layer ensures error-free delivery of data?", options: ["Network", "Transport", "Session", "Application"], correct_option: "B" },
            { id: 18, question: "Which protocol is connection-oriented?", options: ["UDP", "IP", "TCP", "ICMP"], correct_option: "C" },
            { id: 19, question: "Which device regenerates signals?", options: ["Router", "Switch", "Repeater", "Gateway"], correct_option: "C" },
            { id: 20, question: "What is the full form of WAN?", options: ["Wide Area Network", "Wireless Area Network", "Web Access Network", "World Area Network"], correct_option: "A" },
            { id: 21, question: "Which protocol is used for file transfer?", options: ["SMTP", "HTTP", "FTP", "SNMP"], correct_option: "C" },
            { id: 22, question: "Which address is burned into the NIC?", options: ["IP", "MAC", "Port", "URL"], correct_option: "B" },
            { id: 23, question: "What does NAT stand for?", options: ["Network Access Tool", "Network Address Translation", "Network Application Transfer", "Node Address Table"], correct_option: "B" },
            { id: 24, question: "Which layer routes packets?", options: ["Data Link", "Transport", "Network", "Application"], correct_option: "C" },
            { id: 25, question: "Which topology provides high fault tolerance?", options: ["Bus", "Ring", "Star", "Mesh"], correct_option: "D" },
            { id: 26, question: "Which protocol is used for remote login?", options: ["HTTP", "FTP", "Telnet", "SNMP"], correct_option: "C" },
            { id: 27, question: "What is the full form of MAC?", options: ["Media Access Control", "Machine Access Code", "Memory Access Control", "Message Access Channel"], correct_option: "A" },
            { id: 28, question: "Which OSI layer establishes, manages, and terminates sessions?", options: ["Application", "Transport", "Session", "Presentation"], correct_option: "C" },
            { id: 29, question: "Which protocol is used to receive emails?", options: ["SMTP", "FTP", "POP3", "SNMP"], correct_option: "C" },
            { id: 30, question: "What is the default port number of HTTPS?", options: ["21", "25", "80", "443"], correct_option: "D" },
            { id: 31, question: "Which device converts digital signals to analog?", options: ["Switch", "Router", "Modem", "Bridge"], correct_option: "C" },
            { id: 32, question: "Which network covers a small geographical area?", options: ["WAN", "MAN", "LAN", "PAN"], correct_option: "C" },
            { id: 33, question: "What does ICMP stand for?", options: ["Internet Control Message Protocol", "Internal Control Message Program", "Internet Communication Management Protocol", "Internal Communication Message Process"], correct_option: "A" },
            { id: 34, question: "Which topology uses a single backbone cable?", options: ["Ring", "Star", "Bus", "Mesh"], correct_option: "C" },
            { id: 35, question: "Which protocol is used to monitor network devices?", options: ["SMTP", "SNMP", "FTP", "HTTP"], correct_option: "B" },
            { id: 36, question: "Which OSI layer is closest to the end user?", options: ["Transport", "Network", "Presentation", "Application"], correct_option: "D" },
            { id: 37, question: "Which address is used at the Network Layer?", options: ["MAC", "IP", "Port", "URL"], correct_option: "B" },
            { id: 38, question: "Which device connects networks using different protocols?", options: ["Router", "Switch", "Bridge", "Gateway"], correct_option: "D" },
            { id: 39, question: "What is the default port number of FTP?", options: ["20", "21", "22", "25"], correct_option: "B" },
            { id: 40, question: "Which layer provides end-to-end communication?", options: ["Network", "Transport", "Session", "Application"], correct_option: "B" },
            { id: 41, question: "Which protocol is used for secure communication on the web?", options: ["HTTP", "FTP", "HTTPS", "Telnet"], correct_option: "C" },
            { id: 42, question: "Which device divides a network into smaller collision domains?", options: ["Hub", "Switch", "Repeater", "Modem"], correct_option: "B" },
            { id: 43, question: "What does ARP stand for?", options: ["Address Resolution Protocol", "Access Routing Protocol", "Automatic Routing Process", "Address Routing Program"], correct_option: "A" },
            { id: 44, question: "Which OSI layer handles logical addressing?", options: ["Transport", "Data Link", "Network", "Session"], correct_option: "C" },
            { id: 45, question: "Which cable offers highest bandwidth?", options: ["Twisted pair", "Coaxial", "Fiber optic", "Serial"], correct_option: "C" },
            { id: 46, question: "Which protocol uses port number 25?", options: ["FTP", "SMTP", "POP3", "HTTP"], correct_option: "B" },
            { id: 47, question: "Which type of IP address is not routable on the internet?", options: ["Public IP", "Static IP", "Private IP", "Dynamic IP"], correct_option: "C" },
            { id: 48, question: "What is the purpose of a firewall?", options: ["Speed up network", "Monitor hardware", "Block unauthorized access", "Assign IP addresses"], correct_option: "C" },
            { id: 49, question: "Which protocol is connectionless?", options: ["TCP", "FTP", "UDP", "HTTP"], correct_option: "C" },
            { id: 50, question: "Which network topology connects every node to every other node?", options: ["Star", "Bus", "Ring", "Mesh"], correct_option: "D" }
        ];
    }
    
    // Default placeholder questions for other topics
    const placeholderQuestions = [];
    for (let i = 1; i <= CONFIG.totalQuestions; i++) {
        placeholderQuestions.push({
            id: i,
            question: `This is sample question ${i}. The actual question content will be loaded from the AI API.`,
            options: [
                `Option A for question ${i}`,
                `Option B for question ${i}`,
                `Option C for question ${i}`,
                `Option D for question ${i}`
            ]
        });
    }
    return placeholderQuestions;
}

// ========================================
// TIMER FUNCTIONS
// ========================================

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
        STATE.remainingSeconds--;
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

function handleTimeUp() {
    stopTimer();
    showTimeUpModal();
    
    setTimeout(() => {
        submitTest(true);
    }, 2000);
}

function showTimeUpModal() {
    DOM.timeUpModal.classList.remove('hidden');
}

// ========================================
// QUESTION RENDERING
// ========================================

function renderQuestions(questions) {
    STATE.questions = questions;
    DOM.questionsContainer.innerHTML = '';
    
    questions.forEach((question, index) => {
        const questionCard = createQuestionCard(question, index);
        DOM.questionsContainer.appendChild(questionCard);
    });
}

function createQuestionCard(question, index) {
    const card = document.createElement('div');
    card.className = 'question-card';
    card.setAttribute('data-question-id', question.id);
    
    const questionNumber = index + 1;
    
    card.innerHTML = `
        <div class="question-header">
            <div class="question-number">${questionNumber}</div>
            <div class="question-text">${question.question}</div>
        </div>
        <div class="options-container">
            ${question.options.map((option, optionIndex) => `
                <label class="option-label" data-option-index="${optionIndex}">
                    <input 
                        type="radio" 
                        name="question-${question.id}" 
                        value="${optionIndex}"
                        data-question-id="${question.id}"
                    >
                    <span class="option-text">${option}</span>
                </label>
            `).join('')}
        </div>
    `;
    
    const radioButtons = card.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', handleAnswerSelection);
    });
    
    return card;
}

function handleAnswerSelection(event) {
    const questionId = event.target.getAttribute('data-question-id');
    const selectedValue = event.target.value;
    
    STATE.answers[questionId] = selectedValue;
    
    const questionCard = event.target.closest('.question-card');
    const allLabels = questionCard.querySelectorAll('.option-label');
    allLabels.forEach(label => label.classList.remove('selected'));
    event.target.closest('.option-label').classList.add('selected');
    
    updateProgress();
}

function updateProgress() {
    const answeredCount = Object.keys(STATE.answers).length;
    const progressPercentage = (answeredCount / STATE.totalQuestions) * 100;
    
    DOM.progressBar.style.width = `${progressPercentage}%`;
    DOM.progressText.textContent = `${answeredCount}/${STATE.totalQuestions} Answered`;
}

// ========================================
// TEST FLOW FUNCTIONS
// ========================================

async function startTest() {
    DOM.welcomeScreen.classList.add('hidden');
    
    const questions = await fetchQuestionsFromAPI();
    
    renderQuestions(questions);
    
    DOM.testScreen.classList.remove('hidden');
    
    startTimer();
}

function validateAllAnswered() {
    const answeredCount = Object.keys(STATE.answers).length;
    return answeredCount === STATE.totalQuestions;
}

/**
 * Submits the test and saves to database
 */
async function submitTest(autoSubmit = false) {
    stopTimer();
    
    if (!autoSubmit && !validateAllAnswered()) {
        const unansweredCount = STATE.totalQuestions - Object.keys(STATE.answers).length;
        const confirmSubmit = confirm(
            `You have ${unansweredCount} unanswered question(s). Do you want to submit anyway?`
        );
        
        if (!confirmSubmit) {
            startTimer();
            return;
        }
    }
    
    const userEmail = localStorage.getItem('aptilabCurrentUserEmail');
    const userName = localStorage.getItem('aptilabCurrentUserName');
    const topic = localStorage.getItem('aptilabSelectedTopic') || 'General';
    
    const score = calculateScore();
    const testResults = prepareResultsData();
    testResults.score = score;
    testResults.total = CONFIG.totalQuestions;
    
    try {
        console.log('💾 Saving test results to database...');
        
        const response = await fetch('http://localhost:3307/api/submit-test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_email: userEmail,
                user_name: userName,
                score: score,
                total_questions: STATE.totalQuestions,
                topic: topic,
                time_spent: testResults.timeSpent,
                answers: testResults.answers
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log('✅ Test results saved to database');
            
            sessionStorage.setItem('testResults', JSON.stringify({
                ...testResults,
                score: data.score,
                total: data.total,
                percentage: data.percentage
            }));
            
            window.location.href = CONFIG.resultPageUrl;
        } else {
            throw new Error(data.error || 'Failed to save results');
        }
        
    } catch (error) {
        console.error('❌ Error saving test results:', error);
        
        sessionStorage.setItem('testResults', JSON.stringify(testResults));
        alert('Could not save results to database, but you can still view them.');
        window.location.href = CONFIG.resultPageUrl;
    }
}

function prepareResultsData() {
    const endTime = Date.now();
    const totalTimeSpent = Math.floor((endTime - STATE.startTime) / 1000);
    
    return {
        answers: STATE.answers,
        questions: STATE.questions,
        totalQuestions: STATE.totalQuestions,
        answeredQuestions: Object.keys(STATE.answers).length,
        timeSpent: totalTimeSpent,
        submittedAt: new Date().toISOString()
    };
}

function calculateScore() {
    let score = 0;
    STATE.questions.forEach(question => {
        const selected = STATE.answers[String(question.id)];
        if (selected === undefined) {
            return;
        }
        const selectedOption = ['A', 'B', 'C', 'D'][parseInt(selected, 10)];
        if (selectedOption === question.correct_option) {
            score += 1;
        }
    });
    return score;
}

// ========================================
// EVENT LISTENERS
// ========================================

function initEventListeners() {
    DOM.startTestBtn.addEventListener('click', startTest);
    
    DOM.submitTestBtn.addEventListener('click', () => submitTest(false));
    
    window.addEventListener('beforeunload', (event) => {
        if (STATE.timerInterval !== null) {
            event.preventDefault();
            event.returnValue = 'Are you sure you want to leave? Your test progress will be lost.';
            return event.returnValue;
        }
    });
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    console.log('✅ Test page initialized and ready');
    console.log('Waiting for user to start the test...');
});

// ========================================
// UTILITY FUNCTIONS
// ========================================

window.injectQuestions = function(questions) {
    if (!Array.isArray(questions)) {
        console.error('Invalid questions format. Expected an array.');
        return false;
    }
    
    const isValid = questions.every(q => {
        return q.id && q.question && Array.isArray(q.options) && q.options.length === CONFIG.optionsPerQuestion;
    });
    
    if (!isValid) {
        console.error('Invalid question structure. Each question must have: id, question, and 4 options.');
        return false;
    }
    
    STATE.questions = questions;
    console.log('Questions successfully injected:', questions.length);
    return true;
};

window.getTestState = function() {
    return {
        remainingSeconds: STATE.remainingSeconds,
        answers: STATE.answers,
        questionsLoaded: STATE.questions.length,
        totalQuestions: STATE.totalQuestions,
        isTestActive: STATE.timerInterval !== null
    };
};

function getDesiredQuestionCount(topic) {
    return CONFIG.totalQuestions;
}
