// ============================================
// PROVIDENTIA BLOG ADMIN - APPLICATION
// ============================================

// CONFIG
const ADMIN_PASSWORD = 'BakKris01'; // Hardkodirani password - promijeni!
const GITHUB_OWNER = 'filipfisic';
const GITHUB_REPO = 'site';
const GITHUB_BRANCH = 'main';

// STATE
let state = {
    token: localStorage.getItem('github_token') || null,
    currentPost: null,
    posts: [],
    editors: {}
};

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const newPostBtn = document.getElementById('new-post-btn');
const postsListView = document.getElementById('posts-list-view');
const editorView = document.getElementById('editor-view');
const backToListBtn = document.getElementById('back-to-list-btn');
const savePostBtn = document.getElementById('save-post-btn');
const deletePostBtn = document.getElementById('delete-post-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const postsContainer = document.getElementById('posts-container');
const loadingPosts = document.getElementById('loading-posts');
const noPosts = document.getElementById('no-posts');
const languageFilter = document.getElementById('language-filter');

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    if (state.token) {
        showDashboard();
        loadPosts();
    } else {
        showLogin();
    }

    // Event listeners
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);
    newPostBtn.addEventListener('click', showNewPostEditor);
    backToListBtn.addEventListener('click', showPostsList);
    cancelEditBtn.addEventListener('click', showPostsList);
    savePostBtn.addEventListener('click', savePost);
    deletePostBtn.addEventListener('click', showDeleteConfirm);
    languageFilter.addEventListener('change', filterPosts);

    // Image upload
    const postImage = document.getElementById('post-image');
    const imageUpload = document.querySelector('.image-upload');
    postImage.addEventListener('change', handleImageSelect);
    imageUpload.addEventListener('click', () => postImage.click());
    imageUpload.addEventListener('dragover', (e) => {
        e.preventDefault();
        imageUpload.style.borderColor = '#d7ae61';
    });
    imageUpload.addEventListener('dragleave', () => {
        imageUpload.style.borderColor = '#ddd';
    });
    imageUpload.addEventListener('drop', (e) => {
        e.preventDefault();
        imageUpload.style.borderColor = '#ddd';
        if (e.dataTransfer.files[0]) {
            postImage.files = e.dataTransfer.files;
            handleImageSelect({ target: postImage });
        }
    });

    document.getElementById('remove-image-btn')?.addEventListener('click', removeImage);
    document.getElementById('no-posts-new-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        showNewPostEditor();
    });
});

// ============================================
// AUTHENTICATION
// ============================================

function handleLogin(e) {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const token = document.getElementById('github-token').value;
    const errorEl = document.getElementById('login-error');

    errorEl.style.display = 'none';

    if (password !== ADMIN_PASSWORD) {
        errorEl.textContent = 'Pogrešna lozinka!';
        errorEl.style.display = 'block';
        return;
    }

    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
        errorEl.textContent = 'Neispravan GitHub token format!';
        errorEl.style.display = 'block';
        return;
    }

    // Spremi token u localStorage
    localStorage.setItem('github_token', token);
    state.token = token;

    // Očisti formu
    loginForm.reset();

    // Pokaži dashboard
    showDashboard();
    loadPosts();
}

function handleLogout() {
    if (confirm('Jeste li sigurni da se želite odjaviti?')) {
        localStorage.removeItem('github_token');
        state.token = null;
        state.posts = [];
        showLogin();
        loginForm.reset();
    }
}

function showLogin() {
    loginScreen.classList.add('active');
    dashboardScreen.classList.remove('active');
}

function showDashboard() {
    loginScreen.classList.remove('active');
    dashboardScreen.classList.add('active');
}

// ============================================
// POSTS MANAGEMENT
// ============================================

async function loadPosts() {
    loadingPosts.style.display = 'block';
    postsContainer.innerHTML = '';

    try {
        const hrPosts = await loadPostsFromPath('PROVIDENTIA_2/blog');
        const enPosts = await loadPostsFromPath('PROVIDENTIA_2/en/blog');

        state.posts = [...hrPosts, ...enPosts];

        if (state.posts.length === 0) {
            loadingPosts.style.display = 'none';
            noPosts.style.display = 'block';
            return;
        }

        loadingPosts.style.display = 'none';
        noPosts.style.display = 'none';
        displayPosts(state.posts);
    } catch (error) {
        console.error('Error loading posts:', error);
        loadingPosts.innerHTML = `<div class="error-message">Greška pri učitavanju članaka: ${error.message}</div>`;
    }
}

