let vocabulary = [];
let currentLevel = 'A1';
let currentMode = 'study';
let wrongWords = JSON.parse(localStorage.getItem('wrongWords')) || [];

let quizQueue = [];
let currentQuizIndex = 0;

const levelFiles = {
    'A1': 'vocabulary.json',
    'A2': 'vocabulary1.json',
    'B1': 'vocabulary2.json',
    'B2': 'vocabulary3.json'
};

const colorThemes = [
    { border: '#6366f1', bg: '#eef2ff' }, { border: '#ec4899', bg: '#fdf2f8' },
    { border: '#f59e0b', bg: '#fffbeb' }, { border: '#10b981', bg: '#ecfdf5' }
];

async function init(level) {
    try {
        const res = await fetch(levelFiles[level]);
        vocabulary = await res.json();
        document.getElementById('currentLevelText').innerText = level;
        createNav();
        renderActiveContent();
    } catch (e) { 
        document.getElementById('stats').innerText = "載入失敗"; 
    }
}

function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`mode-${mode}`).classList.add('active');
    
    document.getElementById('search-section').style.display = (mode === 'study') ? 'block' : 'none';
    document.getElementById('alphabet-nav').style.display = (mode === 'study') ? 'flex' : 'none';

    if (mode === 'quiz') {
        startQuiz();
    } else {
        renderActiveContent();
    }
}

// 核心發音功能
function speak(t) {
    if (!t) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'en-US';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
}

function render(data) {
    const list = document.getElementById('vocabList');
    document.getElementById('stats').innerText = `(${currentLevel}) 共 ${data.length} 個單字`;
    
    list.innerHTML = data.map(item => {
        const theme = colorThemes[item.word.toUpperCase().charCodeAt(0) % colorThemes.length];
        const safeExample = item.example.replace(/'/g, "\\'"); // 處理英文單引號
        
        return `
        <div class="card-container">
            <div class="card" onclick="this.classList.toggle('flipped')">
                <div class="card-front" style="border-top: 8px solid ${theme.border}; background:${theme.bg}">
                    <h3 style="color:${theme.border}; font-size:2.2rem; margin:0;">${item.word}</h3>
                    <span style="color:#64748b; font-weight:600;">${item.pos}</span>
                </div>
                <div class="card-back" style="border: 2px solid ${theme.border}">
                    <div class="pronounce-icon" onclick="event.stopPropagation(); speak('${item.word}')">🔊 點擊朗讀單字</div>
                    <p class="chinese-text" style="font-size:1.6rem; color:#1e293b; margin:10px 0;">${item.chinese}</p>
                    
                    <div class="example-box" onclick="event.stopPropagation(); speak('${safeExample}')">
                        <div style="color:#6366f1; font-weight:bold; margin-bottom:5px; font-size:0.85rem;">英文例句 (點擊發音)</div>
                        <div style="font-style: italic; color:#334155; margin-bottom:8px; line-height:1.3;">"${item.example}"</div>
                        <div style="color:#64748b; border-top: 1px solid #e2e8f0; padding-top: 5px; font-size:0.9rem;">
                            💡 ${item.description || '暫無翻譯'}
                        </div>
                    </div>
                    
                    ${currentMode === 'wrong' ? `<button onclick="removeWrong(event, '${item.word}')" style="margin-top:10px; color:#ef4444; border:none; background:none; cursor:pointer; font-size:0.8rem;">[ 移除錯題 ]</button>` : ''}
                </div>
            </div>
        </div>`;
    }).join('');
}

// 測驗與導覽邏輯
function startQuiz() {
    quizQueue = [...vocabulary].sort(() => 0.5 - Math.random()).slice(0, 10);
    currentQuizIndex = 0;
    showQuizQuestion();
}

function showQuizQuestion() {
    const list = document.getElementById('vocabList');
    const item = quizQueue[currentQuizIndex];
    let options = [item.chinese];
    while(options.length < 4) {
        let rand = vocabulary[Math.floor(Math.random() * vocabulary.length)].chinese;
        if(!options.includes(rand)) options.push(rand);
    }
    options.sort(() => 0.5 - Math.random());

    list.innerHTML = `
    <div style="grid-column: 1/-1; display:flex; justify-content:center;">
        <div class="card-container" style="max-width: 420px; width: 100%; height: 480px;">
            <div class="card" id="quiz-card">
                <div class="card-front" style="border-top: 10px solid #bae6fd; background:#f0f9ff; justify-content: flex-start; padding-top: 40px;">
                    <h3 style="color:#0369a1; font-size:2.8rem; margin:0;">${item.word}</h3>
                    <span style="color:#64748b; margin-bottom:30px;">${item.pos}</span>
                    <div class="quiz-options">
                        ${options.map(opt => `<button class="quiz-opt-btn" onclick="checkAnswer(this, '${opt}', '${item.chinese}', '${item.word}')">${opt}</button>`).join('')}
                    </div>
                </div>
                <div class="card-back" style="border: 2px solid #6366f1">
                    <p style="color:#6366f1; font-weight:bold;">正確答案</p>
                    <p class="chinese-text" style="font-size:2.2rem;">${item.chinese}</p>
                    <div class="example-box" onclick="speak('${item.example.replace(/'/g, "\\'")}')">
                        <small style="color:#6366f1">點擊聽例句 🔊</small><br>
                        ${item.example}<br>
                        <span style="color:#64748b; font-size:0.85rem;">( ${item.description} )</span>
                    </div>
                    <button onclick="nextQuestion()" style="margin-top:20px; padding:12px 30px; background:#6366f1; color:white; border:none; border-radius:12px; cursor:pointer; font-weight:bold;">
                        ${currentQuizIndex === 9 ? '查看結果' : '下一題 →'}
                    </button>
                </div>
            </div>
        </div>
    </div>`;
}

function checkAnswer(btn, selected, correct, english) {
    const card = document.getElementById('quiz-card');
    btn.style.background = (selected === correct) ? "#dcfce7" : "#fee2e2";
    if (selected !== correct && !wrongWords.find(w => w.word === english)) {
        wrongWords.push(vocabulary.find(v => v.word === english));
        localStorage.setItem('wrongWords', JSON.stringify(wrongWords));
    }
    setTimeout(() => { card.classList.add('flipped'); speak(english); }, 500);
}

function nextQuestion() {
    if (currentQuizIndex < 9) { currentQuizIndex++; showQuizQuestion(); }
    else { alert("測驗結束！"); setMode('study'); }
}

function renderActiveContent() { render(currentMode === 'wrong' ? wrongWords : vocabulary); }

function switchLevel(level, btn) {
    document.querySelectorAll('.lvl-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentLevel = level;
    init(level);
}

function createNav() {
    const nav = document.getElementById('alphabet-nav');
    let html = `<button class="abc-btn active" onclick="filterLetter('ALL', this)">ALL</button>`;
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(l => {
        html += `<button class="abc-btn" onclick="filterLetter('${l}', this)">${l}</button>`;
    });
    nav.innerHTML = html;
}

function filterLetter(l, btn) {
    document.querySelectorAll('.abc-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filtered = l === 'ALL' ? vocabulary : vocabulary.filter(v => v.word.toUpperCase().startsWith(l));
    render(filtered);
}

document.getElementById('searchInput').addEventListener('input', (e) => {
    const t = e.target.value.toLowerCase();
    const f = vocabulary.filter(v => v.word.toLowerCase().includes(t) || v.chinese.includes(t));
    render(f);
});

init('A1');