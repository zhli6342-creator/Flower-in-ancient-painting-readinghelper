const data = window.READING_CONTENT;
const blockOrder = ["氛围与诗境", "故事入门", "名画记", "花卉志", "读后联想"];
const storageKey = "huazhong-reading-checks-v1";

const state = {
  view: "guide",
  chapter: 0,
  blockIndex: 0,
};

let checks = {};

try {
  checks = JSON.parse(localStorage.getItem(storageKey) || "{}");
} catch {
  checks = {};
}

const nav = document.getElementById("chapterNav");
const contentArea = document.getElementById("contentArea");
const title = document.getElementById("pageTitle");
const meta = document.getElementById("pageMeta");
const eyebrow = document.getElementById("eyebrow");
const sectionTabs = document.getElementById("sectionTabs");

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function saveChecks() {
  localStorage.setItem(storageKey, JSON.stringify(checks));
}

function rawBlock(chapter, name) {
  return chapter.blocks.find((block) => block.title === name);
}

function displayBlocks(chapter) {
  const atmosphere = rawBlock(chapter, "氛围引语");
  const poem = rawBlock(chapter, "历史诗境");
  const combined = {
    title: "氛围与诗境",
    entries: [...(atmosphere?.entries || []), ...(poem?.entries || [])],
    references: [],
  };
  return [
    combined,
    rawBlock(chapter, "故事入门"),
    rawBlock(chapter, "名画记"),
    rawBlock(chapter, "花卉志"),
    rawBlock(chapter, "读后联想"),
  ].filter(Boolean);
}

function availableBlocks(chapter) {
  return displayBlocks(chapter).map((block) => block.title);
}

function currentBlock(chapter) {
  const blocks = displayBlocks(chapter);
  const safeIndex = Math.max(0, Math.min(state.blockIndex, blocks.length - 1));
  state.blockIndex = safeIndex;
  return blocks[safeIndex];
}

function renderNav() {
  const items = [
    `<button class="nav-item ${state.view === "guide" ? "active" : ""}" type="button" data-view="guide">
      <span class="nav-num">导引</span><span class="nav-title">全书导引</span><span class="nav-era">阅读入口</span>
    </button>`,
    ...data.chapters
      .map((chapter, index) => ({ chapter, index }))
      .map(({ chapter, index }) => `<button class="nav-item ${state.view === "chapter" && state.chapter === index ? "active" : ""}" type="button" data-chapter="${index}">
        <span class="nav-num">第 ${String(chapter.number).padStart(2, "0")} 章</span>
        <span class="nav-title">${escapeHtml(chapter.title)}</span>
        <span class="nav-era">${escapeHtml(chapter.era)} · ${escapeHtml(chapter.plant)}</span>
      </button>`),
    `<button class="nav-item ${state.view === "outro" ? "active" : ""}" type="button" data-view="outro">
      <span class="nav-num">回想</span><span class="nav-title">全书回想</span><span class="nav-era">花与天地之间</span>
    </button>`,
  ];

  nav.innerHTML = items.join("");
  nav.querySelectorAll("[data-chapter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = "chapter";
      state.chapter = Number(button.dataset.chapter);
      state.blockIndex = 0;
      render();
    });
  });
  nav.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      render();
    });
  });
}

function renderEntry(entry, blockTitle, checkable = state.view === "chapter") {
  if (entry.type === "list") {
    return `<section class="entry">
      <strong class="label">${escapeHtml(entry.label)}</strong>
      <ol class="question-list">${entry.items.map((item, index) => {
        const id = `c${state.chapter}-${blockTitle}-${entry.label}-${index}`;
        const checked = checks[id] ? "checked" : "";
        return checkable ? `<li class="question-item">
          <span class="question-text">${escapeHtml(item)}</span>
          <input class="question-check" type="checkbox" data-check-id="${escapeHtml(id)}" ${checked} aria-label="标记已完成" />
        </li>` : `<li class="plain-list-item">${escapeHtml(item)}</li>`;
      }).join("")}</ol>
    </section>`;
  }
  if (entry.type === "note") {
    return `<section class="entry">
      <strong class="label">${escapeHtml(entry.label)}</strong>
      <p>${escapeHtml(entry.text)}</p>
    </section>`;
  }
  if (entry.text === "---") return "";
  return `<section class="entry"><p>${escapeHtml(entry.text)}</p></section>`;
}

function renderReferences(refs) {
  if (!refs.length) return "";
  return `<aside class="reference-panel">
    <h3>本章参考文献</h3>
    <ol class="reference-list">${refs.map((ref) => `<li>${escapeHtml(shortReference(ref))}</li>`).join("")}</ol>
  </aside>`;
}

function shortReference(ref) {
  return ref.replace(/^([^，、]+)(?:、[^，]+)*，/, "$1，");
}

function renderPurchasePanel(type = "guide") {
  const text = type === "outro"
    ? "如果这份阅读助手让你想继续慢慢看书，可以购买《画中有花朵》完整阅读。书中有更完整的图像、正文与花草线索。"
    : "欢迎把这份阅读助手当作一条小径，先从一个问题、一朵花、一幅画走进去。京东、淘宝、当当检索《画中有花朵》即可找到本书。";
  return `<section class="info-panel purchase-panel">
    <div>
      <strong>购买图书</strong>
      <p>${escapeHtml(text)}</p>
    </div>
    <img class="qr-image" src="assets/buy-qrcode.jpg" alt="购书二维码" />
  </section>`;
}

