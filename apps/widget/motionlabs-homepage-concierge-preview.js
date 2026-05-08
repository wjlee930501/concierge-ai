(() => {
  document.getElementById('ml-salesman-overlay-style')?.remove();
  document.getElementById('ml-salesman-overlay')?.remove();
  document.getElementById('ml-salesman-dim')?.remove();
  document.querySelectorAll('.ml-salesman-spotlight').forEach((el) => el.classList.remove('ml-salesman-spotlight'));

  const style = document.createElement('style');
  style.id = 'ml-salesman-overlay-style';
  style.textContent = `
    #ml-salesman-dim{position:fixed;inset:0;background:rgba(7,20,39,.12);z-index:2147483000;pointer-events:none;opacity:0;transition:.18s}#ml-salesman-dim.on{opacity:1}
    #ml-salesman-overlay{position:fixed;left:50%;bottom:30px;transform:translateX(-50%);z-index:2147483002;width:min(760px,calc(100vw - 28px));font-family:-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Pretendard','Noto Sans KR',sans-serif;color:#071427;pointer-events:auto}#ml-salesman-overlay *{box-sizing:border-box}
    #ml-salesman-overlay .ml-row{display:grid;grid-template-columns:90px 1fr;gap:14px;align-items:end;animation:mlFloat 4.5s ease-in-out infinite}#ml-salesman-overlay .ml-person{width:86px;height:112px;position:relative;transition:.26s cubic-bezier(.2,.8,.2,1)}#ml-salesman-overlay[data-point=left] .ml-person{transform:translateX(-20px) rotate(-2deg)}#ml-salesman-overlay[data-point=right] .ml-person{transform:translateX(20px) rotate(2deg)}#ml-salesman-overlay[data-point=up] .ml-person{transform:translateY(-12px)}
    #ml-salesman-overlay .ml-headshot{position:absolute;left:18px;bottom:26px;width:58px;height:58px;border-radius:22px;background:radial-gradient(circle at 46% 30%,#ffe7d7 0 22%,#dca485 23% 37%,#10213a 38% 70%,#1c73e8 100%);border:2px solid #fff;box-shadow:0 22px 44px rgba(7,20,39,.28)}#ml-salesman-overlay .ml-body{position:absolute;left:9px;bottom:0;width:72px;height:42px;border-radius:24px 24px 18px 18px;background:linear-gradient(135deg,#071427,#1c73e8);box-shadow:0 20px 40px rgba(7,20,39,.22)}#ml-salesman-overlay .ml-dot{position:absolute;right:12px;bottom:30px;width:14px;height:14px;border-radius:50%;background:#37d8b2;border:2px solid #fff;box-shadow:0 0 0 5px rgba(55,216,178,.16)}
    #ml-salesman-overlay .ml-bubble{background:rgba(255,255,255,.95);border:1px solid rgba(255,255,255,.72);border-radius:28px;box-shadow:0 28px 90px rgba(7,20,39,.25);backdrop-filter:blur(18px);overflow:hidden}#ml-salesman-overlay .ml-top{display:flex;justify-content:space-between;gap:14px;padding:14px 16px 10px;border-bottom:1px solid rgba(20,39,71,.09)}#ml-salesman-overlay .ml-title{font-weight:900;letter-spacing:-.025em}#ml-salesman-overlay .ml-state{font-size:12px;color:#64748b}#ml-salesman-overlay .ml-msg{padding:14px 16px 10px;color:#30445f;font-size:15px;line-height:1.58}#ml-salesman-overlay .ml-chips{display:flex;flex-wrap:wrap;gap:8px;padding:0 16px 16px}#ml-salesman-overlay button{min-height:38px;border:1px solid rgba(28,115,232,.18);background:#fff;color:#1f4f93;border-radius:999px;padding:0 12px;font-weight:850;cursor:pointer}#ml-salesman-overlay button[aria-pressed=true]{background:#071427;color:#fff;border-color:#071427}
    #ml-salesman-overlay .ml-pop{position:fixed;z-index:2147483003;max-width:340px;padding:14px 15px;border-radius:18px;background:#071427;color:#fff;box-shadow:0 18px 60px rgba(7,20,39,.30);opacity:0;transform:translateY(6px);transition:.22s;pointer-events:none}#ml-salesman-overlay .ml-pop.on{opacity:1;transform:translateY(0)}#ml-salesman-overlay .ml-l{color:#77efd6;font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;margin-bottom:5px}#ml-salesman-overlay .ml-t{font-weight:900;margin-bottom:5px}#ml-salesman-overlay .ml-b{color:rgba(255,255,255,.78);font-size:13px;line-height:1.52}
    .ml-salesman-spotlight{outline:4px solid rgba(55,216,178,.58)!important;outline-offset:8px!important;border-radius:18px!important;box-shadow:0 0 0 9999px rgba(7,20,39,.10),0 0 40px rgba(55,216,178,.24)!important;position:relative!important;z-index:2147482999!important}@keyframes mlFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}@media(prefers-reduced-motion:reduce){#ml-salesman-overlay .ml-row{animation:none}#ml-salesman-overlay *{transition-duration:1ms!important}}@media(max-width:640px){#ml-salesman-overlay{bottom:16px}#ml-salesman-overlay .ml-row{grid-template-columns:64px 1fr;gap:8px}#ml-salesman-overlay .ml-person{width:64px;height:86px}#ml-salesman-overlay .ml-headshot{width:48px;height:48px;left:9px}#ml-salesman-overlay .ml-body{width:56px;height:34px}#ml-salesman-overlay .ml-msg{font-size:14px}}
  `;
  document.head.appendChild(style);

  const dim = document.createElement('div');
  dim.id = 'ml-salesman-dim';
  document.body.appendChild(dim);

  const root = document.createElement('section');
  root.id = 'ml-salesman-overlay';
  root.dataset.point = 'up';
  root.setAttribute('aria-label', 'MotionLabs Concierge AI floating salesman preview');
  root.innerHTML = `<div class="ml-row"><div class="ml-person" aria-hidden="true"><div class="ml-body"></div><div class="ml-headshot"></div><span class="ml-dot"></span></div><div class="ml-bubble"><div class="ml-top"><div class="ml-title">MotionLabs Concierge AI</div><div class="ml-state" id="mlSalesmanState">화면 중앙 하단에서 안내 중</div></div><div class="ml-msg" id="mlSalesmanMessage">처음 오셨다면 제가 30초 안에 핵심만 짚어드릴게요. 보고 싶은 흐름을 선택해 주세요.</div><div class="ml-chips" role="group" aria-label="세일즈맨 안내 선택지"><button type="button" data-intent="core" aria-pressed="true">서비스 핵심 보기</button><button type="button" data-intent="proof" aria-pressed="false">성과부터 보기</button><button type="button" data-intent="demo" aria-pressed="false">데모로 이동</button><button type="button" data-intent="contact" aria-pressed="false">도입 상담</button></div></div></div><aside class="ml-pop" id="mlSalesmanPopover" aria-live="polite"><div class="ml-l" id="mlSalesmanLabel">Guide</div><div class="ml-t" id="mlSalesmanTitle">핵심 메시지를 먼저 보세요</div><div class="ml-b" id="mlSalesmanBody">방문자가 첫 화면에서 길을 잃지 않도록 핵심 가치와 다음 CTA를 함께 안내합니다.</div></aside>`;
  document.body.appendChild(root);

  const flows = {
    core: { target: 'h1,h2', label: 'Core', title: '핵심부터 짚겠습니다.', body: '첫 화면에서 서비스가 무엇인지 빠르게 이해하도록 핵심 메시지를 먼저 가리킵니다.', point: 'up' },
    proof: { target: 'main img[alt*="12"], main img[alt*="증가"], main p, main h3', label: 'Proof', title: '성과 근거를 먼저 보여드립니다.', body: '관심이 생긴 방문자에게는 기능보다 실제 근거와 사례를 먼저 보여주는 흐름이 더 설득력 있습니다.', point: 'right' },
    demo: { target: 'button', text: '데모', label: 'Demo', title: '직접 체험 CTA로 연결합니다.', body: '설명을 충분히 읽은 방문자는 데모 버튼을 찾아가게 하지 않고 바로 다음 행동으로 안내합니다.', point: 'left' },
    contact: { target: 'button', text: '상담', label: 'Conversion', title: '상담 CTA로 마무리합니다.', body: '도입 의향이 있는 방문자는 더 읽게 만들지 않고 상담 버튼과 입력 흐름으로 자연스럽게 이어갑니다.', point: 'right' }
  };

  function findTarget(flow) {
    const nodes = Array.from(document.querySelectorAll(flow.target)).filter((el) => !root.contains(el));
    if (flow.text) return nodes.find((el) => (el.innerText || el.textContent || '').includes(flow.text)) || nodes[0];
    return nodes[0];
  }
  function placePopover(target) {
    const pop = document.getElementById('mlSalesmanPopover');
    if (!target) { pop.style.left = 'calc(50% - 170px)'; pop.style.top = '52%'; return; }
    const rect = target.getBoundingClientRect();
    const x = Math.min(window.innerWidth - 360, Math.max(18, rect.left + rect.width / 2 - 170));
    const y = rect.top > window.innerHeight * 0.42 ? Math.max(18, rect.top - 124) : Math.min(window.innerHeight - 180, rect.bottom + 18);
    pop.style.left = `${x}px`; pop.style.top = `${y}px`;
  }
  function apply(intent) {
    const flow = flows[intent];
    const target = findTarget(flow);
    document.querySelectorAll('.ml-salesman-spotlight').forEach((el) => el.classList.remove('ml-salesman-spotlight'));
    if (target) { target.classList.add('ml-salesman-spotlight'); target.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
    root.dataset.point = flow.point;
    dim.classList.add('on');
    root.querySelectorAll('button').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.intent === intent)));
    document.getElementById('mlSalesmanState').textContent = target ? '페이지 요소를 가리키는 중' : '다음 행동 안내 중';
    document.getElementById('mlSalesmanMessage').textContent = flow.body;
    document.getElementById('mlSalesmanLabel').textContent = flow.label;
    document.getElementById('mlSalesmanTitle').textContent = flow.title;
    document.getElementById('mlSalesmanBody').textContent = flow.body;
    setTimeout(() => { placePopover(target); document.getElementById('mlSalesmanPopover').classList.add('on'); }, 180);
  }

  root.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => apply(button.dataset.intent)));
  apply('core');
  console.info('MOTIONLABS_CENTER_BOTTOM_SALESMAN_OVERLAY_READY');
})();
