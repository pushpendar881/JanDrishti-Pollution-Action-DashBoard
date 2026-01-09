// Handle signup form submission
document.getElementById('signup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const fullname = document.getElementById('fullname').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validate all fields are filled
    if (!fullname || !email || !password || !confirmPassword) {
        alert('Please fill in all fields');
        return;
    }

    // Validate password match
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    // Validate password length
    if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }
    
    // Here you would typically send signup data to a server
    alert('Account created successfully for: ' + fullname);
    
    // Example: redirect to login page after successful signup
    // window.location.href = 'login.html';
});
