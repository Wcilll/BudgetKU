const backHomeBtn = document.querySelector("#budget-detail button.back-home");
const budgetPage = document.querySelector("#budget");
const detailPage = document.querySelector("#budget-detail");
const budgetCards = document.querySelectorAll("#budget .budget-card");

backHomeBtn.addEventListener("click", () => {
  detailPage.classList.add("hidden");
  budgetPage.classList.remove("hidden");
});

budgetCards.forEach((card) => {
  card.addEventListener("click", () => {
    budgetPage.classList.add("hidden");
    detailPage.classList.remove("hidden");
  });
});
