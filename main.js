const backHomeBtn = document.querySelector("#budget-detail button.back-home");
const budgetPage = document.querySelector("#budget");
const detailPage = document.querySelector("#budget-detail");
const budgetCards = document.querySelectorAll("#budget .budget-card");

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

// klik tiap card
budgetCards.forEach((card) => {
  card.addEventListener("click", () => {
    budgetPage.classList.add("hidden");
    detailPage.classList.remove("hidden");
  });
});

// buka modal pemasukan
budgetBtn.addEventListener("click", () => {
  addForm.classList.remove("hidden");
});

// buka modal pengeluaran
spentBtn.addEventListener("click", () => {
  spentForm.classList.remove("hidden");
});

// close modal (X)
closeIcons.forEach((icon) => {
  icon.addEventListener("click", () => {
    icon.closest(".modal").classList.add("hidden");
  });
});

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
//fungsi tambah budget
document.querySelector("#add-form form").addEventListener("submit", (e) => {
  e.preventDefault();
  const data = getFormValues(new FormData(e.target));

  console.log("data:", data);
});
