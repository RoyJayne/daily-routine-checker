const STORAGE_KEYS = {
  routine: "dailyRoutine.tasks.v1",
  completions: "dailyRoutine.completions.v1",
  taskArchive: "dailyRoutine.taskArchive.v1",
};

const els = {
  todayDate: document.querySelector("#todayDate"),
  routineList: document.querySelector("#routineList"),
  emptyState: document.querySelector("#emptyState"),
  manageButton: document.querySelector("#manageButton"),
  historyButton: document.querySelector("#historyButton"),
  emptyAddButton: document.querySelector("#emptyAddButton"),
  modalBackdrop: document.querySelector("#modalBackdrop"),
  closeModalButton: document.querySelector("#closeModalButton"),
  taskForm: document.querySelector("#taskForm"),
  taskInput: document.querySelector("#taskInput"),
  managerList: document.querySelector("#managerList"),
  routineCount: document.querySelector("#routineCount"),
  progressText: document.querySelector("#progressText"),
  progressPercent: document.querySelector("#progressPercent"),
  progressBar: document.querySelector("#progressBar"),
  exportButton: document.querySelector("#exportButton"),
  importInput: document.querySelector("#importInput"),
  statusMessage: document.querySelector("#statusMessage"),
  historyBackdrop: document.querySelector("#historyBackdrop"),
  closeHistoryButton: document.querySelector("#closeHistoryButton"),
  historyList: document.querySelector("#historyList"),
  historyDays: document.querySelector("#historyDays"),
  historyTotal: document.querySelector("#historyTotal"),
  taskTemplate: document.querySelector("#taskTemplate"),
  managerTaskTemplate: document.querySelector("#managerTaskTemplate"),
};

let tasks = loadRoutine();
let completions = loadCompletions();
let taskArchive = loadTaskArchive();
syncTaskArchive();

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function completionIdsForDate(dateKey) {
  const entries = completions[dateKey] || [];
  return new Set(
    entries
      .map((entry) => (typeof entry === "string" ? entry : entry?.id))
      .filter(Boolean)
  );
}

function todayCompletedIds() {
  return completionIdsForDate(localDateKey());
}

function loadRoutine() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.routine));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function loadCompletions() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.completions));
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

function loadTaskArchive() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.taskArchive));
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

function syncTaskArchive() {
  let changed = false;

  tasks.forEach((task) => {
    if (task && task.id && task.name && taskArchive[task.id] !== task.name) {
      taskArchive[task.id] = task.name;
      changed = true;
    }
  });

  if (changed) saveTaskArchive();
}

function saveRoutine() {
  localStorage.setItem(STORAGE_KEYS.routine, JSON.stringify(tasks));
}

function saveCompletions() {
  localStorage.setItem(STORAGE_KEYS.completions, JSON.stringify(completions));
}

function saveTaskArchive() {
  localStorage.setItem(STORAGE_KEYS.taskArchive, JSON.stringify(taskArchive));
}

