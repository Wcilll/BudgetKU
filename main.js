const backHomeBtn = document.querySelector("#budget-detail button.back-home");
const budgetPage = document.querySelector("#budget");
const detailPage = document.querySelector("#budget-detail");
// container untuk menampilkan kartu budget (main#budget)
const budgetsContainer = document.querySelector("#budget");

// tombol
const budgetBtn = document.querySelector(".budget-button");
const spentBtn = document.querySelector(".spent-button");

// modal
const addForm = document.querySelector("#add-form");
const spentForm = document.querySelector("#spent-form");
const closeIcons = document.querySelectorAll(".modal .ph-x");

// navigasi back
backHomeBtn.addEventListener("click", () => {
  detailPage.classList.add("hidden");
  budgetPage.classList.remove("hidden");
});

// (kartu sekarang dibuat secara dinamis oleh renderBudgets)

// buka modal pemasukan
budgetBtn.addEventListener("click", () => {
  // creating new budget (clear edit state)
  editingBudgetId = null;
  addForm.classList.remove("hidden");
});

// buka modal pengeluaran
spentBtn.addEventListener("click", () => {
  // preparing to add new expense
  editingExpenseId = null;
  spentForm.classList.remove("hidden");
});

// close modal (X)
closeIcons.forEach((icon) => {
  icon.addEventListener("click", () => {
    icon.closest(".modal").classList.add("hidden");
  });
});

// edit budget via pencil icon in detail view
const detailEditIcon = detailPage.querySelector(".icon");
if (detailEditIcon) {
  // pencil: edit budget
  detailEditIcon.addEventListener("click", () => {
    if (!currentBudgetId) return;
    const b = budgetsData.find((x) => x.id === currentBudgetId);
    if (!b) return;
    // set edit mode and prefill form
    editingBudgetId = b.id;
    const form = document.querySelector("#add-form form");
    if (form) {
      const nameInput = form.querySelector('input[name="name-budget"]');
      const amountInput = form.querySelector('input[name="total"]');
      if (nameInput) nameInput.value = b.name;
      if (amountInput) amountInput.value = b.amount;
      document.querySelector("#add-form").classList.remove("hidden");
    }
  });

  // add delete button next to pencil (if not already present)
  if (!detailEditIcon.querySelector(".budget-delete")) {
    const delBtn = document.createElement("button");
    // delBtn.type = "button";
    // delBtn.className = "budget-delete";
    // delBtn.title = "Hapus Budget";
    // delBtn.style.marginLeft = "0.5rem";
    // // delBtn.textContent = "";
    // detailEditIcon.appendChild(delBtn);

    delBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (!currentBudgetId) return;
      const bIndex = budgetsData.findIndex((x) => x.id === currentBudgetId);
      if (bIndex === -1) return;
      const ok = confirm("Yakin ingin menghapus budget ini?");
      if (!ok) return;
      // remove budget
      budgetsData.splice(bIndex, 1);
      saveBudgetsToStorage(budgetsData);
      // reset view
      currentBudgetId = null;
      editingBudgetId = null;
      if (detailPage) detailPage.classList.add("hidden");
      if (budgetPage) budgetPage.classList.remove("hidden");
      renderBudgets(budgetsData);
      showToast("Budget dihapus", { duration: 1800 });
    });
  }
}

//local storage
localStorage.setItem("name", "Budgetku");
localStorage.getItem("name");

function getFormValues(formData) {
  let result = new Object();

  for (const data of formData.entries()) {
    const [name, value] = data;

    Object.assign(result, { [name]: value });
  }
  return result;
}
// ------------------ Budgets: load / render / detail ------------------
// in-memory state
let budgetsData = [];
let currentBudgetId = null;
let editingBudgetId = null;
let editingExpenseId = null;

// format number as Indonesian Rupiah (no decimals)
function formatRupiah(value) {
  const n = Number(value) || 0;
  return "Rp " + n.toLocaleString("id-ID");
}

function sumSpents(spents) {
  if (!Array.isArray(spents)) return 0;
  return spents.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
}

