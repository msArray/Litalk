const d = [document, "querySelectorAll"];
d[0][d[1]]("button").forEach((e, i) => {
  console.log(e);
  e.addEventListener("click", () => localStorage.setItem("key" + i, d[0][d[1]]("input")[i].value));
});
