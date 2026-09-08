/**
 * 两个页面共用的界面行为：移动端侧边栏、回到顶部。
 */
window.BlogSite = (function () {
  'use strict';

  function initSidebar() {
    var header = document.getElementById('header');
    var toggle = document.getElementById('headerToggle');
    var backdrop = document.getElementById('backdrop');
    if (!header || !toggle) return;

    function close() {
      header.classList.remove('header-show');
      if (backdrop) backdrop.classList.remove('show');
    }

    toggle.addEventListener('click', function () {
      header.classList.toggle('header-show');
      if (backdrop) backdrop.classList.toggle('show', header.classList.contains('header-show'));
    });

    if (backdrop) backdrop.addEventListener('click', close);
    header.addEventListener('click', function (e) {
      if (e.target.closest('a') && window.innerWidth < 1200) close();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1200) close();
    });
  }

  function initScrollTop() {
    var btn = document.getElementById('scrollTop');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    window.addEventListener('scroll', function () {
      btn.classList.toggle('active', window.scrollY > 400);
    }, { passive: true });
  }

  function init() {
    initSidebar();
    initScrollTop();
  }

  return { init: init };
})();