async function fetchBudgetsFromFile() {
  try {
    const res = await fetch("data.json", { cache: "no-store" });
    if (!res.ok) throw new Error("fetch failed");
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    // normalize file structure to internal shape
    return data.map((d, i) => ({
      id: Date.now() + i,
      name: d.nama_budget || d.name || "Untitled",
      amount: Number(d.total_budget ?? d.amount ?? 0),
      spents: Array.isArray(d.pengeluaran)
        ? d.pengeluaran.map((p) => ({
            name: p.nama_pengeluaran || p.name || "-",
            date: p.tanggal || p.date || "",
            amount: Number(p.jumlah_pengeluaran ?? p.amount ?? 0),
          }))
        : [],
      raw: d,
    }));
  } catch (err) {
    // fetch often fails on file://; silently return empty to fallback to storage
    return [];
  }
}

function loadBudgetsFromStorage() {
  try {
    const raw = localStorage.getItem("budgets");
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("failed parse budgets from storage", err);
    return [];
  }
}

function saveBudgetsToStorage(list) {
  try {
    localStorage.setItem("budgets", JSON.stringify(list));
  } catch (err) {
    console.error("failed save budgets", err);
  }
}

function clearBudgetCards() {
  // remove existing .budget-card children inside main#budget
  budgetsContainer.querySelectorAll(".budget-card").forEach((n) => n.remove());
  // remove any empty message
  const empty = budgetsContainer.querySelector(".no-budgets");
  if (empty) empty.remove();
}

function renderBudgets(list) {
  if (!budgetsContainer) return;

  // keep in-memory copy in sync
  budgetsData = list || [];

  // keep reference to add button so we can insert before it
  const addBtn = budgetsContainer.querySelector(".budget-button");

  clearBudgetCards();

  if (!list || list.length === 0) {
    const el = document.createElement("div");
    el.className = "no-budgets";
    el.style.opacity = ".6";
    el.style.padding = "1rem";
    el.style.textAlign = "center";
    el.textContent = "Tidak ada budget. Klik + untuk menambahkan.";
    budgetsContainer.insertBefore(el, addBtn || null);
    // show budgets page
    if (budgetPage) budgetPage.classList.remove("hidden");
    return;
  }

  list.forEach((b) => {
    const card = document.createElement("div");
    card.className = "budget-card";
    card.dataset.id = b.id;
    const spentSum = sumSpents(b.spents);
    const remaining = Number(b.amount || 0) - spentSum;
    card.innerHTML = `
      <h2 class="budget-name">${b.name}</h2>
      <p class="budget-amount">${formatRupiah(b.amount)}</p>
      <p class="budget-total">Sisa ${formatRupiah(remaining)}</p>
    `;

    card.addEventListener("click", () => {
      // show detail page and populate
      if (budgetPage) budgetPage.classList.add("hidden");
      if (detailPage) detailPage.classList.remove("hidden");
      // set active budget id and populate
      currentBudgetId = b.id;
      populateDetail(b);
    });

    budgetsContainer.insertBefore(card, addBtn || null);
  });

  // ensure budgets page visible
  // Note: do not forcibly show the budgets page here — navigation should be
  // controlled by explicit actions (clicks, deletes, etc.). This prevents
  // renderBudgets from interrupting the current detail view when called
  // after adding/deleting expenses.
}

