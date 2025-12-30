document.addEventListener("DOMContentLoaded", () => {
  /* =========================
     1) 메인 비주얼 슬라이더
     ========================= */
  let sliderIndex = 0;
  const sliderWrap = document.querySelector(".sliderWrap");
  let slides = document.querySelectorAll(".sliderWrap .slide");
  const slideWidth = 1920;

  if (sliderWrap && slides.length) {
    if (!sliderWrap.dataset.cloned) {
      sliderWrap.appendChild(slides[0].cloneNode(true));
      sliderWrap.dataset.cloned = "true";
    }

    slides = document.querySelectorAll(".sliderWrap .slide");

    setInterval(() => {
      sliderIndex++;
      sliderWrap.style.transition = "margin-left 0.6s ease";
      sliderWrap.style.marginLeft = `-${slideWidth * sliderIndex}px`;

      if (sliderIndex === slides.length - 1) {
        setTimeout(() => {
          sliderWrap.style.transition = "none";
          sliderWrap.style.marginLeft = "0px";
          sliderIndex = 0;
        }, 700);
      }
    }, 3000);
  }

  /* =========================
     2) 풀페이지 마우스 휠
     ========================= */
  const sections = document.querySelectorAll(
    "header, #artist, #news01, #news02, #main05, footer"
  );

  let currentIndex = 0;
  let isMoving = false;

  const triggerMotionsForSection = (sectionEl) => {
    if (!sectionEl) return;

    if (sectionEl.id === "news01") {
      const rowTop = document.querySelector("#news01 .row-top");
      const rowBottom = document.querySelector("#news01 .row-bottom");

      if (rowTop && !rowTop.classList.contains("is-visible")) {
        rowTop.classList.add("is-visible");

        rowTop.addEventListener(
          "animationend",
          () => {
            if (rowBottom && !rowBottom.classList.contains("is-visible")) {
              rowBottom.classList.add("is-visible");
            }
          },
          { once: true }
        );
      }
    }

    if (sectionEl.id === "news02") {
      document.querySelectorAll(".news2-card").forEach((card) => {
        card.classList.add("is-visible");
      });
    }

    if (sectionEl.id === "main05") {
      sectionEl.classList.add("is-visible");
    }
  };

  const moveTo = (i) => {
    if (i < 0 || i >= sections.length) return;
    isMoving = true;

    const target = sections[i];
    target.scrollIntoView({ behavior: "smooth" });

    setTimeout(() => {
      triggerMotionsForSection(target);
      isMoving = false;
    }, 750);
  };

  const syncIndexToScroll = () => {
    const y = window.scrollY + window.innerHeight / 2;
    let bestIdx = 0;
    let bestDist = Infinity;

    sections.forEach((sec, idx) => {
      const top = sec.offsetTop;
      const dist = Math.abs(top - y);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = idx;
      }
    });

    currentIndex = bestIdx;
  };

  // ✅ 스크롤 리스너는 "한 번만" (아래 quickMenu에서도 같이 처리)
  syncIndexToScroll();

  window.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      if (isMoving) return;

      syncIndexToScroll();

      if (e.deltaY > 0) {
        if (currentIndex < sections.length - 1) currentIndex++;
      } else {
        if (currentIndex > 0) currentIndex--;
      }

      moveTo(currentIndex);
    },
    { passive: false }
  );

  /* =========================
     3) ARTIST : 회전초밥 + 중앙 확대
     ========================= */
  const inner = document.querySelector("#artist .artist-inner");
  const track = document.querySelector("#artist .artist-list");

  if (inner && track) {
    if (!track.dataset.duplicated) {
      track.innerHTML += track.innerHTML;
      track.dataset.duplicated = "true";
    }

    const SPEED_PX_PER_SEC = 140;

    const setMarquee = () => {
      const distance = track.scrollWidth / 2;
      track.style.setProperty("--marquee-distance", `${distance}px`);
      const duration = distance / SPEED_PX_PER_SEC;
      track.style.setProperty("--marquee-duration", `${duration}s`);
      track.classList.add("is-marquee");
    };

    setMarquee();
    window.addEventListener("resize", setMarquee);

    const updateCenter = () => {
      const rect = inner.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const items = track.querySelectorAll(".artist-item");

      let best = null;
      let bestDist = Infinity;

      items.forEach((it) => {
        const r = it.getBoundingClientRect();
        const x = r.left + r.width / 2;
        const d = Math.abs(x - centerX);
        if (d < bestDist) {
          bestDist = d;
          best = it;
        }
      });

      items.forEach((it) => it.classList.remove("is-center"));
      if (best) best.classList.add("is-center");
    };

    const loop = () => {
      updateCenter();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /* =========================
     4) 첫 진입 섹션 모션(새로고침 대비)
     ========================= */
  triggerMotionsForSection(sections[currentIndex]);

  /* =========================
     5) 하단 픽시드 메뉴(quickMenu)
        - header(#top)에서는 아예 안 보이게
        - news01/news02는 NEWS로 active
        - 클릭하면 풀페이지 moveTo로 이동
     ========================= */
  const quickMenu = document.querySelector(".quickMenu");
  const quickItems = document.querySelectorAll(".quickMenu .q-item");
  const quickTop = document.querySelector(".quickMenu .q-top");

  const getIdxById = (id) => {
    return Array.from(sections).findIndex((sec) => sec.id === id);
  };

  const updateQuickState = () => {
    if (!quickMenu || !quickItems.length) return;
    const cur = sections[currentIndex];
    if (!cur) return;

    // 1) header(#top)에서는 아예 숨김
    if (cur.id === "top") {
      quickMenu.classList.remove("is-show");
      quickMenu.classList.remove("only-top");
      return;
    }

    // 2) footer에서는 TOP만
    // ⚠️ 너 footer id가 "footer"니까 이걸로 체크
    if (cur.id === "footer") {
      quickMenu.classList.add("is-show"); // 보여주긴 보여줘야 TOP가 보임
      quickMenu.classList.add("only-top"); // TOP만 남기기
    } else {
      quickMenu.classList.add("is-show");
      quickMenu.classList.remove("only-top");
    }

    // 3) active 처리 (footer에서는 굳이 필요 없지만, 안전하게 돌려도 됨)
    quickItems.forEach((it) => {
      const target = it.dataset.target;

      if (target === "news01") {
        it.classList.toggle(
          "active",
          cur.id === "news01" || cur.id === "news02"
        );
        return;
      }

      it.classList.toggle("active", target === cur.id);
    });
  };

  // ✅ 메뉴 클릭 → 풀페이지 moveTo 이동
  quickItems.forEach((it) => {
    it.addEventListener("click", (e) => {
      e.preventDefault();
      const id = it.dataset.target;
      const idx = getIdxById(id);
      if (idx === -1) return;

      currentIndex = idx;
      updateQuickState();
      moveTo(currentIndex);
    });
  });

  // ✅ TOP(이미지) 클릭 → header(top) 이동
  if (quickTop) {
    quickTop.addEventListener("click", (e) => {
      e.preventDefault();

      // ✅ "올라가는 순간"에 먼저 완전 숨김(깜빡임 방지)
      if (quickMenu) {
        quickMenu.classList.remove("is-show");
        quickMenu.classList.remove("only-top");
      }

      const idx = getIdxById("top");
      currentIndex = idx === -1 ? 0 : idx;

      // updateQuickState()는 top에서 is-show 제거하니까 그대로 호출해도 OK
      updateQuickState();
      moveTo(currentIndex);
    });
  }

  // ✅ 스크롤 시 currentIndex + quickMenu 동기화 (한 번만 등록)
  window.addEventListener(
    "scroll",
    () => {
      syncIndexToScroll();
      updateQuickState();
    },
    { passive: true }
  );

  // ✅ 첫 로드시 "잠깐 뜨는 현상" 방지: index 먼저 맞추고 상태 반영
  syncIndexToScroll();
  updateQuickState();
});
