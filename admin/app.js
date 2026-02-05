// ============================================
// PROVIDENTIA BLOG ADMIN - STRUCTURED EDITOR
// Version 3.0 - No WYSIWYG, structured sections
// ============================================

// CONFIG
const ADMIN_PASSWORD = 'BakKris01';
const GITHUB_OWNER = 'filipfisic';
const GITHUB_REPO = 'site';
const GITHUB_BRANCH = 'main';

// STATE
let state = {
    token: localStorage.getItem('github_token') || null,
    currentPost: null,
    posts: []
};

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
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    document.getElementById('new-post-btn').addEventListener('click', showNewPostEditor);
    document.getElementById('back-to-list-btn').addEventListener('click', showPostsList);
    document.getElementById('cancel-edit-btn').addEventListener('click', showPostsList);
    document.getElementById('save-post-btn').addEventListener('click', savePost);
    document.getElementById('delete-post-btn').addEventListener('click', showDeleteConfirm);
    document.getElementById('language-filter').addEventListener('change', filterPosts);

    // Section builders
    document.getElementById('add-section-hr').addEventListener('click', () => addSection('hr'));
    document.getElementById('add-section-en').addEventListener('click', () => addSection('en'));

    // Image upload
    setupImageUpload();

    // Delete modal
    document.getElementById('confirm-delete-btn')?.addEventListener('click', deletePost);
    document.getElementById('cancel-delete-btn')?.addEventListener('click', () => {
        document.getElementById('delete-modal').style.display = 'none';
    });

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
        errorEl.textContent = 'Pogresna lozinka!';
        errorEl.style.display = 'block';
        return;
    }

    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
        errorEl.textContent = 'Neispravan GitHub token format!';
        errorEl.style.display = 'block';
        return;
    }

    localStorage.setItem('github_token', token);
    state.token = token;
    document.getElementById('login-form').reset();
    showDashboard();
    loadPosts();
}

function handleLogout() {
    if (confirm('Jeste li sigurni da se zelite odjaviti?')) {
        localStorage.removeItem('github_token');
        state.token = null;
        state.posts = [];
        showLogin();
    }
}

function showLogin() {
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('dashboard-screen').classList.remove('active');
}

function showDashboard() {
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('dashboard-screen').classList.add('active');
}

// ============================================
// POSTS MANAGEMENT
// ============================================