function populateDetail(budget) {
  if (!detailPage || !budget) return;
  const nameEl = detailPage.querySelector(".budget-name");
  const amountEl = detailPage.querySelector(".budget-amount");
  const totalEl = detailPage.querySelector(".budget-total");
  const spentListEl = detailPage.querySelector(".spent-list");

  const spentSum = sumSpents(budget.spents);
  const remaining = Number(budget.amount || 0) - spentSum;

  if (nameEl) nameEl.textContent = budget.name;
  if (amountEl) amountEl.textContent = formatRupiah(budget.amount);
  if (totalEl) totalEl.textContent = `Sisa ${formatRupiah(remaining)}`;

  // clear spent list
  if (spentListEl) {
    spentListEl.innerHTML = "";
    const spents = Array.isArray(budget.spents) ? [...budget.spents] : [];

    if (spents.length === 0) {
      const msg = document.createElement("div");
      msg.style.opacity = ".6";
      msg.style.padding = "1rem";
      msg.style.textAlign = "center";
      msg.textContent = "Belum ada pengeluaran untuk budget ini.";
      spentListEl.appendChild(msg);
    } else {
      // determine sort option from select in detail view
      const sortSelect = detailPage.querySelector(".spent-sort select");
      const sortVal = sortSelect ? sortSelect.value : "latest";

      // apply sorting
      let sorted = spents.slice();
      switch (sortVal) {
        case "name":
          sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
          break;
        case "smallest":
          sorted.sort(
            (a, b) => (Number(a.amount) || 0) - (Number(b.amount) || 0)
          );
          break;
        case "largest":
          sorted.sort(
            (a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0)
          );
          break;
        case "latest":
        default:
          // latest by date (most recent first)
          sorted.sort((a, b) => {
            const da = a.date ? new Date(a.date).getTime() : 0;
            const db = b.date ? new Date(b.date).getTime() : 0;
            return db - da;
          });
          break;
      }

      // render each expense
      sorted.forEach((s) => {
        const row = document.createElement("div");
        row.className = "spent-detail";
        row.dataset.id = s.id;
        row.innerHTML = `
          <div class="spent-date">
            <h4>${s.name}</h4>
            <p>${s.date || ""}</p>
          </div>
          <div class="spent-nominal">
            <p>${formatRupiah(s.amount)}</p>
          </div>
          <div class="spent-actions">
            <button class="spent-edit" title="Edit"><i class="ph ph-pencil-simple-line"></i></button>
            <button class="spent-delete" title="Hapus"><i class="ph ph-trash"></i></button>
          </div>
        `;
        spentListEl.appendChild(row);
      });

      // attach handlers for edit/delete
      spentListEl.querySelectorAll(".spent-delete").forEach((btn) => {
        btn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          const row = btn.closest(".spent-detail");
          if (!row) return;
          const id = Number(row.dataset.id);
          const bIdx = budgetsData.findIndex((x) => x.id === budget.id);
          if (bIdx === -1) return;
          const spIdx = (budgetsData[bIdx].spents || []).findIndex(
            (p) => p.id === id
          );
          if (spIdx === -1) return;
          // remove expense
          budgetsData[bIdx].spents.splice(spIdx, 1);
          saveBudgetsToStorage(budgetsData);
          populateDetail(budgetsData[bIdx]);
          renderBudgets(budgetsData);
          showToast("Pengeluaran dihapus", { duration: 1400 });
        });
      });

      spentListEl.querySelectorAll(".spent-edit").forEach((btn) => {
        btn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          const row = btn.closest(".spent-detail");
          if (!row) return;
          const id = Number(row.dataset.id);
          const bIdx = budgetsData.findIndex((x) => x.id === budget.id);
          if (bIdx === -1) return;
          const sp = (budgetsData[bIdx].spents || []).find((p) => p.id === id);
          if (!sp) return;
          // prefill spent form
          editingExpenseId = sp.id;
          const sf = document.querySelector("#spent-form form");
          if (sf) {
            const nameInput = sf.querySelector('input[type="text"]');
            const amountInput = sf.querySelector('input[type="number"]');
            const dateInput = sf.querySelector('input[type="date"]');
            if (nameInput) nameInput.value = sp.name || "";
            if (amountInput) amountInput.value = sp.amount || 0;
            if (dateInput) dateInput.value = sp.date || "";
            document.querySelector("#spent-form").classList.remove("hidden");
          }
        });
      });
    }
  }
}

// initialize: try storage first, fallback to data.json
(async function init() {
  let budgets = loadBudgetsFromStorage();
  if (!budgets || budgets.length === 0) {
    const fromFile = await fetchBudgetsFromFile();
    budgets = fromFile;
    // persist the initial file data into localStorage so subsequent runs
    // use the browser's saved copy and changes are preserved locally
    if (Array.isArray(fromFile) && fromFile.length > 0) {
      try {
        saveBudgetsToStorage(fromFile);
        // brief feedback to the user
        showToast("Data awal diimpor ke localStorage", { duration: 1600 });
      } catch (err) {
        console.error("failed to persist initial data", err);
      }
    }
  }
  // keep in-memory state
  budgetsData = budgets;
  renderBudgets(budgetsData);
})();
// wire sort select to re-render expenses when changed
(function wireSortSelect() {
  const sortSelect = document.querySelector(
    "#budget-detail .spent-sort select"
  );
  if (!sortSelect) return;
  sortSelect.addEventListener("change", () => {
    if (!currentBudgetId) return;
    const b = budgetsData.find((x) => x.id === currentBudgetId);
    if (!b) return;
    populateDetail(b);
  });
})();
// small toast helper for success messages
function showToast(message, { duration = 2500, type = "success" } = {}) {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // trigger show transition
  requestAnimationFrame(() => toast.classList.add("show"));

  // remove after duration
  setTimeout(() => {
    toast.classList.remove("show");
    toast.addEventListener(
      "transitionend",
      () => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      },
      { once: true }
    );
  }, duration);
}

