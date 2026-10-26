const serverIP = "Lightsmpp.aternos.me";
const admins = ["proeditYT", "LognKing7470"];
// Canlı ortak veritabanı adresi
const DB_URL = "https://api.npoint.io/468c85ae6cf4177d0793";

let dbData = {
    season: "Aktif Sezon: Sezon 1 - Yeni Başlangıç",
    news: [],
    apps: [],
    users: {}
};

window.onload = async function() {
    await loadDatabase();
    checkAuth();
    fetchServerStatus();
    setInterval(fetchServerStatus, 30000);
}

// Buluttan Veri Çekme
async function loadDatabase() {
    try {
        const res = await fetch(DB_URL);
        const data = await res.json();
        if (data) {
            dbData = { ...dbData, ...data };
        }
    } catch (e) {
        console.log("Veri çekme hatası:", e);
    }
    renderUI();
}

// Buluta Veri Gönderme
async function saveDatabase() {
    try {
        await fetch(DB_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dbData)
        });
    } catch (e) {
        console.log("Veri kaydetme hatası:", e);
    }
}

function renderUI() {
    // Sezon ve Haberler
    const seasonEl = document.getElementById('seasonDisplay');
    if (seasonEl) seasonEl.innerText = dbData.season;

    const container = document.getElementById('newsContainer');
    if (container) {
        if (!dbData.news || dbData.news.length === 0) {
            container.innerHTML = `<p style="color:var(--text-muted); font-size:14px;">Henüz duyuru yapılmadı.</p>`;
        } else {
            container.innerHTML = '';
            [...dbData.news].reverse().forEach(n => {
                container.innerHTML += `
                    <div class="news-item">
                        <h3>${n.title}</h3>
                        <p>${n.content}</p>
                        <div class="news-date"><i class="fa-regular fa-clock"></i> ${n.date} - Ekleyen: ${n.author}</div>
                    </div>
                `;
            });
        }
    }

    // Admin Başvuruları
    const currentUser = localStorage.getItem('smp_current_user');
    if (currentUser && admins.includes(currentUser)) {
        loadAdminApplications();
    }
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

async function handleRegister(e) {
    e.preventDefault();
    const user = document.getElementById('regUser').value.trim();
    const pass = document.getElementById('regPass').value;

    if (dbData.users[user]) {
        showToast("Bu oyuncu adı zaten kayıtlı!");
        return;
    }

    dbData.users[user] = pass;
    await saveDatabase();
    showToast("Kayıt başarılı! Giriş yapabilirsin.");
    closeModal('registerModal');
    openModal('loginModal');
}

function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value;

    if (admins.includes(user) || dbData.users[user] === pass) {
        localStorage.setItem('smp_current_user', user);
        showToast(`Hoş geldin, ${user}!`);
        closeModal('loginModal');
        checkAuth();
        renderUI();
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

async function submitKingdomApp(e) {
    e.preventDefault();
    const currentUser = localStorage.getItem('smp_current_user');
    if (!currentUser) return showToast("Önce giriş yapmalısın!");

    const kingdom = document.getElementById('kingdomSelect').value;
    const reason = document.getElementById('appReason').value;

    if (!dbData.apps) dbData.apps = [];
    dbData.apps.push({ id: Date.now(), user: currentUser, kingdom, reason, status: 'Bekliyor' });
    
    await saveDatabase();
    showToast("Krallık başvurusu gönderildi!");
    document.getElementById('appReason').value = '';
    renderUI();
}

async function updateSeason() {
    const val = document.getElementById('newSeasonInput').value.trim();
    if (!val) return;
    dbData.season = "Aktif Sezon: " + val;
    await saveDatabase();
    renderUI();
    showToast("Sezon adı güncellendi!");
    document.getElementById('newSeasonInput').value = '';
}

async function addNews(e) {
    e.preventDefault();
    const title = document.getElementById('newsTitle').value.trim();
    const content = document.getElementById('newsContent').value.trim();
    const author = localStorage.getItem('smp_current_user');

    if (!dbData.news) dbData.news = [];
    dbData.news.push({ title, content, author, date: new Date().toLocaleDateString() });

    await saveDatabase();
    renderUI();
    showToast("Haber yayınlandı!");
    document.getElementById('newsTitle').value = '';
    document.getElementById('newsContent').value = '';
}

function loadAdminApplications() {
    const container = document.getElementById('appListContainer');
    if (!container) return;
    
    let apps = (dbData.apps || []).filter(a => a.status === 'Bekliyor');

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

async function updateApp(id, status) {
    dbData.apps = dbData.apps.map(a => a.id === id ? { ...a, status } : a);
    await saveDatabase();
    renderUI();
    showToast(`Başvuru ${status.toLowerCase()}!`);
}

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function copyIP() { navigator.clipboard.writeText(serverIP); showToast("IP Kopyalandı!"); }
function showToast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.innerText = msg;
    t.className = "show";
    setTimeout(() => { t.className = ""; }, 2500);
}
