// ============================================================
// 사이트 전역 설정 — 이 파일 한 곳만 수정하면 전 페이지에 반영됩니다
// ============================================================
window.SITE_CONFIG = {
  // ▼ 카카오톡 채널 개설 후 채팅 URL을 여기에 넣으세요.
  //   카카오톡 채널 예: 'https://pf.kakao.com/_xaBcDe/chat'
  //   오픈채팅을 쓸 경우: 'https://open.kakao.com/o/xxxxxxx'
  kakaoChatUrl: '',

  phone: '010-8726-8288',
  blog: 'https://blog.naver.com/furniture81'
};

(function () {
  var CFG = window.SITE_CONFIG;
  var telHref = 'tel:' + CFG.phone.replace(/-/g, '');

  function kakaoFallback() {
    alert('카카오톡 채널 준비 중입니다.\n전화로 문의해 주세요: ' + CFG.phone);
  }

  function bind() {
    var url = CFG.kakaoChatUrl;

    // ── 1) 노란 카카오톡 버튼 전부 ──
    document.querySelectorAll('.btn-kakao').forEach(function (b) {
      b.addEventListener('click', function () {
        if (url) { window.open(url, '_blank'); }
        else { kakaoFallback(); }
      });
    });

    // ── 2) 텍스트 링크류 일괄 처리 ──
    document.querySelectorAll('a').forEach(function (a) {
      var t = a.textContent.trim();
      var href = a.getAttribute('href') || '';

      // '카톡 상담' 링크: 채널 있으면 연결, 없으면 전화 안내 (index의 #contact 스크롤은 유지)
      if (t === '카톡 상담') {
        if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; }
        else if (!(href === '#contact' && document.querySelector('#contact'))) {
          a.addEventListener('click', function (e) { e.preventDefault(); kakaoFallback(); });
        }
      }

      // '전화' 링크 → 실제 발신
      if (t === '전화') { a.href = telHref; }

      // 약관류 빈 링크 → 준비 중 안내
      if (href === '#' && (t === '이용약관' || t === '개인정보처리방침')) {
        a.addEventListener('click', function (e) {
          e.preventDefault();
          alert('정식 오픈 준비 중인 페이지입니다.\n문의: ' + CFG.phone);
        });
      }

      // 블로그 관련 빈 링크 → 실제 블로그로
      if (href === '#' && /블로그/.test(t)) {
        a.href = CFG.blog; a.target = '_blank'; a.rel = 'noopener';
      }
    });

    // ── 3) 모바일 햄버거 메뉴 (top-nav 있는 페이지 공통) ──
    var navBox = document.querySelector('.top-nav .container');
    if (navBox && !document.getElementById('mMenuBtn')) {
      var style = document.createElement('style');
      style.textContent = [
        '#mMenuBtn{display:none;background:none;border:none;cursor:pointer;padding:8px;margin-left:4px}',
        '#mMenuBtn svg{display:block}',
        '#mDrawer{display:none;position:fixed;top:72px;left:0;right:0;bottom:0;background:#fff;z-index:200;padding:8px 24px 24px;overflow-y:auto}',
        '#mDrawer.open{display:block}',
        '#mDrawer a{display:block;padding:16px 4px;font-size:17px;font-weight:600;border-bottom:1px solid #eee;color:#222}',
        '#mDrawer .m-sub{font-size:13px;color:#888;font-weight:400;margin-left:8px}',
        '#mDrawer .m-contact{display:flex;gap:10px;margin-top:18px}',
        '#mDrawer .m-contact a{flex:1;text-align:center;border:1px solid #ddd;border-radius:10px;padding:14px 0;font-size:15px;border-bottom:1px solid #ddd}',
        '#mDrawer .m-contact a.k{background:#FEE500;border-color:#FEE500}',
        'body.menu-open{overflow:hidden}',
        '@media (max-width:744px){#mMenuBtn{display:block}}'
      ].join('\n');
      document.head.appendChild(style);

      var btn = document.createElement('button');
      btn.id = 'mMenuBtn';
      btn.setAttribute('aria-label', '메뉴 열기');
      btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
      navBox.appendChild(btn);

      var drawer = document.createElement('div');
      drawer.id = 'mDrawer';
      drawer.innerHTML =
        '<a href="index.html">홈</a>' +
        '<a href="서비스.html">서비스</a>' +
        '<a href="씽크대견적.html">씽크대 견적 <span class="m-sub">제품별 가격 공개</span></a>' +
        '<a href="장제작상세.html">장 리폼 <span class="m-sub">냉장고장·키큰장·아일랜드</span></a>' +
        '<a href="계산기.html">견적 계산기 <span class="m-sub">30초 예상 견적</span></a>' +
        '<a href="시공사례.html">시공사례</a>' +
        '<a href="교육.html">교육</a>' +
        '<a href="자료실.html">자료실</a>' +
        '<a href="상담문의.html">상담 문의</a>' +
        '<div class="m-contact"><a href="' + telHref + '">📞 전화하기</a><a href="#" class="k" id="mDrawerKakao">💬 카톡 상담</a></div>';
      document.body.appendChild(drawer);

      function toggle(open) {
        drawer.classList[open ? 'add' : 'remove']('open');
        document.body.classList[open ? 'add' : 'remove']('menu-open');
        btn.innerHTML = open
          ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'
          : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#222" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
      }
      btn.addEventListener('click', function () { toggle(!drawer.classList.contains('open')); });
      drawer.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () { toggle(false); });
      });
      var dk = document.getElementById('mDrawerKakao');
      dk.addEventListener('click', function (e) {
        if (CFG.kakaoChatUrl) { dk.href = CFG.kakaoChatUrl; dk.target = '_blank'; }
        else { e.preventDefault(); kakaoFallback(); }
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