async function loadPosts() {
    const loadingPosts = document.getElementById('loading-posts');
    const postsContainer = document.getElementById('posts-container');
    const noPosts = document.getElementById('no-posts');

    loadingPosts.style.display = 'block';
    postsContainer.innerHTML = '';

    try {
        const hrPosts = await loadPostsFromPath('blog');
        const enPosts = await loadPostsFromPath('en/blog');
        const allPosts = [...hrPosts, ...enPosts];

        // Group by articleId
        const postsMap = {};
        allPosts.forEach(post => {
            if (!postsMap[post.articleId]) {
                postsMap[post.articleId] = {
                    articleId: post.articleId,
                    title: post.title,
                    tag: post.tag,
                    date: post.date,
                    readTime: post.readTime,
                    excerpt: post.excerpt,
                    image: post.image,
                    versions: {}
                };
            }
            postsMap[post.articleId].versions[post.lang] = {
                title: post.title,
                tag: post.tag,
                excerpt: post.excerpt,
                filepath: post.filepath,
                filename: post.filename,
                sections: post.sections
            };
        });

        state.posts = Object.values(postsMap);

        loadingPosts.style.display = 'none';
        if (state.posts.length === 0) {
            noPosts.style.display = 'block';
        } else {
            noPosts.style.display = 'none';
            displayPosts(state.posts);
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        loadingPosts.innerHTML = `<div class="error-message">Greska pri ucitavanju: ${error.message}</div>`;
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

// ============================================
// PARSE HTML TO STRUCTURED DATA
// ============================================

function parsePostFromHTML(html, filepath) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        if (!doc.querySelector('.blog-post-hero')) return null;

        const isEnglish = filepath.startsWith('en/') || filepath.includes('/en/');
        const articleId = doc.querySelector('meta[name="article-id"]')?.getAttribute('content') || '';
        const title = doc.querySelector('.blog-post-hero h1')?.textContent || '';
        const tagEl = doc.querySelector('.blog-tag');
        const tag = tagEl?.textContent || '';
        const dateEl = doc.querySelector('.blog-post-hero-meta span:nth-child(2)');
        const date = dateEl?.textContent || '';
        const readTimeEl = doc.querySelector('.blog-post-hero-meta span:nth-child(3)');
        const readTime = readTimeEl?.textContent || '';
        const excerptEl = doc.querySelector('.blog-post-content > .container > p:first-of-type');
        const excerpt = excerptEl?.textContent || '';
        const heroImageStyle = doc.querySelector('.blog-post-hero')?.getAttribute('style') || '';
        const imageMatch = heroImageStyle.match(/url\(['"]?([^'")\s]+)['"]?\)/);
        const image = imageMatch ? imageMatch[1] : '';

        // Parse sections from content
        const sections = parseContentToSections(doc);

        const filename = filepath.split('/').pop().replace('.html', '');

        return {
            title,
            tag,
            date: parseBlogDate(date),
            readTime: parseInt(readTime) || 3,
            excerpt,
            sections,
            image,
            filepath,
            filename,
            articleId,
            lang: isEnglish ? 'en' : 'hr'
        };
    } catch (error) {
        console.error('Error parsing post:', error);
        return null;
    }
}

function parseContentToSections(doc) {
    const sections = [];
    const divider = doc.querySelector('.blog-post-divider');
    if (!divider) return sections;

    let currentSection = null;
    let elem = divider.nextElementSibling;

    while (elem && !elem.classList.contains('blog-post-footer')) {
        const tagName = elem.tagName.toLowerCase();

        if (tagName === 'h3') {
            // New section starts
            if (currentSection) {
                sections.push(currentSection);
            }
            currentSection = {
                subtitle: elem.textContent.trim(),
                text: '',
                bullets: []
            };
        } else if (tagName === 'p' && currentSection) {
            // Add paragraph text
            if (currentSection.text) {
                currentSection.text += '\n\n' + elem.textContent.trim();
            } else {
                currentSection.text = elem.textContent.trim();
            }
        } else if (tagName === 'ul' && currentSection) {
            // Add bullet points
            const items = elem.querySelectorAll('li');
            items.forEach(li => {
                currentSection.bullets.push(li.textContent.trim());
            });
        }

        elem = elem.nextElementSibling;
    }

    // Add last section
    if (currentSection) {
        sections.push(currentSection);
    }

    return sections;
}

function parseBlogDate(dateStr) {
    const months = {
        'Sijecanj': '01', 'Veljaca': '02', 'Ozujak': '03', 'Travanj': '04',
        'Svibanj': '05', 'Lipanj': '06', 'Srpanj': '07', 'Kolovoz': '08',
        'Rujan': '09', 'Listopad': '10', 'Studeni': '11', 'Prosinac': '12',
        'January': '01', 'February': '02', 'March': '03', 'April': '04',
        'May': '05', 'June': '06', 'July': '07', 'August': '08',
        'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };

    const parts = dateStr.trim().split(/\s+/);
    const month = months[parts[0]] || '01';
    const year = parts[1] || new Date().getFullYear();

    return `${year}-${month}-01`;
}

// ============================================
// DISPLAY POSTS
// ============================================

function displayPosts(posts) {
    const lang = document.getElementById('language-filter').value;
    const filtered = lang === 'all' ? posts : posts.filter(p => p.versions[lang]);

    document.getElementById('posts-container').innerHTML = filtered.map(post => {
        const availableLangs = Object.keys(post.versions).map(l => l === 'hr' ? 'HR' : 'EN').join(' + ');
        const defaultLang = post.versions['hr'] ? 'hr' : 'en';

        return `
        <div class="post-card">
            ${post.image ? `<div class="post-card-image"><img src="${post.image}" alt="${escapeHtml(post.title)}"></div>` : '<div class="post-card-image"></div>'}
            <div class="post-card-content">
                <span class="post-card-lang">${availableLangs}</span>
                <h3 class="post-card-title">${escapeHtml(post.title)}</h3>
                <p class="post-card-excerpt">${escapeHtml(post.excerpt.substring(0, 100))}...</p>
                <div class="post-card-meta">
                    <span>${post.date}</span> - <span>${post.readTime} min</span>
                </div>
                <div class="post-card-actions">
                    <button class="btn-primary" onclick="editPost('${post.articleId}', '${defaultLang}')">
                        <i class="fas fa-edit"></i> Uredi
                    </button>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

function filterPosts() {
    displayPosts(state.posts);
}

// ============================================
// SECTION MANAGEMENT
// ============================================

function addSection(lang, data = null) {
    const container = document.getElementById(`sections-${lang}`);
    const template = document.getElementById('section-template');
    const clone = template.content.cloneNode(true);
    const section = clone.querySelector('.content-section');

    const index = container.children.length;
    section.dataset.index = index;
    section.querySelector('.section-number').textContent = `Sekcija ${index + 1}`;

    // Fill data if provided
    if (data) {
        section.querySelector('.section-subtitle').value = data.subtitle || '';
        section.querySelector('.section-text').value = data.text || '';
        section.querySelector('.section-bullets').value = (data.bullets || []).map(b => `- ${b}`).join('\n');
    }

    // Remove button handler
    section.querySelector('.btn-remove-section').addEventListener('click', function() {
        section.remove();
        renumberSections(lang);
    });

    container.appendChild(section);
}

function renumberSections(lang) {
    const container = document.getElementById(`sections-${lang}`);
    const sections = container.querySelectorAll('.content-section');
    sections.forEach((section, i) => {
        section.dataset.index = i;
        section.querySelector('.section-number').textContent = `Sekcija ${i + 1}`;
    });
}

function getSectionsData(lang) {
    const container = document.getElementById(`sections-${lang}`);
    const sections = container.querySelectorAll('.content-section');
    const data = [];

    sections.forEach(section => {
        const subtitle = section.querySelector('.section-subtitle').value.trim();
        const text = section.querySelector('.section-text').value.trim();
        const bulletsRaw = section.querySelector('.section-bullets').value.trim();

        // Parse bullets
        const bullets = bulletsRaw.split('\n')
            .map(line => line.replace(/^[-*]\s*/, '').trim())
            .filter(line => line.length > 0);

        if (subtitle || text || bullets.length > 0) {
            data.push({ subtitle, text, bullets });
        }
    });

    return data;
}

function clearSections(lang) {
    document.getElementById(`sections-${lang}`).innerHTML = '';
}

// ============================================
// EDITOR
// ============================================

function showNewPostEditor() {
    state.currentPost = null;
    clearEditorForm();
    document.getElementById('editor-title').textContent = 'Novi clanak';
    document.getElementById('delete-post-btn').style.display = 'none';
    document.getElementById('post-date').valueAsDate = new Date();

    // Add one empty section for each language
    addSection('hr');
    addSection('en');

    document.getElementById('posts-list-view').style.display = 'none';
    document.getElementById('editor-view').style.display = 'block';
}

function editPost(articleId, lang) {
    const post = state.posts.find(p => p.articleId === articleId);
    if (!post) return;

    state.currentPost = post;
    document.getElementById('editor-title').textContent = `Uredi: ${post.title}`;
    document.getElementById('delete-post-btn').style.display = 'inline-block';

    const hrVer = post.versions['hr'] || {};
    const enVer = post.versions['en'] || {};

    document.getElementById('post-title').value = hrVer.title || '';
    document.getElementById('post-title-en').value = enVer.title || '';
    document.getElementById('post-tag').value = hrVer.tag || '';
    document.getElementById('post-tag-en').value = enVer.tag || '';
    document.getElementById('post-date').value = post.date;
    document.getElementById('post-read-time').value = post.readTime;
    document.getElementById('post-excerpt').value = hrVer.excerpt || '';
    document.getElementById('post-excerpt-en').value = enVer.excerpt || '';

    if (post.image) {
        document.getElementById('image-preview').style.display = 'block';
        document.getElementById('preview-img').src = post.image;
    }

    // Load sections
    clearSections('hr');
    clearSections('en');

    if (hrVer.sections && hrVer.sections.length > 0) {
        hrVer.sections.forEach(s => addSection('hr', s));
    } else {
        addSection('hr');
    }

    if (enVer.sections && enVer.sections.length > 0) {
        enVer.sections.forEach(s => addSection('en', s));
    } else {
        addSection('en');
    }

    document.getElementById('posts-list-view').style.display = 'none';
    document.getElementById('editor-view').style.display = 'block';
}

function showPostsList() {
    document.getElementById('posts-list-view').style.display = 'block';
    document.getElementById('editor-view').style.display = 'none';
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
    document.getElementById('post-image').dataset.base64 = '';
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('editor-error').style.display = 'none';
    document.getElementById('editor-success').style.display = 'none';

    clearSections('hr');
    clearSections('en');
}

// ============================================
// IMAGE UPLOAD
// ============================================

function setupImageUpload() {
    const postImage = document.getElementById('post-image');
    const imageUpload = document.querySelector('.image-upload');

    postImage.addEventListener('change', handleImageSelect);
    imageUpload.addEventListener('click', (e) => {
        if (e.target !== postImage) postImage.click();
    });
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

    document.getElementById('remove-image-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        removeImage();
    });
}

function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        alert('Slika je prevelika! Maksimalno 5MB.');
        return;
    }

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        alert('Dozvoljeni formati: PNG, JPG, WebP');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('preview-img').src = e.target.result;
        document.getElementById('image-preview').style.display = 'block';
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
// GENERATE HTML FROM STRUCTURED DATA
// ============================================

function generateContentHTML(sections) {
    let html = '';

    sections.forEach(section => {
        if (section.subtitle) {
            html += `\n            <h3>${escapeHtml(section.subtitle)}</h3>`;
        }
        if (section.text) {
            // Split text into paragraphs
            const paragraphs = section.text.split(/\n\n+/);
            paragraphs.forEach(p => {
                if (p.trim()) {
                    html += `\n            <p>${escapeHtml(p.trim())}</p>`;
                }
            });
        }
        if (section.bullets && section.bullets.length > 0) {
            html += `\n            <ul>`;
            section.bullets.forEach(bullet => {
                html += `\n                <li>${escapeHtml(bullet)}</li>`;
            });
            html += `\n            </ul>`;
        }
    });

    return html;
}

function generatePostHTML(title, tag, dateFormatted, readTime, excerpt, sections, imageUrl, lang, articleId) {
    const isEn = lang === 'en';
    const contentHTML = generateContentHTML(sections);

    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)} | PROVIDENTIA Blog</title>
    <meta name="description" content="${escapeHtml(excerpt)}">
    <meta name="article-id" content="${escapeHtml(articleId)}">
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
                <a href="../index.html">
                    <img src="../images/logozaweb1.png" alt="PROVIDENTIA logo">
                </a>
            </div>

            <nav class="main-nav">
                <ul>
                    <li><a href="../index.html#hero">${isEn ? 'Homepage' : 'Naslovnica'}</a></li>
                    <li><a href="../index.html#about">${isEn ? 'About Us' : 'O nama'}</a></li>
                    <li class="nav-item-dropdown">
                        <a href="../index.html#services">${isEn ? 'Our Services' : 'Nase usluge'} <i class="fas fa-chevron-down" style="font-size: 0.6em; margin-left: 4px;"></i></a>
                        <ul class="dropdown-menu">
                            <li><a href="../poslovno-savjetovanje.html">Poslovno savjetovanje</a></li>
                            <li><a href="../upravljanje-projektima.html">Upravljanje projektima</a></li>
                            <li><a href="../HR-usluge-i-radni-procesi.html">HR usluge i radni procesi</a></li>
                            <li><a href="../financijske-usluge.html">Financijsko-racunovodstvene usluge</a></li>
                            <li><a href="../administrativne-usluge.html">Administrativne usluge</a></li>
                            <li><a href="../organizacija-eventa.html">Organizacija eventa</a></li>
                            <li><a href="../virtualni-asistent-i-coaching.html">Virtualni asistent i coaching</a></li>
                            <li><a href="../marketing-i-PR-usluge.html">Digitalni marketing i izrada weba</a></li>
                        </ul>
                    </li>
                    <li><a href="../blog.html">Blog</a></li>
                    <li><a href="../index.html#faq">FAQ</a></li>
                    <li><a href="../index.html#contact">${isEn ? 'Contact' : 'Kontakt'}</a></li>
                </ul>
            </nav>

            <div class="header-actions">
                <div class="lang-switcher">
                    <a href="../en/blog/${articleId}.html" title="English"><img src="../images/197374.png" alt="EN"></a>
                    <a href="../blog/${articleId}.html" class="active" title="Hrvatski"><img src="../images/197503.png" alt="HR"></a>
                </div>
                <button class="mobile-menu-toggle" aria-label="${isEn ? 'Open menu' : 'Otvori izbornik'}">
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
                <span><i class="far fa-clock"></i> ${readTime} min ${isEn ? 'read' : 'citanja'}</span>
            </div>
            <h1>${escapeHtml(title)}</h1>
        </div>
    </div>

    <section class="blog-post-content">
        <div class="container">
            <a href="../blog.html" class="blog-back-link">
                <i class="fas fa-arrow-left"></i> ${isEn ? 'Back to blog' : 'Natrag na blog'}
            </a>

            <p>${escapeHtml(excerpt)}</p>

            <hr class="blog-post-divider">
${contentHTML}

            <div class="blog-post-footer">
                <a href="../blog.html" class="blog-back-link">
                    <i class="fas fa-arrow-left"></i> ${isEn ? 'Back to blog' : 'Natrag na blog'}
                </a>
            </div>
        </div>
    </section>

    <footer class="site-footer">
        <div class="container">
            <div class="footer-content">
                <a href="../index.html" class="footer-logo">
                    <img src="../images/logozaweb1.png" alt="PROVIDENTIA">
                </a>
                <p class="footer-copyright">&copy; <span id="currentYear">2025</span> Providentia. ${isEn ? 'All rights reserved.' : 'Sva prava pridrzana.'}</p>
                <div class="footer-contact">
                    <a href="mailto:info@providentia-poslovanje-eventi.hr"><i class="fas fa-envelope"></i> info@providentia-poslovanje-eventi.hr</a>
                    <span class="footer-divider">|</span>
                    <a href="tel:+385996359829"><i class="fas fa-phone"></i> 099-635-9829</a>
                </div>
                <div class="footer-legal">
                    <a href="../politika-privatnosti.html">${isEn ? 'Privacy Policy' : 'Politika privatnosti'}</a>
                </div>
            </div>
        </div>
    </footer>

    <button class="back-to-top" id="back-to-top" aria-label="${isEn ? 'Back to top' : 'Povratak na vrh'}"><i class="fas fa-chevron-up"></i></button>

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
// SAVE POST
// ============================================

async function savePost() {
    const errorEl = document.getElementById('editor-error');
    const successEl = document.getElementById('editor-success');
    const savingModal = document.getElementById('saving-modal');

    errorEl.style.display = 'none';
    successEl.style.display = 'none';

    // Validation
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

    const sectionsHR = getSectionsData('hr');
    const sectionsEN = getSectionsData('en');

    if (sectionsHR.length === 0 || sectionsEN.length === 0) {
        errorEl.textContent = 'Dodaj barem jednu sekciju za svaki jezik!';
        errorEl.style.display = 'block';
        return;
    }

    savingModal.style.display = 'flex';

    try {
        const filename = slugify(title);
        const readTimeVal = parseInt(document.getElementById('post-read-time').value) || 3;

        // Upload image if new
        let imageUrl = state.currentPost?.image || '';
        const base64 = document.getElementById('post-image').dataset.base64;
        if (base64) {
            imageUrl = await uploadImage(base64, filename);
        }

        const dateFormatted = formatBlogDate(new Date(date), 'hr');
        const dateFormattedEn = formatBlogDate(new Date(date), 'en');

        // Generate HTML
        const htmlHR = generatePostHTML(title, tag, dateFormatted, readTimeVal, excerpt, sectionsHR, imageUrl, 'hr', filename);
        const htmlEN = generatePostHTML(titleEn, tagEn, dateFormattedEn, readTimeVal, excerptEn, sectionsEN, imageUrl, 'en', filename);

        // Save files (one by one to avoid Tree API issues)
        await saveFileToGithub(`blog/${filename}.html`, htmlHR);
        await saveFileToGithub(`en/blog/${filename}.html`, htmlEN);

        savingModal.style.display = 'none';
        successEl.textContent = 'Clanak je uspjesno spreman! Osvjezavanje...';
        successEl.style.display = 'block';

        setTimeout(() => {
            showPostsList();
            loadPosts();
        }, 2000);
    } catch (error) {
        savingModal.style.display = 'none';
        errorEl.textContent = `Greska: ${error.message}`;
        errorEl.style.display = 'block';
        console.error('Save error:', error);
    }
}

async function uploadImage(base64Data, filename) {
    const base64 = base64Data.split(',')[1];
    const timestamp = Date.now();
    const imagePath = `images/blog/${filename}-${timestamp}.webp`;

    await saveFileToGithub(imagePath, base64, true);
    return `../images/blog/${filename}-${timestamp}.webp`;
}

async function saveFileToGithub(filepath, content, isBase64 = false) {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filepath}`;

    // Check if file exists
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
    } catch (e) {
        console.log('File does not exist, creating new');
    }

    // Save file
    const body = {
        message: `Blog: ${filepath.split('/').pop()}`,
        content: isBase64 ? content : btoa(unescape(encodeURIComponent(content))),
        branch: GITHUB_BRANCH
    };

    if (sha) body.sha = sha;

    const res = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${state.token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const text = await res.text();
        console.error('GitHub API error:', text);
        throw new Error(`GitHub API error: ${res.status}`);
    }
}

// ============================================
// DELETE
// ============================================

function showDeleteConfirm() {
    document.getElementById('delete-modal').style.display = 'flex';
}

async function deletePost() {
    if (!state.currentPost) return;

    const savingModal = document.getElementById('saving-modal');
    savingModal.style.display = 'flex';

    try {
        const post = state.currentPost;

        if (post.versions['hr']) {
            await deleteFileFromGithub(post.versions['hr'].filepath);
        }
        if (post.versions['en']) {
            await deleteFileFromGithub(post.versions['en'].filepath);
        }

        savingModal.style.display = 'none';
        alert('Clanak je obrisan!');

        showPostsList();
        loadPosts();
    } catch (error) {
        savingModal.style.display = 'none';
        alert(`Greska pri brisanju: ${error.message}`);
    }

    document.getElementById('delete-modal').style.display = 'none';
}

async function deleteFileFromGithub(filepath) {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filepath}`;

    const getRes = await fetch(url, {
        headers: {
            'Authorization': `token ${state.token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });

    if (!getRes.ok) throw new Error(`File not found: ${filepath}`);

    const data = await getRes.json();

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
    const monthsHR = ['Sijecanj', 'Veljaca', 'Ozujak', 'Travanj', 'Svibanj', 'Lipanj',
                     'Srpanj', 'Kolovoz', 'Rujan', 'Listopad', 'Studeni', 'Prosinac'];
    const monthsEN = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];

    const months = lang === 'hr' ? monthsHR : monthsEN;
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
}
