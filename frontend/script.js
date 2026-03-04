let currentFile = null;
let currentWalletAddress = null;

// Ethers & Login UI
const loginOverlay = document.getElementById('login-overlay');
const connectWalletBtn = document.getElementById('connect-wallet-btn');
const loginErrorMsg = document.getElementById('login-error');
const loginErrorText = document.getElementById('login-error-text');

const appContainer = document.getElementById('app-container');
const walletBadgeBtn = document.getElementById('wallet-badge');
const disconnectBtn = document.getElementById('disconnect-btn');
const historyList = document.getElementById('history-list');

// Tabs
const tabAudit = document.getElementById('tab-audit');
const tabGenerate = document.getElementById('tab-generate');
const tabArchitect = document.getElementById('tab-architect');
const tabLearn = document.getElementById('tab-learn');
const contentAudit = document.getElementById('content-audit');
const contentGenerate = document.getElementById('content-generate');
const contentArchitect = document.getElementById('content-architect');
const contentLearn = document.getElementById('content-learn');

// Audit UI Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileDisplay = document.getElementById('file-display');
const fileNameUI = document.getElementById('file-name');
const analyzeBtn = document.getElementById('analyze-btn');
const resultsArea = document.getElementById('results');
const errorMsgArea = document.getElementById('error-msg');
const errorText = document.getElementById('error-text');
const agentSelect = document.getElementById('agent-select');

// Report Elements
const scoreVal = document.getElementById('score-val');
const vulnReport = document.getElementById('vuln-report');
const gasReport = document.getElementById('gas-report');
const fixedCode = document.getElementById('fixed-code');
const copyBtn = document.getElementById('copy-btn');
const scoreCardContainer = document.getElementById('score-card');
const vulnSection = document.getElementById('vuln-section');
const gasSection = document.getElementById('gas-section');
const fixSection = document.getElementById('fix-section');

// Generate UI Elements
const generatePrompt = document.getElementById('generate-prompt');
const generateBtn = document.getElementById('generate-btn');
const genErrorMsg = document.getElementById('gen-error-msg');
const genErrorText = document.getElementById('gen-error-text');
const clarificationBox = document.getElementById('clarification-box');
const clarificationText = document.getElementById('clarification-text');
const btnConfirmPrompt = document.getElementById('btn-confirm-prompt');
const btnEditPrompt = document.getElementById('btn-edit-prompt');

const generateResults = document.getElementById('generate-results');
const generatedCode = document.getElementById('generated-code');
const genCopyBtn = document.getElementById('gen-copy-btn');

// Architect UI Elements
const architectPrompt = document.getElementById('architect-prompt');
const architectBtn = document.getElementById('architect-btn');
const archErrorMsg = document.getElementById('arch-error-msg');
const archErrorText = document.getElementById('arch-error-text');
const architectResults = document.getElementById('architect-results');
const architectRoadmap = document.getElementById('architect-roadmap');

// Tech Selection Modal Elements
const techModal = document.getElementById('tech-selection-modal');
const closeModalBtn = document.getElementById('close-tech-modal');
const modalSummary = document.getElementById('modal-project-summary');
const btnFinalGenerate = document.getElementById('btn-final-generate');
const expLevelSelect = document.getElementById('experience-level');

let pendingImprovedPrompt = "";
let lastAnalyzedIdea = "";

async function checkWalletConnection() {
    setWelcomeGreeting();
    if (localStorage.getItem('walletDisconnected') === 'true') return;

    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                handleWalletConnect(accounts[0]);
            }
        } catch (err) {
            console.error("Wallet check error:", err);
        }
    }
}

function setWelcomeGreeting() {
    const welcomeTitle = document.getElementById('welcome-title');
    const lastAddress = localStorage.getItem('lastUserAddress');

    if (lastAddress) {
        const shortened = `${lastAddress.substring(0, 6)}...${lastAddress.substring(38)}`;
        welcomeTitle.textContent = `Welcome back, ${shortened}!`;
    } else {
        welcomeTitle.textContent = "Hi there, Friend!";
    }
}

