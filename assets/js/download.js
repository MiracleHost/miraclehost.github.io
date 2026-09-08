/**
 * 下载页：读取 ../downloads.json 渲染软件包列表。
 */
(function () {
  'use strict';

  var $ = function (sel) { return document.querySelector(sel); };

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function isOutdated(p) {
    return p.currentVersion && p.latestVersion && p.currentVersion !== p.latestVersion;
  }

  function actionHTML(p) {
    if (!p.available || !p.file) {
      return '<span class="btn btn--disabled" title="文件尚未上传">待上传</span>';
    }
    return '<a class="btn" href="' + esc(p.file) + '" download="' + esc(p.file.split('/').pop()) +
      '"><span>⬇</span>下载</a>';
  }

  function versionHTML(p) {
    if (!isOutdated(p)) {
      return '<div class="pkg__ver"><div class="pkg__ver-item"><small>当前 / 最新版本</small><b>' +
        esc(p.latestVersion || p.currentVersion || '—') + '</b></div></div>';
    }
    return '<div class="pkg__ver">' +
      '<div class="pkg__ver-item"><small>当前版本</small><b>' + esc(p.currentVersion) + '</b></div>' +
      '<span class="text-muted">→</span>' +
      '<div class="pkg__ver-item"><small>最新版本</small><b class="is-new">' + esc(p.latestVersion) + '</b></div>' +
      '</div>';
  }

  function pkgHTML(p) {
    return '<article class="pkg">' +
      '<div class="pkg__icon">' + esc(p.icon || '📦') + '</div>' +
      '<div class="pkg__main">' +
        '<div class="pkg__title"><h3>' + esc(p.name) + '</h3>' +
          '<span class="badge">' + esc(p.platform || '其他') + '</span>' +
          (p.channel ? '<span class="badge badge--ghost">' + esc(p.channel) + '</span>' : '') +
          (isOutdated(p) ? '<span class="badge badge--new">有新版本</span>' : '') +
        '</div>' +
        '<p class="pkg__desc">' + esc(p.description) + '</p>' +
        versionHTML(p) +
        '<div class="pkg__meta"><span>📅 ' + esc(p.updatedAt || '—') + '</span>' +
          (p.size ? '<span>💾 ' + esc(p.size) + '</span>' : '') +
          (p.changelog ? '<span>🛠 ' + esc(p.changelog) + '</span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="pkg__action">' + actionHTML(p) + '</div>' +
    '</article>';
  }

  fetch('../downloads.json', { cache: 'no-store' })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      var page = data.page || {};
      document.title = (page.title || '下载') + ' · 小鹿 Lu';
      $('#pageTitle').textContent = page.title || 'APP Download';
      $('#pageSubtitle').textContent = page.subtitle || '';
      $('#pageNote').textContent = page.note || '';
      $('#pkgList').innerHTML = (data.packages || []).map(pkgHTML).join('');
    })
    .catch(function () {
      $('#pkgList').innerHTML =
        '<div class="text-center text-muted py-5">列表加载失败：请通过 http(s) 打开本页。</div>';
    });
})();