async function loadPostsFromPath(path) {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${state.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            // Ako path ne postoji, vrati prazan niz
            if (response.status === 404) return [];
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const files = await response.json();
        const posts = [];

        for (const file of files) {
            if (file.type === 'file' && file.name.endsWith('.html')) {
                const content = await fetchFileContent(file.path);
                const post = parsePostFromHTML(content, file.path);
                if (post) posts.push(post);
            }
        }

        return posts;
    } catch (error) {
        console.error(`Error loading posts from ${path}:`, error);
        return [];
    }
}

async function fetchFileContent(filepath) {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filepath}`;

    const response = await fetch(url, {
        headers: {
            'Authorization': `token ${state.token}`,
            'Accept': 'application/vnd.github.v3.raw'
        }
    });

    if (!response.ok) throw new Error(`Failed to fetch ${filepath}`);
    return await response.text();
}

function parsePostFromHTML(html, filepath) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Provjera je li to blog post
        if (!doc.querySelector('.blog-post-hero')) return null;

        const isEnglish = filepath.includes('/en/');
        const title = doc.querySelector('.blog-post-hero h1')?.textContent || '';
        const tagEl = doc.querySelector('.blog-tag');
        const tag = tagEl?.textContent || '';
        const dateEl = doc.querySelector('.blog-post-hero-meta span:nth-child(2)');
        const date = dateEl?.textContent || '';
        const readTimeEl = doc.querySelector('.blog-post-hero-meta span:nth-child(3)');
        const readTime = readTimeEl?.textContent || '';
        const excerptEl = doc.querySelector('.blog-post-content > .container > p:first-of-type');
        const excerpt = excerptEl?.textContent || '';
        const heroImageStyle = doc.querySelector('.blog-post-hero')?.style.backgroundImage || '';
        const image = heroImageStyle.match(/url\(['"]?([^'"]+)['"]?\)/)?.[1] || '';

        // Extrahiraj content (sve nakon <hr class="blog-post-divider">)
        const divider = doc.querySelector('.blog-post-divider');
        let content = '';
        if (divider) {
            let elem = divider.nextElementSibling;
            while (elem && !elem.classList.contains('blog-post-footer')) {
                content += elem.outerHTML;
                elem = elem.nextElementSibling;
            }
        }

        const filename = filepath.split('/').pop().replace('.html', '');

        return {
            title,
            tag,
            date: parseBlogDate(date),
            readTime: parseInt(readTime) || 3,
            excerpt,
            content,
            image,
            filepath,
            filename,
            lang: isEnglish ? 'en' : 'hr'
        };
    } catch (error) {
        console.error('Error parsing post:', error);
        return null;
    }
}

function parseBlogDate(dateStr) {
    // "Kolovoz 2025" → 2025-08-01
    const months = {
        'Siječanj': '01', 'Veljača': '02', 'Ožujak': '03', 'Travanj': '04',
        'Svibanj': '05', 'Lipanj': '06', 'Srpanj': '07', 'Kolovoz': '08',
        'Rujan': '09', 'Listopad': '10', 'Studeni': '11', 'Siječanj': '12',
        'January': '01', 'February': '02', 'March': '03', 'April': '04',
        'May': '05', 'June': '06', 'July': '07', 'August': '08',
        'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };

    const parts = dateStr.trim().split(/\s+/);
    const month = months[parts[0]] || '01';
    const year = parts[1] || new Date().getFullYear();

    return `${year}-${month}-01`;
}

function displayPosts(posts) {
    const lang = languageFilter.value;
    const filtered = lang === 'all' ? posts : posts.filter(p => p.lang === lang);

    postsContainer.innerHTML = filtered.map(post => `
        <div class="post-card">
            ${post.image ? `<div class="post-card-image"><img src="${post.image}" alt="${post.title}"></div>` : '<div class="post-card-image"></div>'}
            <div class="post-card-content">
                <span class="post-card-lang">${post.lang === 'hr' ? 'Hrvatski' : 'English'}</span>
                <h3 class="post-card-title">${escapeHtml(post.title)}</h3>
                <p class="post-card-excerpt">${escapeHtml(post.excerpt.substring(0, 100))}...</p>
                <div class="post-card-meta">
                    <span>${post.date}</span> •
                    <span>${post.readTime} min čitanja</span>
                </div>
                <div class="post-card-actions">
                    <button class="btn-primary" onclick="editPost('${post.filename}', '${post.lang}')">
                        <i class="fas fa-edit"></i> Uredi
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function filterPosts() {
    displayPosts(state.posts);
}

