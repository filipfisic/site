// Main JavaScript for PROVIDENTIA Website

document.addEventListener('DOMContentLoaded', function() {

    // ========================================
    // DYNAMIC YEAR IN FOOTER
    // ========================================
    var yearEl = document.getElementById('currentYear');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    // ========================================
    // MOBILE MENU TOGGLE
    // ========================================
    var mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    var header = document.getElementById('header');
    var mobileOverlay = document.querySelector('.mobile-overlay');

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            header.classList.toggle('mobile-menu-active');
        });
    }

    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', function() {
            header.classList.remove('mobile-menu-active');
        });
    }

    // Close mobile menu when clicking on a nav link
    var navLinks = document.querySelectorAll('.main-nav a');
    navLinks.forEach(function(link) {
        link.addEventListener('click', function() {
            header.classList.remove('mobile-menu-active');
        });
    });

    // Mobile dropdown toggle
    var dropdownItems = document.querySelectorAll('.nav-item-dropdown');
    dropdownItems.forEach(function(item) {
        var mainLink = item.querySelector(':scope > a');
        if (mainLink && window.innerWidth < 768) {
            mainLink.addEventListener('click', function(e) {
                if (window.innerWidth < 768) {
                    e.preventDefault();
                    item.classList.toggle('open');
                }
            });
        }
    });

    // ========================================
    // STICKY HEADER
    // ========================================
    var backToTopButton = document.getElementById('back-to-top');

    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            header.classList.add('sticky');
        } else {
            header.classList.remove('sticky');
        }

        // Back to top button visibility
        if (backToTopButton) {
            if (window.scrollY > 300) {
                backToTopButton.classList.add('visible');
            } else {
                backToTopButton.classList.remove('visible');
            }
        }
    });

    // ========================================
    // BACK TO TOP BUTTON
    // ========================================
    if (backToTopButton) {
        backToTopButton.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ========================================
    // SMOOTH SCROLLING (anchor links with header offset)
    // ========================================
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            var targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '###') return;

            var target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                var headerHeight = header ? header.offsetHeight : 0;
                var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }
        });
    });

    // ========================================
    // PARALLAX HERO EFFECT
    // ========================================
    var heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        window.addEventListener('scroll', function() {
            var scrolled = window.pageYOffset;
            if (scrolled < window.innerHeight) {
                heroSection.style.backgroundPositionY = (scrolled * 0.5) + 'px';
            }
        });
    }

    // ========================================
    // SCROLL ANIMATIONS (IntersectionObserver)
    // ========================================
    var animateElements = document.querySelectorAll('.animate-on-scroll');

    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        });

        animateElements.forEach(function(el) {
            observer.observe(el);
        });
    } else {
        // Fallback: show all elements
        animateElements.forEach(function(el) {
            el.classList.add('in-view');
        });
    }

    // ========================================
    // ACCORDION (FAQ)
    // ========================================
    var accordionHeaders = document.querySelectorAll('.accordion-header');

    accordionHeaders.forEach(function(headerBtn) {
        headerBtn.addEventListener('click', function() {
            var isActive = this.classList.contains('active');
            var body = this.nextElementSibling;

            // Close all
            accordionHeaders.forEach(function(h) {
                h.classList.remove('active');
                var b = h.nextElementSibling;
                if (b) b.style.maxHeight = null;
            });

            // Open clicked (if it wasn't already open)
            if (!isActive) {
                this.classList.add('active');
                if (body) {
                    body.style.maxHeight = body.scrollHeight + 'px';
                }
            }
        });
    });

    // Open first accordion item by default
    var firstAccordion = document.querySelector('.accordion-header.active');
    if (firstAccordion) {
        var firstBody = firstAccordion.nextElementSibling;
        if (firstBody) {
            firstBody.style.maxHeight = firstBody.scrollHeight + 'px';
        }
    }

    // ========================================
    // CONTACT GALLERY SLIDER
    // ========================================
    var gallery = document.querySelector('.contact-gallery');
    if (gallery) {
        var slides = gallery.querySelectorAll('.gallery-slide');
        var dotsContainer = gallery.querySelector('.gallery-controls');
        var prevBtn = gallery.querySelector('.gallery-prev');
        var nextBtn = gallery.querySelector('.gallery-next');
        var currentSlide = 0;
        var galleryInterval = null;

        // Generate dots
        slides.forEach(function(_, i) {
            var dot = document.createElement('button');
            dot.className = 'gallery-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', 'Slika ' + (i + 1));
            dot.addEventListener('click', function() {
                showSlide(i);
            });
            dotsContainer.appendChild(dot);
        });

        var dots = dotsContainer.querySelectorAll('.gallery-dot');

        function showSlide(index) {
            slides.forEach(function(s) { s.classList.remove('active'); });
            dots.forEach(function(d) { d.classList.remove('active'); });
            currentSlide = index;
            slides[currentSlide].classList.add('active');
            dots[currentSlide].classList.add('active');
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                showSlide((currentSlide - 1 + slides.length) % slides.length);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                showSlide((currentSlide + 1) % slides.length);
            });
        }

        function startGalleryAutoPlay() {
            galleryInterval = setInterval(function() {
                showSlide((currentSlide + 1) % slides.length);
            }, 5000);
        }

        function stopGalleryAutoPlay() {
            clearInterval(galleryInterval);
        }

        gallery.addEventListener('mouseenter', stopGalleryAutoPlay);
        gallery.addEventListener('mouseleave', startGalleryAutoPlay);

        startGalleryAutoPlay();
    }

    // ========================================
    // BLOG PREVIEW CAROUSEL
    // ========================================
    var blogSlider = document.querySelector('.blog-preview-slider');
    if (blogSlider) {
        var blogCards = blogSlider.querySelectorAll('.blog-preview-cards .blog-card');
        var blogDotsContainer = blogSlider.querySelector('.blog-preview-dots');
        var blogPrevBtn = blogSlider.querySelector('.blog-prev');
        var blogNextBtn = blogSlider.querySelector('.blog-next');
        var currentBlog = 0;
        var blogAutoInterval = null;

        // Generate dots
        blogCards.forEach(function(_, i) {
            var dot = document.createElement('button');
            dot.className = 'blog-preview-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', 'Članak ' + (i + 1));
            dot.addEventListener('click', function() {
                showBlogCard(i);
            });
            blogDotsContainer.appendChild(dot);
        });

        var blogDots = blogDotsContainer.querySelectorAll('.blog-preview-dot');

        function showBlogCard(index) {
            blogCards.forEach(function(c) {
                c.classList.remove('active');
                c.classList.remove('exit-left');
            });
            blogDots.forEach(function(d) { d.classList.remove('active'); });
            currentBlog = index;
            blogCards[currentBlog].classList.add('active');
            blogDots[currentBlog].classList.add('active');
        }

        if (blogPrevBtn) {
            blogPrevBtn.addEventListener('click', function() {
                showBlogCard((currentBlog - 1 + blogCards.length) % blogCards.length);
            });
        }

        if (blogNextBtn) {
            blogNextBtn.addEventListener('click', function() {
                showBlogCard((currentBlog + 1) % blogCards.length);
            });
        }

        // Auto-rotate (only if more than 1 card)
        if (blogCards.length > 1) {
            function startBlogAutoPlay() {
                blogAutoInterval = setInterval(function() {
                    showBlogCard((currentBlog + 1) % blogCards.length);
                }, 6000);
            }

            function stopBlogAutoPlay() {
                clearInterval(blogAutoInterval);
            }

            blogSlider.addEventListener('mouseenter', stopBlogAutoPlay);
            blogSlider.addEventListener('mouseleave', startBlogAutoPlay);
            startBlogAutoPlay();
        }
    }

    // ========================================
    // RIPPLE EFFECT ON BUTTONS
    // ========================================
    document.querySelectorAll('.btn-ripple').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            var ripple = document.createElement('span');
            ripple.classList.add('ripple');
            var rect = this.getBoundingClientRect();
            var size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
            this.appendChild(ripple);
            setTimeout(function() {
                ripple.remove();
            }, 600);
        });
    });

    // ========================================
    // COOKIE CONSENT BANNER
    // ========================================
    var cookieBanner = document.getElementById('cookie-banner');
    var cookieAcceptBtn = document.getElementById('cookie-accept');

    // Check if consent was already given
    function hasConsent() {
        try {
            var raw = document.cookie.split(';').map(function(c){ return c.trim(); })
                .find(function(c){ return c.startsWith('consent='); });
            if (raw) {
                var val = JSON.parse(decodeURIComponent(raw.split('=')[1]));
                return !!(val.analytics || val.submissions || val.ads);
            }
        } catch(e) {}
        return false;
    }

    if (hasConsent() && cookieBanner) {
        cookieBanner.classList.add('hidden');
    }

    if (cookieAcceptBtn) {
        cookieAcceptBtn.addEventListener('click', function() {
            // Update GTM consent
            if (typeof gtag === 'function') {
                gtag('consent', 'update', {
                    ad_storage: 'granted',
                    analytics_storage: 'granted',
                    functionality_storage: 'granted',
                    ad_user_data: 'granted',
                    ad_personalization: 'granted'
                });
            }

            // Set cookie (180 days)
            document.cookie = 'consent=' + encodeURIComponent(JSON.stringify({
                analytics: true, ads: true, submissions: true
            })) + ';path=/;max-age=' + (3600 * 24 * 180);

            // Hide banner
            if (cookieBanner) {
                cookieBanner.classList.add('hidden');
            }
        });
    }

    // ========================================
    // FORM HANDLING (visual only - submission to be configured later)
    // ========================================
    var contactForm = document.getElementById('contact-form');
    var newsletterForm = document.getElementById('newsletter-form');

    function handleFormSubmit(form, successId, errorId, isNewsletter) {
        if (!form) return;
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            var successMsg = document.getElementById(successId);
            var errorMsg = document.getElementById(errorId);

            // Pripremi podatke
            var formData = new FormData(form);

            // Dodaj recipient email
            formData.append('_to', 'kristinabakula3@gmail.com');

            // Skriveni polja za Formsubmit
            formData.append('_captcha', 'false');
            formData.append('_subject', isNewsletter ? 'Nova prijava na newsletter - PROVIDENTIA' : 'Novi zahtjev za kontakt - PROVIDENTIA');

            // Slanje putem Formsubmit.co
            fetch('https://formsubmit.co/kristinabakula3@gmail.com', {
                method: 'POST',
                body: formData
            })
            .then(function(response) {
                if (response.ok) {
                    if (successMsg) {
                        successMsg.style.display = 'block';
                        setTimeout(function() {
                            successMsg.style.display = 'none';
                        }, 4000);
                    }
                    form.reset();
                } else {
                    throw new Error('Greška pri slanju');
                }
            })
            .catch(function(error) {
                console.error('Form error:', error);
                if (errorMsg) {
                    errorMsg.style.display = 'block';
                    setTimeout(function() {
                        errorMsg.style.display = 'none';
                    }, 4000);
                }
            });
        });
    }

    handleFormSubmit(contactForm, 'cf-success', 'cf-error', false);
    handleFormSubmit(newsletterForm, 'nl-success', 'nl-error', true);

    // ========================================
    // BLOG READ MORE / LESS TOGGLE
    // ========================================
    var readMoreButtons = document.querySelectorAll('.post-readmore');
    readMoreButtons.forEach(function(btn) {
        var targetId = btn.getAttribute('data-target');
        var body = document.getElementById(targetId);
        if (!btn || !body) return;

        var MORE = btn.getAttribute('data-more') || 'Prikaži više';
        var LESS = btn.getAttribute('data-less') || 'Prikaži manje';

        btn.addEventListener('click', function(e) {
            e.preventDefault();
            var isCollapsedNow = body.classList.toggle('is-collapsed');
            var expanded = !isCollapsedNow;
            btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            btn.textContent = expanded ? LESS : MORE;
        });
    });

});
