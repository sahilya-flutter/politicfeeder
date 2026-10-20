/**
 * PoliticFeeder (पॉलिटिकफीडर) - Master Application Logic
 * Pure ES6+, Zero External Dependencies, 100% Marathi Support
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. State Management & LocalStorage Persistence
  // ==========================================================================
  const STORAGE_KEYS = {
    ARTICLES: 'politicfeeder_articles_v1',
    BOOKMARKS: 'politicfeeder_bookmarks_v1',
    POLL: 'politicfeeder_poll_v1',
    POLL_VOTED: 'politicfeeder_poll_voted_v1',
    THEME: 'politicfeeder_theme_v1'
  };

  let state = {
    articles: [],
    bookmarks: [],
    pollData: null,
    hasVotedPoll: false,
    currentCategory: 'all',
    currentDistrict: 'all',
    searchQuery: '',
    currentArticle: null,
    editingArticleId: null,
    theme: 'light',
    isAdminMode: false,
    fontSizeMultiplier: 1.0,
    isSpeaking: false,
    viewMode: 'grid'
  };

  // Preset news images for quick selection in admin panel
  const PRESET_IMAGES = [
    { name: "विधानसभा / राजकारण", url: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1000&q=80" },
    { name: "मुंबई मेट्रो / पायाभूत सुविधा", url: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1000&q=80" },
    { name: "महाराष्ट्र शेती / शेतकरी", url: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&w=1000&q=80" },
    { name: "भारतीय अर्थव्यवस्था / बँकिंग", url: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1000&q=80" },
    { name: "इस्रो / अंतराळ विज्ञान", url: "https://images.unsplash.com/photo-1517976487502-5735f49d32d0?auto=format&fit=crop&w=1000&q=80" },
    { name: "क्रीडा / कुस्ती व क्रिकेट", url: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1000&q=80" }
  ];

  // Initialize Data
  function initState() {
    // 1. Articles
    const savedArticles = localStorage.getItem(STORAGE_KEYS.ARTICLES);
    if (savedArticles) {
      try {
        state.articles = JSON.parse(savedArticles);
      } catch (e) {
        state.articles = [...INITIAL_NEWS_DATA];
      }
    } else {
      state.articles = [...INITIAL_NEWS_DATA];
      saveArticles();
    }

    // 2. Bookmarks
    const savedBookmarks = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    state.bookmarks = savedBookmarks ? JSON.parse(savedBookmarks) : [];

    // 3. Poll
    const savedPoll = localStorage.getItem(STORAGE_KEYS.POLL);
    state.pollData = savedPoll ? JSON.parse(savedPoll) : { ...INITIAL_POLL };
    state.hasVotedPoll = localStorage.getItem(STORAGE_KEYS.POLL_VOTED) === 'true';

    // 4. Theme
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    setTheme(savedTheme);
  }

  function saveArticles() {
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(state.articles));
  }

  function saveBookmarks() {
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(state.bookmarks));
    updateBookmarkCountUI();
  }

  function savePoll() {
    localStorage.setItem(STORAGE_KEYS.POLL, JSON.stringify(state.pollData));
    localStorage.setItem(STORAGE_KEYS.POLL_VOTED, 'true');
    state.hasVotedPoll = true;
  }

  // ==========================================================================
  // 2. Date, Time & Weather Helpers (मराठी कॅलेंडर व घड्याळ)
  // ==========================================================================
  const MARATHI_DAYS = ['रविवार', 'सोमवार', 'मंगळवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
  const MARATHI_MONTHS = ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'];

  function updateLiveMarathiDateTime() {
    const now = new Date();
    const day = MARATHI_DAYS[now.getDay()];
    const date = now.getDate();
    const month = MARATHI_MONTHS[now.getMonth()];
    const year = now.getFullYear();

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'दुपारी / रात्री' : 'सकाळी';
    const displayHours = hours % 12 || 12;

    const formatted = `${day}, ${date} ${month} ${year} | वेळ: ${displayHours}:${minutes}:${seconds}`;
    const el = document.getElementById('live-marathi-datetime');
    if (el) el.textContent = formatted;
  }

  // ==========================================================================
  // 3. Theme Toggle
  // ==========================================================================
  function setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.innerHTML = theme === 'dark' 
        ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg> लाइट थीम`
        : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> डार्क थीम`;
    }
  }

  // ==========================================================================
  // 4. Rendering Frontend (Public Portal)
  // ==========================================================================
  
  // Render Breaking Ticker
  function renderBreakingTicker() {
    const marquee = document.getElementById('breaking-ticker-marquee');
    if (!marquee) return;

    const breakingNews = state.articles.filter(a => a.isBreaking);
    const items = breakingNews.length > 0 ? breakingNews : state.articles.slice(0, 4);

    marquee.innerHTML = items.map(item => `
      <span class="ticker-item" data-id="${item.id}">
        <strong>[${item.categoryName || 'महत्त्वाचे'}]</strong> ${item.title}
      </span>
    `).join('');

    // Attach click listeners to ticker items
    marquee.querySelectorAll('.ticker-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-id');
        openArticleModal(id);
      });
    });
  }

  // Render Navigation Categories with live counts
  function renderNavCategories() {
    const navList = document.getElementById('main-nav-links');
    if (!navList) return;

    navList.innerHTML = CATEGORIES.map(cat => {
      const count = cat.id === 'all' 
        ? state.articles.length 
        : state.articles.filter(a => a.category === cat.id).length;
      
      const isActive = state.currentCategory === cat.id ? 'active' : '';

      return `
        <li class="nav-item">
          <a href="#${cat.id}" class="nav-link ${isActive}" data-category="${cat.id}">
            <span>${cat.name}</span>
            <span class="nav-badge-count">${count}</span>
          </a>
        </li>
      `;
    }).join('');

    // Nav link click events
    navList.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const cat = link.getAttribute('data-category');
        setCategoryFilter(cat);
      });
    });
  }

  // Render Hero Section (Lead Story + Trending Sidebar)
  function renderHeroSection() {
    const leadContainer = document.getElementById('lead-story-container');
    const trendingContainer = document.getElementById('trending-side-container');
    if (!leadContainer || !trendingContainer) return;

    // Pick Lead Story (isLead === true or highest views)
    let lead = state.articles.find(a => a.isLead);
    if (!lead && state.articles.length > 0) lead = state.articles[0];

    if (lead) {
      leadContainer.innerHTML = `
        <div class="lead-story-card" data-id="${lead.id}">
          <div class="lead-image-wrap">
            <img src="${lead.image}" alt="${lead.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1000&q=80'"/>
            <div class="lead-overlay-gradient"></div>
            <div class="lead-badge-float">
              <span class="badge-tag ${lead.isBreaking ? 'breaking' : ''}">
                ${lead.isBreaking ? '⚡ ब्रेकिंग न्यूज' : '★ मुख्य बातमी'}
              </span>
              <span class="badge-tag" style="background: rgba(0,0,0,0.6);">${lead.categoryName || 'विशेष'}</span>
            </div>
            <div class="lead-content-overlay">
              <h2 class="lead-headline">${lead.title}</h2>
              <p class="lead-excerpt">${lead.summary}</p>
              <div class="lead-meta">
                <span>📍 ${lead.district || 'महाराष्ट्र'}</span>
                <span>🕒 ${lead.date}</span>
                <span>👁️ ${lead.views.toLocaleString()} वाचक</span>
                <span>⏱️ ${lead.readTime || '२ मिनिटे'}</span>
              </div>
            </div>
          </div>
        </div>
      `;

      leadContainer.querySelector('.lead-story-card').addEventListener('click', () => {
        openArticleModal(lead.id);
      });
    }

    // Top 3 Secondary Trending Stories (excluding lead)
    const otherStories = state.articles.filter(a => a.id !== lead?.id).slice(0, 3);
    trendingContainer.innerHTML = otherStories.map(story => `
      <div class="trending-card" data-id="${story.id}">
        <div class="trending-thumb">
          <img src="${story.image}" alt="${story.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=400&q=80'"/>
        </div>
        <div class="trending-details">
          <span class="trending-tag">${story.categoryName} • ${story.district || 'महाराष्ट्र'}</span>
          <h4 class="trending-title">${story.title}</h4>
          <div class="trending-meta">
            <span>🕒 ${story.date.split(',')[0]}</span>
            <span>👁️ ${story.views}</span>
          </div>
        </div>
      </div>
    `).join('');

    trendingContainer.querySelectorAll('.trending-card').forEach(card => {
      card.addEventListener('click', () => {
        openArticleModal(card.getAttribute('data-id'));
      });
    });
  }

  // Render Filtered News Grid (Supports Grid & Timeline List View Modes)
  function renderNewsGrid() {
    const container = document.getElementById('news-cards-container') || document.getElementById('news-cards-grid');
    const resultCountEl = document.getElementById('grid-results-count');
    if (!container) return;

    let filtered = [...state.articles];

    // Filter by category
    if (state.currentCategory !== 'all') {
      filtered = filtered.filter(a => a.category === state.currentCategory);
    }

    // Filter by district
    if (state.currentDistrict !== 'all') {
      filtered = filtered.filter(a => a.district && a.district.includes(state.currentDistrict));
    }

    // Filter by search query
    if (state.searchQuery.trim()) {
      const q = state.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        (a.content && a.content.toLowerCase().includes(q)) ||
        (a.tags && a.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    if (resultCountEl) {
      resultCountEl.textContent = `${filtered.length} ताज्या बातम्या`;
    }

    if (filtered.length === 0) {
      container.className = 'news-cards-grid';
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3.5rem 1.5rem; background: var(--bg-surface); border-radius: var(--radius-md); border: 2px dashed var(--border-strong);">
          <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🔍</div>
          <h3 style="font-family: var(--font-heading); font-size: 1.35rem; font-weight: 800; color: var(--navy-900); margin-bottom: 0.5rem;">कोणतीही बातमी सापडली नाही</h3>
          <p style="color: var(--text-muted); font-size: 1rem; font-weight: 500;">कृपया वेगळे शब्द वापरून शोधा किंवा वर्गवारी बदला.</p>
          <button class="primary-btn" id="reset-filters-btn" style="margin-top: 1.25rem;">सर्व बातम्या पहा</button>
        </div>
      `;
      const resetBtn = document.getElementById('reset-filters-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          setCategoryFilter('all');
          const searchInput = document.getElementById('brand-search-input');
          if (searchInput) searchInput.value = '';
          state.searchQuery = '';
          state.currentDistrict = 'all';
          renderAll();
        });
      }
      return;
    }

    // Check display mode: 'grid' vs 'list'
    if (state.viewMode === 'list') {
      // Timeline / Feed Mode
      container.className = 'news-cards-feed';
      container.innerHTML = filtered.map(item => {
        const isSaved = state.bookmarks.includes(item.id);
        return `
          <article class="news-feed-card" data-id="${item.id}">
            <div class="feed-thumb-wrap">
              <img src="${item.image}" alt="${item.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80'"/>
              ${item.isBreaking ? '<span class="badge-tag breaking" style="position: absolute; top: 0.65rem; left: 0.65rem;">⚡ ब्रेकिंग</span>' : ''}
            </div>
            <div class="feed-content-wrap">
              <div class="feed-top-meta">
                <div class="feed-tags">
                  <span class="card-category-pill">${item.categoryName}</span>
                  <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-subtle);">📍 ${item.district || 'महाराष्ट्र'}</span>
                  <span style="font-size: 0.775rem; color: var(--breaking-red); font-weight: 800;">🔴 ताज्या अपडेट्स</span>
                </div>
                <button class="card-bookmark-btn ${isSaved ? 'saved' : ''}" data-id="${item.id}" title="बुकमार्क करा">
                  ${isSaved ? '★' : '☆'}
                </button>
              </div>
              <h3 class="feed-title">${item.title}</h3>
              <p class="feed-snippet">${item.summary}</p>
              <div class="feed-bottom-row">
                <div style="display: flex; gap: 1rem; align-items: center;">
                  <span>✍️ ${item.author ? item.author.split(',')[0] : 'पॉलिटिकफीडर डेस्क'}</span>
                  <span>🕒 ${item.date.split(',')[0]}</span>
                  <span>👁️ ${item.views} वाचक</span>
                </div>
                <button class="feed-read-btn">
                  <span>सविस्तर वाचा</span> &rarr;
                </button>
              </div>
            </div>
          </article>
        `;
      }).join('');

      container.querySelectorAll('.news-feed-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.card-bookmark-btn')) return;
          const id = card.getAttribute('data-id');
          openArticleModal(id);
        });
      });
    } else {
      // Magazine Grid Mode
      container.className = 'news-cards-grid';
      container.innerHTML = filtered.map(item => {
        const isSaved = state.bookmarks.includes(item.id);
        return `
          <article class="news-card" data-id="${item.id}">
            <div class="news-card-image">
              <img src="${item.image}" alt="${item.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=600&q=80'"/>
              ${item.isBreaking ? '<span class="badge-tag breaking" style="position: absolute; top: 0.75rem; left: 0.75rem;">⚡ ब्रेकिंग</span>' : ''}
            </div>
            <div class="news-card-body">
              <div class="news-card-category-row">
                <span class="card-category-pill">${item.categoryName} • ${item.district || 'महाराष्ट्र'}</span>
                <button class="card-bookmark-btn ${isSaved ? 'saved' : ''}" data-id="${item.id}" title="बुकमार्क करा">
                  ${isSaved ? '★' : '☆'}
                </button>
              </div>
              <h3 class="news-card-title">${item.title}</h3>
              <p class="news-card-snippet">${item.summary}</p>
              <div class="news-card-footer">
                <span>🕒 ${item.date.split(',')[0]}</span>
                <span>⏱️ ${item.readTime || '२ मिनिटे'}</span>
                <span>👁️ ${item.views}</span>
              </div>
            </div>
          </article>
        `;
      }).join('');

      container.querySelectorAll('.news-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.card-bookmark-btn')) return;
          const id = card.getAttribute('data-id');
          openArticleModal(id);
        });
      });
    }

    // Bookmark button click handling
    container.querySelectorAll('.card-bookmark-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        toggleBookmark(id);
      });
    });
  }

  // Render Top 5 Most Read (Numbered List)
  function renderTrendingTop5() {
    const list = document.getElementById('trending-numbered-list');
    if (!list) return;

    const top5 = [...state.articles].sort((a, b) => b.views - a.views).slice(0, 5);

    list.innerHTML = top5.map((item, index) => `
      <div class="numbered-item" data-id="${item.id}">
        <span class="item-rank">०${index + 1}</span>
        <div class="item-text">
          <h4>${item.title}</h4>
          <div class="item-meta">
            <span>${item.categoryName}</span> • <span>👁️ ${item.views.toLocaleString()}</span>
          </div>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.numbered-item').forEach(el => {
      el.addEventListener('click', () => {
        openArticleModal(el.getAttribute('data-id'));
      });
    });
  }

  // Render Opinion Poll Widget
  function renderPollWidget() {
    const pollBox = document.getElementById('opinion-poll-container');
    if (!pollBox) return;

    const poll = state.pollData;
    const hasVoted = state.hasVotedPoll;

    let optionsHtml = '';
    poll.options.forEach(opt => {
      const percentage = poll.totalVotes > 0 
        ? Math.round((opt.votes / poll.totalVotes) * 100) 
        : 0;

      if (hasVoted) {
        optionsHtml += `
          <div class="poll-option-btn" style="cursor: default;">
            <div class="poll-result-bar" style="width: ${percentage}%;"></div>
            <div class="poll-option-text">
              <span>${opt.text}</span>
              <span class="poll-percentage">${percentage}% (${opt.votes})</span>
            </div>
          </div>
        `;
      } else {
        optionsHtml += `
          <button class="poll-option-btn" data-opt-id="${opt.id}">
            <div class="poll-option-text">
              <span>${opt.text}</span>
              <span style="color: var(--blue-600); font-size: 0.8rem;">मत द्या &rarr;</span>
            </div>
          </button>
        `;
      }
    });

    pollBox.innerHTML = `
      <div class="poll-question">❓ ${poll.question}</div>
      <div class="poll-options-list">${optionsHtml}</div>
      <div class="poll-total-votes">
        ${hasVoted ? '✓ तुमचे मत नोंदवले गेले आहे! ' : ''}एकूण मते: ${poll.totalVotes.toLocaleString()}
      </div>
    `;

    if (!hasVoted) {
      pollBox.querySelectorAll('.poll-option-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const optId = btn.getAttribute('data-opt-id');
          handleVotePoll(optId);
        });
      });
    }
  }

  function handleVotePoll(optId) {
    const opt = state.pollData.options.find(o => o.id === optId);
    if (opt) {
      opt.votes += 1;
      state.pollData.totalVotes += 1;
      savePoll();
      renderPollWidget();
      showToast("तुमचे मत यशस्वीरीत्या नोंदवले गेले आहे!", "success");
    }
  }

  // Bookmark Toggle
  function toggleBookmark(articleId) {
    const index = state.bookmarks.indexOf(articleId);
    if (index > -1) {
      state.bookmarks.splice(index, 1);
      showToast("बातमी सेव्ह यादीतून काढली गेली.", "info");
    } else {
      state.bookmarks.push(articleId);
      showToast("बातमी सेव्ह केली गेली! नंतर वाचू शकता.", "success");
    }
    saveBookmarks();
    renderNewsGrid();
  }

  function updateBookmarkCountUI() {
    const badge = document.getElementById('saved-count-badge');
    if (badge) {
      badge.textContent = state.bookmarks.length;
    }
  }

  // Filter Categories
  function setCategoryFilter(categoryId) {
    state.currentCategory = categoryId;
    renderNavCategories();
    renderNewsGrid();

    // Scroll smoothly to news section
    const newsSection = document.getElementById('latest-news-section');
    if (newsSection) {
      newsSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // ==========================================================================
  // 5. Full Article Modal Reader (सविस्तर वाचन कक्ष व आवाज)
  // ==========================================================================
  function openArticleModal(articleId) {
    const article = state.articles.find(a => a.id === articleId);
    if (!article) return;

    state.currentArticle = article;
    article.views = (article.views || 0) + 1;
    saveArticles();

    const backdrop = document.getElementById('article-modal-backdrop');
    const container = document.getElementById('article-modal-body');
    if (!backdrop || !container) return;

    // Split paragraphs
    const paragraphs = (article.content || article.summary).split('\n\n').filter(p => p.trim());

    container.innerHTML = `
      <span class="article-category-badge">${article.categoryName} • ${article.district || 'महाराष्ट्र'}</span>
      <h2 class="article-title-full" id="article-read-title">${article.title}</h2>
      
      <div class="article-meta-row">
        <div>
          <strong>✍️ ${article.author || 'पॉलिटिकफीडर प्रतिनिधी'}</strong> | 
          <span>🕒 ${article.date}</span> | 
          <span>👁️ ${article.views.toLocaleString()} वाचक</span>
        </div>
        <div class="reader-toolbar">
          <button class="toolbar-btn" id="btn-listen-speech">
            <span>🔊</span> <span id="tts-label">बातमी ऐका</span>
          </button>
          <button class="toolbar-btn" id="btn-font-smaller">अ- लहान</button>
          <button class="toolbar-btn" id="btn-font-reset">अ मूळ</button>
          <button class="toolbar-btn" id="btn-font-larger">अ+ मोठे</button>
        </div>
      </div>

      <img src="${article.image}" alt="${article.title}" class="article-featured-image" onerror="this.src='https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1000&q=80'"/>

      <div class="article-body-text" id="article-body-text">
        ${paragraphs.map(p => `<p>${p}</p>`).join('')}
      </div>

      <!-- Share Box -->
      <div class="article-share-section">
        <div>
          <strong style="color: var(--navy-900);">ही बातमी मित्रांना शेअर करा:</strong>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">सत्य आणि सडेतोड बातमी लोकांपर्यंत पोहोचवा</p>
        </div>
        <div class="share-buttons">
          <button class="share-btn share-whatsapp" id="btn-share-whatsapp">
            <span>💬</span> व्हॉट्सॲप
          </button>
          <button class="share-btn share-twitter" id="btn-share-twitter">
            <span>𝕏</span> ट्विटर
          </button>
          <button class="share-btn share-copy" id="btn-share-copy">
            <span>📋</span> लिंक कॉपी करा
          </button>
        </div>
      </div>

      <!-- Comments -->
      <div class="comments-container">
        <h3 class="comments-title">वाचक प्रतिक्रिया (${article.comments ? article.comments.length : 0})</h3>
        <div class="comment-input-box">
          <input type="text" id="new-comment-name" placeholder="तुमचे नाव प्रविष्ट करा..." />
          <textarea id="new-comment-text" rows="3" placeholder="या बातमीबद्दल आपले परखड मत नोंदवा..."></textarea>
          <button class="comment-submit-btn" id="btn-submit-comment">प्रतिक्रिया पाठवा</button>
        </div>
        <div id="comments-list">
          ${(article.comments && article.comments.length > 0) ? article.comments.map(c => `
            <div class="comment-item">
              <div class="comment-author-name">
                <span>👤 ${c.name}</span>
                <span style="font-size: 0.775rem; color: var(--text-subtle);">${c.time}</span>
              </div>
              <div class="comment-text">${c.text}</div>
            </div>
          `).join('') : '<p style="color: var(--text-subtle); font-size: 0.9rem;">अद्याप कोणतीही प्रतिक्रिया नाही. पहिली प्रतिक्रिया तुम्ही नोंदवा!</p>'}
        </div>
      </div>
    `;

    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';

    // Font size controls
    const bodyText = document.getElementById('article-body-text');
    document.getElementById('btn-font-smaller').addEventListener('click', () => {
      state.fontSizeMultiplier = Math.max(0.85, state.fontSizeMultiplier - 0.1);
      bodyText.style.fontSize = `${1.15 * state.fontSizeMultiplier}rem`;
    });
    document.getElementById('btn-font-reset').addEventListener('click', () => {
      state.fontSizeMultiplier = 1.0;
      bodyText.style.fontSize = '1.15rem';
    });
    document.getElementById('btn-font-larger').addEventListener('click', () => {
      state.fontSizeMultiplier = Math.min(1.4, state.fontSizeMultiplier + 0.1);
      bodyText.style.fontSize = `${1.15 * state.fontSizeMultiplier}rem`;
    });

    // Text to Speech
    const listenBtn = document.getElementById('btn-listen-speech');
    const ttsLabel = document.getElementById('tts-label');
    listenBtn.addEventListener('click', () => {
      toggleSpeech(article.title + '. ' + article.summary, ttsLabel);
    });

    // Share buttons
    const articleUrl = window.location.href.split('#')[0] + `?news=${article.id}`;
    const shareText = `*${article.title}*\n\nसविस्तर बातमी PoliticFeeder वर वाचा:\n${articleUrl}`;

    document.getElementById('btn-share-whatsapp').addEventListener('click', () => {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
    });

    document.getElementById('btn-share-twitter').addEventListener('click', () => {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(articleUrl)}`, '_blank');
    });

    document.getElementById('btn-share-copy').addEventListener('click', () => {
      navigator.clipboard.writeText(articleUrl).then(() => {
        showToast("बातमीची लिंक कॉपी झाली आहे!", "success");
      }).catch(() => {
        showToast(articleUrl, "info");
      });
    });

    // Submit Comment
    document.getElementById('btn-submit-comment').addEventListener('click', () => {
      const nameInput = document.getElementById('new-comment-name');
      const textInput = document.getElementById('new-comment-text');
      const name = nameInput.value.trim() || 'सुजाण वाचक';
      const text = textInput.value.trim();

      if (!text) {
        showToast("कृपया प्रतिक्रिया लिहा!", "error");
        return;
      }

      if (!article.comments) article.comments = [];
      article.comments.unshift({
        id: 'c_' + Date.now(),
        name: name,
        text: text,
        time: 'आत्ताच'
      });

      saveArticles();
      showToast("तुमची प्रतिक्रिया जोडली गेली!", "success");
      openArticleModal(article.id); // Re-render modal with new comment
    });
  }

  function closeArticleModal() {
    const backdrop = document.getElementById('article-modal-backdrop');
    if (backdrop) backdrop.classList.remove('open');
    document.body.style.overflow = '';
    stopSpeech();
  }

  // Web Speech API
  function toggleSpeech(text, labelEl) {
    if (!('speechSynthesis' in window)) {
      showToast("तुमचा ब्राउझर व्हॉईस रिडरला सपोर्ट करत नाही.", "error");
      return;
    }

    if (state.isSpeaking) {
      window.speechSynthesis.cancel();
      state.isSpeaking = false;
      if (labelEl) labelEl.textContent = "बातमी ऐका";
      return;
    }

    window.speechSynthesis.cancel(); // Stop any pending speech
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt Marathi or Hindi voice
    const voices = window.speechSynthesis.getVoices();
    const marathiVoice = voices.find(v => v.lang.startsWith('mr') || v.lang.startsWith('hi'));
    if (marathiVoice) {
      utterance.voice = marathiVoice;
    }
    utterance.rate = 0.95;

    utterance.onstart = () => {
      state.isSpeaking = true;
      if (labelEl) labelEl.textContent = "आवाज थांबवा ⏸️";
    };

    utterance.onend = () => {
      state.isSpeaking = false;
      if (labelEl) labelEl.textContent = "बातमी ऐका";
    };

    utterance.onerror = () => {
      state.isSpeaking = false;
      if (labelEl) labelEl.textContent = "बातमी ऐका";
    };

    window.speechSynthesis.speak(utterance);
  }

  function stopSpeech() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    state.isSpeaking = false;
  }

  // ==========================================================================
  // 6. Admin Panel (अॅडमिन डॅशबोर्ड व बातमी व्यवस्थापन)
  // ==========================================================================
  function toggleAdminMode(showAdmin) {
    state.isAdminMode = showAdmin;
    const websiteView = document.getElementById('website-view');
    const adminView = document.getElementById('admin-view');

    if (showAdmin) {
      if (websiteView) websiteView.classList.add('hidden');
      if (adminView) adminView.classList.add('active');
      renderAdminDashboard();
      window.scrollTo(0, 0);
    } else {
      if (adminView) adminView.classList.remove('active');
      if (websiteView) websiteView.classList.remove('hidden');
      renderAll();
      window.scrollTo(0, 0);
    }
  }

  function renderAdminDashboard() {
    // 1. Stats
    const totalNews = state.articles.length;
    const breakingCount = state.articles.filter(a => a.isBreaking).length;
    const totalViews = state.articles.reduce((acc, a) => acc + (a.views || 0), 0);
    const leadCount = state.articles.filter(a => a.isLead).length;

    document.getElementById('admin-stat-total').textContent = totalNews;
    document.getElementById('admin-stat-breaking').textContent = breakingCount;
    document.getElementById('admin-stat-views').textContent = totalViews.toLocaleString();
    document.getElementById('admin-stat-lead').textContent = leadCount;

    // 2. Table
    renderAdminTable();
  }

  function renderAdminTable(filterQuery = '') {
    const tbody = document.getElementById('admin-articles-tbody');
    if (!tbody) return;

    let list = [...state.articles];
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      list = list.filter(a => a.title.toLowerCase().includes(q) || a.categoryName.toLowerCase().includes(q));
    }

    tbody.innerHTML = list.map(article => `
      <tr>
        <td>
          <img src="${article.image}" alt="${article.title}" class="news-thumb-cell" onerror="this.src='https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=150&q=80'"/>
        </td>
        <td>
          <strong style="font-family: var(--font-heading); font-size: 0.95rem; color: var(--text-main); display: block;">${article.title}</strong>
          <span style="font-size: 0.8rem; color: var(--text-subtle);">✍️ ${article.author}</span>
        </td>
        <td>
          <span class="card-category-pill">${article.categoryName}</span>
        </td>
        <td>
          <span style="font-size: 0.825rem; color: var(--text-muted);">${article.date.split(',')[0]}</span>
        </td>
        <td>
          ${article.isBreaking ? '<span class="status-badge breaking">ब्रेकिंग</span>' : ''}
          ${article.isLead ? '<span class="status-badge lead">मुख्य</span>' : ''}
          ${!article.isBreaking && !article.isLead ? '<span class="status-badge normal">नियमित</span>' : ''}
        </td>
        <td>
          <strong style="color: var(--blue-600);">${(article.views || 0).toLocaleString()}</strong>
        </td>
        <td>
          <div class="table-action-btns">
            <button class="action-icon-btn btn-admin-view" data-id="${article.id}" title="पहा">👁️</button>
            <button class="action-icon-btn btn-admin-edit" data-id="${article.id}" title="संपादित करा">✏️</button>
            <button class="action-icon-btn btn-admin-toggle-break" data-id="${article.id}" title="ब्रेकिंग बदला">⚡</button>
            <button class="action-icon-btn delete btn-admin-delete" data-id="${article.id}" title="काढून टाका">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');

    // Table Actions
    tbody.querySelectorAll('.btn-admin-view').forEach(btn => {
      btn.addEventListener('click', () => {
        openArticleModal(btn.getAttribute('data-id'));
      });
    });

    tbody.querySelectorAll('.btn-admin-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        openEditArticleModal(btn.getAttribute('data-id'));
      });
    });

    tbody.querySelectorAll('.btn-admin-toggle-break').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const art = state.articles.find(a => a.id === id);
        if (art) {
          art.isBreaking = !art.isBreaking;
          saveArticles();
          renderAdminDashboard();
          showToast(`बातमीची ब्रेकिंग स्थिती बदलली: ${art.isBreaking ? 'होय' : 'नाही'}`, "info");
        }
      });
    });

    tbody.querySelectorAll('.btn-admin-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm("तुम्हाला खात्री आहे का की ही बातमी डिलीट करायची आहे?")) {
          state.articles = state.articles.filter(a => a.id !== id);
          saveArticles();
          renderAdminDashboard();
          showToast("बातमी यशस्वीरीत्या काढून टाकली गेली.", "success");
        }
      });
    });
  }

  // Open Article Form Modal (Add / Edit)
  function openEditArticleModal(articleId = null) {
    state.editingArticleId = articleId;
    const modalBackdrop = document.getElementById('admin-form-modal');
    const modalTitle = document.getElementById('admin-form-modal-title');
    const presetContainer = document.getElementById('preset-images-picker');

    const titleInput = document.getElementById('form-news-title');
    const catSelect = document.getElementById('form-news-category');
    const districtInput = document.getElementById('form-news-district');
    const imageInput = document.getElementById('form-news-image');
    const authorInput = document.getElementById('form-news-author');
    const summaryInput = document.getElementById('form-news-summary');
    const contentInput = document.getElementById('form-news-content');
    const checkBreaking = document.getElementById('form-check-breaking');
    const checkLead = document.getElementById('form-check-lead');
    const checkTrending = document.getElementById('form-check-trending');

    // Render Preset Images
    if (presetContainer) {
      presetContainer.innerHTML = PRESET_IMAGES.map((img, i) => `
        <div class="preset-img-option" data-url="${img.url}" title="${img.name}">
          <img src="${img.url}" alt="${img.name}"/>
        </div>
      `).join('');

      presetContainer.querySelectorAll('.preset-img-option').forEach(opt => {
        opt.addEventListener('click', () => {
          presetContainer.querySelectorAll('.preset-img-option').forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
          imageInput.value = opt.getAttribute('data-url');
        });
      });
    }

    if (articleId) {
      const art = state.articles.find(a => a.id === articleId);
      if (art) {
        modalTitle.textContent = "बातमी संपादित करा";
        titleInput.value = art.title;
        catSelect.value = art.category;
        districtInput.value = art.district || '';
        imageInput.value = art.image;
        authorInput.value = art.author || 'पॉलिटिकफीडर प्रतिनिधी';
        summaryInput.value = art.summary;
        contentInput.value = art.content || art.summary;
        checkBreaking.checked = !!art.isBreaking;
        checkLead.checked = !!art.isLead;
        checkTrending.checked = !!art.isTrending;
      }
    } else {
      modalTitle.textContent = "नवीन बातमी तयार करा";
      titleInput.value = '';
      catSelect.value = 'maharashtra';
      districtInput.value = 'मुंबई';
      imageInput.value = PRESET_IMAGES[0].url;
      authorInput.value = 'विशेष प्रतिनिधी, पॉलिटिकफीडर';
      summaryInput.value = '';
      contentInput.value = '';
      checkBreaking.checked = false;
      checkLead.checked = false;
      checkTrending.checked = true;
    }

    modalBackdrop.classList.add('open');
  }

  function closeAdminFormModal() {
    const modalBackdrop = document.getElementById('admin-form-modal');
    if (modalBackdrop) modalBackdrop.classList.remove('open');
    state.editingArticleId = null;
  }

  function handleSaveArticleForm() {
    const title = document.getElementById('form-news-title').value.trim();
    const category = document.getElementById('form-news-category').value;
    const district = document.getElementById('form-news-district').value.trim() || 'महाराष्ट्र';
    const image = document.getElementById('form-news-image').value.trim() || PRESET_IMAGES[0].url;
    const author = document.getElementById('form-news-author').value.trim() || 'पॉलिटिकफीडर डेस्क';
    const summary = document.getElementById('form-news-summary').value.trim();
    const content = document.getElementById('form-news-content').value.trim() || summary;
    const isBreaking = document.getElementById('form-check-breaking').checked;
    const isLead = document.getElementById('form-check-lead').checked;
    const checkTrending = document.getElementById('form-check-trending').checked;

    if (!title || !summary) {
      showToast("कृपया बातमीचे शीर्षक आणि सारांश भरा!", "error");
      return;
    }

    const catObj = CATEGORIES.find(c => c.id === category);
    const categoryName = catObj ? catObj.name : 'महाराष्ट्र';

    const now = new Date();
    const formattedDate = `${now.getDate()} ${MARATHI_MONTHS[now.getMonth()]} ${now.getFullYear()}, ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (state.editingArticleId) {
      // Update
      const art = state.articles.find(a => a.id === state.editingArticleId);
      if (art) {
        art.title = title;
        art.category = category;
        art.categoryName = categoryName;
        art.district = district;
        art.image = image;
        art.author = author;
        art.summary = summary;
        art.content = content;
        art.isBreaking = isBreaking;
        art.isLead = isLead;
        art.isTrending = checkTrending;
        showToast("बातमी यशस्वीरीत्या अपडेट केली!", "success");
      }
    } else {
      // Create New
      // If new one is marked lead, remove lead from previous
      if (isLead) {
        state.articles.forEach(a => a.isLead = false);
      }

      const newArticle = {
        id: 'pf-' + Date.now(),
        title: title,
        category: category,
        categoryName: categoryName,
        district: district,
        summary: summary,
        content: content,
        image: image,
        author: author,
        date: formattedDate,
        timestamp: Date.now(),
        views: 1,
        isBreaking: isBreaking,
        isLead: isLead,
        isTrending: checkTrending,
        readTime: '२ मिनिटे',
        tags: [categoryName, district, 'ताजी बातमी'],
        comments: []
      };

      state.articles.unshift(newArticle);
      showToast("नवीन बातमी यशस्वीरीत्या प्रसिद्ध केली गेली!", "success");
    }

    saveArticles();
    closeAdminFormModal();
    renderAdminDashboard();
  }

  // ==========================================================================
  // 7. Toast Notifications System
  // ==========================================================================
  function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✓' : type === 'error' ? '⚠️' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // ==========================================================================
  // 8. Global UI Wiring & Initial Render
  // ==========================================================================
  function renderAll() {
    renderBreakingTicker();
    renderNavCategories();
    renderHeroSection();
    renderNewsGrid();
    renderTrendingTop5();
    renderPollWidget();
    updateBookmarkCountUI();
  }

  function setupEventListeners() {
    // Live Clock Interval
    updateLiveMarathiDateTime();
    setInterval(updateLiveMarathiDateTime, 1000);

    // Theme Toggle
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const nextTheme = state.theme === 'light' ? 'dark' : 'light';
        setTheme(nextTheme);
      });
    }

    // Admin Panel Open/Close
    const adminSwitchBtn = document.getElementById('admin-switch-btn');
    if (adminSwitchBtn) {
      adminSwitchBtn.addEventListener('click', () => toggleAdminMode(true));
    }

    const backToWebBtn = document.getElementById('btn-back-to-web');
    if (backToWebBtn) {
      backToWebBtn.addEventListener('click', () => toggleAdminMode(false));
    }

    // Logo Click -> Reset to Home
    const logoBrand = document.getElementById('brand-identity');
    if (logoBrand) {
      logoBrand.addEventListener('click', () => {
        toggleAdminMode(false);
        state.currentCategory = 'all';
        state.currentDistrict = 'all';
        state.searchQuery = '';
        const searchInput = document.getElementById('brand-search-input');
        if (searchInput) searchInput.value = '';
        renderAll();
      });
    }

    // Search Input with Debounce
    const searchInput = document.getElementById('brand-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderNewsGrid();
      });
    }

    // District Filter Chips
    const districtBar = document.getElementById('district-filter-bar');
    if (districtBar) {
      districtBar.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          districtBar.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          state.currentDistrict = pill.getAttribute('data-district');
          renderNewsGrid();
        });
      });
    }

    // View Switcher (Grid vs List / Timeline Feed)
    const btnGrid = document.getElementById('btn-view-grid');
    const btnList = document.getElementById('btn-view-list');
    if (btnGrid) {
      btnGrid.addEventListener('click', () => {
        state.viewMode = 'grid';
        btnGrid.classList.add('active');
        if (btnList) btnList.classList.remove('active');
        renderNewsGrid();
      });
    }
    if (btnList) {
      btnList.addEventListener('click', () => {
        state.viewMode = 'list';
        btnList.classList.add('active');
        if (btnGrid) btnGrid.classList.remove('active');
        renderNewsGrid();
      });
    }

    // Saved Bookmarks Button in Top Brand Row
    const savedArticlesBtn = document.getElementById('saved-articles-btn');
    if (savedArticlesBtn) {
      savedArticlesBtn.addEventListener('click', () => {
        if (state.bookmarks.length === 0) {
          showToast("तुम्ही अजून कोणतीही बातमी सेव्ह केलेली नाही. कार्डवरील ☆ वर क्लिक करून सेव्ह करा.", "info");
          return;
        }
        // Filter grid to bookmarks
        const bookmarkedArticles = state.articles.filter(a => state.bookmarks.includes(a.id));
        const grid = document.getElementById('news-cards-container') || document.getElementById('news-cards-grid');
        if (grid) {
          document.getElementById('grid-results-count').textContent = `सेव्ह केलेल्या ${bookmarkedArticles.length} बातम्या`;
          grid.className = 'news-cards-grid';
          grid.innerHTML = bookmarkedArticles.map(item => `
            <article class="news-card" data-id="${item.id}">
              <div class="news-card-image">
                <img src="${item.image}" alt="${item.title}" loading="lazy"/>
              </div>
              <div class="news-card-body">
                <div class="news-card-category-row">
                  <span class="card-category-pill">${item.categoryName} • ${item.district || 'महाराष्ट्र'}</span>
                  <button class="card-bookmark-btn saved" data-id="${item.id}">★</button>
                </div>
                <h3 class="news-card-title">${item.title}</h3>
                <p class="news-card-snippet">${item.summary}</p>
                <div class="news-card-footer">
                  <span>🕒 ${item.date}</span>
                </div>
              </div>
            </article>
          `).join('');

          grid.querySelectorAll('.news-card').forEach(c => {
            c.addEventListener('click', (ev) => {
              if (ev.target.closest('.card-bookmark-btn')) return;
              openArticleModal(c.getAttribute('data-id'));
            });
          });

          grid.querySelectorAll('.card-bookmark-btn').forEach(btn => {
            btn.addEventListener('click', (ev) => {
              ev.stopPropagation();
              toggleBookmark(btn.getAttribute('data-id'));
              savedArticlesBtn.click(); // re-filter
            });
          });
        }
      });
    }

    // Modal Close
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalBackdrop = document.getElementById('article-modal-backdrop');
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeArticleModal);
    if (modalBackdrop) {
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) closeArticleModal();
      });
    }

    // Keyboard ESC to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeArticleModal();
        closeAdminFormModal();
      }
    });

    // Admin Dashboard Controls
    const btnAddNewStory = document.getElementById('btn-add-new-story');
    if (btnAddNewStory) btnAddNewStory.addEventListener('click', () => openEditArticleModal(null));

    const adminFormCloseBtn = document.getElementById('admin-form-close-btn');
    if (adminFormCloseBtn) adminFormCloseBtn.addEventListener('click', closeAdminFormModal);

    const adminFormCancelBtn = document.getElementById('admin-form-cancel-btn');
    if (adminFormCancelBtn) adminFormCancelBtn.addEventListener('click', closeAdminFormModal);

    const adminFormSaveBtn = document.getElementById('admin-form-save-btn');
    if (adminFormSaveBtn) adminFormSaveBtn.addEventListener('click', handleSaveArticleForm);

    const adminTableSearch = document.getElementById('admin-table-search');
    if (adminTableSearch) {
      adminTableSearch.addEventListener('input', (e) => {
        renderAdminTable(e.target.value);
      });
    }

    // Export Data & Reset Demo
    const btnExportData = document.getElementById('btn-export-data');
    if (btnExportData) {
      btnExportData.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.articles, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `politicfeeder_backup_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast("बॅकअप फाईल डाऊनलोड झाली!", "success");
      });
    }

    const btnResetData = document.getElementById('btn-reset-demo-data');
    if (btnResetData) {
      btnResetData.addEventListener('click', () => {
        if (confirm("तुम्हाला खात्री आहे का? सर्व डीफॉल्ट मराठी बातम्या पुन्हा रिस्टोअर केल्या जातील.")) {
          state.articles = [...INITIAL_NEWS_DATA];
          saveArticles();
          renderAdminDashboard();
          showToast("डीफॉल्ट डेटा रिस्टोअर केला गेला!", "success");
        }
      });
    }
  }

  // ==========================================================================
  // DOM Ready Initialization
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    initState();
    setupEventListeners();
    renderAll();

    // Check if query param ?news=pf-xxx is in URL
    const urlParams = new URLSearchParams(window.location.search);
    const newsId = urlParams.get('news');
    if (newsId) {
      setTimeout(() => openArticleModal(newsId), 300);
    }
  });

})();
