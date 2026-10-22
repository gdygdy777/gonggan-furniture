#!/usr/bin/env python3
# 네이버 블로그(furniture81) RSS → 사이트 블로그 데이터/카드 자동 동기화
# - 데이터/blog-posts.js 재생성 (제품상세 시공사례 매칭용)
# - index.html 홈 '시공 사례' 카드 4개 갱신 (마커 사이)
# - 자료실.html 블로그 카드 3개 갱신 (마커 사이)
# - 제품상세.html 의 blog-posts.js 캐시 버전(?v=) 을 내용 해시로 갱신
# 표준 라이브러리만 사용. 마커가 없으면 자동 삽입(부트스트랩).
import re, json, html, hashlib, os, urllib.request
from pathlib import Path
from email.utils import parsedate_to_datetime

ROOT = Path(__file__).resolve().parent.parent
RSS_URL = "https://rss.blog.naver.com/furniture81.xml"
BLOG_BASE = "https://blog.naver.com/furniture81"
# 부트스트랩 시 그리드를 찾는 앵커 — 카드 링크에만 존재(head 스키마/푸터 링크와 구분)
POST_ANCHOR = '<a class="p-card" href="https://blog.naver.com/furniture81/'

def fetch_rss():
    # 로컬 테스트용: SYNC_RSS_FILE 가 지정되면 그 파일을 읽음 (CI 는 항상 URL 사용)
    local = os.environ.get("SYNC_RSS_FILE")
    if local:
        return Path(local).read_text(encoding="utf-8")
    req = urllib.request.Request(RSS_URL, headers={"User-Agent": "Mozilla/5.0 (gongganlab blog sync)"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "replace")

def cdata(field, blk):
    m = re.search(rf"<{field}>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</{field}>", blk, re.S)
    return m.group(1).strip() if m else ""

def parse(xml):
    posts = []
    for it in re.findall(r"<item>(.*?)</item>", xml, re.S):
        title = html.unescape(cdata("title", it))
        link = cdata("guid", it) or re.sub(r"\?.*$", "", cdata("link", it))
        cat = (cdata("category", it) or "기타").replace("\xa0", " ").strip()
        date = cdata("pubDate", it)
        img = re.search(r'<img[^>]+src="([^"]+)"', cdata("description", it))
        thumb = img.group(1) if img else ""
        thumb = re.sub(r"\?type=\w+$", "", thumb) + ("?type=w2" if thumb else "")
        if title and link:
            posts.append({"title": title, "link": link, "cat": cat, "date": date, "thumb": thumb})
    return posts

def ymd(d):
    dt = parsedate_to_datetime(d)
    return f"{dt.year}.{dt.month:02d}.{dt.day:02d}"

def esc(s):
    return html.escape(s, quote=True)

def trunc(s, n):
    return s if len(s) <= n else s[:n] + "…"

def home_card(p):
    return (
        f'      <a class="p-card" href="{p["link"]}" target="_blank" rel="noopener">\n'
        f'        <div class="p-photo"><img src="{p["thumb"]}" alt="{esc(p["title"])}" loading="lazy" referrerpolicy="no-referrer"></div>\n'
        f'        <div class="p-meta">\n'
        f'          <div class="p-title">{esc(trunc(p["title"], 24))}</div>\n'
        f'          <div class="p-sub">{esc(p["cat"])} · {ymd(p["date"])}</div>\n'
        f'        </div>\n'
        f'      </a>'
    )

def lib_card(p, ph):
    phc = f" {ph}" if ph else ""
    return (
        f'      <a class="p-card" href="{p["link"]}" target="_blank" rel="noopener">\n'
        f'        <div class="p-photo{phc}"><img src="{p["thumb"]}" alt="{esc(p["title"])}" loading="lazy" referrerpolicy="no-referrer"><span class="badge">{esc(p["cat"])}</span></div>\n'
        f'        <div class="p-meta">\n'
        f'          <div class="p-title">{esc(trunc(p["title"], 26))}</div>\n'
        f'          <div class="p-sub">{esc(p["cat"])} · {ymd(p["date"])}</div>\n'
        f'          <span class="p-link">블로그에서 읽기 ↗</span>\n'
        f'        </div>\n'
        f'      </a>'
    )

def grid_inner_bounds(htmltext, grid_class, must_contain):
    anchor = htmltext.find(must_contain)
    if anchor < 0:
        raise SystemExit(f"[중단] '{must_contain}' 를 못 찾음")
    opening = htmltext.rfind(f'<div class="{grid_class}"', 0, anchor)
    if opening < 0:
        raise SystemExit(f"[중단] <div class=\"{grid_class}\"> 를 못 찾음")
    inner_start = htmltext.find(">", opening) + 1
    i, depth = inner_start, 1
    while i < len(htmltext):
        if htmltext.startswith("<div", i):
            depth += 1; i += 4
        elif htmltext.startswith("</div>", i):
            depth -= 1; i += 6
            if depth == 0:
                return inner_start, i - 6
        else:
            i += 1
    raise SystemExit("[중단] grid 닫는 태그 매칭 실패")

def update_cards(htmltext, grid_class, must_contain, start_m, end_m, cards):
    block = f"{start_m}\n" + "\n".join(cards) + f"\n      {end_m}"
    if start_m in htmltext and end_m in htmltext:
        pat = re.escape(start_m) + r".*?" + re.escape(end_m)
        return re.sub(pat, lambda _: block, htmltext, flags=re.S)
    # 부트스트랩: 마커가 없으면 grid 내부 전체를 마커+카드로 교체
    s, e = grid_inner_bounds(htmltext, grid_class, must_contain)
    return htmltext[:s] + f"\n      {block}\n    " + htmltext[e:]

def main():
    xml = fetch_rss()
    posts = parse(xml)
    if len(posts) < 5:
        raise SystemExit(f"[중단] 글이 너무 적음({len(posts)}) — 피드 이상, 기존 데이터 유지")

    # A. blog-posts.js
    blog_js = "window.GG_BLOG = " + json.dumps(posts, ensure_ascii=False) + ";\n"
    (ROOT / "데이터/blog-posts.js").write_text(blog_js, encoding="utf-8")
    ver = hashlib.md5(blog_js.encode("utf-8")).hexdigest()[:8]

    # B. index.html 홈 카드 4개
    ip = ROOT / "index.html"; t = ip.read_text(encoding="utf-8")
    t = update_cards(t, "card-grid", POST_ANCHOR, "<!-- BLOG:HOME:START -->", "<!-- BLOG:HOME:END -->",
                     [home_card(p) for p in posts[:4]])
    ip.write_text(t, encoding="utf-8")

    # C. 자료실.html 카드 3개
    lp = ROOT / "자료실.html"; t = lp.read_text(encoding="utf-8")
    phs = ["", "ph2", "ph3"]
    t = update_cards(t, "blog-grid", POST_ANCHOR, "<!-- BLOG:LIBRARY:START -->", "<!-- BLOG:LIBRARY:END -->",
                     [lib_card(p, phs[i]) for i, p in enumerate(posts[:3])])
    lp.write_text(t, encoding="utf-8")

    # D. 제품상세.html 캐시 버전(?v=) → 내용 해시
    pp = ROOT / "제품상세.html"; t = pp.read_text(encoding="utf-8")
    t2 = re.sub(r"(blog-posts\.js\?v=)[^\"']*", r"\g<1>" + ver, t)
    pp.write_text(t2, encoding="utf-8")

    print(f"동기화 완료: 글 {len(posts)}개, 최신 {ymd(posts[0]['date'])} '{trunc(posts[0]['title'],20)}', ver={ver}")

if __name__ == "__main__":
    main()