async function connectWallet() {
    localStorage.removeItem('walletDisconnected');
    loginErrorMsg.style.display = 'none';
    if (typeof window.ethereum === 'undefined') {
        loginErrorText.textContent = "MetaMask not found. Please install a Web3 wallet.";
        loginErrorMsg.style.display = 'flex';
        return;
    }

    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
            handleWalletConnect(accounts[0]);
        }
    } catch (err) {
        loginErrorText.textContent = err.message;
        loginErrorMsg.style.display = 'flex';
    }
}

function handleWalletConnect(address) {
    currentWalletAddress = address;
    localStorage.setItem('lastUserAddress', address);
    loginOverlay.style.display = 'none';
    appContainer.style.display = 'flex';

    const shortened = `${address.substring(0, 6)}...${address.substring(38)}`;
    walletBadgeBtn.querySelector('span').textContent = shortened;

    fetchUserHistory(address);
    fetchLearningStatus(address);
}

if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
            window.location.reload();
        } else {
            handleWalletConnect(accounts[0]);
        }
    });
}

connectWalletBtn.addEventListener('click', connectWallet);
disconnectBtn.addEventListener('click', () => {
    localStorage.setItem('walletDisconnected', 'true');
    window.location.reload();
});
checkWalletConnection();

// --- History Logic --- //
async function fetchUserHistory(address) {
    try {
        const response = await fetch(`/history/${address}`);
        const data = await response.json();
        // Backend returns a flat list now, not {history: [...]}
        renderHistoryList(data);
    } catch (err) {
        console.error("Error fetching history:", err);
    }
}

function renderHistoryList(historyArray) {
    historyList.innerHTML = '';

    if (historyArray.length === 0) {
        historyList.innerHTML = '<div style="color:#000; font-size:0.85rem; padding: 1rem; font-weight: 700; text-transform: uppercase;">No history found. Create a contract!</div>';
        return;
    }

    historyArray.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        let iconClass = 'fa-magnifying-glass';
        if (item.type === 'generate') iconClass = 'fa-wand-magic-sparkles';
        if (item.type === 'architect') iconClass = 'fa-compass';

        // Format timestamp
        let timeStr = "";
        if (item.created_at) {
            const date = new Date(item.created_at);
            const now = new Date();
            const isToday = date.toDateString() === now.toDateString();

            if (isToday) {
                timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
            } else {
                timeStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            }
        }

        div.innerHTML = `
            <div class="history-info" onclick="fetchHistoryDetail(${item.id}, '${item.type}')">
                <i class="fa-solid ${iconClass}"></i>
                <div class="history-text-wrapper">
                    <span class="history-title">${item.title}</span>
                    <span class="history-time">${timeStr}</span>
                </div>
            </div>
            <button class="history-delete-btn" onclick="deleteHistoryItem(event, ${item.id})">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `;

        historyList.appendChild(div);
    });
}

