/* ==========================================================================
   PROVIDENTIA — Poslovanje & Eventi (redesign 2026)
   Sva interaktivnost: mobilni meni, reveal animacije, video, FAQ,
   blog iz blog-posts.json, forme (Formsubmit), cookie consent, back-to-top
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {

    var IS_EN = document.documentElement.lang === 'en';
    var BASE = IS_EN ? '../' : '';
    var REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ========================================
    // MOBILE MENU
    // ========================================
    var menuToggle = document.querySelector('.mobile-menu-toggle');
    var mobileMenu = document.getElementById('mobile-menu');
    var mobileOverlay = document.querySelector('.mobile-overlay');

    function closeMobileMenu() {
        if (mobileMenu) mobileMenu.classList.remove('open');
        if (mobileOverlay) mobileOverlay.classList.remove('visible');
        if (menuToggle) {
            menuToggle.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
        }
    }

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', function () {
            var isOpen = mobileMenu.classList.toggle('open');
            menuToggle.classList.toggle('active', isOpen);
            menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            if (mobileOverlay) mobileOverlay.classList.toggle('visible', isOpen);
        });

        mobileMenu.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', closeMobileMenu);
        });
    }

    if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobileMenu);

    // ========================================
    // SCROLL REVEAL (IntersectionObserver)
    // ========================================
    var revealEls = document.querySelectorAll('[data-reveal]');
    if ('IntersectionObserver' in window && !REDUCED_MOTION) {
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        revealEls.forEach(function (el) { revealObserver.observe(el); });
    } else {
        revealEls.forEach(function (el) { el.classList.add('in-view'); });
    }

    // ========================================
    // VIDEO AUTOPLAY + PAUSE OFF-SCREEN
    // ========================================
    var videos = document.querySelectorAll('video[data-showreel]');
    videos.forEach(function (v) {
        v.muted = true;
        v.loop = true;
        v.playsInline = true;
        var p = v.play();
        if (p && p.catch) p.catch(function () {});
    });

    if ('IntersectionObserver' in window) {
        var videoObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                var v = entry.target;
                if (entry.isIntersecting) {
                    var p = v.play();
                    if (p && p.catch) p.catch(function () {});
                } else {
                    try { v.pause(); } catch (err) {}
                }
            });
        }, { threshold: 0.2 });
        videos.forEach(function (v) { videoObserver.observe(v); });
    }

    // ========================================
    // FAQ ACCORDION (jedan otvoren istovremeno)
    // ========================================
    var faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(function (item) {
        var btn = item.querySelector('.faq-q');
        var answer = item.querySelector('.faq-a');
        if (!btn || !answer) return;

        btn.addEventListener('click', function () {
            var isOpen = item.classList.contains('open');

            faqItems.forEach(function (other) {
                other.classList.remove('open');
                var a = other.querySelector('.faq-a');
                if (a) a.style.maxHeight = '0px';
                var b = other.querySelector('.faq-q');
                if (b) b.setAttribute('aria-expanded', 'false');
            });

            if (!isOpen) {
                item.classList.add('open');
                answer.style.maxHeight = answer.scrollHeight + 'px';
                btn.setAttribute('aria-expanded', 'true');
            }
        });
    });

    // ========================================
    // BACK TO TOP
    // ========================================
    var backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        window.addEventListener('scroll', function () {
            backToTop.classList.toggle('visible', window.scrollY > 300);
        }, { passive: true });

        backToTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
        });
    }

    // ========================================
    // COOKIE CONSENT BANNER (GTM Consent Mode v2)
    // ========================================
    var cookieBanner = document.getElementById('cookie-banner');
    var cookieAcceptBtn = document.getElementById('cookie-accept');

    function hasConsent() {
        try {
            var raw = document.cookie.split(';').map(function (c) { return c.trim(); })
                .find(function (c) { return c.startsWith('consent='); });
            if (raw) {
                var val = JSON.parse(decodeURIComponent(raw.split('=')[1]));
                return !!(val.analytics || val.submissions || val.ads);
            }
        } catch (e) {}
        return false;
    }

    if (cookieBanner && !hasConsent()) {
        cookieBanner.classList.add('visible');
    }

    if (cookieAcceptBtn) {
        cookieAcceptBtn.addEventListener('click', function () {
            if (typeof gtag === 'function') {
                gtag('consent', 'update', {
                    ad_storage: 'granted',
                    analytics_storage: 'granted',
                    functionality_storage: 'granted',
                    ad_user_data: 'granted',
                    ad_personalization: 'granted'
                });
            }

            document.cookie = 'consent=' + encodeURIComponent(JSON.stringify({
                analytics: true, ads: true, submissions: true
            })) + ';path=/;max-age=' + (3600 * 24 * 180);

            if (cookieBanner) cookieBanner.classList.remove('visible');
        });
    }

    // ========================================
    // FORME (Formsubmit.co)
    // ========================================
    function handleFormSubmit(form, successId, errorId, isNewsletter) {
        if (!form) return;
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            var successMsg = document.getElementById(successId);
            var errorMsg = document.getElementById(errorId);
            var submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            var formData = new FormData(form);
            formData.append('_captcha', 'false');
            formData.append('_subject', isNewsletter
                ? 'Nova prijava na newsletter - PROVIDENTIA'
                : 'Novi zahtjev za kontakt - PROVIDENTIA');

            fetch('https://formsubmit.co/kristinabakula3@gmail.com', {
                method: 'POST',
                body: formData
            })
            .then(function (response) {
                if (!response.ok) throw new Error('Greška pri slanju');
                if (successMsg) {
                    successMsg.classList.add('visible');
                    setTimeout(function () { successMsg.classList.remove('visible'); }, 5000);
                }
                form.reset();
            })
            .catch(function (error) {
                console.error('Form error:', error);
                if (errorMsg) {
                    errorMsg.classList.add('visible');
                    setTimeout(function () { errorMsg.classList.remove('visible'); }, 5000);
                }
            })
            .finally(function () {
                if (submitBtn) submitBtn.disabled = false;
            });
        });
    }

    handleFormSubmit(document.getElementById('contact-form'), 'cf-success', 'cf-error', false);
    handleFormSubmit(document.getElementById('newsletter-form'), 'nl-success', 'nl-error', true);

    // ========================================
    // BLOG — naslovnica (featured + grid iz blog-posts.json)
    // ========================================
    var blogGrid = document.getElementById('blog-grid');
    var blogFeatured = document.getElementById('blog-featured');

    if (blogGrid) {
        var monthsHR = ['siječnja', 'veljače', 'ožujka', 'travnja', 'svibnja', 'lipnja',
                        'srpnja', 'kolovoza', 'rujna', 'listopada', 'studenog', 'prosinca'];
        var monthsEN = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];

        function formatDate(iso) {
            var d = new Date(iso);
            if (isNaN(d)) return '';
            return IS_EN
                ? monthsEN[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear()
                : d.getDate() + '. ' + monthsHR[d.getMonth()] + ' ' + d.getFullYear() + '.';
        }

        fetch(BASE + 'blog-posts.json?t=' + Date.now())
            .then(function (res) {
                if (!res.ok) throw new Error('Manifest not found');
                return res.json();
            })
            .then(function (manifest) {
                var posts = (manifest.posts || []).filter(function (p) {
                    return IS_EN ? p.en : p.hr;
                });

                if (posts.length === 0) {
                    blogGrid.innerHTML = '<p class="blog-loading">' +
                        (IS_EN ? 'No articles yet — coming soon!' : 'Još nema članaka — uskoro!') + '</p>';
                    return;
                }

                // -------- Featured rotator --------
                if (blogFeatured) {
                    blogFeatured.hidden = false;

                    var featImg = document.getElementById('feat-img');
                    var featTag = document.getElementById('feat-tag');
                    var featTitle = document.getElementById('feat-title');
                    var featExcerpt = document.getElementById('feat-excerpt');
                    var dotsWrap = document.getElementById('news-dots');
                    var featPosts = posts.slice(0, 3);
                    var idx = 0;
                    var timer = null;

                    function postUrl(post) {
                        var loc = IS_EN ? post.en : post.hr;
                        return BASE + loc.url;
                    }

                    function renderFeatured() {
                        var post = featPosts[idx];
                        var loc = IS_EN ? post.en : post.hr;
                        if (featImg) {
                            featImg.style.backgroundImage = "url('" + BASE + post.image + "')";
                            featImg.href = postUrl(post);
                        }
                        if (featTag) featTag.textContent = (IS_EN ? 'Latest · ' : 'Najnovije · ') + loc.tag;
                        if (featTitle) {
                            featTitle.textContent = loc.title;
                            featTitle.href = postUrl(post);
                        }
                        if (featExcerpt) featExcerpt.textContent = loc.excerpt;
                        if (dotsWrap) {
                            dotsWrap.querySelectorAll('.news-dot').forEach(function (d, i) {
                                d.classList.toggle('active', i === idx);
                            });
                        }
                    }

                    if (dotsWrap) {
                        featPosts.forEach(function (_, i) {
                            var dot = document.createElement('button');
                            dot.className = 'news-dot';
                            dot.setAttribute('aria-label', (IS_EN ? 'Article ' : 'Članak ') + (i + 1));
                            dot.addEventListener('click', function () {
                                idx = i;
                                renderFeatured();
                                restartTimer();
                            });
                            dotsWrap.appendChild(dot);
                        });
                    }

                    function restartTimer() {
                        if (timer) clearInterval(timer);
                        if (featPosts.length > 1 && !REDUCED_MOTION) {
                            timer = setInterval(function () {
                                idx = (idx + 1) % featPosts.length;
                                renderFeatured();
                            }, 4500);
                        }
                    }

                    renderFeatured();
                    restartTimer();
                }

                // -------- Cards grid --------
                var showAll = blogGrid.hasAttribute('data-all');
                blogGrid.innerHTML = (showAll ? posts : posts.slice(0, 3)).map(function (post) {
                    var loc = IS_EN ? post.en : post.hr;
                    var readLabel = IS_EN
                        ? post.readTime + ' min read'
                        : post.readTime + ' min čitanja';
                    return '<a href="' + BASE + loc.url + '" class="blog-card">' +
                        '<div class="card-img" style="background-image:url(\'' + BASE + post.image + '\')"></div>' +
                        '<div class="card-tag gold-grad">' + loc.tag + '</div>' +
                        '<div class="card-title">' + loc.title + '</div>' +
                        '<div class="card-excerpt">' + loc.excerpt + '</div>' +
                        '<div class="card-meta">' + formatDate(post.date) + ' · ' + readLabel + '</div>' +
                        '</a>';
                }).join('');

            })
            .catch(function (err) {
                console.error('Blog load error:', err);
                blogGrid.innerHTML = '<p class="blog-loading">' +
                    (IS_EN ? 'Unable to load articles.' : 'Članke trenutno nije moguće učitati.') + '</p>';
            });
    }

    // ========================================
    // DINAMIČKA GODINA U FOOTERU
    // ========================================
    var yearEl = document.getElementById('currentYear');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
});
