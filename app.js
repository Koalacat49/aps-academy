const STORAGE_KEY = "aps-academy-progress-v1";

let curriculum = null;
let state = loadState();
let selectedDay = null;

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (parsed && Array.isArray(parsed.completed)) return parsed;
  } catch (_) {}
  return { completed: [], xp: 0, quizScores: {} };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateTopbar();
}

function currentDayNumber() {
  for (let i = 1; i <= 30; i += 1) {
    if (!state.completed.includes(i)) return i;
  }
  return 30;
}

function isUnlocked(day) {
  return day <= currentDayNumber();
}

function dayData(day) {
  return curriculum.days.find((item) => item.day === day);
}

function phaseData(id) {
  return curriculum.program.phases.find((phase) => phase.id === id);
}

function updateTopbar() {
  const current = currentDayNumber();
  document.getElementById("xp-value").textContent = state.xp;
  document.getElementById("day-value").textContent = `${current} / 30`;
}

function setView(name) {
  document.querySelectorAll(".view").forEach((node) => node.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach((node) => node.classList.remove("active"));
  document.getElementById(`view-${name}`).classList.add("active");
  document.querySelector(`[data-view="${name}"]`)?.classList.add("active");
  document.getElementById("page-title").textContent =
    name === "dashboard" ? "Dashboard" :
    name === "roadmap" ? "Roadmap" : "Mission";
  if (name === "dashboard") renderDashboard();
  if (name === "roadmap") renderRoadmap();
  if (name === "mission") renderMission(selectedDay ?? currentDayNumber());
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
}

function progressPercent() {
  return Math.round((state.completed.length / 30) * 100);
}

function learnerLevel() {
  const c = state.completed.length;
  if (c >= 30) return "APS Contributor";
  if (c >= 22) return "Builder Trainee";
  if (c >= 14) return "Trust Architecture Trainee";
  if (c >= 7) return "Junior Engineer";
  if (c >= 2) return "Python Reader";
  return "Python Beginner";
}

function renderDashboard() {
  const root = document.getElementById("view-dashboard");
  const current = dayData(currentDayNumber());
  const phase = phaseData(current.phase);
  const pct = progressPercent();

  root.innerHTML = `
    <div class="grid">
      <div class="card hero">
        <div class="mission-kicker">TODAY'S MISSION · DAY ${String(current.day).padStart(2, "0")}</div>
        <div class="mission-title">${escapeHtml(current.mission)}</div>
        <div class="mission-subtitle">${escapeHtml(current.subtitle)}</div>
        <div class="meta-row">
          <span class="chip">${escapeHtml(phase.name)}</span>
          <span class="chip">⚡ ${current.xp} XP</span>
          <span class="chip">⏱ ${current.minutes} min</span>
          ${current.skills.slice(0,3).map((skill) => `<span class="chip">${escapeHtml(skill)}</span>`).join("")}
        </div>
        <button class="primary-btn" id="start-mission">START MISSION →</button>
      </div>

      <div class="card">
        <div class="metric">
          <div class="metric-label">CURRENT LEVEL</div>
          <div class="metric-value">${escapeHtml(learnerLevel())}</div>
        </div>
        <div class="metric">
          <div class="metric-label">TOTAL XP</div>
          <div class="metric-value">${state.xp}</div>
        </div>
        <div class="metric">
          <div class="metric-label">MISSIONS COMPLETE</div>
          <div class="metric-value">${state.completed.length} / 30</div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:18px">
      <div class="phase-header">
        <div>
          <div class="mission-kicker">YOUR PROGRESS</div>
          <h2 style="margin:8px 0 0">${pct}% complete</h2>
        </div>
        <div class="phase-caption">Target: APS Contributor</div>
      </div>
      <div class="progress-shell"><div class="progress-bar" style="width:${pct}%"></div></div>
      <div class="progress-copy"><span>Day 1</span><span>Day 30 · APS CORE</span></div>
    </div>

    <div class="card" style="margin-top:18px">
      <div class="mission-kicker">WHY THIS EXISTS</div>
      <h2>コードを書くことより、理解して判断できること。</h2>
      <p class="mission-subtitle">
        このAcademyのゴールは、AIにコードを書かせる人ではなく、
        AIが書いたコードを読み、テストし、危険な変更を見抜き、
        自分の言葉で説明できるAPS contributorになることです。
      </p>
    </div>
  `;

  document.getElementById("start-mission").addEventListener("click", () => {
    selectedDay = current.day;
    setView("mission");
  });
}

function renderRoadmap() {
  const root = document.getElementById("view-roadmap");
  const current = currentDayNumber();

  root.innerHTML = curriculum.program.phases.map((phase) => {
    const days = curriculum.days.filter((day) => day.phase === phase.id);
    return `
      <div class="phase">
        <div class="phase-header">
          <div>
            <div class="phase-name">${escapeHtml(phase.name)}</div>
            <div class="phase-caption">${escapeHtml(phase.caption)}</div>
          </div>
          <div class="phase-caption">DAY ${phase.days[0]}–${phase.days[1]}</div>
        </div>
        <div class="day-grid">
          ${days.map((day) => {
            const complete = state.completed.includes(day.day);
            const unlocked = isUnlocked(day.day);
            const cls = [
              "day-node",
              complete ? "complete" : "",
              day.day === current ? "current" : "",
              !unlocked ? "locked" : ""
            ].filter(Boolean).join(" ");
            const stateCopy = complete ? "COMPLETE ✓" : day.day === current ? "ACTIVE" : unlocked ? "READY" : "LOCKED";
            return `
              <div class="${cls}" data-day="${day.day}">
                <div class="day-num">DAY ${String(day.day).padStart(2, "0")}</div>
                <div class="day-title">${escapeHtml(day.title)}</div>
                <div class="day-state">${stateCopy}</div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
  }).join("");

  root.querySelectorAll(".day-node:not(.locked)").forEach((node) => {
    node.addEventListener("click", () => {
      selectedDay = Number(node.dataset.day);
      setView("mission");
    });
  });
}

function renderMission(dayNumber) {
  const root = document.getElementById("view-mission");
  const day = dayData(dayNumber);
  if (!day) {
    root.innerHTML = '<div class="card empty">Mission not found.</div>';
    return;
  }

  if (!isUnlocked(day.day) && !state.completed.includes(day.day)) {
    root.innerHTML = `
      <div class="card empty">
        <h2>MISSION LOCKED</h2>
        <p>前のMissionを完了すると解放されます。</p>
      </div>
    `;
    return;
  }

  const detailed = Array.isArray(day.lesson);
  const score = state.quizScores[String(day.day)] ?? null;

  root.innerHTML = `
    <div class="lesson-layout">
      <div>
        <div class="card hero">
          <div class="mission-kicker">DAY ${String(day.day).padStart(2,"0")} · ${escapeHtml(phaseData(day.phase).name)}</div>
          <div class="mission-title">${escapeHtml(day.mission)}</div>
          <div class="mission-subtitle">${escapeHtml(day.subtitle)}</div>
          <div class="meta-row">
            <span class="chip">⚡ ${day.xp} XP</span>
            <span class="chip">⏱ ${day.minutes} min</span>
            ${day.skills.map((skill) => `<span class="chip">${escapeHtml(skill)}</span>`).join("")}
          </div>
        </div>

        ${detailed ? renderDetailedLesson(day, score) : renderComingSoon(day)}
      </div>

      <aside class="card sticky-card">
        <div class="mission-kicker">MISSION STATUS</div>
        <h2 style="margin:8px 0 14px">${state.completed.includes(day.day) ? "COMPLETE ✓" : "IN PROGRESS"}</h2>
        <p class="small">
          クリア条件: 教材を理解し、演習を行い、Quizで80%以上を取る。
          「見た」ではなく「説明できる」が合格基準。
        </p>
        ${score !== null ? `<div class="metric"><div class="metric-label">QUIZ SCORE</div><div class="metric-value">${score}%</div></div>` : ""}
        ${detailed ? `
          <button class="ghost-btn" id="copy-tutor" style="width:100%;margin-top:12px">COPY AI TUTOR PROMPT</button>
          <button class="primary-btn" id="complete-mission" style="width:100%;margin-top:10px"
            ${score !== null && score >= 80 ? "" : "disabled"}>
            ${state.completed.includes(day.day) ? "MISSION COMPLETE ✓" : "COMPLETE MISSION"}
          </button>
          <div class="small" style="margin-top:10px">AI Tutorは補助。コードの答えを丸ごと書かせず、質問・ヒント・採点に使う。</div>
        ` : ""}
      </aside>
    </div>
  `;

  if (detailed) {
    bindQuiz(day);
    document.getElementById("copy-tutor")?.addEventListener("click", async () => {
      await navigator.clipboard.writeText(day.tutorPrompt);
      showToast("AI Tutor prompt copied.");
    });
    document.getElementById("complete-mission")?.addEventListener("click", () => completeMission(day));
  }
}

function renderDetailedLesson(day, previousScore) {
  return `
    <div class="card" style="margin-top:18px">
      <div class="lesson-block">
        <div class="mission-kicker">01 · BRIEFING / LEARN</div>
        <h3>今日理解すること</h3>
        ${day.lesson.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
      </div>

      <div class="lesson-block">
        <div class="mission-kicker">02 · TRY IT</div>
        <h3>まず動かす</h3>
        <div class="code-box">${escapeHtml(day.example)}</div>
      </div>

      <div class="lesson-block">
        <div class="mission-kicker">03 · BREAK / BUILD</div>
        <h3>自分で触る</h3>
        ${day.exercises.map((exercise, index) => `
          <div class="exercise"><strong>CHALLENGE ${index + 1}</strong>${escapeHtml(exercise)}</div>
        `).join("")}
      </div>

      <div class="lesson-block">
        <div class="mission-kicker">04 · QUIZ</div>
        <h3>理解を確認する</h3>
        <div id="quiz-root"></div>
        ${previousScore !== null ? `<p class="small">Previous best: ${previousScore}%</p>` : ""}
      </div>

      <div class="lesson-block">
        <div class="mission-kicker">05 · EXPLAIN</div>
        <h3>最後に自分の言葉で説明</h3>
        <p>画面を閉じても、今日のテーマを3分以内で他人に説明できるか確認してください。説明できない部分が、次に復習すべき部分です。</p>
      </div>
    </div>
  `;
}

function renderComingSoon(day) {
  return `
    <div class="card" style="margin-top:18px">
      <div class="mission-kicker">ROADMAP DEFINED</div>
      <h2>このMissionの詳細教材はWeek単位で追加されます。</h2>
      <p class="mission-subtitle">
        学習目標はすでに固定されています。Week 1の実際の理解度を見て、
        難易度と演習量を調整してから詳細化します。
      </p>
    </div>
  `;
}

function bindQuiz(day) {
  const root = document.getElementById("quiz-root");
  if (!root) return;

  const answers = new Map();

  root.innerHTML = day.quiz.map((item, qi) => `
    <div class="exercise" data-question="${qi}">
      <strong>Q${qi + 1}. ${escapeHtml(item.q)}</strong>
      ${item.options.map((option, oi) => `
        <button class="quiz-option" data-q="${qi}" data-o="${oi}">${escapeHtml(option)}</button>
      `).join("")}
    </div>
  `).join("") + '<button class="primary-btn" id="submit-quiz" style="margin-top:14px">SUBMIT QUIZ</button>';

  root.querySelectorAll(".quiz-option").forEach((button) => {
    button.addEventListener("click", () => {
      const q = Number(button.dataset.q);
      answers.set(q, Number(button.dataset.o));
      root.querySelectorAll(`[data-q="${q}"]`).forEach((node) => node.classList.remove("correct","wrong"));
      button.classList.add("correct");
    });
  });

  document.getElementById("submit-quiz").addEventListener("click", () => {
    if (answers.size !== day.quiz.length) {
      showToast("全問答えてから提出してください。");
      return;
    }

    let correct = 0;
    day.quiz.forEach((item, q) => {
      const selected = answers.get(q);
      const buttons = root.querySelectorAll(`[data-q="${q}"]`);
      buttons.forEach((button) => {
        button.classList.remove("correct","wrong");
        if (Number(button.dataset.o) === item.answer) button.classList.add("correct");
        if (Number(button.dataset.o) === selected && selected !== item.answer) button.classList.add("wrong");
      });
      if (selected === item.answer) correct += 1;
    });

    const score = Math.round((correct / day.quiz.length) * 100);
    const previous = state.quizScores[String(day.day)] ?? 0;
    state.quizScores[String(day.day)] = Math.max(previous, score);
    saveState();

    showToast(score >= 80 ? `PASS · ${score}%` : `RETRY · ${score}%`);
    setTimeout(() => renderMission(day.day), 850);
  });
}

function completeMission(day) {
  const score = state.quizScores[String(day.day)] ?? 0;
  if (score < 80) {
    showToast("Quiz 80%以上が必要です。");
    return;
  }

  if (!state.completed.includes(day.day)) {
    state.completed.push(day.day);
    state.completed.sort((a,b) => a-b);
    state.xp += day.xp;
    saveState();
    showToast(`MISSION COMPLETE · +${day.xp} XP`);
  }

  selectedDay = currentDayNumber();
  setTimeout(() => setView("dashboard"), 700);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

async function boot() {
  try {
    const response = await fetch("./data/curriculum.json", { cache: "no-store" });
    if (!response.ok) throw new Error("curriculum fetch failed");
    curriculum = await response.json();
  } catch (error) {
    document.body.innerHTML = `
      <main style="max-width:760px;margin:80px auto;padding:24px;color:white;font-family:system-ui">
        <h1>APS Academy could not load.</h1>
        <p>GitHub PagesまたはローカルHTTPサーバーから開いてください。</p>
      </main>
    `;
    return;
  }

  selectedDay = currentDayNumber();
  updateTopbar();
  renderDashboard();

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });
}

boot();