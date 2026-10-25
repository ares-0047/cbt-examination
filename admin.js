document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('loginSection');
    const dashboardSection = document.getElementById('dashboardSection');
    const loginForm = document.getElementById('adminLoginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const noAuthLinks = document.querySelectorAll('.no-auth-only');

    // Check if already logged in
    const token = sessionStorage.getItem('adminToken');
    if (token) {
        showDashboard();
    }

    // Login Handler
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (res.ok) {
                sessionStorage.setItem('adminToken', data.token);
                showDashboard();
            } else {
                errorDiv.textContent = data.error;
                errorDiv.style.display = 'block';
            }
        } catch (err) {
            errorDiv.textContent = 'Server connection failed.';
            errorDiv.style.display = 'block';
        }
    });

    // Logout Handler
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('adminToken');
        dashboardSection.style.display = 'none';
        loginSection.style.display = 'block';
        logoutBtn.style.display = 'none';
        noAuthLinks.forEach(link => link.style.display = 'inline');
    });
});

function showDashboard() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    document.getElementById('logoutBtn').style.display = 'inline';
    document.querySelectorAll('.no-auth-only').forEach(link => link.style.display = 'none');
    fetchResults();
}

window.fetchResults = async function() {
    const token = sessionStorage.getItem('adminToken');
    const tbody = document.getElementById('resultsTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Loading...</td></tr>';

    try {
        const res = await fetch('/api/admin/results', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401 || res.status === 403) {
            alert('Session expired. Please login again.');
            document.getElementById('logoutBtn').click();
            return;
        }

        const results = await res.json();
        tbody.innerHTML = '';

        if (results.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No results found.</td></tr>';
            return;
        }

        // We fetch exam max marks as well. To keep it simple, we assume GATE=10, CAT=30, IELTS=10 based on our seed.
        // A robust solution would join the Exam schema on the backend.
        const maxMarksMap = { 'GATE': 10, 'CAT': 30, 'IELTS': 10, 'Other': 10 };

        results.forEach(r => {
            const date = new Date(r.submissionTime).toLocaleDateString();
            const maxMarks = maxMarksMap[r.examCategory] || 10;
            const percentage = ((r.finalScore / maxMarks) * 100).toFixed(2);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${date}</td>
                <td>${r.studentId.fullName}</td>
                <td>${r.studentId.qId}</td>
                <td>${r.examCategory}</td>
                <td>${r.finalScore.toFixed(2)}</td>
                <td>${percentage}%</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Failed to load data.</td></tr>';
    }
}