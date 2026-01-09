// Handle login form submission
document.querySelector('.login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Basic validation
    if (email && password) {
        // Here you would typically send login data to a server
        alert('Login attempt with email: ' + email);
        
        // Example: redirect to dashboard after successful login
        // window.location.href = 'dashboard.html';
    } else {
        alert('Please fill in all fields');
    }
});