async function deleteHistoryItem(event, id) {
    event.stopPropagation();
    if (!confirm("Are you sure you want to delete this history item?")) return;

    try {
        const response = await fetch(`/history/${id}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.status === 'success') {
            fetchUserHistory(currentWalletAddress);
        } else {
            alert(data.error || "Failed to delete history item.");
        }
    } catch (err) {
        console.error("Error deleting history item:", err);
    }
}

async function fetchHistoryDetail(id, type) {
    try {
        const response = await fetch(`/history/detail/${id}`);
        const data = await response.json();

        // data is the history object directly
        if (data && data.report) {
            const report = data.report;
            if (type === 'audit') {
                document.querySelector('[data-tab="audit"]').click();
                fileNameUI.textContent = data.title;
                fileDisplay.classList.add('active');
                renderResults(report, 'all');
            } else if (type === 'generate') {
                document.querySelector('[data-tab="generate"]').click();
                generatePrompt.value = data.title;
                displayGeneratedContract(report.fix || report);
            } else if (type === 'architect') {
                document.querySelector('[data-tab="architect"]').click();
                architectPrompt.value = data.title;
                renderArchitectResults(report.roadmap || report);
            }
        }
    } catch (err) {
        console.error("Error fetching history detail:", err);
    }
}

document.getElementById('new-chat-btn').addEventListener('click', () => {
    currentFile = null;
    fileDisplay.classList.remove('active');
    analyzeBtn.classList.remove('ready');
    resultsArea.classList.remove('active');
    generateResults.style.display = 'none';
    generatePrompt.value = '';
    clarificationBox.classList.remove('active');

    architectResults.style.display = 'none';
    architectPrompt.value = '';
    archErrorMsg.classList.remove('active');
});

// --- Tab Switching --- //
function deactivateAllTabs() {
    [tabAudit, tabGenerate, tabArchitect, tabLearn].forEach(t => t?.classList.remove('active'));
    [contentAudit, contentGenerate, contentArchitect, contentLearn].forEach(c => c?.classList.remove('active'));
}

if (tabAudit && tabGenerate && tabArchitect && tabLearn) {
    tabAudit.addEventListener('click', () => {
        deactivateAllTabs();
        tabAudit.classList.add('active');
        contentAudit.classList.add('active');
    });

    tabGenerate.addEventListener('click', () => {
        deactivateAllTabs();
        tabGenerate.classList.add('active');
        contentGenerate.classList.add('active');
    });

    tabArchitect.addEventListener('click', () => {
        deactivateAllTabs();
        tabArchitect.classList.add('active');
        contentArchitect.classList.add('active');
    });

    tabLearn.addEventListener('click', () => {
        deactivateAllTabs();
        tabLearn.classList.add('active');
        contentLearn.classList.add('active');
        if (currentWalletAddress) fetchLearningStatus(currentWalletAddress);
    });
}

// --- Drag and Drop Logic --- //
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');

    if (e.dataTransfer.files.length) {
        handleFileSelect(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
        handleFileSelect(fileInput.files[0]);
    }
});

function handleFileSelect(file) {
    errorMsgArea.classList.remove('active');

    if (!file.name.endsWith('.sol')) {
        showError("Please upload a valid Solidity (.sol) file.");
        return;
    }

    currentFile = file;
    fileNameUI.textContent = file.name;
    fileDisplay.classList.add('active');
    analyzeBtn.classList.add('ready');

    resultsArea.classList.remove('active');
}

function showError(msg) {
    errorText.textContent = msg;
    errorMsgArea.classList.add('active');
    analyzeBtn.classList.remove('ready');
    fileDisplay.classList.remove('active');
    currentFile = null;
}

// --- Audit API Submission Logic --- //
analyzeBtn.addEventListener('click', async () => {
    if (!currentFile || !analyzeBtn.classList.contains('ready')) return;

    analyzeBtn.classList.add('analyzing');
    analyzeBtn.classList.remove('ready');
    errorMsgArea.classList.remove('active');
    resultsArea.classList.remove('active');

    const selectedAgent = agentSelect ? agentSelect.value : 'all';

    const formData = new FormData();
    formData.append("file", currentFile);
    formData.append("agent", selectedAgent);
    if (currentWalletAddress) {
        formData.append("wallet_address", currentWalletAddress);
    }

    try {
        const response = await fetch('/audit/', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || data.error || `Server returned ${response.status}`);
        }

        if (data.error) {
            throw new Error(data.error);
        }

        renderResults(data.report, selectedAgent);

        if (currentWalletAddress) fetchUserHistory(currentWalletAddress);

    } catch (err) {
        showError(`${err.message}`);
    } finally {
        analyzeBtn.classList.remove('analyzing');
        analyzeBtn.classList.add('ready');
    }
});

function renderResults(report, selectedAgent) {
    if (!report) {
        showError("No report data returned from the server.");
        return;
    }

    if (scoreCardContainer) scoreCardContainer.style.display = 'none';
    if (vulnSection) vulnSection.style.display = 'none';
    if (gasSection) gasSection.style.display = 'none';
    if (fixSection) fixSection.style.display = 'none';

    if (selectedAgent === 'all' || selectedAgent === 'vulnerability') {
        if (scoreCardContainer) scoreCardContainer.style.display = 'flex';
        if (vulnSection) vulnSection.style.display = 'block';

        let score = 0;
        if (report.risk_score !== undefined) {
            if (typeof report.risk_score === 'string') {
                score = parseInt(report.risk_score.replace(/\D/g, '')) || 0;
            } else {
                score = report.risk_score;
            }
        } else if (typeof report === 'string') {
            const match = report.match(/Risk Score: (\d+)/i);
            if (match) score = parseInt(match[1]);
        }

        scoreVal.textContent = score;
        scoreVal.className = 'score-value';
        if (score >= 80) scoreVal.classList.add('score-high');
        else if (score >= 50) scoreVal.classList.add('score-medium');
        else scoreVal.classList.add('score-low');

        vulnReport.innerHTML = marked.parse(report.vulnerability || "No detailed vulnerability info provided.");
    }

    if (selectedAgent === 'all' || selectedAgent === 'gas') {
        if (gasSection) gasSection.style.display = 'block';
        gasReport.innerHTML = marked.parse(report.gas_optimization || "No gas optimization info provided.");
    }

    if (selectedAgent === 'all' || selectedAgent === 'fix') {
        if (fixSection) fixSection.style.display = 'block';
        let fixedCodeRaw = report.fix || "No fixed code provided.";
        if (fixedCodeRaw.includes("```")) {
            let match = fixedCodeRaw.match(/```[a-z]*\n([\s\S]*?)```/);
            if (match && match[1]) fixedCodeRaw = match[1];
        }
        fixedCode.textContent = fixedCodeRaw.trim();
    }

    resultsArea.classList.add('active');
    setTimeout(() => { resultsArea.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
}

// --- Copy Logic --- //
if (copyBtn) {
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(fixedCode.textContent).then(() => {
            const icon = copyBtn.querySelector('i');
            icon.className = 'fa-solid fa-check';
            setTimeout(() => { icon.className = 'fa-regular fa-copy'; }, 2000);
        });
    });
}

