// Function to handle exam selection from the home page
function registerForExam(examCategory) {
    // Store selected exam category temporarily to auto-fill the registration form
    sessionStorage.setItem('selectedExam', examCategory);
    window.location.href = 'register.html';
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});