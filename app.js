/* =====================================================
   네이버페이 스코어 프로토타입 — 인터랙션
   - 뷰 라우터 (만들기 / 생성중 / 생성된)
   - 버튼 ripple
   - "만들기" → "생성중" → 2.4s 후 → "생성된" 자동 시뮬레이션
   ===================================================== */

(function () {
  const VIEWS = ["create", "loading", "result"];

  const views = Object.fromEntries(
    VIEWS.map((name) => [name, document.getElementById(`view-${name}`)])
  );
  const devButtons = document.querySelectorAll(".devnav__btn");

  let current = "create";

  /** 뷰 전환 */
  function go(target) {
    if (!VIEWS.includes(target) || target === current) return;

    const prevView = views[current];
    const nextView = views[target];

    // 이전 뷰: leaving 애니메이션 트리거
    prevView.classList.add("is-leaving");
    prevView.classList.remove("is-active");

    // 짧은 delay 후 다음 뷰 활성화 (스택 전환 느낌)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        nextView.classList.add("is-active");
      });
    });

    // leaving 정리
    setTimeout(() => {
      prevView.classList.remove("is-leaving");
    }, 360);

    current = target;
    updateDevNav();

    // 스크롤 리셋
    nextView.scrollTop = 0;

    // 결과 화면 진입 → 컨페티 발사 🎉
    if (target === "result") {
      // 일러스트 팝인 직후 터지도록 약간 딜레이
      setTimeout(() => fireConfetti(nextView), 350);
    }
  }

  function updateDevNav() {
    devButtons.forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.go === current);
    });
  }

  /** 이벤트 위임: data-go / data-action */
  document.addEventListener("click", (e) => {
    const goEl = e.target.closest("[data-go]");
    if (goEl) {
      go(goEl.dataset.go);
      return;
    }

    const actionEl = e.target.closest("[data-action]");
    if (actionEl) {
      switch (actionEl.dataset.action) {
        case "start-make":
          go("loading");
          break;
        case "finish":
          go("result");
          break;
      }
    }
  });

  /** 버튼 ripple */
  document.addEventListener("pointerdown", (e) => {
    const btn = e.target.closest(".btn");
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    btn.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  });

  /** 키보드: ← → 로 뷰 전환 (데모 편의) */
  document.addEventListener("keydown", (e) => {
    const idx = VIEWS.indexOf(current);
    if (e.key === "ArrowRight" && idx < VIEWS.length - 1) {
      go(VIEWS[idx + 1]);
    } else if (e.key === "ArrowLeft" && idx > 0) {
      go(VIEWS[idx - 1]);
    }
  });

  /** =====================================================
   *  Confetti 🎉 — canvas particle burst
   *  ===================================================== */
  function fireConfetti(container) {
    // 중복 방지
    const old = container.querySelector(".confetti-canvas");
    if (old) old.remove();

    const canvas = document.createElement("canvas");
    canvas.className = "confetti-canvas";
    container.appendChild(canvas);

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    const colors = [
      "#00CD60", // green
      "#3DDC84", // light green
      "#FFD43B", // yellow
      "#FF8FA3", // pink
      "#74C0FC", // blue
      "#FFFFFF", // white
    ];

    // 발사 원점: 일러스트 부근 (상단 중앙)
    const originX = rect.width / 2;
    const originY = rect.height * 0.32;

    const COUNT = 90;
    const particles = [];
    for (let i = 0; i < COUNT; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
      const speed = 6 + Math.random() * 7;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 5 + Math.random() * 6,
        color: colors[(Math.random() * colors.length) | 0],
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.4,
        shape: Math.random() < 0.5 ? "rect" : "circle",
        life: 0,
        maxLife: 90 + Math.random() * 40,
        gravity: 0.22 + Math.random() * 0.08,
        drag: 0.985,
      });
    }

    let raf;
    function tick() {
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      let alive = 0;
      for (const p of particles) {
        if (p.life >= p.maxLife) continue;
        alive++;
        p.vx *= p.drag;
        p.vy = p.vy * p.drag + p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vrot;
        p.life++;

        const t = p.life / p.maxLife;
        const alpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.45, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      if (alive > 0) {
        raf = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(raf);
        canvas.remove();
      }
    }
    tick();
  }
})();