// ============================================
// EDITOR
// ============================================

function showNewPostEditor() {
    state.currentPost = null;
    clearEditorForm();
    document.getElementById('editor-title').textContent = 'Novi članek';
    deletePostBtn.style.display = 'none';

    // Postavi datumi na danas
    document.getElementById('post-date').valueAsDate = new Date();

    postsListView.style.display = 'none';
    editorView.style.display = 'block';

    // Inicijaliziraj Quill editory
    initializeQuillEditors();
}

function editPost(filename, lang) {
    const post = state.posts.find(p => p.filename === filename && p.lang === lang);
    if (!post) return;

    state.currentPost = post;
    document.getElementById('editor-title').textContent = `Uredi: ${post.title}`;
    deletePostBtn.style.display = 'inline-block';

    // Popuni formu
    document.getElementById('post-title').value = post.title;
    document.getElementById('post-tag').value = post.tag;
    document.getElementById('post-date').value = post.date;
    document.getElementById('post-read-time').value = post.readTime;
    document.getElementById('post-excerpt').value = post.excerpt;

    // Prikaži sliku ako postoji
    if (post.image) {
        document.getElementById('image-preview').style.display = 'block';
        document.getElementById('preview-img').src = post.image;
    }

    postsListView.style.display = 'none';
    editorView.style.display = 'block';

    // Inicijaliziraj Quill editory
    initializeQuillEditors(post.content);
}

function showPostsList() {
    postsListView.style.display = 'block';
    editorView.style.display = 'none';
    clearEditorForm();
}

function clearEditorForm() {
    document.getElementById('post-title').value = '';
    document.getElementById('post-title-en').value = '';
    document.getElementById('post-tag').value = '';
    document.getElementById('post-tag-en').value = '';
    document.getElementById('post-date').value = '';
    document.getElementById('post-read-time').value = '3';
    document.getElementById('post-excerpt').value = '';
    document.getElementById('post-excerpt-en').value = '';
    document.getElementById('post-image').value = '';
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('editor-error').style.display = 'none';
    document.getElementById('editor-success').style.display = 'none';

    // Očisti Quill editory
    if (state.editors.hr) state.editors.hr.setContents([]);
    if (state.editors.en) state.editors.en.setContents([]);
}

function initializeQuillEditors(contentHTML = '') {
    // Uništi stare editory ako postoje
    Object.values(state.editors).forEach(editor => {
        editor.off('text-change');
    });

    // Kreiraj nove editory
    state.editors.hr = new Quill('#post-content-hr', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['blockquote', 'code-block'],
                ['link'],
                ['clean']
            ]
        }
    });

    state.editors.en = new Quill('#post-content-en', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['blockquote', 'code-block'],
                ['link'],
                ['clean']
            ]
        }
    });

    // Ako postoji sadržaj, postavi ga
    if (contentHTML) {
        state.editors.hr.root.innerHTML = contentHTML;
    }
}

function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Provjera veličine
    if (file.size > 5 * 1024 * 1024) {
        alert('Slika je prevelika! Maksimalno 5MB.');
        return;
    }

    // Provjera tipa
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        alert('Dozvoljeni formati: PNG, JPG, WebP');
        return;
    }

    // Prikaži preview
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('preview-img').src = e.target.result;
        document.getElementById('image-preview').style.display = 'block';
        // Spremi base64 u atribut
        document.getElementById('post-image').dataset.base64 = e.target.result;
    };
    reader.readAsDataURL(file);
}

