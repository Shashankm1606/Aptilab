// Toggle between login and register forms
function toggleForm(event, formType) {
    event.preventDefault();
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (formType === 'register') {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
    } else {
        registerForm.classList.remove('active');
        loginForm.classList.add('active');
    }

    // Clear all messages
    clearMessages();
}

// Handle login - UPDATED WITH API
async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    await loginWithCredentials(email, password);
}

// Login helper used by both manual login and post-registration auto-login
async function loginWithCredentials(email, password) {
    // Clear previous messages
    clearMessages();

    try {
        const response = await fetch('http://localhost:3307/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showMessage('loginSuccess', 'Login successful! Redirecting to dashboard...');
            localStorage.setItem('aptilabCurrentUserName', data.user.name);
            localStorage.setItem('aptilabCurrentUserEmail', data.user.email);
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            return true;
        }

        showMessage('loginError', data.error || 'Invalid credentials');
        return false;
    } catch (error) {
        console.error('Login error:', error);
        showMessage('loginError', 'Could not connect to server. Please make sure the backend is running.');
        return false;
    }
}

// Handle registration - UPDATED WITH API
async function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    // Clear previous messages
    clearMessages();

    // Validate passwords match
    if (password !== confirmPassword) {
        showMessage('registerError', 'Passwords do not match!');
        return;
    }

    // Validate password strength
    if (password.length < 6) {
        showMessage('registerError', 'Password must be at least 6 characters long.');
        return;
    }

    try {
        const response = await fetch('http://localhost:3307/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showMessage('registerSuccess', 'Account created! Logging you in...');

            // Switch to login form and prefill credentials
            toggleForm(event, 'login');
            document.getElementById('loginEmail').value = email;
            document.getElementById('loginPassword').value = password;

            // Auto-login and redirect to dashboard
            await loginWithCredentials(email, password);
        } else {
            showMessage('registerError', data.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('registerError', 'Could not connect to server. Please make sure the backend is running.');
    }
}

// Show forgot password alert
function showForgotPassword(event) {
    event.preventDefault();
    alert('Password reset link will be sent to your registered email address.');
}

// Show message helper
function showMessage(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.classList.add('show');
}

// Clear all messages
function clearMessages() {
    const messages = document.querySelectorAll('.success-message, .error-message');
    messages.forEach(msg => {
        msg.classList.remove('show');
        msg.textContent = '';
    });
}

// Create neural network pattern
function createNeuralNetwork() {
    const container = document.getElementById('neuralNetwork');
    const nodeCount = 30;
    const nodes = [];

    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
        const node = document.createElement('div');
        node.className = 'neural-node';
        node.style.left = Math.random() * 100 + '%';
        node.style.top = Math.random() * 100 + '%';
        node.style.animationDelay = Math.random() * 3 + 's';
        container.appendChild(node);
        nodes.push({
            element: node,
            x: parseFloat(node.style.left),
            y: parseFloat(node.style.top)
        });
    }

    // Create connecting lines
    for (let i = 0; i < nodeCount; i++) {
        const connections = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < connections; j++) {
            const targetIndex = Math.floor(Math.random() * nodeCount);
            if (targetIndex !== i) {
                const line = document.createElement('div');
                line.className = 'neural-line';
                
                const x1 = nodes[i].x;
                const y1 = nodes[i].y;
                const x2 = nodes[targetIndex].x;
                const y2 = nodes[targetIndex].y;
                
                const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
                const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
                
                line.style.width = length + '%';
                line.style.left = x1 + '%';
                line.style.top = y1 + '%';
                line.style.transform = `rotate(${angle}deg)`;
                line.style.animationDelay = Math.random() * 3 + 's';
                
                container.appendChild(line);
            }
        }
    }
}

// Create floating particles
function createParticles() {
    const container = document.getElementById('particles');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.bottom = '0';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
        container.appendChild(particle);
    }
}

// Initialize
window.addEventListener('load', () => {
    createNeuralNetwork();
    createParticles();
});