function renderCoverPanel() {
  return `<section class="cover-panel">
    <img class="cover-image" src="assets/book-cover.jpg" alt="《画中有花朵》书籍封面" />
  </section>`;
}

function renderContactPanel() {
  return `<section class="info-panel contact-panel">
    <div>
      <strong>作者公众号</strong>
      <p>如有问题，可以与作者联系。</p>
    </div>
    <img class="qr-image" src="assets/author-qrcode.jpg" alt="作者公众号二维码" />
  </section>`;
}

function renderToolNote() {
  return `<section class="tool-note">
    <p>本工具的设计初衷：这本书内容扎实丰厚，知识点来自科研文献，并交叉历史、艺术、植物、文化等多个学科；读者在阅读这样的书时，常会觉得好看，却不知道从哪里进入，也常在合上书后说不清自己读到了什么。</p>
    <p>因此，这个阅读助手希望像一次作者伴读或读书讲座，先把读者带到语境中，再逐章用问题启发阅读。带着问题翻书，注意力会自然落在有意义的地方，也更容易形成自己的理解。</p>
    <p>每个问题后的勾选框，可以为自己是否思考过这个问题做一个阅读标记。每个问题都没有正确答案，你思考过的答案就是最好的答案。</p>
  </section>`;
}

function bindChecks() {
  contentArea.querySelectorAll("[data-check-id]").forEach((box) => {
    box.addEventListener("change", () => {
      checks[box.dataset.checkId] = box.checked;
      saveChecks();
    });
  });
}

function renderGuide(kind) {
  const section = kind === "guide" ? data.guide : data.outro;
  eyebrow.textContent = kind === "guide" ? "全书导引" : "全书回想";
  title.textContent = section.title;
  meta.textContent = kind === "guide" ? data.subtitle : "花、画、人和天地之间的回望";
  document.querySelector(".section-turner").style.display = "none";

  const invitation = kind === "guide"
    ? `<section class="invitation"><p>这不是一份标准答案，而是一把慢慢看画、看花、看历史的钥匙。你可以带着问题进入每一章，也可以只停在某一朵花前，想一想它为什么会出现在那里。</p></section>`
    : "";
  const guidePanels = kind === "guide"
    ? `${renderCoverPanel()}${invitation}${renderPurchasePanel("guide")}${renderToolNote()}${renderContactPanel()}`
    : renderPurchasePanel("outro");

  contentArea.innerHTML = `${section.entries.map((entry) => renderEntry(entry, "guide", false)).join("")}${guidePanels}`;
  bindChecks();
}

function renderChapter() {
  const chapter = data.chapters[state.chapter];
  const block = currentBlock(chapter);
  const blocks = displayBlocks(chapter);

  eyebrow.textContent = `第 ${String(chapter.number).padStart(2, "0")} 章 · ${chapter.era}`;
  title.textContent = chapter.title;
  meta.textContent = [chapter.artwork, chapter.plant].filter(Boolean).join(" · ");
  sectionTabs.innerHTML = blocks.map((item, index) => `<button class="section-tab ${index === state.blockIndex ? "active" : ""}" type="button" data-section="${index}">${index + 1}. ${escapeHtml(item.title)}</button>`).join("");
  sectionTabs.querySelectorAll("[data-section]").forEach((button) => {
    button.addEventListener("click", () => {
      state.blockIndex = Number(button.dataset.section);
      renderChapter();
    });
  });
  document.querySelector(".section-turner").style.display = "grid";

  const refs = block.title === "读后联想" ? renderReferences(chapter.references) : "";
  contentArea.innerHTML = `${block.entries.map((entry) => renderEntry(entry, block.title)).join("")}${refs}`;
  contentArea.classList.remove("turning");
  void contentArea.offsetWidth;
  contentArea.classList.add("turning");
  bindChecks();
}

function render() {
  renderNav();
  if (state.view === "chapter") renderChapter();
  else renderGuide(state.view);
}

function changeSection(delta) {
  if (state.view !== "chapter") {
    state.view = "chapter";
    state.chapter = 0;
    state.blockIndex = 0;
    render();
    return;
  }
  const names = availableBlocks(data.chapters[state.chapter]);
  const next = state.blockIndex + delta;
  if (next >= 0 && next < names.length) {
    state.blockIndex = next;
  } else if (delta > 0 && state.chapter < data.chapters.length - 1) {
    state.chapter += 1;
    state.blockIndex = 0;
  } else if (delta > 0 && state.chapter === data.chapters.length - 1) {
    state.view = "outro";
    state.blockIndex = 0;
  } else if (delta < 0 && state.chapter > 0) {
    state.chapter -= 1;
    state.blockIndex = availableBlocks(data.chapters[state.chapter]).length - 1;
  }
  render();
}

document.getElementById("prevSectionBtn").addEventListener("click", () => changeSection(-1));
document.getElementById("nextSectionBtn").addEventListener("click", () => changeSection(1));

render();