function removeImage() {
    document.getElementById('post-image').value = '';
    document.getElementById('post-image').dataset.base64 = '';
    document.getElementById('image-preview').style.display = 'none';
}

// ============================================
// SAVE POST
// ============================================

async function savePost() {
    const errorEl = document.getElementById('editor-error');
    const successEl = document.getElementById('editor-success');
    const savingModal = document.getElementById('saving-modal');

    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    // Validacija
    const title = document.getElementById('post-title').value.trim();
    const titleEn = document.getElementById('post-title-en').value.trim();
    const tag = document.getElementById('post-tag').value.trim();
    const tagEn = document.getElementById('post-tag-en').value.trim();
    const date = document.getElementById('post-date').value;
    const excerpt = document.getElementById('post-excerpt').value.trim();
    const excerptEn = document.getElementById('post-excerpt-en').value.trim();

    if (!title || !titleEn || !tag || !tagEn || !date || !excerpt || !excerptEn) {
        errorEl.textContent = 'Popuni sva obavezna polja!';
        errorEl.style.display = 'block';
        return;
    }

    if (!state.editors.hr.getLength() || !state.editors.en.getLength()) {
        errorEl.textContent = 'Dodaj sadržaj članku!';
        errorEl.style.display = 'block';
        return;
    }

    savingModal.style.display = 'flex';

    try {
        // Pripremi file names
        const filename = slugify(title);
        const filenameEn = slugify(titleEn);

        // Upload slike ako postoji
        let imageUrl = state.currentPost?.image || '';
        const base64 = document.getElementById('post-image').dataset.base64;
        if (base64) {
            imageUrl = await uploadImage(base64, filename);
        }

        // Generiraj HTML za HR verziju
        const dateFormatted = formatBlogDate(new Date(date), 'hr');
        const htmlHR = generatePostHTML(
            titleEn,
            titleEn,
            tag,
            dateFormatted,
            parseInt(document.getElementById('post-read-time').value),
            excerpt,
            state.editors.hr.root.innerHTML,
            imageUrl,
            'hr'
        );

        // Generiraj HTML za EN verziju
        const dateFormattedEn = formatBlogDate(new Date(date), 'en');
        const htmlEN = generatePostHTML(
            titleEn,
            title,
            tagEn,
            dateFormattedEn,
            parseInt(document.getElementById('post-read-time').value),
            excerptEn,
            state.editors.en.root.innerHTML,
            imageUrl,
            'en'
        );

        // Spremi u GitHub
        if (state.currentPost) {
            // Update postojeće članke
            await saveFileToGithub(`PROVIDENTIA_2/blog/${state.currentPost.filename}.html`, htmlHR);
            await saveFileToGithub(`PROVIDENTIA_2/en/blog/${state.currentPost.filename}.html`, htmlEN);
        } else {
            // Kreiraj nove članke
            await saveFileToGithub(`PROVIDENTIA_2/blog/${filename}.html`, htmlHR);
            await saveFileToGithub(`PROVIDENTIA_2/en/blog/${filenameEn}.html`, htmlEN);

            // Ažuriraj blog.html i en/blog.html listing stranice
            await updateBlogListing(filename, titleEn, tag, excerpt, imageUrl, 'hr');
            await updateBlogListing(filenameEn, titleEn, tagEn, excerptEn, imageUrl, 'en');
        }

        savingModal.style.display = 'none';
        successEl.textContent = 'Članek je uspješno spreman! Osvježavanje...';
        successEl.style.display = 'block';

        setTimeout(() => {
            showPostsList();
            loadPosts();
        }, 2000);
    } catch (error) {
        savingModal.style.display = 'none';
        errorEl.textContent = `Greška: ${error.message}`;
        errorEl.style.display = 'block';
        console.error('Save error:', error);
    }
}

async function uploadImage(base64Data, filename) {
    // Extrahiraj samo base64 dio
    const base64 = base64Data.split(',')[1];
    const timestamp = Date.now();
    const imagePath = `PROVIDENTIA_2/images/blog/${filename}-${timestamp}.webp`;

    // Konvertiraj base64 u blob
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    await saveFileToGithub(imagePath, base64, true);
    return `../images/blog/${filename}-${timestamp}.webp`;
}

