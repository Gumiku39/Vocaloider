let currentSelectedSong = null;
let currentEmoji = '🎵 治愈';
let allSongs = []; // 用于存放拉取的所有歌曲，供本地检索使用

// ================= 视图与路由控制 =================
function switchTab(tabName) {
    document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));

    const homeView = document.getElementById('homeView');
    const recommendView = document.getElementById('recommendView');

    if (tabName === 'home') {
        document.querySelectorAll('.nav-links li')[0].classList.add('active');
        homeView.style.display = 'flex';
        recommendView.style.display = 'none';
        initCanvas();
    } else if (tabName === 'recommend') {
        document.querySelectorAll('.nav-links li')[1].classList.add('active');
        homeView.style.display = 'none';
        recommendView.style.display = 'block';
    } else if (tabName === 'news') {
        alert('【资讯分享】板块正在开发中，敬请期待...');
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('collapsed');
}

// ================= 弹窗与提交 =================
function openModal() {
    const modal = document.getElementById('addModal');
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.querySelector('.modal-content').style.transform = 'translateY(0)';
    }, 10);
    resetModal();
}

function closeModal() {
    const modal = document.getElementById('addModal');
    modal.style.opacity = '0';
    modal.querySelector('.modal-content').style.transform = 'translateY(20px)';
    setTimeout(() => { modal.style.display = 'none'; }, 300);
}

function resetModal() {
    document.getElementById('step1').style.display = 'block';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('messageInput').value = '';
    document.getElementById('recommenderInput').value = '';
    currentSelectedSong = null;
}

// 搜索 Apple Music
async function searchMusic() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = '<p style="color:#888; text-align:center; font-size:0.9em;">正在查找...</p>';
    try {
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=5`);
        const data = await response.json();
        resultsDiv.innerHTML = '';
        if (data.results.length === 0) {
            resultsDiv.innerHTML = '<p style="color:#888; text-align:center; font-size:0.9em;">未找到相关歌曲</p>';
            return;
        }

        data.results.forEach(song => {
            const highResCover = song.artworkUrl100.replace('100x100bb', '600x600bb');
            const item = document.createElement('div');
            item.className = 'search-item';
            item.innerHTML = `
                <img src="${song.artworkUrl100}" alt="cover">
                <div>
                    <div style="font-family: 'Georgia', serif; font-size: 1.1em; color: #1a1a1a;">${song.trackName}</div>
                    <div style="font-size: 0.8em; color: #888;">${song.artistName}</div>
                </div>
            `;
            item.onclick = () => selectSong(song.trackName, song.artistName, highResCover);
            resultsDiv.appendChild(item);
        });
    } catch (error) {
        resultsDiv.innerHTML = '<p style="color:red; text-align:center; font-size:0.9em;">网络错误，请重试</p>';
    }
}

function selectSong(title, artist, cover) {
    currentSelectedSong = { title, artist, cover };
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
    document.getElementById('selectedSongPreview').innerHTML = `
        <img src="${cover}" alt="cover">
        <div>
            <div style="font-family: 'Georgia', serif; font-size: 1.2em; color:#1a1a1a;">${title}</div>
            <div style="font-size: 0.9em; color: #666;">${artist}</div>
        </div>
    `;
}

function selectEmoji(element, tag) {
    document.querySelectorAll('.emoji-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    currentEmoji = tag;
}

// 核心升级：提交后触发高亮特效
async function submitSong() {
    const recommender = document.getElementById('recommenderInput').value.trim() || 'Anonymous';
    const message = document.getElementById('messageInput').value.trim() || '分享了一首好歌。';

    const postData = {
        title: currentSelectedSong.title,
        artist: currentSelectedSong.artist,
        cover: currentSelectedSong.cover,
        tag: currentEmoji,
        message: message,
        recommender: recommender
    };
    try {
        const response = await fetch('http://localhost:3000/api/songs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(postData)
        });
        if (response.ok) {
            const resultData = await response.json();
            closeModal();
            // 提交成功后清空搜索框
            document.getElementById('localSearchInput').value = '';
            // 传入刚生成的 songId 触发闪烁特效
            loadSongs(resultData.songId);
        }
    } catch (error) {
        alert("提交失败，请确认服务端是否运行！");
    }
}

// ================= 数据展示与交互 =================
// 渲染瀑布流网格，加入高亮与点赞绑定
function renderGrid(songs, highlightId = null) {
    const grid = document.getElementById('musicGrid');
    grid.innerHTML = '';
    if (songs.length === 0) {
        grid.innerHTML = '<p style="text-align:center; width:100%; color:#888; grid-column: 1 / -1;">未找到相关共鸣。</p>';
        return;
    }

    songs.forEach((song, index) => {
        const delay = (index % 10) * 0.1;
        // 如果是刚刚上传的歌，加上高亮发光 class
        const highlightClass = (song.id === highlightId) ? 'highlight-glow' : '';

        const cardHTML = `
            <div class="card ${highlightClass}" style="animation: fadeUp 0.8s ease ${delay}s forwards;">
                <div class="cover-wrapper">
                    <img src="${song.cover}" alt="Cover" class="cover-img">
                </div>
                <div class="card-content">
                    <span class="tag">${song.tag}</span>
                    <h2 class="song-title">${song.title}</h2>
                    <p class="artist">${song.artist}</p>
                    <p class="message">${song.message}</p>
                    <div class="actions">
                        <span class="recommender">by ${song.recommender}</span>
                        <button class="btn-like" onclick="likeSong(${song.id}, this)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            <span>${song.likes || 0}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        grid.innerHTML += cardHTML;
    });
}

