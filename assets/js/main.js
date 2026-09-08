/**
 * 小鹿 · 个人博客
 * 依赖（均来自公共 CDN）：Bootstrap、AOS、Typed.js、PureCounter、Swiper
 */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ------------------------------------------------------------------
   * 侧边栏（移动端）与回到顶部
   * ------------------------------------------------------------------ */
  function initChrome() {
    var header = $('#header');
    var toggle = $('#headerToggle');
    var backdrop = $('#backdrop');
    var scrollTop = $('#scroll-top');

    function closeMenu() {
      header.classList.remove('header-show');
      backdrop.classList.remove('show');
    }

    if (toggle) {
      toggle.addEventListener('click', function () {
        header.classList.toggle('header-show');
        backdrop.classList.toggle('show', header.classList.contains('header-show'));
      });
    }
    if (backdrop) backdrop.addEventListener('click', closeMenu);
    $$('#navmenu a').forEach(function (a) {
      a.addEventListener('click', function () {
        if (window.innerWidth < 1200) closeMenu();
      });
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1200) closeMenu();
    });

    if (scrollTop) {
      scrollTop.addEventListener('click', function (e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      window.addEventListener('scroll', function () {
        scrollTop.classList.toggle('active', window.scrollY > 400);
      }, { passive: true });
    }

    // 导航高亮：滚动到哪个区块
    var sections = $$('main section[id]');
    var links = $$('#navmenu a[href^="#"]');
    window.addEventListener('scroll', function () {
      var pos = window.scrollY + 160;
      var current = '';
      sections.forEach(function (sec) {
        if (pos >= sec.offsetTop && pos < sec.offsetTop + sec.offsetHeight) current = sec.id;
      });
      links.forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('href') === '#' + current);
      });
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
   * 打字机
   * ------------------------------------------------------------------ */
  function initTyped() {
    var el = $('.typed');
    if (!el || typeof Typed === 'undefined') return;
    var items = el.getAttribute('data-typed-items') || '';
    new Typed(el, {
      strings: items.split(',').map(function (s) { return s.trim(); }),
      loop: true,
      typeSpeed: 90,
      backSpeed: 45,
      backDelay: 1600
    });
  }

  /* ------------------------------------------------------------------
   * 技能进度条动画
   * ------------------------------------------------------------------ */
  function initSkills() {
    var bars = $$('.skills .progress-bar');
    if (!bars.length) return;
    function fill() {
      bars.forEach(function (bar) {
        bar.style.width = (bar.getAttribute('aria-valuenow') || 0) + '%';
      });
    }
    if (!('IntersectionObserver' in window)) { fill(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { fill(); io.disconnect(); }
      });
    }, { threshold: .3 });
    io.observe($('#skills'));
  }

  /* ------------------------------------------------------------------
   * 极简 Markdown（用于文章正文）
   * ------------------------------------------------------------------ */
  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function inlineMd(text) {
    return esc(text)
      .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img alt="$1" src="$2" loading="lazy">')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  }

  function blockMd(text) {
    var t = text.trim();
    if (!t) return '';
    if (/^```/.test(t)) {
      return '<pre><code>' + esc(t.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '')) + '</code></pre>';
    }
    if (/^---+$/.test(t)) return '<hr>';
    var h = t.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      var level = Math.min(h[1].length + 1, 6);
      return '<h' + level + '>' + inlineMd(h[2]) + '</h' + level + '>';
    }
    var lines = t.split('\n');
    if (lines.every(function (l) { return /^>\s?/.test(l.trim()); })) {
      return '<blockquote>' + inlineMd(lines.map(function (l) {
        return l.trim().replace(/^>\s?/, '');
      }).join('<br>')) + '</blockquote>';
    }
    if (lines.every(function (l) { return /^[-*+]\s+/.test(l.trim()); })) {
      return '<ul>' + lines.map(function (l) {
        return '<li>' + inlineMd(l.trim().replace(/^[-*+]\s+/, '')) + '</li>';
      }).join('') + '</ul>';
    }
    if (lines.every(function (l) { return /^\d+\.\s+/.test(l.trim()); })) {
      return '<ol>' + lines.map(function (l) {
        return '<li>' + inlineMd(l.trim().replace(/^\d+\.\s+/, '')) + '</li>';
      }).join('') + '</ol>';
    }
    return '<p>' + lines.map(inlineMd).join('<br>') + '</p>';
  }

  function markdown(src) {
    return String(src || '').split(/\n{2,}/).map(blockMd).join('\n');
  }

  /* ------------------------------------------------------------------
   * 博客文章（posts.json）
   * ------------------------------------------------------------------ */
  function formatDate(date) {
    if (!date) return '';
    var p = String(date).split('-');
    return p.length === 3 ? p[0] + ' 年 ' + Number(p[1]) + ' 月 ' + Number(p[2]) + ' 日' : String(date);
  }

  function readingTime(post) {
    if (post.readingTime) return post.readingTime;
    return Math.max(1, Math.round((post.content || '').length / 350)) + ' 分钟阅读';
  }

  function renderFilters(tags) {
    var box = $('#portfolioFilters');
    box.innerHTML = '<li data-filter="*" class="filter-active">全部</li>' + tags.map(function (t) {
      return '<li data-filter="' + esc(t) + '">' + esc(t) + '</li>';
    }).join('');

    box.addEventListener('click', function (e) {
      var li = e.target.closest('li');
      if (!li) return;
      $$('li', box).forEach(function (item) { item.classList.remove('filter-active'); });
      li.classList.add('filter-active');
      var filter = li.getAttribute('data-filter');
      $$('.portfolio-item').forEach(function (item) {
        var show = filter === '*' || item.getAttribute('data-tag') === filter;
        item.style.display = show ? '' : 'none';
      });
    });
  }

  function renderPosts(posts) {
    var box = $('#portfolioContainer');
    box.innerHTML = posts.map(function (post) {
      var tags = post.tags || [];
      return '<div class="col-lg-4 col-md-6 portfolio-item" data-tag="' + esc(tags[0] || '其他') + '">' +
        '<div class="portfolio-content" data-id="' + esc(post.id) + '">' +
        '<img src="https://picsum.photos/seed/' + encodeURIComponent(post.id) + '/600/400" alt="" loading="lazy">' +
        '<div class="portfolio-info">' +
        '<div class="portfolio-tags">' + tags.map(function (t) {
          return '<span>' + esc(t) + '</span>';
        }).join('') + '</div>' +
        '<h4>' + esc(post.title) + '</h4>' +
        '<p>' + esc(post.excerpt) + '</p>' +
        '<div class="meta"><span>' + esc(formatDate(post.date)) + '</span><span>' + esc(readingTime(post)) + '</span></div>' +
        '</div></div></div>';
    }).join('');

    $$('.portfolio-content', box).forEach(function (card) {
      card.addEventListener('click', function () {
        openPost(card.getAttribute('data-id'));
      });
    });
  }

  var postsCache = [];
  var postModal = null;

  function openPost(id) {
    var post = postsCache.filter(function (p) { return String(p.id) === String(id); })[0];
    if (!post) return;
    $('#postModalTitle').textContent = post.title;
    $('#postModalMeta').textContent = formatDate(post.date) + ' · ' + readingTime(post) +
      ((post.tags || []).length ? ' · ' + post.tags.join(' / ') : '');
    $('#postModalBody').innerHTML = markdown(post.content);
    if (typeof bootstrap !== 'undefined') {
      if (!postModal) postModal = new bootstrap.Modal($('#postModal'));
      postModal.show();
    }
  }

  function loadPosts() {
    fetch('posts.json', { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        var posts = (data.posts || []).slice().sort(function (a, b) {
          var pinned = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
          return pinned ? pinned : String(b.date || '').localeCompare(String(a.date || ''));
        });
        postsCache = posts;

        var tags = [];
        posts.forEach(function (p) {
          (p.tags || []).forEach(function (t) { if (tags.indexOf(t) === -1) tags.push(t); });
        });
        renderFilters(tags);
        renderPosts(posts);

        if (data.site && data.site.name) document.title = data.site.name;
      })
      .catch(function () {
        var box = $('#portfolioContainer');
        if (box) {
          box.innerHTML =
            '<div class="col-12 text-center text-muted py-5">文章加载失败：请通过 http(s) 打开本页（直接双击 HTML 无法读取本地 JSON）。</div>';
        }
      });
  }

  /* ------------------------------------------------------------------
   * 联系表单（静态站点，调用邮件客户端发送）
   * ------------------------------------------------------------------ */
  function initContactForm() {
    var form = $('#contactForm');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.name.value.trim();
      var email = form.email.value.trim();
      var subject = form.subject.value.trim();
      var message = form.message.value.trim();
      var sent = $('.sent-message');
      var error = $('.error-message');
      if (!name || !email || !subject || !message) {
        error.style.display = 'block';
        error.textContent = '请填写完整信息。';
        return;
      }
      error.style.display = 'none';
      var body = encodeURIComponent(message + '\n\n— ' + name + '（' + email + '）');
      window.location.href = 'mailto:hello@example.com?subject=' +
        encodeURIComponent('[博客留言] ' + subject) + '&body=' + body;
      sent.style.display = 'block';
      form.reset();
    });
  }

  /* ------------------------------------------------------------------
   * 启动
   * ------------------------------------------------------------------ */
  function init() {
    initChrome();
    initTyped();
    initSkills();
    initContactForm();
    loadPosts();

    if (typeof AOS !== 'undefined') {
      AOS.init({ duration: 600, easing: 'ease-in-out', once: true, mirror: false });
    }
    if (typeof PureCounter !== 'undefined') new PureCounter();
    if (typeof Swiper !== 'undefined') {
      $$('.init-swiper').forEach(function (el) {
        var cfgEl = $('.swiper-config', el);
        var config = { loop: true, speed: 600, autoplay: { delay: 5000 }, slidesPerView: 'auto' };
        if (cfgEl) {
          try { config = Object.assign(config, JSON.parse(cfgEl.textContent)); } catch (err) { /* 使用默认配置 */ }
        }
        new Swiper(el, config);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