async function saveFileToGithub(filepath, content, isBase64 = false) {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filepath}`;

    // Prvo provjeri postoji li fajl
    let sha = null;
    try {
        const getRes = await fetch(url, {
            headers: {
                'Authorization': `token ${state.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (getRes.ok) {
            const data = await getRes.json();
            sha = data.sha;
        }
    } catch (error) {
        // File ne postoji, OK
    }

    const body = {
        message: `Blog: ${filepath.split('/').pop()}`,
        content: isBase64 ? content : btoa(content),
        branch: GITHUB_BRANCH
    };

    if (sha) body.sha = sha;

    const res = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${state.token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(`GitHub API error: ${error.message}`);
    }
}

async function updateBlogListing(filename, title, tag, excerpt, image, lang) {
    const blogPath = lang === 'hr' ? 'PROVIDENTIA_2/blog.html' : 'PROVIDENTIA_2/en/blog.html';
    const linkPath = lang === 'hr' ? `blog/${filename}.html` : `blog/${filename}.html`;

    const content = await fetchFileContent(blogPath);

    // Generiraj novi blog card
    const newCard = `<article class="blog-card">
                    <a href="${linkPath}" class="blog-card-link">
                        <div class="blog-card-image">
                            <img src="${image}" alt="${escapeHtml(title)}">
                            <div class="blog-card-overlay">
                                <span class="blog-tag">${escapeHtml(tag)}</span>
                            </div>
                        </div>
                        <div class="blog-card-content">
                            <div class="blog-meta">
                                <span><i class="far fa-calendar-alt"></i> ${lang === 'hr' ? 'Nedavno' : 'Recently'}</span>
                                <span><i class="far fa-clock"></i> 3 min čitanja</span>
                            </div>
                            <h3>${escapeHtml(title)}</h3>
                            <p>${escapeHtml(excerpt)}</p>
                            <span class="blog-read-more">${lang === 'hr' ? 'Pročitaj više' : 'Read more'} <i class="fas fa-arrow-right"></i></span>
                        </div>
                    </a>
                </article>`;

    // Injektiraj u blog-grid
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const grid = doc.querySelector('.blog-grid');

    if (grid) {
        grid.insertAdjacentHTML('afterbegin', newCard);
        await saveFileToGithub(blogPath, doc.documentElement.outerHTML);
    }
}