function createId() {
  if (window.crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function setDateLabel() {
  const now = new Date();
  els.todayDate.textContent = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(now);
}

function render() {
  syncTaskArchive();
  renderRoutine();
  renderManager();
  renderProgress();
  renderHistory();
}

function renderRoutine() {
  els.routineList.innerHTML = "";
  els.emptyState.classList.toggle("hidden", tasks.length !== 0);

  const done = todayCompletedIds();

  tasks.forEach((task) => {
    const node = els.taskTemplate.content.cloneNode(true);
    const button = node.querySelector(".routine-item");
    const name = node.querySelector(".task-name");
    const status = node.querySelector(".task-status");
    const isComplete = done.has(task.id);

    name.textContent = task.name;
    status.textContent = isComplete ? "Complete" : "Not complete";
    button.classList.toggle("complete", isComplete);
    button.setAttribute("aria-pressed", String(isComplete));
    button.setAttribute(
      "aria-label",
      `${task.name}. ${isComplete ? "Complete" : "Not complete"}. Click to toggle.`
    );

    button.addEventListener("click", () => toggleTask(task.id));

    els.routineList.appendChild(node);
  });
}

function renderProgress() {
  const done = todayCompletedIds();
  const completedCount = tasks.filter((task) => done.has(task.id)).length;
  const total = tasks.length;
  const percentage = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  els.progressText.textContent = `${completedCount} / ${total} complete`;
  els.progressPercent.textContent = `${percentage}%`;
  els.progressBar.style.width = `${percentage}%`;
}

function renderManager() {
  els.managerList.innerHTML = "";
  els.routineCount.textContent = `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;

  if (tasks.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted small";
    empty.textContent = "Your routine is empty.";
    els.managerList.appendChild(empty);
    return;
  }

  tasks.forEach((task, index) => {
    const node = els.managerTaskTemplate.content.cloneNode(true);
    node.querySelector(".manager-task-name").textContent = task.name;

    const up = node.querySelector(".move-up");
    const down = node.querySelector(".move-down");
    const remove = node.querySelector(".delete-button");

    up.disabled = index === 0;
    down.disabled = index === tasks.length - 1;

    up.addEventListener("click", () => moveTask(index, index - 1));
    down.addEventListener("click", () => moveTask(index, index + 1));
    remove.addEventListener("click", () => deleteTask(task.id));

    els.managerList.appendChild(node);
  });
}


function resolveTaskName(entry) {
  if (entry && typeof entry === "object" && typeof entry.name === "string") {
    return entry.name;
  }

  const id = typeof entry === "string" ? entry : entry?.id;
  if (!id) return null;

  return taskArchive[id] || tasks.find((task) => task.id === id)?.name || null;
}

function formatHistoryDate(dateKey) {
  const parts = dateKey.split("-").map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);

  const today = localDateKey();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = localDateKey(yesterdayDate);

  const formatted = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);

  if (dateKey === today) return `Today · ${formatted}`;
  if (dateKey === yesterday) return `Yesterday · ${formatted}`;
  return formatted;
}

function renderHistory() {
  if (!els.historyList) return;

  els.historyList.innerHTML = "";

  const days = Object.keys(completions)
    .filter((dateKey) => Array.isArray(completions[dateKey]) && completions[dateKey].length > 0)
    .sort((a, b) => b.localeCompare(a));

  const totalCompletions = days.reduce(
    (total, dateKey) => total + (completions[dateKey]?.length || 0),
    0
  );

  els.historyDays.textContent = String(days.length);
  els.historyTotal.textContent = String(totalCompletions);

  if (days.length === 0) {
    const empty = document.createElement("div");
    empty.className = "history-empty";
    empty.innerHTML = "<strong>No completed tasks yet.</strong><br>Your completed tasks will appear here by day.";
    els.historyList.appendChild(empty);
    return;
  }

  days.forEach((dateKey) => {
    const entries = completions[dateKey] || [];
    const names = entries
      .map(resolveTaskName)
      .filter(Boolean);

    const day = document.createElement("section");
    day.className = "history-day";

    const header = document.createElement("div");
    header.className = "history-day-header";

    const date = document.createElement("div");
    date.className = "history-date";
    date.textContent = formatHistoryDate(dateKey);

    const count = document.createElement("div");
    count.className = "history-count";
    count.textContent = `${names.length} ${names.length === 1 ? "task" : "tasks"}`;

    header.append(date, count);

    const list = document.createElement("ul");
    list.className = "history-tasks";

    names.forEach((name) => {
      const item = document.createElement("li");
      item.className = "history-task";
      item.textContent = name;
      list.appendChild(item);
    });

    day.append(header, list);
    els.historyList.appendChild(day);
  });
}

function openHistory() {
  renderHistory();
  els.historyBackdrop.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeHistory() {
  els.historyBackdrop.classList.add("hidden");
  document.body.style.overflow = "";
}

function toggleTask(id) {
  const key = localDateKey();
  const existing = Array.isArray(completions[key]) ? completions[key] : [];
  const done = completionIdsForDate(key);

  if (done.has(id)) {
    completions[key] = existing.filter((entry) => {
      const entryId = typeof entry === "string" ? entry : entry?.id;
      return entryId !== id;
    });
  } else {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;

    taskArchive[id] = task.name;
    saveTaskArchive();

    completions[key] = [
      ...existing,
      { id: task.id, name: task.name },
    ];
  }

  saveCompletions();
  renderRoutine();
  renderProgress();
  renderHistory();
}

function addTask(name) {
  const cleanName = name.trim();
  if (!cleanName) return;

  tasks.push({
    id: createId(),
    name: cleanName,
  });

  taskArchive[tasks[tasks.length - 1].id] = tasks[tasks.length - 1].name;
  saveRoutine();
  saveTaskArchive();
  els.taskInput.value = "";
  setStatus(`Added "${cleanName}".`);
  render();
  els.taskInput.focus();
}

function deleteTask(id) {
  const target = tasks.find((task) => task.id === id);
  tasks = tasks.filter((task) => task.id !== id);

  // Keep past completion history even if a routine item is deleted.
  saveRoutine();
  saveTaskArchive();
  setStatus(target ? `Deleted "${target.name}".` : "Task deleted.");
  render();
}

function moveTask(from, to) {
  if (to < 0 || to >= tasks.length) return;
  const [task] = tasks.splice(from, 1);
  tasks.splice(to, 0, task);
  saveRoutine();
  render();
}

function openModal() {
  els.modalBackdrop.classList.remove("hidden");
  document.body.style.overflow = "hidden";
  setTimeout(() => els.taskInput.focus(), 0);
}

function closeModal() {
  els.modalBackdrop.classList.add("hidden");
  document.body.style.overflow = "";
  setStatus("");
}

function setStatus(message) {
  els.statusMessage.textContent = message;
}

function exportRoutine() {
  const payload = {
    app: "Daily Routine",
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `daily-routine-${localDateKey()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  setStatus("Routine exported.");
}

async function importRoutine(file) {
  if (!file) return;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const imported = Array.isArray(parsed) ? parsed : parsed.tasks;

    if (!Array.isArray(imported)) {
      throw new Error("No task list found.");
    }

    const validTasks = imported
      .map((item) => {
        if (typeof item === "string") {
          return { id: createId(), name: item.trim() };
        }

        if (item && typeof item.name === "string") {
          return {
            id: typeof item.id === "string" && item.id ? item.id : createId(),
            name: item.name.trim(),
          };
        }

        return null;
      })
      .filter((item) => item && item.name);

    tasks = validTasks;
    completions = {};
    taskArchive = {};
    syncTaskArchive();
    saveRoutine();
    saveCompletions();
    saveTaskArchive();
    render();
    setStatus(`Imported ${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}.`);
  } catch (error) {
    setStatus("Could not import that file. Please use a valid routine JSON file.");
  } finally {
    els.importInput.value = "";
  }
}

els.manageButton.addEventListener("click", openModal);
els.historyButton.addEventListener("click", openHistory);
els.emptyAddButton.addEventListener("click", openModal);
els.closeModalButton.addEventListener("click", closeModal);
els.closeHistoryButton.addEventListener("click", closeHistory);

els.modalBackdrop.addEventListener("click", (event) => {
  if (event.target === els.modalBackdrop) closeModal();
});

els.historyBackdrop.addEventListener("click", (event) => {
  if (event.target === els.historyBackdrop) closeHistory();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  if (!els.historyBackdrop.classList.contains("hidden")) {
    closeHistory();
  } else if (!els.modalBackdrop.classList.contains("hidden")) {
    closeModal();
  }
});

els.taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTask(els.taskInput.value);
});

els.exportButton.addEventListener("click", exportRoutine);
els.importInput.addEventListener("change", () => {
  importRoutine(els.importInput.files?.[0]);
});

setDateLabel();
render();

// If the page remains open past midnight, refresh the date and daily completion UI.
setInterval(() => {
  setDateLabel();
  renderRoutine();
  renderProgress();
  renderHistory();
}, 60_000);