// 核心升级：局部检索过滤器
function filterSongs() {
    const query = document.getElementById('localSearchInput').value.toLowerCase().trim();
    if (!query) {
        renderGrid(allSongs);
        return;
    }
    const filtered = allSongs.filter(song =>
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        song.recommender.toLowerCase().includes(query) ||
        song.tag.toLowerCase().includes(query)
    );
    renderGrid(filtered);
}

// 核心升级：点赞发送到服务器
async function likeSong(id, btnElement) {
    // 防止重复点赞的简单校验（仅限本次访问）
    if (btnElement.classList.contains('liked')) return;

    try {
        const response = await fetch(`http://localhost:3000/api/songs/${id}/like`, { method: 'POST' });
        if (response.ok) {
            // 前端 UI 更新
            const span = btnElement.querySelector('span');
            span.innerText = parseInt(span.innerText) + 1;
            btnElement.classList.add('liked');
            // 播放一个缩放小特效
            btnElement.style.transform = 'scale(1.3)';
            setTimeout(() => btnElement.style.transform = 'scale(1)', 300);
        }
    } catch (error) {
        console.error('点赞请求失败', error);
    }
}

// 加载全部歌曲
async function loadSongs(highlightId = null) {
    try {
        const response = await fetch('http://localhost:3000/api/songs');
        allSongs = await response.json(); // 存入全局缓存

        renderGrid(allSongs, highlightId);

        // 计算社区温度
        const totalSongs = allSongs.length;
        const uniqueVocaloiders = new Set(allSongs.map(song => song.recommender)).size;
        document.getElementById('communityStats').innerText =
            `当前已收录 ${totalSongs} 段共鸣 | ${uniqueVocaloiders} 位 Vocaloider 已加入`;

    } catch (error) {
        console.error("无法连接到服务器", error);
    }
}

// ================= 滚动文案轮播 =================
const slogans = [
    "用旋律连接不同的世界线。",
    "最初的声音，无限的共鸣。",
    "在数据的海洋里，寻找属于我们的感动。",
    "每一首推荐，都是一次跨越次元的拥抱。"
];
let sloganIndex = 0;

setInterval(() => {
    const textElement = document.getElementById('rollingText');
    if (!textElement) return;
    textElement.style.opacity = '0';
    setTimeout(() => {
        sloganIndex = (sloganIndex + 1) % slogans.length;
        textElement.innerText = slogans[sloganIndex];
        textElement.style.opacity = '0.9';
    }, 500);
}, 5000);

// ================= Canvas 粒子特效 =================
let canvas, ctx;
let particles = [];
let mouse = { x: null, y: null, radius: 100 };

function initCanvas() {
    canvas = document.getElementById('particleCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;

    particles = [];
    const numberOfParticles = (canvas.width * canvas.height) / 9000;

    for (let i = 0; i < numberOfParticles; i++) {
        let size = (Math.random() * 2) + 1;
        let x = Math.random() * (canvas.width - size * 2) + size;
        let y = Math.random() * (canvas.height - size * 2) + size;
        let directionX = (Math.random() * 2) - 1;
        let directionY = (Math.random() * 2) - 1;
        let color = 'rgba(255, 255, 255, 0.6)';
        particles.push(new Particle(x, y, directionX, directionY, size, color));
    }
}

class Particle {
    constructor(x, y, directionX, directionY, size, color) {
        this.x = x; this.y = y; this.directionX = directionX; this.directionY = directionY; this.size = size; this.color = color;
    }
    draw() {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false); ctx.fillStyle = this.color; ctx.fill();
    }
    update() {
        if (this.x > canvas.width || this.x < 0) this.directionX = -this.directionX;
        if (this.y > canvas.height || this.y < 0) this.directionY = -this.directionY;
        let dx = mouse.x - this.x; let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < mouse.radius + this.size) {
            const forceDirectionX = dx / distance; const forceDirectionY = dy / distance;
            this.x -= forceDirectionX * 2; this.y -= forceDirectionY * 2;
        }
        this.x += this.directionX * 0.5; this.y += this.directionY * 0.5;
        this.draw();
    }
}

function animateParticles() {
    requestAnimationFrame(animateParticles);
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        for (let j = i; j < particles.length; j++) {
            let dx = particles[i].x - particles[j].x;
            let dy = particles[i].y - particles[j].y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 100) {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(255, 255, 255, ${1 - distance / 100})`;
                ctx.lineWidth = 0.5;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
}

window.addEventListener('mousemove', (event) => {
    if (canvas) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = event.x - rect.left;
        mouse.y = event.y - rect.top;
    }
});

window.addEventListener('resize', () => {
    if (document.getElementById('homeView').style.display !== 'none') {
        initCanvas();
    }
});

// ================= 初始化 =================
window.onload = () => {
    loadSongs();
    switchTab('home');
    setTimeout(() => { initCanvas(); animateParticles(); }, 200);
};