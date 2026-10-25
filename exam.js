document.addEventListener('DOMContentLoaded', async () => {
    const studentId = sessionStorage.getItem('studentId');
    const examCategory = sessionStorage.getItem('examCategory');
    const studentName = sessionStorage.getItem('studentName');
    const studentQId = sessionStorage.getItem('studentQId');
    const examDuration = parseInt(sessionStorage.getItem('examDuration'), 10) || 90;

    if (!studentId || !examCategory) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('headerStudentName').textContent = studentName;
    document.getElementById('headerQId').textContent = studentQId;
    document.getElementById('headerExamName').textContent = `${examCategory} Examination`;

    let questions = [];
    let currentQIndex = 0;
    
    const backupKey = `exam_backup_${studentId}`;
    let savedState = JSON.parse(localStorage.getItem(backupKey));
    let answers = savedState ? savedState.answers : {}; 
    let statuses = savedState ? savedState.statuses : {}; 
    
    let examStartTime = sessionStorage.getItem('examStartTime');
    if (!examStartTime) {
        examStartTime = Date.now();
        sessionStorage.setItem('examStartTime', examStartTime);
    }
    const endTime = parseInt(examStartTime, 10) + (examDuration * 60 * 1000);

    const timerInterval = setInterval(() => {
        const now = Date.now();
        const timeLeft = endTime - now;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            document.getElementById('timeLeft').textContent = "00:00:00";
            autoSubmitExam();
        } else {
            const h = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((timeLeft % (1000 * 60)) / 1000);
            document.getElementById('timeLeft').textContent = 
                `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
    }, 1000);

    try {
        const res = await fetch(`/api/questions/${examCategory}`);
        questions = await res.json();
        
        if (questions.length > 0) {
            initializeStatuses();
            renderPalette();
            loadQuestion(0);
        } else {
            alert('No questions found.');
        }
    } catch (error) {
        console.error('Failed to load questions', error);
    }

    function initializeStatuses() {
        if (!savedState) {
            questions.forEach((q, index) => statuses[index] = 'not-visited');
        }
    }

    function saveProgressLocally() {
        localStorage.setItem(backupKey, JSON.stringify({ answers, statuses }));
    }

    function loadQuestion(index) {
        currentQIndex = index;
        const q = questions[index];
        
        if (statuses[index] === 'not-visited') {
            statuses[index] = 'not-answered';
            saveProgressLocally();
        }
        
        // Handle Reading Passage Split View
        const passageArea = document.getElementById('passageArea');
        if (q.passage) {
            document.getElementById('passageText').textContent = q.passage;
            passageArea.style.display = 'flex';
        } else {
            passageArea.style.display = 'none';
        }

        document.getElementById('questionNumberDisplay').textContent = `Question No. ${index + 1}`;
        document.getElementById('marksPositive').textContent = `+${q.marks}`;
        document.getElementById('marksNegative').textContent = `-${q.negativeMarks}`;
        document.getElementById('questionText').textContent = q.text;

        const optionsContainer = document.getElementById('optionsContainer');
        optionsContainer.innerHTML = '';

        q.options.forEach((optText, optIndex) => {
            const label = document.createElement('label');
            label.className = 'option-label';
            
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'currentOption';
            radio.value = optIndex;
            
            if (answers[q._id] === optIndex) {
                radio.checked = true;
                label.classList.add('selected');
            }

            radio.addEventListener('change', () => {
                document.querySelectorAll('.option-label').forEach(lbl => lbl.classList.remove('selected'));
                if (radio.checked) label.classList.add('selected');
            });

            label.appendChild(radio);
            label.appendChild(document.createTextNode(optText));
            optionsContainer.appendChild(label);
        });

        updatePaletteUI();
    }

    function renderPalette() {
        const grid = document.getElementById('questionGrid');
        grid.innerHTML = '';
        questions.forEach((q, index) => {
            const btn = document.createElement('button');
            btn.className = `q-btn ${statuses[index]}`;
            btn.textContent = index + 1;
            btn.id = `palette-btn-${index}`;
            btn.onclick = () => loadQuestion(index);
            grid.appendChild(btn);
        });
        updateStats();
    }

    function updatePaletteUI() {
        questions.forEach((q, index) => {
            const btn = document.getElementById(`palette-btn-${index}`);
            if (btn) {
                btn.className = `q-btn ${statuses[index]}`;
                btn.style.boxShadow = (index === currentQIndex) ? "0 0 10px #FFFFFF" : "none";
            }
        });
        updateStats();
    }

    function updateStats() {
        const counts = { 'answered': 0, 'not-answered': 0, 'not-visited': 0, 'marked': 0 };
        Object.values(statuses).forEach(s => counts[s]++);
        document.getElementById('countAnswered').textContent = counts['answered'];
        document.getElementById('countNotAnswered').textContent = counts['not-answered'];
        document.getElementById('countNotVisited').textContent = counts['not-visited'];
        document.getElementById('countMarked').textContent = counts['marked'];
    }

    document.getElementById('saveNextBtn').addEventListener('click', () => {
        const selected = document.querySelector('input[name="currentOption"]:checked');
        if (selected) {
            answers[questions[currentQIndex]._id] = parseInt(selected.value, 10);
            statuses[currentQIndex] = 'answered';
        } else if (statuses[currentQIndex] !== 'marked' && statuses[currentQIndex] !== 'answered') {
            statuses[currentQIndex] = 'not-answered';
        }
        saveProgressLocally();
        if (currentQIndex < questions.length - 1) loadQuestion(currentQIndex + 1);
        else updatePaletteUI();
    });

    document.getElementById('markReviewBtn').addEventListener('click', () => {
        const selected = document.querySelector('input[name="currentOption"]:checked');
        if (selected) answers[questions[currentQIndex]._id] = parseInt(selected.value, 10);
        statuses[currentQIndex] = 'marked';
        saveProgressLocally();
        if (currentQIndex < questions.length - 1) loadQuestion(currentQIndex + 1);
        else updatePaletteUI();
    });

    document.getElementById('clearBtn').addEventListener('click', () => {
        document.querySelectorAll('input[name="currentOption"]').forEach(r => r.checked = false);
        document.querySelectorAll('.option-label').forEach(lbl => lbl.classList.remove('selected'));
        delete answers[questions[currentQIndex]._id];
        statuses[currentQIndex] = 'not-answered';
        saveProgressLocally();
        updatePaletteUI();
    });

    document.getElementById('prevBtn').addEventListener('click', () => {
        if (currentQIndex > 0) loadQuestion(currentQIndex - 1);
    });

    const modal = document.getElementById('submitModal');
    document.getElementById('submitExamBtn').addEventListener('click', () => modal.style.display = 'flex');
    document.getElementById('cancelSubmitBtn').addEventListener('click', () => modal.style.display = 'none');
    document.getElementById('confirmSubmitBtn').addEventListener('click', () => { modal.style.display = 'none'; submitExam(); });

    async function autoSubmitExam() {
        alert("Time is up! Submitting automatically.");
        await submitExam();
    }

    async function submitExam() {
        const submitBtn = document.getElementById('submitExamBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";
        clearInterval(timerInterval);

        try {
            const response = await fetch('/api/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId, category: examCategory, answers })
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.removeItem(backupKey);
                sessionStorage.removeItem('examStartTime');
                sessionStorage.setItem('resultId', data.resultId);
                window.location.href = 'result.html';
            } else {
                alert('Submission failed: ' + data.error);
                submitBtn.disabled = false;
                submitBtn.textContent = "Submit Examination";
            }
        } catch (error) {
            alert('Network error during submission.');
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Examination";
        }
    }
});