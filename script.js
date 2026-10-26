const serverIP = "Lightsmpp.aternos.me";
const admins = ["proeditYT", "LognKing7470"];

window.onload = function() {
    checkAuth();
    fetchServerStatus();
    loadNewsAndSeason();
    setInterval(fetchServerStatus, 30000);
}

async function fetchServerStatus() {
    try {
        const res = await fetch(`https://api.mcsrvstat.us/2/${serverIP}`);
        const data = await res.json();
        const dot = document.getElementById('statusDot');
        const txt = document.getElementById('statusText');
        const count = document.getElementById('playerCount');

        if (data.online) {
            dot.classList.add('online');
            txt.innerText = "AÇIK";
            txt.style.color = "#2ed573";
            count.innerText = `${data.players.online} / ${data.players.max}`;
        } else {
            dot.classList.remove('online');
            txt.innerText = "KAPALI / UYKUDA";
            txt.style.color = "#ff4757";
            count.innerText = "0 / 0";
        }
    } catch (e) {
        document.getElementById('statusText').innerText = "BİLİNMİYOR";
    }
}

function handleRegister(e) {
    e.preventDefault();
    const user = document.getElementById('regUser').value.trim();
    const pass = document.getElementById('regPass').value;

    let users = JSON.parse(localStorage.getItem('smp_users') || '{}');
    if (users[user]) {
        showToast("Bu oyuncu adı zaten kayıtlı!");
        return;
    }

    users[user] = pass;
    localStorage.setItem('smp_users', JSON.stringify(users));
    showToast("Kayıt başarılı! Giriş yapabilirsin.");
    closeModal('registerModal');
    openModal('loginModal');
}

function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value;

    let users = JSON.parse(localStorage.getItem('smp_users') || '{}');
    
    if (admins.includes(user) || users[user] === pass) {
        localStorage.setItem('smp_current_user', user);
        showToast(`Hoş geldin, ${user}!`);
        closeModal('loginModal');
        checkAuth();
    } else {
        showToast("Hatalı kullanıcı adı veya şifre!");
    }
}

function checkAuth() {
    const currentUser = localStorage.getItem('smp_current_user');
    const authNav = document.getElementById('authNav');
    const kingdomCard = document.getElementById('kingdomCard');
    const adminPanel = document.getElementById('adminPanel');

    if (currentUser) {
        authNav.innerHTML = `
            <span style="font-weight:600; color:var(--primary-color);">${currentUser}</span>
            <button class="btn btn-login" onclick="logout()">Çıkış</button>
        `;
        kingdomCard.style.display = 'block';

        if (admins.includes(currentUser)) {
            adminPanel.style.display = 'block';
            loadAdminApplications();
        } else {
            adminPanel.style.display = 'none';
        }
    } else {
        authNav.innerHTML = `
            <button class="btn btn-login" onclick="openModal('loginModal')">Giriş Yap</button>
            <button class="btn btn-register" onclick="openModal('registerModal')">Kayıt Ol</button>
        `;
        kingdomCard.style.display = 'none';
        adminPanel.style.display = 'none';
    }
}

function logout() {
    localStorage.removeItem('smp_current_user');
    showToast("Çıkış yapıldı.");
    checkAuth();
}

function submitKingdomApp(e) {
    e.preventDefault();
    const currentUser = localStorage.getItem('smp_current_user');
    const kingdom = document.getElementById('kingdomSelect').value;
    const reason = document.getElementById('appReason').value;

    let apps = JSON.parse(localStorage.getItem('smp_apps') || '[]');
    apps.push({ id: Date.now(), user: currentUser, kingdom, reason, status: 'Bekliyor' });
    localStorage.setItem('smp_apps', JSON.stringify(apps));

    showToast("Krallık başvurusu gönderildi!");
    document.getElementById('appReason').value = '';
}

function loadNewsAndSeason() {
    const season = localStorage.getItem('smp_season') || "Aktif Sezon: Sezon 1 - Yeni Başlangıç";
    document.getElementById('seasonDisplay').innerText = season;

    const news = JSON.parse(localStorage.getItem('smp_news') || '[]');
    const container = document.getElementById('newsContainer');

    if (news.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted); font-size:14px;">Henüz duyuru yapılmadı.</p>`;
        return;
    }

    container.innerHTML = '';
    news.reverse().forEach(n => {
        container.innerHTML += `
            <div class="news-item">
                <h3>${n.title}</h3>
                <p>${n.content}</p>
                <div class="news-date"><i class="fa-regular fa-clock"></i> ${n.date} - Ekleyen: ${n.author}</div>
            </div>
        `;
    });
}

function updateSeason() {
    const val = document.getElementById('newSeasonInput').value.trim();
    if (!val) return;
    localStorage.setItem('smp_season', "Aktif Sezon: " + val);
    loadNewsAndSeason();
    showToast("Sezon adı güncellendi!");
    document.getElementById('newSeasonInput').value = '';
}

function addNews(e) {
    e.preventDefault();
    const title = document.getElementById('newsTitle').value.trim();
    const content = document.getElementById('newsContent').value.trim();
    const author = localStorage.getItem('smp_current_user');

    let news = JSON.parse(localStorage.getItem('smp_news') || '[]');
    news.push({ title, content, author, date: new Date().toLocaleDateString() });
    localStorage.setItem('smp_news', JSON.stringify(news));

    loadNewsAndSeason();
    showToast("Haber yayınlandı!");
    document.getElementById('newsTitle').value = '';
    document.getElementById('newsContent').value = '';
}

function loadAdminApplications() {
    const container = document.getElementById('appListContainer');
    let apps = JSON.parse(localStorage.getItem('smp_apps') || '[]').filter(a => a.status === 'Bekliyor');

    if (apps.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted);">Bekleyen başvuru bulunmuyor.</p>`;
        return;
    }

    container.innerHTML = '';
    apps.forEach(app => {
        container.innerHTML += `
            <div class="app-item">
                <div>
                    <strong>${app.user}</strong> -> <span style="color:var(--primary-color);">${app.kingdom}</span>
                    <div style="font-size: 12px; color:var(--text-muted);">Sebep: ${app.reason}</div>
                </div>
                <div class="admin-actions">
                    <button class="btn-approve" onclick="updateApp(${app.id}, 'Onaylandı')">Kabul Et</button>
                    <button class="btn-reject" onclick="updateApp(${app.id}, 'Reddedildi')">Reddet</button>
                </div>
            </div>
        `;
    });
}

function updateApp(id, status) {
    let apps = JSON.parse(localStorage.getItem('smp_apps') || '[]');
    apps = apps.map(a => a.id === id ? { ...a, status } : a);
    localStorage.setItem('smp_apps', JSON.stringify(apps));
    loadAdminApplications();
    showToast(`Başvuru ${status.toLowerCase()}!`);
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function copyIP() { navigator.clipboard.writeText(serverIP); showToast("IP Kopyalandı!"); }
function showToast(msg) {
    const t = document.getElementById("toast");
    t.innerText = msg;
    t.className = "show";
    setTimeout(() => { t.className = ""; }, 2500);
}