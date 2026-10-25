document.addEventListener('DOMContentLoaded', async () => {
    const resultId = sessionStorage.getItem('resultId');
    const loadingMsg = document.getElementById('loadingMsg');
    const resultCard = document.getElementById('resultCard');

    if (!resultId) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`/api/results/${resultId}`);
        const data = await response.json();

        if (response.ok) {
            const { result, exam } = data;
            
            // Format Date
            const subDate = new Date(result.submissionTime);
            document.getElementById('resDate').textContent = subDate.toLocaleString();

            // Populate Student Data
            document.getElementById('resStudentName').textContent = result.studentId.fullName;
            document.getElementById('resQId').textContent = result.studentId.qId;
            document.getElementById('resExamName').textContent = exam.name;

            // Populate Stats
            const attempted = result.correctCount + result.incorrectCount;
            document.getElementById('resTotalQuestions').textContent = exam.totalQuestions;
            document.getElementById('resAttempted').textContent = attempted;
            document.getElementById('resCorrect').textContent = result.correctCount;
            document.getElementById('resIncorrect').textContent = result.incorrectCount;

            // Populate Score
            document.getElementById('resFinalScore').textContent = result.finalScore.toFixed(2);
            document.getElementById('resMaxMarks').textContent = exam.maxMarks;

            const percentage = ((result.finalScore / exam.maxMarks) * 100).toFixed(2);
            document.getElementById('resPercentage').textContent = `${percentage} %`;

            loadingMsg.style.display = 'none';
            resultCard.style.display = 'block';

            // Clean up session storage so they can't simply refresh back into the exam
            sessionStorage.removeItem('examCategory');
            sessionStorage.removeItem('examStartTime');
        } else {
            loadingMsg.textContent = 'Error loading result: ' + data.error;
        }
    } catch (error) {
        loadingMsg.textContent = 'Network error while loading result.';
    }
});