function generatePostHTML(titleHR, titleEN, tag, dateFormatted, readTime, excerpt, contentHTML, imageUrl, lang) {
    const enVersion = lang === 'en';
    const homeLink = enVersion ? '../index.html' : 'index.html';
    const navHref = enVersion ? '../index.html' : '../index.html';
    const blogLink = enVersion ? '../en/blog.html' : '../blog.html';
    const langLink = enVersion ? './virtualni-asistenti.html' : '../en/blog/virtual-assistants.html';

    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(enVersion ? titleEN : titleHR)} | PROVIDENTIA Blog</title>
    <meta name="description" content="${escapeHtml(excerpt)}">
    <meta name="theme-color" content="#53627f">
    <link rel="icon" href="../images/favicon.png">

    <!-- Consent + GTM -->
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){ dataLayer.push(arguments); }
        gtag('consent', 'default', {
            ad_storage: 'denied', analytics_storage: 'denied',
            functionality_storage: 'denied', security_storage: 'granted',
            ad_user_data: 'denied', ad_personalization: 'denied'
        });
    </script>
    <script>
        (function(){
            function getCookie(name){
                return document.cookie.split(';').map(function(c){ return c.trim(); })
                    .find(function(c){ return c.startsWith(name + '='); });
            }
            try {
                var raw = getCookie('consent');
                if (raw) {
                    var v = JSON.parse(decodeURIComponent(raw.split('=')[1]));
                    if (v && (v.analytics || v.ads || v.submissions)) {
                        gtag('consent','update',{
                            ad_storage: v.ads ? 'granted' : 'denied',
                            analytics_storage: v.analytics ? 'granted' : 'denied',
                            functionality_storage: 'granted',
                            ad_user_data: v.ads ? 'granted' : 'denied',
                            ad_personalization: v.ads ? 'granted' : 'denied'
                        });
                    }
                }
            } catch(e){}
        })();
    </script>
    <script>
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','GTM-W8XNSL8N');
    </script>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@300;400;500;600;700&family=Open+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="../css/reset.css">
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/responsive.css">
</head>
<body>
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-W8XNSL8N" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>

    <header id="header">
        <div class="container">
            <div class="logo">
                <a href="${homeLink}">
                    <img src="../images/logozaweb1.png" alt="PROVIDENTIA logo">
                </a>
            </div>

            <nav class="main-nav">
                <ul>
                    <li><a href="${navHref}#hero">${enVersion ? 'Homepage' : 'Naslovnica'}</a></li>
                    <li><a href="${navHref}#about">${enVersion ? 'About Us' : 'O nama'}</a></li>
                    <li><a href="${blogLink}">${enVersion ? 'Blog' : 'Blog'}</a></li>
                    <li><a href="${navHref}#faq">${enVersion ? 'FAQ' : 'FAQ'}</a></li>
                    <li><a href="${navHref}#contact">${enVersion ? 'Contact' : 'Kontakt'}</a></li>
                </ul>
            </nav>

            <div class="header-actions">
                <div class="lang-switcher">
                    ${enVersion ? `<a href="./virtualni-asistenti.html" title="Hrvatski"><img src="../images/197503.png" alt="HR"></a>
                    <a href="./" class="active" title="English"><img src="../images/197374.png" alt="EN"></a>` : `<a href="../en/blog/virtual-assistants.html" title="English"><img src="../images/197374.png" alt="EN"></a>
                    <a href="./" class="active" title="Hrvatski"><img src="../images/197503.png" alt="HR"></a>`}
                </div>
                <button class="mobile-menu-toggle" aria-label="${enVersion ? 'Open menu' : 'Otvori izbornik'}">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </div>
        <div class="mobile-overlay"></div>
    </header>

    <div class="blog-post-hero" style="background-image: url('${imageUrl}');">
        <div class="container">
            <div class="blog-post-hero-meta">
                <span class="blog-tag">${escapeHtml(tag)}</span>
                <span><i class="far fa-calendar-alt"></i> ${dateFormatted}</span>
                <span><i class="far fa-clock"></i> ${readTime} min ${enVersion ? 'read' : 'čitanja'}</span>
            </div>
            <h1>${escapeHtml(enVersion ? titleEN : titleHR)}</h1>
        </div>
    </div>

    <section class="blog-post-content">
        <div class="container">
            <a href="${blogLink}" class="blog-back-link">
                <i class="fas fa-arrow-left"></i> ${enVersion ? 'Back to blog' : 'Natrag na blog'}
            </a>

            ${contentHTML}

            <div class="blog-post-footer">
                <a href="${blogLink}" class="blog-back-link">
                    <i class="fas fa-arrow-left"></i> ${enVersion ? 'Back to blog' : 'Natrag na blog'}
                </a>
            </div>
        </div>
    </section>

    <footer class="site-footer">
        <div class="container">
            <div class="footer-content">
                <a href="${homeLink}" class="footer-logo">
                    <img src="../images/logozaweb1.png" alt="PROVIDENTIA">
                </a>
                <p class="footer-copyright">&copy; <span id="currentYear">2025</span> Providentia. ${enVersion ? 'All rights reserved.' : 'Sva prava pridržana.'}</p>
                <div class="footer-contact">
                    <a href="mailto:info@providentia-poslovanje-eventi.hr"><i class="fas fa-envelope"></i> info@providentia-poslovanje-eventi.hr</a>
                    <span class="footer-divider">|</span>
                    <a href="tel:+385996359829"><i class="fas fa-phone"></i> 099-635-9829</a>
                </div>
                <div class="footer-legal">
                    <a href="${enVersion ? '../politika-privatnosti.html' : 'politika-privatnosti.html'}">${enVersion ? 'Privacy Policy' : 'Politika privatnosti'}</a>
                </div>
            </div>
        </div>
    </footer>

    <button class="back-to-top" id="back-to-top" aria-label="${enVersion ? 'Back to top' : 'Povratak na vrh'}"><i class="fas fa-chevron-up"></i></button>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            var yearEl = document.getElementById('currentYear');
            if (yearEl) yearEl.textContent = new Date().getFullYear();
            var header = document.getElementById('header');
            var toggle = document.querySelector('.mobile-menu-toggle');
            var overlay = document.querySelector('.mobile-overlay');
            if (toggle) toggle.addEventListener('click', function(){ header.classList.toggle('mobile-menu-active'); });
            if (overlay) overlay.addEventListener('click', function(){ header.classList.remove('mobile-menu-active'); });
            document.querySelectorAll('.main-nav a').forEach(function(l){ l.addEventListener('click', function(){ header.classList.remove('mobile-menu-active'); }); });
            window.addEventListener('scroll', function(){
                header.classList.toggle('sticky', window.scrollY > 100);
                var btn = document.getElementById('back-to-top');
                if (btn) btn.classList.toggle('visible', window.scrollY > 300);
            });
            var btn = document.getElementById('back-to-top');
            if (btn) btn.addEventListener('click', function(e){ e.preventDefault(); window.scrollTo({top:0,behavior:'smooth'}); });
        });
    </script>
