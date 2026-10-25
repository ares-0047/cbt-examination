document.addEventListener('DOMContentLoaded', async () => {
    const studentName = sessionStorage.getItem('studentName');
    const examCategory = sessionStorage.getItem('examCategory');
    
    // Redirect if accessed directly without registration
    if (!studentName || !examCategory) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('navStudentName').textContent = `Welcome, ${studentName}`;

    try {
        const response = await fetch(`/api/exams/${examCategory}`);
        const examData = await response.json();

        if (response.ok) {
            document.getElementById('examName').textContent = examData.name;
            document.getElementById('totalQuestions').textContent = examData.totalQuestions;
            document.getElementById('duration').textContent = examData.duration;
            document.getElementById('maxMarks').textContent = examData.maxMarks;
            
            // Save duration for the timer in exam page
            sessionStorage.setItem('examDuration', examData.duration);
        } else {
            alert('Failed to load exam details.');
        }
    } catch (error) {
        console.error('Error fetching exam:', error);
    }

    const agreeCheckbox = document.getElementById('agreeCheckbox');
    const startExamBtn = document.getElementById('startExamBtn');

    agreeCheckbox.addEventListener('change', () => {
        startExamBtn.disabled = !agreeCheckbox.checked;
    });

    startExamBtn.addEventListener('click', () => {
        // Record start time to ensure consistency during refresh
        if (!sessionStorage.getItem('examStartTime')) {
            sessionStorage.setItem('examStartTime', Date.now());
        }
        window.location.href = 'exam.html';
    });
});