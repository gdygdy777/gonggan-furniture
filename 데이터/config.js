// ============================================================
// 사이트 전역 설정 — 이 파일 한 곳만 수정하면 전 페이지에 반영됩니다
// ============================================================
window.SITE_CONFIG = {
  // ▼ 카카오톡 채널 개설 후 채팅 URL을 여기에 넣으세요.
  //   카카오톡 채널 예: 'https://pf.kakao.com/_xaBcDe/chat'
  //   오픈채팅을 쓸 경우: 'https://open.kakao.com/o/xxxxxxx'
  kakaoChatUrl: '',

  phone: '010-8726-8288'
};

(function () {
  function bind() {
    var url = window.SITE_CONFIG.kakaoChatUrl;

    // 노란 카카오톡 버튼 전부
    document.querySelectorAll('.btn-kakao').forEach(function (b) {
      b.addEventListener('click', function () {
        if (url) { window.open(url, '_blank'); }
        else {
          alert('카카오톡 채널 준비 중입니다.\n전화로 문의해 주세요: ' + window.SITE_CONFIG.phone);
        }
      });
    });

    // 모바일 하단 바 '카톡 상담' / '전화' 링크
    document.querySelectorAll('a').forEach(function (a) {
      var t = a.textContent.trim();
      if (t === '카톡 상담' && url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; }
      if (t === '전화') { a.href = 'tel:' + window.SITE_CONFIG.phone.replace(/-/g, ''); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
