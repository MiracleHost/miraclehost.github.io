/**
 * 纯静态博客：从 posts.json 读取内容并渲染。
 * 无需构建、无需后端，直接部署到 GitHub Pages 即可。
 */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var state = { site: {}, posts: [], tag: '全部', keyword: '', current: null };

  var FALLBACK_COVERS = [
    'linear-gradient(135deg, #ffd3a5, #fd6585)',
    'linear-gradient(135deg, #a1c4fd, #c2e9fb)',
    'linear-gradient(135deg, #fbc2eb, #a6c1ee)',
    'linear-gradient(135deg, #d4fc79, #96e6a1)',
    'linear-gradient(135deg, #e0c3fc, #8ec5fc)',
    'linear-gradient(135deg, #84fab0, #8fd3f4)'
  ];

  /* ---------------- 工具函数 ---------------- */

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function coverOf(post, index) {
    return post.cover || FALLBACK_COVERS[index % FALLBACK_COVERS.length];
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    var parts = String(dateStr).split('-');
    if (parts.length !== 3) return String(dateStr);
    return parts[0] + ' 年 ' + Number(parts[1]) + ' 月 ' + Number(parts[2]) + ' 日';
  }

  function readingTime(post) {
    if (post.readingTime) return post.readingTime;
    var minutes = Math.max(1, Math.round((post.content || '').length / 350));
    return minutes + ' 分钟阅读';
  }

  /* ---------------- 极简 Markdown 渲染 ---------------- */

  function inline(text) {
    return esc(text)
      .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img alt="$1" src="$2" loading="lazy">')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  }

  function block(text) {
    var t = text.trim();
    if (!t) return '';

    if (/^```/.test(t)) {
      var code = t.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '');
      return '<pre><code>' + esc(code) + '</code></pre>';
    }
    if (/^---+$/.test(t)) return '<hr>';

    var heading = t.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      var level = Math.min(heading[1].length + 1, 6);
      return '<h' + level + '>' + inline(heading[2]) + '</h' + level + '>';
    }

    var lines = t.split('\n');

    if (lines.every(function (l) { return /^>\s?/.test(l.trim()); })) {
      return '<blockquote>' + inline(lines.map(function (l) {
        return l.trim().replace(/^>\s?/, '');
      }).join('<br>')) + '</blockquote>';
    }
    if (lines.every(function (l) { return /^[-*+]\s+/.test(l.trim()); })) {
      return '<ul>' + lines.map(function (l) {
        return '<li>' + inline(l.trim().replace(/^[-*+]\s+/, '')) + '</li>';
      }).join('') + '</ul>';
    }
    if (lines.every(function (l) { return /^\d+\.\s+/.test(l.trim()); })) {
      return '<ol>' + lines.map(function (l) {
        return '<li>' + inline(l.trim().replace(/^\d+\.\s+/, '')) + '</li>';
      }).join('') + '</ol>';
    }

    return '<p>' + lines.map(inline).join('<br>') + '</p>';
  }

  function markdown(src) {
    return String(src || '').split(/\n{2,}/).map(block).join('\n');
  }

  /* ---------------- 网站信息 ---------------- */

  function applySite() {
    var site = state.site || {};
    document.title = site.name ? site.name + ' · ' + (site.tagline || '个人博客') : '个人博客';
    $('#navName').textContent = site.name || '个人博客';
    $('#navAvatar').textContent = site.avatar || '🌿';
    $('#heroAvatar').textContent = site.avatar || '🌿';
    $('#heroName').textContent = site.name || '个人博客';
    $('#heroTagline').textContent = site.tagline || '';
    $('#heroBio').textContent = site.bio || '';
    $('#heroHandle').textContent = site.handle || '';
    $('#heroLocation').textContent = site.location || '';
    $('#heroBadge').textContent = '✨ 共 ' + state.posts.length + ' 篇更新';

    var tags = allTags();
    $('#heroStats').innerHTML = [
      statHTML(state.posts.length, 'ARTICLES'),
      statHTML(tags.length, 'TAGS'),
      statHTML(state.posts.length ? formatDate(state.posts[0].date).replace(/ 年.*/, '') : '—', 'LATEST')
    ].join('');

    $('#heroSocials').innerHTML = (site.socials || []).map(function (s) {
      return '<a class="social" href="' + esc(s.url) + '" target="_blank" rel="noopener">' +
        '<span>' + esc(s.icon || '🔗') + '</span>' + esc(s.label) + '</a>';
    }).join('');

    $('#footerText').textContent = site.tagline || '用一杯咖啡的时间，写点什么 ☕️';
    $('#footerCopy').textContent = '© ' + new Date().getFullYear() + ' ' + (site.name || '个人博客');

    var og = document.querySelector('meta[property="og:title"]');
    if (og) og.setAttribute('content', site.name || '个人博客');
    var desc = document.querySelector('meta[name="description"]');
    if (desc && site.bio) desc.setAttribute('content', site.bio);
  }

  function statHTML(value, label) {
    return '<div class="stat"><b>' + esc(value) + '</b><span>' + esc(label) + '</span></div>';
  }

  function allTags() {
    var seen = {};
    state.posts.forEach(function (p) {
      (p.tags || []).forEach(function (t) { seen[t] = true; });
    });
    return Object.keys(seen);
  }

  /* ---------------- 列表页 ---------------- */

  function renderChips() {
    var tags = ['全部'].concat(allTags());
    $('#tagChips').innerHTML = tags.map(function (t) {
      return '<button class="chip' + (t === state.tag ? ' is-active' : '') + '" data-tag="' + esc(t) + '">' + esc(t) + '</button>';
    }).join('');
  }

  function filtered() {
    var kw = state.keyword.trim().toLowerCase();
    return state.posts.filter(function (p) {
      var okTag = state.tag === '全部' || (p.tags || []).indexOf(state.tag) > -1;
      if (!okTag) return false;
      if (!kw) return true;
      var hay = [p.title, p.excerpt, (p.tags || []).join(' '), p.content].join(' ').toLowerCase();
      return hay.indexOf(kw) > -1;
    });
  }

  function renderList() {
    var list = filtered();
    var isDefault = state.tag === '全部' && !state.keyword.trim();
    var featuredBox = $('#featured');
    var gridBox = $('#postGrid');

    $('#emptyState').hidden = list.length > 0;

    if (isDefault && list.length) {
      var first = list[0];
      featuredBox.innerHTML = featuredHTML(first);
      featuredBox.querySelector('.featured').addEventListener('click', function () {
        openPost(first.id);
      });
      list = list.slice(1);
    } else {
      featuredBox.innerHTML = '';
    }

    gridBox.innerHTML = list.map(cardHTML).join('');
    Array.prototype.forEach.call(gridBox.querySelectorAll('.card'), function (el) {
      el.addEventListener('click', function () { openPost(el.getAttribute('data-id')); });
    });
  }

  function tagHTML(tags) {
    return (tags || []).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('');
  }

  function featuredHTML(post) {
    return '<div class="featured">' +
      '<div class="featured__cover" style="background:' + coverOf(post, 0) + '">' +
        '<span class="featured__flag">⭐ 置顶推荐</span>' + esc(post.emoji || '📝') +
      '</div>' +
      '<div class="featured__body">' +
        '<div class="card__tags">' + tagHTML(post.tags) + '</div>' +
        '<h2>' + esc(post.title) + '</h2>' +
        '<p>' + esc(post.excerpt) + '</p>' +
        '<div class="card__meta" style="margin-top:auto;padding-top:24px">' +
          '<span>' + esc(formatDate(post.date)) + '</span><span>·</span><span>' + esc(readingTime(post)) + '</span>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function cardHTML(post, index) {
    return '<article class="card" data-id="' + esc(post.id) + '">' +
      '<div class="card__cover" style="background:' + coverOf(post, index) + '">' +
        '<span>' + esc(post.emoji || '📝') + '</span>' +
        '<span class="card__time">' + esc(readingTime(post)) + '</span>' +
      '</div>' +
      '<div class="card__body">' +
        '<div class="card__tags">' + tagHTML(post.tags) + '</div>' +
        '<h2 class="card__title">' + esc(post.title) + '</h2>' +
        '<p class="card__excerpt">' + esc(post.excerpt) + '</p>' +
        '<div class="card__meta"><span>' + esc(formatDate(post.date)) + '</span></div>' +
      '</div>' +
    '</article>';
  }

  /* ---------------- 文章详情 ---------------- */

  function findPost(id) {
    for (var i = 0; i < state.posts.length; i++) {
      if (String(state.posts[i].id) === String(id)) return { post: state.posts[i], index: i };
    }
    return null;
  }

  function openPost(id) {
    location.hash = '#/post/' + encodeURIComponent(id);
  }

  function renderPost(id) {
    var found = findPost(id);
    if (!found) { location.hash = '#/'; return; }
    var post = found.post;
    var index = found.index;

    state.current = post;
    document.title = post.title + ' · ' + (state.site.name || '个人博客');

    $('#postCover').style.background = coverOf(post, index);
    $('#postEmoji').textContent = post.emoji || '📝';
    $('#postTitle').textContent = post.title;
    $('#postTags').innerHTML = tagHTML(post.tags);
    $('#postTagsBottom').innerHTML = tagHTML(post.tags);
    $('#postMeta').textContent = formatDate(post.date) + ' · ' + readingTime(post);
    $('#postContent').innerHTML = markdown(post.content);

    var prev = state.posts[index - 1];
    var next = state.posts[index + 1];
    var nav = '';
    if (prev) nav += '<a href="#/post/' + encodeURIComponent(prev.id) + '"><small>← 上一篇</small>' + esc(prev.title) + '</a>';
    else nav += '<span style="flex:1"></span>';
    if (next) nav += '<a class="next" href="#/post/' + encodeURIComponent(next.id) + '"><small>下一篇 →</small>' + esc(next.title) + '</a>';
    $('#postNav').innerHTML = nav;

    window.scrollTo({ top: 0, behavior: 'auto' });
    updateProgress();
  }

  /* ---------------- 路由 ---------------- */

  function route() {
    var match = location.hash.match(/^#\/post\/(.+)$/);
    if (match) {
      var id = decodeURIComponent(match[1]);
      if (findPost(id)) {
        $('#viewHome').hidden = true;
        $('#viewPost').hidden = false;
        renderPost(id);
        return;
      }
    }
    state.current = null;
    $('#viewPost').hidden = true;
    $('#viewHome').hidden = false;
    document.title = state.site.name ? state.site.name + ' · ' + (state.site.tagline || '个人博客') : '个人博客';
    renderList();
  }

  /* ---------------- 滚动效果 ---------------- */

  function updateProgress() {
    var bar = $('#progressBar');
    if ($('#viewPost').hidden) { bar.style.width = '0'; return; }
    var el = document.documentElement;
    var height = el.scrollHeight - el.clientHeight;
    var ratio = height > 0 ? el.scrollTop / height : 0;
    bar.style.width = Math.min(100, Math.max(0, ratio * 100)) + '%';
  }

  function bindScroll() {
    var nav = $('#nav');
    window.addEventListener('scroll', function () {
      nav.classList.toggle('is-stuck', window.scrollY > 10);
      updateProgress();
    }, { passive: true });
  }

  /* ---------------- 事件绑定 ---------------- */

  function bindEvents() {
    $('#searchInput').addEventListener('input', function (e) {
      state.keyword = e.target.value;
      renderList();
    });

    $('#tagChips').addEventListener('click', function (e) {
      var btn = e.target.closest('.chip');
      if (!btn) return;
      state.tag = btn.getAttribute('data-tag');
      renderChips();
      renderList();
    });

    document.addEventListener('click', function (e) {
      var link = e.target.closest('[data-home]');
      if (!link) return;
      if (location.hash === '#/' || location.hash === '') {
        e.preventDefault();
        route();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    window.addEventListener('hashchange', route);
  }

  /* ---------------- 启动 ---------------- */

  function load() {
    fetch('posts.json', { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        state.site = data.site || {};
        state.posts = (data.posts || []).slice().sort(function (a, b) {
          var pinned = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
          if (pinned) return pinned;
          return String(b.date || '').localeCompare(String(a.date || ''));
        });
        applySite();
        renderChips();
        route();
      })
      .catch(function () {
        $('#postGrid').innerHTML =
          '<div class="empty">内容加载失败 🌧<br>请确认 <code>posts.json</code> 格式正确，' +
          '并通过 http(s) 访问（直接双击打开 HTML 会被浏览器拦截本地文件读取）。</div>';
      });
  }

  if (window.BlogTheme) window.BlogTheme.init();
  bindEvents();
  bindScroll();
  load();
})();