</body>
</html>`;
}

// ============================================
// DELETE
// ============================================

function showDeleteConfirm() {
    const modal = document.getElementById('delete-modal');
    modal.style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', function() {
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', deletePost);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', () => {
        document.getElementById('delete-modal').style.display = 'none';
    });
});

async function deletePost() {
    if (!state.currentPost) return;

    const savingModal = document.getElementById('saving-modal');
    savingModal.style.display = 'flex';

    try {
        // Obriši HR verziju
        await deleteFileFromGithub(`PROVIDENTIA_2/blog/${state.currentPost.filename}.html`);

        // Obriši EN verziju
        const enFilename = slugify(document.getElementById('post-title-en').value);
        await deleteFileFromGithub(`PROVIDENTIA_2/en/blog/${enFilename}.html`);

        // Ažuriraj blog.html
        await removeBlogCard(state.currentPost.filename, 'hr');
        await removeBlogCard(enFilename, 'en');

        savingModal.style.display = 'none';
        alert('Članek je obrisan!');

        showPostsList();
        loadPosts();
    } catch (error) {
        savingModal.style.display = 'none';
        alert(`Greška pri brisanju: ${error.message}`);
        console.error('Delete error:', error);
    }

    document.getElementById('delete-modal').style.display = 'none';
}

async function deleteFileFromGithub(filepath) {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filepath}`;

    // Prvo otvori SHA
    const getRes = await fetch(url, {
        headers: {
            'Authorization': `token ${state.token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });

    if (!getRes.ok) throw new Error(`File not found: ${filepath}`);

    const data = await getRes.json();

    // Obriši fajl
    const res = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Authorization': `token ${state.token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: `Delete: ${filepath}`,
            sha: data.sha,
            branch: GITHUB_BRANCH
        })
    });

    if (!res.ok) throw new Error('Failed to delete file');
}

async function removeBlogCard(filename, lang) {
    const blogPath = lang === 'hr' ? 'PROVIDENTIA_2/blog.html' : 'PROVIDENTIA_2/en/blog.html';
    const content = await fetchFileContent(blogPath);

    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const grid = doc.querySelector('.blog-grid');

    if (grid) {
        const cards = grid.querySelectorAll('.blog-card');
        cards.forEach(card => {
            const link = card.querySelector('a');
            if (link && link.href.includes(filename)) {
                card.remove();
            }
        });

        await saveFileToGithub(blogPath, doc.documentElement.outerHTML);
    }
}

// ============================================
// HELPERS
// ============================================

function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatBlogDate(date, lang) {
    const monthsHR = ['Siječanj', 'Veljača', 'Ožujak', 'Travanj', 'Svibanj', 'Lipanj',
                     'Srpanj', 'Kolovoz', 'Rujan', 'Listopad', 'Studeni', 'Prosinac'];
    const monthsEN = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];

    const months = lang === 'hr' ? monthsHR : monthsEN;
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
}
