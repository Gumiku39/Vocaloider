let currentSelectedSong = null;
let currentEmoji = '🎵 治愈';

// 控制弹窗显示与隐藏
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

// 步骤1：调用 Apple Music (iTunes Search API)
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
            // 将默认模糊封面替换为 600x600 的高清封面
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
            // 点击后进入补充信息页
            item.onclick = () => selectSong(song.trackName, song.artistName, highResCover);
            resultsDiv.appendChild(item);
        });
    } catch (error) {
        resultsDiv.innerHTML = '<p style="color:red; text-align:center; font-size:0.9em;">网络错误，请重试</p>';
    }
}

// 步骤2：选中歌曲，准备提交
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

// 标签选择效果
function selectEmoji(element, tag) {
    document.querySelectorAll('.emoji-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    currentEmoji = tag;
}

// 步骤3：提交数据到你自己的 Node.js 服务器
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
            closeModal();
            loadSongs(); // 重新拉取所有歌曲并刷新网格
        }
    } catch (error) {
        alert("提交失败，请确认你的黑框框(Node服务端)正在运行！");
    }
}

// 渲染网页中的网格
function renderGrid(songs) {
    const grid = document.getElementById('musicGrid');
    grid.innerHTML = '';

    if (songs.length === 0) {
        grid.innerHTML = '<p style="text-align:center; width:100%; color:#888; grid-column: 1 / -1;">这里空空如也，点击上方按钮成为第一个推荐者吧。</p>';
        return;
    }

    songs.forEach((song, index) => {
        const delay = (index % 10) * 0.1;
        const cardHTML = `
            <div class="card" style="animation: fadeUp 0.8s ease ${delay}s forwards;">
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
                        <button class="btn-like">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            ${song.likes || 0}
                        </button>
                    </div>
                </div>
            </div>
        `;
        grid.innerHTML += cardHTML;
    });
}

// 页面一打开时，就向服务端拉取所有已保存的歌曲
async function loadSongs() {
    try {
        const response = await fetch('http://localhost:3000/api/songs');
        const songs = await response.json();
        renderGrid(songs);
    } catch (error) {
        console.error("无法连接到服务器", error);
    }
}

window.onload = loadSongs;