// --- Generate Logic --- //
function showGenError(msg) {
    genErrorText.textContent = msg;
    genErrorMsg.classList.add('active');
    if (generateBtn) {
        generateBtn.classList.remove('analyzing');
        generateBtn.classList.add('ready');
    }
}

if (generateBtn) {
    generateBtn.addEventListener('click', async () => {
        const prompt = generatePrompt.value;
        if (!prompt.trim() || !generateBtn.classList.contains('ready')) return;

        genErrorMsg.classList.remove('active');
        clarificationBox.classList.remove('active');
        generateResults.style.display = 'none';
        generateBtn.classList.remove('ready');
        generateBtn.classList.add('analyzing');

        try {
            const response = await fetch('/generate/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt, is_confirmed: false, wallet_address: currentWalletAddress })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || "Server error");

            if (data.status === "clarification_needed") {
                pendingImprovedPrompt = data.improved_prompt;
                clarificationText.textContent = pendingImprovedPrompt;
                clarificationBox.classList.add('active');
                generateBtn.classList.remove('analyzing');
                generateBtn.classList.add('ready');
            } else if (data.status === "generating") {
                displayGeneratedContract(data.contract);
                if (currentWalletAddress) fetchUserHistory(currentWalletAddress);
            }

        } catch (err) {
            showGenError(err.message);
        }
    });
}

if (btnConfirmPrompt) {
    btnConfirmPrompt.addEventListener('click', async () => {
        clarificationBox.classList.remove('active');
        generateBtn.classList.remove('ready');
        generateBtn.classList.add('analyzing');
        generatePrompt.value = pendingImprovedPrompt;

        try {
            const response = await fetch('/generate/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: pendingImprovedPrompt, is_confirmed: true, wallet_address: currentWalletAddress })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Server error");

            if (data.status === "generating") {
                displayGeneratedContract(data.contract);
                if (currentWalletAddress) fetchUserHistory(currentWalletAddress);
            }
        } catch (err) {
            showGenError(err.message);
        }
    });
}

if (btnEditPrompt) {
    btnEditPrompt.addEventListener('click', () => {
        clarificationBox.classList.remove('active');
    });
}

function displayGeneratedContract(codeRaw) {
    let cleanCode = typeof codeRaw === 'string' ? codeRaw : JSON.stringify(codeRaw);
    if (cleanCode.includes("```")) {
        let match = cleanCode.match(/```[a-z]*\n([\s\S]*?)```/);
        if (match && match[1]) cleanCode = match[1];
    }

    generatedCode.textContent = cleanCode.trim();
    generateResults.style.display = 'block';

    generateBtn.classList.remove('analyzing');
    generateBtn.classList.add('ready');

    setTimeout(() => { generateResults.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
}

if (genCopyBtn) {
    genCopyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(generatedCode.textContent).then(() => {
            const icon = genCopyBtn.querySelector('i');
            icon.className = 'fa-solid fa-check';
            setTimeout(() => { icon.className = 'fa-regular fa-copy'; }, 2000);
        });
    });
}

// --- Architect Logic --- //
function showArchError(msg) {
    archErrorText.textContent = msg;
    archErrorMsg.classList.add('active');
    if (architectBtn) {
        architectBtn.classList.remove('analyzing');
        architectBtn.classList.add('ready');
    }
}

// Analysis Step
if (architectBtn) {
    architectBtn.addEventListener('click', async () => {
        const prompt = architectPrompt.value;
        if (!prompt.trim() || !architectBtn.classList.contains('ready')) return;

        archErrorMsg.classList.remove('active');
        architectResults.style.display = 'none';
        architectBtn.classList.remove('ready');
        architectBtn.classList.add('analyzing');

        try {
            const response = await fetch('/architect/analyze/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `Server error (${response.status})`);
            }

            const data = await response.json();
            lastAnalyzedIdea = prompt;
            openTechModal(data.analysis);

        } catch (err) {
            showArchError(err.message);
        } finally {
            architectBtn.classList.remove('analyzing');
            architectBtn.classList.add('ready');
        }
    });
}

function openTechModal(analysis) {
    modalSummary.textContent = analysis.summary;

    // Map of Group IDs to Suggestion Keys
    const groupMap = {
        'group-blockchain': 'blockchain',
        'group-network': 'network',
        'group-frontend': 'frontend',
        'group-styling': 'styling',
        'group-database': 'database',
        'group-wallet': 'wallet',
        'group-storage': 'storage',
        'group-backend': 'backend',
        'group-indexing': 'indexing',
        'group-auth': 'authentication',
        'group-deployment': 'deployment',
        'group-security': 'security'
    };

    for (const [groupId, key] of Object.entries(groupMap)) {
        populateSelectionGroup(groupId, analysis.suggestions[key] || []);
    }

    techModal.classList.add('active');
}

function populateSelectionGroup(groupId, suggestions) {
    const container = document.getElementById(groupId);
    if (!container) return;
    container.innerHTML = '';

    suggestions.forEach(tech => {
        const label = document.createElement('label');
        label.className = 'checkbox-item';
        // Auto-select the first suggestion by default
        if (tech === suggestions[0]) label.classList.add('selected');

        label.innerHTML = `<input type="checkbox" value="${tech}" ${tech === suggestions[0] ? 'checked' : ''}>
                           <span>${tech}</span>`;

        label.addEventListener('click', (e) => {
            e.preventDefault();
            const checkbox = label.querySelector('input');
            const isChecked = checkbox.checked;

            // Single-select logic: uncheck all others in this group
            if (!isChecked) {
                const groupCheckboxes = container.querySelectorAll('input');
                groupCheckboxes.forEach(cb => {
                    cb.checked = false;
                    cb.parentElement.classList.remove('selected');
                });
                checkbox.checked = true;
                label.classList.add('selected');
            } else {
                // If it was checked, clicking it might uncheck it (optional)
                checkbox.checked = false;
                label.classList.remove('selected');
            }
        });

        container.appendChild(label);
    });
}

closeModalBtn.addEventListener('click', () => techModal.classList.remove('active'));

// Final Roadmap Step
btnFinalGenerate.addEventListener('click', async () => {
    const groupMap = {
        'group-blockchain': 'blockchain',
        'group-network': 'network',
        'group-frontend': 'frontend',
        'group-styling': 'styling',
        'group-database': 'database',
        'group-wallet': 'wallet',
        'group-storage': 'storage',
        'group-backend': 'backend',
        'group-indexing': 'indexing',
        'group-auth': 'authentication',
        'group-deployment': 'deployment',
        'group-security': 'security'
    };

    const selectedTools = {};
    for (const [groupId, key] of Object.entries(groupMap)) {
        selectedTools[key] = Array.from(document.querySelectorAll(`#${groupId} input:checked`)).map(i => i.value);
    }

    btnFinalGenerate.classList.remove('ready');
    btnFinalGenerate.classList.add('analyzing');

    try {
        const response = await fetch('/architect/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project_idea: lastAnalyzedIdea,
                selected_tools: selectedTools,
                experience_level: expLevelSelect.value,
                wallet_address: currentWalletAddress
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Server error");

        techModal.classList.remove('active');
        renderArchitectResults(data.roadmap);
        if (currentWalletAddress) fetchUserHistory(currentWalletAddress);

    } catch (err) {
        alert("Error generating roadmap: " + err.message);
    } finally {
        btnFinalGenerate.classList.remove('analyzing');
        btnFinalGenerate.classList.add('ready');
    }
});

function renderArchitectResults(roadmapMarkdown) {
    architectRoadmap.innerHTML = marked.parse(roadmapMarkdown || "No roadmap generated.");
    architectResults.style.display = 'block';

    architectBtn.classList.remove('analyzing');
    architectBtn.classList.add('ready');

    setTimeout(() => { architectResults.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
}

// Copy Roadmap Logic
const archCopyBtn = document.getElementById('arch-copy-roadmap-btn');
if (archCopyBtn) {
    archCopyBtn.addEventListener('click', () => {
        const content = architectRoadmap.innerText; // Use innerText to get clean text without HTML
        navigator.clipboard.writeText(content).then(() => {
            const icon = archCopyBtn.querySelector('i');
            const originalText = archCopyBtn.innerHTML;
            archCopyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            setTimeout(() => { archCopyBtn.innerHTML = originalText; }, 2000);
        });
    });
}

// --- Learning Platform UI Logic --- //

let activeLearningTasks = [];
let currentViewingTaskId = null;

async function fetchLearningStatus(address) {
    if (!address) return;
    try {
        const response = await fetch(`/learning/status/${address}`);
        const data = await response.json();
        if (data.status === 'success') {
            updateLearningUserUI(data.progress);
            activeLearningTasks = data.active_tasks || [];
            renderLearningTasksGrid(activeLearningTasks);

            // Toggle setup vs tasks view
            const setupView = document.getElementById('learning-setup');
            const tasksView = document.getElementById('learning-tasks-container');
            if (activeLearningTasks.length > 0) {
                setupView.style.display = 'none';
                tasksView.style.display = 'block';
            } else {
                setupView.style.display = 'block';
                tasksView.style.display = 'none';
            }
        }
    } catch (err) {
        console.error("Error fetching learning status:", err);
    }
}

function updateLearningUserUI(progress) {
    const lvlEl = document.getElementById('user-level');
    const xpEl = document.getElementById('user-xp');
    const progEl = document.getElementById('xp-progress');
    const badgesEl = document.getElementById('user-badges');

    if (lvlEl) lvlEl.textContent = progress.level || 1;
    if (xpEl) xpEl.textContent = progress.xp || 0;

    // XP Progress bar logic (assuming 100 XP per level)
    const xpInLevel = (progress.xp || 0) % 100;
    if (progEl) progEl.style.width = `${xpInLevel}%`;

    if (badgesEl) {
        badgesEl.innerHTML = '';
        (progress.badges || []).forEach(badge => {
            const span = document.createElement('span');
            span.className = 'badge-icon';
            span.title = badge;
            span.style.fontSize = '1.5rem';
            span.innerHTML = '🏅';
            badgesEl.appendChild(span);
        });
    }
}

function renderLearningTasksGrid(tasks) {
    const list = document.getElementById('tasks-list');
    if (!list) return;
    list.innerHTML = '';
    tasks.forEach(task => {
        const card = document.createElement('div');
        card.className = `glass-panel task-card ${task.status === 'solved' ? 'solved' : ''}`;
        card.innerHTML = `
            <span class="task-badge ${task.difficulty}">${task.difficulty}</span>
            <h4 style="margin: 0.5rem 0; color: #000; font-weight: 800; text-transform: uppercase;">${task.title}</h4>
            <p style="font-size: 0.85rem; color: #555; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 0; font-weight: 600;">
                ${task.description}
            </p>
        `;
        card.addEventListener('click', () => openTaskSolver(task));
        list.appendChild(card);
    });
}

function openTaskSolver(task) {
    currentViewingTaskId = task.id;
    const tasksContainer = document.getElementById('learning-tasks-container');
    const solverView = document.getElementById('task-solver-view');

    if (tasksContainer) tasksContainer.style.display = 'none';
    if (solverView) solverView.style.display = 'block';

    const titleEl = document.getElementById('current-task-title');
    const descEl = document.getElementById('current-task-desc');
    const reqsEl = document.getElementById('current-task-requirements');
    const constsEl = document.getElementById('current-task-constraints');
    const feedbackBox = document.getElementById('review-feedback');

    if (titleEl) titleEl.textContent = task.title;
    if (descEl) descEl.textContent = task.description;

    if (reqsEl) {
        try {
            const reqs = typeof task.concepts === 'string' ? JSON.parse(task.concepts) : task.concepts;
            reqsEl.innerHTML = `<p>Target Concepts:</p><ul>${reqs.map(r => `<li>${r}</li>`).join('')}</ul>`;
        } catch (e) {
            reqsEl.innerHTML = '';
        }
    }

    if (constsEl) constsEl.innerHTML = ''; // Placeholder for dynamic constraints if added
    if (feedbackBox) feedbackBox.style.display = 'none';

    // Scroll to top of solver
    solverView.scrollIntoView({ behavior: 'smooth' });
}

const backToTasksBtn = document.getElementById('back-to-tasks');
if (backToTasksBtn) {
    backToTasksBtn.addEventListener('click', () => {
        document.getElementById('task-solver-view').style.display = 'none';
        document.getElementById('learning-tasks-container').style.display = 'block';
        currentViewingTaskId = null;
    });
}

const learnGenerateBtn = document.getElementById('learn-generate-btn');
if (learnGenerateBtn) {
    learnGenerateBtn.addEventListener('click', async () => {
        const selectedConcepts = Array.from(document.querySelectorAll('input[name="concept"]:checked')).map(i => i.value);
        const difficulty = document.getElementById('learn-difficulty').value;
        const count = document.getElementById('learn-task-count').value;

        if (selectedConcepts.length === 0) {
            alert("Please select at least one concept to learn.");
            return;
        }

        learnGenerateBtn.classList.add('analyzing');
        learnGenerateBtn.classList.remove('ready');

        try {
            const response = await fetch('/learning/generate/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wallet_address: currentWalletAddress,
                    concepts: selectedConcepts,
                    difficulty: difficulty,
                    count: parseInt(count)
                })
            });
            const data = await response.json();
            if (response.ok) {
                fetchLearningStatus(currentWalletAddress);
            } else {
                alert(data.error || "Generation failed");
            }
        } catch (err) {
            console.error("Error generating tasks:", err);
            alert("Connection error occurred.");
        } finally {
            learnGenerateBtn.classList.remove('analyzing');
            learnGenerateBtn.classList.add('ready');
        }
    });
}

const submitSolutionBtn = document.getElementById('submit-solution-btn');
if (submitSolutionBtn) {
    submitSolutionBtn.addEventListener('click', async () => {
        const solutionEditor = document.getElementById('solution-editor');
        const feedbackBox = document.getElementById('review-feedback');
        const compilerStatus = document.getElementById('compiler-status');

        if (!solutionEditor || !solutionEditor.value.trim()) return;
        const code = solutionEditor.value;

        submitSolutionBtn.classList.add('analyzing');
        submitSolutionBtn.classList.remove('ready');
        if (feedbackBox) feedbackBox.style.display = 'none';
        if (compilerStatus) {
            compilerStatus.textContent = "Compiling & Reviewing...";
            compilerStatus.className = "compiler-status";
        }

        try {
            const response = await fetch('/learning/submit/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wallet_address: currentWalletAddress,
                    task_id: currentViewingTaskId,
                    code: code
                })
            });
            const data = await response.json();

            if (feedbackBox) feedbackBox.style.display = 'block';
            if (data.status === 'ACCEPTED') {
                if (feedbackBox) {
                    feedbackBox.className = 'feedback-box accepted';
                    feedbackBox.innerHTML = `<h3>✅ Correct!</h3><p>${data.feedback || 'Great job! You solved the challenge.'}</p>`;
                }
                if (compilerStatus) {
                    compilerStatus.textContent = "Accepted";
                    compilerStatus.classList.add('success');
                }

                // Wait a bit then go back
                setTimeout(() => {
                    fetchLearningStatus(currentWalletAddress);
                    if (backToTasksBtn) backToTasksBtn.click();
                    if (solutionEditor) solutionEditor.value = '';
                }, 3000);
            } else {
                if (feedbackBox) {
                    feedbackBox.className = 'feedback-box rejected';
                    if (data.type === 'compiler') {
                        feedbackBox.innerHTML = `<h3>❌ Compiler Error</h3><p>${data.explanation}</p><pre style="font-size: 0.85rem; margin-top: 1rem; color: #000; background: #f0f0f0; padding: 1rem; border: 2px solid #000; border-radius: 0; font-weight: 700;">${data.hint}</pre>`;
                        if (compilerStatus) {
                            compilerStatus.textContent = "Compiler Error";
                            compilerStatus.classList.add('error');
                        }
                    } else {
                        feedbackBox.innerHTML = `<h3>❌ Logic Issue</h3><p style="margin-bottom:0.5rem;"><strong>Explain:</strong> ${data.explanation}</p><p style="margin-bottom:0.5rem;"><strong>Why:</strong> ${data.why}</p><p><strong>Hint:</strong> ${data.hint}</p>`;
                        if (compilerStatus) {
                            compilerStatus.textContent = "Logic Error";
                            compilerStatus.classList.add('error');
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Error submitting solution:", err);
            if (feedbackBox) {
                feedbackBox.style.display = 'block';
                feedbackBox.innerHTML = `<p style="color:#000; font-weight: 800;">Error connecting to server.</p>`;
            }
        } finally {
            submitSolutionBtn.classList.remove('analyzing');
            submitSolutionBtn.classList.add('ready');
        }
    });
}

