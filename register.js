document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registrationForm');
    const examCategorySelect = document.getElementById('examCategory');
    const phoneInput = document.getElementById('phoneNumber');
    const phoneError = document.getElementById('phoneError');
    const formError = document.getElementById('formError');
    const submitBtn = document.getElementById('submitBtn');

    // Auto-select exam category if redirected from home page cards
    const preSelectedExam = sessionStorage.getItem('selectedExam');
    if (preSelectedExam) {
        examCategorySelect.value = preSelectedExam;
        // Clear it so it doesn't force selection on page reload
        sessionStorage.removeItem('selectedExam');
    }

    // Phone validation strictly numeric and 10 digits
    phoneInput.addEventListener('input', () => {
        phoneInput.value = phoneInput.value.replace(/[^0-9]/g, '');
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Reset errors
        phoneError.style.display = 'none';
        formError.style.display = 'none';
        formError.textContent = '';

        const fullName = document.getElementById('fullName').value.trim();
        const phoneNumber = phoneInput.value.trim();
        const qId = document.getElementById('qId').value.trim();
        const email = document.getElementById('email').value.trim();
        const category = examCategorySelect.value;

        if (phoneNumber.length !== 10) {
            phoneError.style.display = 'block';
            return;
        }

        submitBtn.textContent = 'Registering...';
        submitBtn.disabled = true;

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fullName, phoneNumber, qId, email, category })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            // Save student context temporarily for the exam flow
            sessionStorage.setItem('studentId', data.studentId);
            sessionStorage.setItem('examCategory', data.category);
            sessionStorage.setItem('studentName', fullName);
            sessionStorage.setItem('studentQId', qId);

            // Redirect to instructions
            window.location.href = 'instructions.html';

        } catch (error) {
            formError.textContent = error.message;
            formError.style.display = 'block';
            submitBtn.textContent = 'Proceed to Instructions';
            submitBtn.disabled = false;
        }
    });
});