// fungsi tambah budget (wire up form submit)
const addFormElement = document.querySelector("#add-form form");
if (addFormElement) {
  addFormElement.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = getFormValues(new FormData(e.target));
    // data keys from form: 'name-budget' and 'total'
    const name = data["name-budget"] ? data["name-budget"].trim() : "";
    const amount = Number(data["total"] || 0);

    if (editingBudgetId) {
      // update existing budget
      const idx = budgetsData.findIndex((b) => b.id === editingBudgetId);
      if (idx !== -1) {
        budgetsData[idx].name = name || budgetsData[idx].name;
        budgetsData[idx].amount = amount || budgetsData[idx].amount;
        saveBudgetsToStorage(budgetsData);
        renderBudgets(budgetsData);
        // if user is viewing this budget, refresh detail view too
        if (currentBudgetId === editingBudgetId)
          populateDetail(budgetsData[idx]);
        showToast("Budget diperbarui", { duration: 1600 });
      }
      editingBudgetId = null;
    } else {
      // create new budget
      const newBudget = {
        id: Date.now(),
        name: name || "Untitled",
        amount: amount || 0,
        spents: [],
      };
      budgetsData.push(newBudget);
      saveBudgetsToStorage(budgetsData);
      renderBudgets(budgetsData);
      showToast("Budget tersimpan", { duration: 1600 });
    }

    // close modal and reset
    const addModal = document.querySelector("#add-form");
    if (addModal) addModal.classList.add("hidden");
    e.target.reset();
  });
}

// ---- expenses: wire up spent form to add expense to current budget ----
const spentFormElement = document.querySelector("#spent-form form");
if (spentFormElement) {
  spentFormElement.addEventListener("submit", (e) => {
    e.preventDefault();

    // gather values from inputs (form inputs in index.html don't have names)
    const form = e.target;
    const nameInput = form.querySelector('input[type="text"]');
    const amountInput = form.querySelector('input[type="number"]');
    const dateInput = form.querySelector('input[type="date"]');

    const name = nameInput ? nameInput.value.trim() : "";
    const amount = amountInput ? Number(amountInput.value || 0) : 0;
    const date = dateInput
      ? dateInput.value
      : new Date().toISOString().slice(0, 10);

    if (!currentBudgetId) {
      showToast("Pilih budget terlebih dahulu", {
        duration: 2000,
        type: "error",
      });
      return;
    }

    // find budget in memory
    const idx = budgetsData.findIndex((b) => b.id === currentBudgetId);
    if (idx === -1) {
      showToast("Budget tidak ditemukan", { duration: 2000, type: "error" });
      return;
    }

    const expense = {
      id: Date.now(),
      name: name || "Pengeluaran",
      amount: amount || 0,
      date: date,
    };

    // ensure spents array
    budgetsData[idx].spents = budgetsData[idx].spents || [];

    if (editingExpenseId) {
      // update existing expense
      const ei = budgetsData[idx].spents.findIndex(
        (s) => s.id === editingExpenseId
      );
      if (ei !== -1) {
        budgetsData[idx].spents[ei].name = expense.name;
        budgetsData[idx].spents[ei].amount = expense.amount;
        budgetsData[idx].spents[ei].date = expense.date;
        showToast("Pengeluaran diperbarui", { duration: 1600 });
      }
      editingExpenseId = null;
    } else {
      budgetsData[idx].spents.push(expense);
      showToast("Pengeluaran tersimpan", { duration: 1600 });
    }

    // persist and update UI
    saveBudgetsToStorage(budgetsData);
    populateDetail(budgetsData[idx]);
    renderBudgets(budgetsData);

    // feedback and close
    const spentModal = document.querySelector("#spent-form");
    if (spentModal) spentModal.classList.add("hidden");
    form.reset();
  });
}
