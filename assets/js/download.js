/**
 * 下载页：从 ../downloads.json 读取软件包列表并渲染。
 */
(function () {
  'use strict';

  var $ = function (sel) { return document.querySelector(sel); };
  var state = { page: {}, packages: [], platform: '全部', keyword: '' };

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function platforms() {
    var seen = {};
    state.packages.forEach(function (p) { seen[p.platform || '其他'] = true; });
    return Object.keys(seen);
  }

  function isOutdated(pkg) {
    return pkg.currentVersion && pkg.latestVersion && pkg.currentVersion !== pkg.latestVersion;
  }

  function fileUrl(file) {
    if (!file) return '';
    return /^https?:\/\//.test(file) ? file : file;
  }

  function renderChips() {
    var list = ['全部'].concat(platforms());
    $('#platformChips').innerHTML = list.map(function (t) {
      return '<button class="chip' + (t === state.platform ? ' is-active' : '') +
        '" data-platform="' + esc(t) + '">' + esc(t) + '</button>';
    }).join('');
  }

  function filtered() {
    var kw = state.keyword.trim().toLowerCase();
    return state.packages.filter(function (p) {
      var okPlatform = state.platform === '全部' || (p.platform || '其他') === state.platform;
      if (!okPlatform) return false;
      if (!kw) return true;
      return [p.name, p.description, p.platform, p.changelog].join(' ').toLowerCase().indexOf(kw) > -1;
    });
  }

  function actionHTML(pkg) {
    if (!pkg.available || !pkg.file) {
      return '<span class="btn btn--disabled" title="文件尚未上传">待上传</span>';
    }
    return '<a class="btn" href="' + esc(fileUrl(pkg.file)) + '" download="' +
      esc(pkg.file.split('/').pop()) + '"><span>⬇</span>下载</a>';
  }

  function versionHTML(pkg) {
    var outdated = isOutdated(pkg);
    if (!pkg.latestVersion || !outdated) {
      return '<div class="pkg__ver">' +
        '<div class="pkg__ver-item"><small>当前 / 最新版本</small><b>' + esc(pkg.latestVersion || pkg.currentVersion || '—') + '</b></div>' +
        '</div>';
    }
    return '<div class="pkg__ver">' +
      '<div class="pkg__ver-item"><small>当前版本</small><b>' + esc(pkg.currentVersion) + '</b></div>' +
      '<span class="pkg__arrow">→</span>' +
      '<div class="pkg__ver-item"><small>最新版本</small><b class="is-new">' + esc(pkg.latestVersion) + '</b></div>' +
      '</div>';
  }

  function pkgHTML(pkg) {
    return '<article class="pkg">' +
      '<div class="pkg__icon">' + esc(pkg.icon || '📦') + '</div>' +
      '<div class="pkg__main">' +
        '<div class="pkg__title">' +
          '<h2>' + esc(pkg.name) + '</h2>' +
          '<span class="badge">' + esc(pkg.platform || '其他') + '</span>' +
          (pkg.channel ? '<span class="badge badge--ghost">' + esc(pkg.channel) + '</span>' : '') +
          (isOutdated(pkg) ? '<span class="badge badge--new">有新版本</span>' : '') +
        '</div>' +
        '<p class="pkg__desc">' + esc(pkg.description) + '</p>' +
        versionHTML(pkg) +
        '<div class="pkg__meta">' +
          '<span>📅 ' + esc(pkg.updatedAt || '—') + '</span>' +
          (pkg.size ? '<span>💾 ' + esc(pkg.size) + '</span>' : '') +
          (pkg.changelog ? '<span class="pkg__changelog">🛠 ' + esc(pkg.changelog) + '</span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="pkg__action">' + actionHTML(pkg) + '</div>' +
    '</article>';
  }

  function render() {
    var list = filtered();
    $('#emptyState').hidden = list.length > 0;
    $('#pkgList').innerHTML = list.map(pkgHTML).join('');
  }

  function applyPage() {
    var page = state.page || {};
    document.title = (page.title || '下载') + ' · 小鹿的代码日记';
    $('#pageTitle').textContent = page.title || '下载';
    $('#pageSubtitle').textContent = page.subtitle || '';
    $('#pageNote').textContent = page.note || '';

    var outdated = state.packages.filter(isOutdated).length;
    $('#pageStats').innerHTML = [
      statHTML(state.packages.length, 'PACKAGES'),
      statHTML(platforms().length, 'PLATFORMS'),
      statHTML(outdated, 'NEED UPDATE')
    ].join('');

    $('#footerCopy').textContent = '© ' + new Date().getFullYear() + ' 小鹿的代码日记';
  }

  function statHTML(value, label) {
    return '<div class="stat"><b>' + esc(value) + '</b><span>' + esc(label) + '</span></div>';
  }

  function bind() {
    $('#searchInput').addEventListener('input', function (e) {
      state.keyword = e.target.value;
      render();
    });

    $('#platformChips').addEventListener('click', function (e) {
      var btn = e.target.closest('.chip');
      if (!btn) return;
      state.platform = btn.getAttribute('data-platform');
      renderChips();
      render();
    });

    window.addEventListener('scroll', function () {
      $('#nav').classList.toggle('is-stuck', window.scrollY > 10);
    }, { passive: true });
  }

  function load() {
    fetch('../downloads.json', { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        state.page = data.page || {};
        state.packages = data.packages || [];
        applyPage();
        renderChips();
        render();
      })
      .catch(function () {
        $('#pkgList').innerHTML =
          '<div class="empty">列表加载失败 🌧<br>请确认 <code>downloads.json</code> 存在，并通过 http(s) 访问本页。</div>';
      });
  }

  if (window.BlogTheme) window.BlogTheme.init();
  bind();
  load();
})();
