/**
 * 博客：从 posts.json 读取内容并渲染（列表 / 详情 / 搜索 / 标签筛选）。
 */
(function () {
  'use strict';

  var $ = function (sel) { return document.querySelector(sel); };
  var state = { site: {}, posts: [], tag: '全部', keyword: '' };

  var FALLBACK_COVERS = [
    'linear-gradient(135deg, #149ddd, #0b6ea8)',
    'linear-gradient(135deg, #fbc2eb, #a6c1ee)',
    'linear-gradient(135deg, #d4fc79, #96e6a1)',
    'linear-gradient(135deg, #e0c3fc, #8ec5fc)',
    'linear-gradient(135deg, #84fab0, #8fd3f4)',
    'linear-gradient(135deg, #ffd3a5, #fd6585)'
  ];

  /* ---------------- 工具 ---------------- */

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

  /* ---------------- 极简 Markdown ---------------- */

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

  function allTags() {
    var seen = {};
    state.posts.forEach(function (p) {
      (p.tags || []).forEach(function (t) { seen[t] = true; });
    });
    return Object.keys(seen);
  }

  function socialHTML(socials, cls) {
    return (socials || []).map(function (s) {
      return '<a class="' + cls + '" href="' + esc(s.url) + '" target="_blank" rel="noopener" title="' +
        esc(s.label) + '">' + esc(s.icon || '🔗') + '</a>';
    }).join('');
  }

  function applySite() {
    var site = state.site || {};
    var name = site.name || '个人博客';
    document.title = name + ' · ' + (site.tagline || '首页');

    $('#sideName').textContent = name;
    $('#sideHandle').textContent = site.handle || '';
    $('#sideAvatar').textContent = site.avatar || '🦌';
    $('#sideSocials').innerHTML = socialHTML(site.socials, '');
    $('#heroSocials').innerHTML = socialHTML(site.socials, '');
    $('#heroName').textContent = name;
    $('#sideCopy').textContent = '© ' + new Date().getFullYear() + ' ' + name;

    $('#aboutTagline').textContent = site.tagline || '';
    $('#aboutBio').textContent = site.bio || '';
    $('#aboutRole').textContent = (site.roles && site.roles[0]) || site.tagline || '';

    var mail = (site.socials || []).filter(function (s) { return /^mailto:/.test(s.url || ''); })[0];
    var info = [
      ['🏙', '城市', site.location || '—'],
      ['✉️', '邮箱', mail ? mail.url.replace(/^mailto:/, '') : (site.handle || '—')],
      ['📝', '文章', state.posts.length + ' 篇'],
      ['🏷', '标签', allTags().length + ' 个']
    ];
    $('#aboutInfo').innerHTML = info.map(function (row) {
      return '<li><span class="k">' + row[0] + '</span><span><strong>' + esc(row[1]) +
        '：</strong>' + esc(row[2]) + '</span></li>';
    }).join('');

    $('#aboutStats').innerHTML = [
      statHTML(state.posts.length, '📝', 'Articles', '累计文章'),
      statHTML(allTags().length, '🏷', 'Tags', '文章标签'),
      statHTML(state.posts.length ? String(state.posts[0].date).slice(0, 4) : '—', '📅', 'Latest', '最近更新')
    ].join('');

    $('#footerText').textContent = site.tagline || '用一杯咖啡的时间，写点什么 ☕️';

    var og = document.querySelector('meta[property="og:title"]');
    if (og) og.setAttribute('content', name);
    var desc = document.querySelector('meta[name="description"]');
    if (desc && site.bio) desc.setAttribute('content', site.bio);

    startTyped(site.roles || [site.tagline || '写作者']);
  }

  function statHTML(value, icon, label, sub) {
    return '<div class="stats-item"><div class="ico">' + icon + '</div>' +
      '<span class="num">' + esc(value) + '</span>' +
      '<p><strong>' + esc(label) + '</strong> ' + esc(sub) + '</p></div>';
  }

  /* ---------------- Hero 打字机 ---------------- */

  function startTyped(items) {
    var el = $('#typedText');
    if (!el) return;
    items = (items || []).filter(Boolean);
    if (!items.length) return;

    var index = 0, chars = 0, deleting = false;
    (function tick() {
      var word = items[index % items.length];
      el.textContent = word.slice(0, chars);
      var delay = deleting ? 60 : 110;
      if (!deleting && chars === word.length) { deleting = true; delay = 1500; }
      else if (deleting && chars === 0) { deleting = false; index += 1; delay = 300; }
      else { chars += deleting ? -1 : 1; }
      setTimeout(tick, delay);
    })();
  }

  /* ---------------- 列表 ---------------- */

  function renderChips() {
    var tags = ['全部'].concat(allTags());
    $('#tagChips').innerHTML = tags.map(function (t) {
      return '<button class="chip' + (t === state.tag ? ' is-active' : '') +
        '" data-tag="' + esc(t) + '">' + esc(t) + '</button>';
    }).join('');
  }

  function filtered() {
    var kw = state.keyword.trim().toLowerCase();
    return state.posts.filter(function (p) {
      if (state.tag !== '全部' && (p.tags || []).indexOf(state.tag) === -1) return false;
      if (!kw) return true;
      return [p.title, p.excerpt, (p.tags || []).join(' '), p.content]
        .join(' ').toLowerCase().indexOf(kw) > -1;
    });
  }

  function tagHTML(tags) {
    return (tags || []).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('');
  }

  function featuredHTML(post) {
    return '<div class="featured">' +
      '<div class="featured__cover" style="background:' + coverOf(post, 0) + '">' +
        '<span class="featured__flag">置顶推荐</span>' + esc(post.emoji || '📝') +
      '</div>' +
      '<div class="featured__body">' +
        '<div class="card__tags">' + tagHTML(post.tags) + '</div>' +
        '<h3>' + esc(post.title) + '</h3>' +
        '<p>' + esc(post.excerpt) + '</p>' +
        '<div class="card__meta" style="margin-top:auto;padding-top:22px">' +
          esc(formatDate(post.date)) + ' · ' + esc(readingTime(post)) +
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
        '<h3 class="card__title">' + esc(post.title) + '</h3>' +
        '<p class="card__excerpt">' + esc(post.excerpt) + '</p>' +
        '<div class="card__meta">' + esc(formatDate(post.date)) + '</div>' +
      '</div>' +
    '</article>';
  }

  function renderList() {
    var list = filtered();
    var isDefault = state.tag === '全部' && !state.keyword.trim();
    var featuredBox = $('#featured');
    var gridBox = $('#postGrid');

    $('#emptyState').hidden = list.length > 0;

    if (isDefault && list.length) {
      featuredBox.innerHTML = featuredHTML(list[0]);
      featuredBox.querySelector('.featured').addEventListener('click', function () {
        openPost(list[0].id);
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

    document.title = post.title + ' · ' + (state.site.name || '个人博客');
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
    $('#viewPost').hidden = true;
    $('#viewHome').hidden = false;
    document.title = state.site.name ? state.site.name + ' · ' + (state.site.tagline || '首页') : '个人博客';
    renderList();

    var anchor = location.hash.replace('#', '');
    if (anchor && anchor.indexOf('/') === -1) {
      var target = document.getElementById(anchor);
      if (target) target.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
    updateProgress();
  }

  /* ---------------- 滚动 & 事件 ---------------- */

  function updateProgress() {
    var bar = $('#progressBar');
    if (!bar) return;
    if ($('#viewPost').hidden) { bar.style.width = '0'; return; }
    var el = document.documentElement;
    var height = el.scrollHeight - el.clientHeight;
    bar.style.width = (height > 0 ? Math.min(100, (el.scrollTop / height) * 100) : 0) + '%';
  }

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
      var link = e.target.closest('a[href="#blog"], a[href="#hero"], a[href="#about"]');
      if (!link) return;
      var target = link.getAttribute('href').slice(1);
      if (!location.hash || location.hash === '#' + target) {
        e.preventDefault();
        route();
        var el = document.getElementById(target);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          '<div class="empty">内容加载失败，请确认 <code>posts.json</code> 正确，并通过 http(s) 访问本页。</div>';
      });
  }

  if (window.BlogTheme) window.BlogTheme.init();
  if (window.BlogSite) window.BlogSite.init();
  bindEvents();
  load();
})();
