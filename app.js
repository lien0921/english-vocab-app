let vocabulary = [];
let currentLevel = 'A1';

// 對應各級別的資料檔案名稱
const levelFiles = {
    'A1': 'vocabulary.json',
    'A2': 'vocabulary1.json',
    'B1': 'vocabulary2.json',
    'B2': 'vocabulary3.json'
};

const colorThemes = [
    { border: '#6366f1', bg: '#eef2ff' }, { border: '#ec4899', bg: '#fdf2f8' },
    { border: '#f59e0b', bg: '#fffbeb' }, { border: '#10b981', bg: '#ecfdf5' },
    { border: '#8b5cf6', bg: '#f5f3ff' }
];

// 初始化
async function init(level) {
    try {
        const res = await fetch(levelFiles[level]);
        vocabulary = await res.json();
        document.getElementById('currentLevelText').innerText = level;
        createNav();
        render(vocabulary);
    } catch (e) { 
        document.getElementById('stats').innerText = "載入失敗"; 
    }
}

// 切換級別邏輯
function switchLevel(level, btn) {
    // 切換按鈕樣式
    document.querySelectorAll('.lvl-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // 更新資料
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

function render(data) {
    const list = document.getElementById('vocabList');
    document.getElementById('stats').innerText = `(${currentLevel}) 共 ${data.length} 個單字`;
    list.innerHTML = data.map(item => {
        const theme = colorThemes[item.word.toUpperCase().charCodeAt(0) % colorThemes.length];
        return `
        <div class="card-container">
            <div class="card" onclick="this.classList.toggle('flipped')">
                <div class="card-front" style="border-top: 8px solid ${theme.border}; background:${theme.bg}">
                    <h3 style="color:${theme.border}; font-size:2rem; margin:0;">${item.word}</h3>
                    <span style="color:#64748b">${item.pos}</span>
                </div>
                <div class="card-back" style="border: 2px solid ${theme.border}">
                    <button class="voice-btn" style="position:absolute; top:10px; right:10px" 
                            onclick="event.stopPropagation(); speak('${item.word}')">🔊</button>
                    <p class="chinese-text">${item.chinese}</p>
                    <div class="example">
                        ${item.example}
                        <button class="voice-btn" style="font-size:0.9rem" 
                                onclick="event.stopPropagation(); speak('${item.example}')">💬</button>
                    </div>
                    <p style="font-size:0.7rem; color:#94a3b8">${item.description}</p>
                </div>
            </div>
        </div>`;
    }).join('');
}

function speak(t) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'en-US';
    window.speechSynthesis.speak(u);
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

// 預設啟動 A1
init('A1');