// Get modal elements
const loginModal = document.getElementById('login-modal');
const signupModal = document.getElementById('signup-modal');
const signupTrigger = document.getElementById('signup-trigger');
const closeLoginBtn = document.getElementById('close-modal');
const closeSignupBtn = document.getElementById('close-signup');
const backToLoginBtn = document.getElementById('back-to-login');

// Open signup modal
signupTrigger.addEventListener('click', function(e) {
    e.preventDefault();
    loginModal.classList.remove('show');
    signupModal.classList.add('show');
});

// Back to login from signup
backToLoginBtn.addEventListener('click', function(e) {
    e.preventDefault();
    signupModal.classList.remove('show');
    loginModal.classList.add('show');
});

// Close login modal
closeLoginBtn.addEventListener('click', function() {
    loginModal.classList.remove('show');
});

// Close signup modal
closeSignupBtn.addEventListener('click', function() {
    signupModal.classList.remove('show');
});

// Close modal when clicking outside of it
window.addEventListener('click', function(e) {
    if (e.target === loginModal) {
        loginModal.classList.remove('show');
    }
    if (e.target === signupModal) {
        signupModal.classList.remove('show');
    }
});

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (email && password) {
        alert('Login attempt with email: ' + email);
        // Close modal after login
        loginModal.classList.remove('show');
        // Reset form
        this.reset();
    } else {
        alert('Please fill in all fields');
    }
});

// Handle signup form submission
document.getElementById('signup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const fullname = document.getElementById('fullname').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (!fullname || !email || !password || !confirmPassword) {
        alert('Please fill in all fields');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }
    
    alert('Account created successfully for: ' + fullname);
    // Close modal after signup
    signupModal.classList.remove('show');
    // Reset form
    this.reset();
});
