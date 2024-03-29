const d = document;
const t = ["addEventListener", "querySelector"];
var n = "";
var z = "";
const p = (q) => {
  if (q.tagName == "SECTION") {
    return q;
  } else {
    return p(q.parentElement);
  }
};
const c = (e) => {
  u.style.display = "flex";
  u.style.left = e.clientX + "px";
  u.style.top = e.clientY + "px";
  z = p(e.target.parentElement).id;
  n = p(e.target.parentElement)[t[1] + "All"]("p")[1].innerText;
};
d.body[t[0]]("contextmenu", (e) => {
  e.preventDefault();
});
const g = (m) => {
  let s = m;
  const x = m.match(/\|\>([0-9a-z]{8})\<\|/g);
  if (x == null) return m;
  x.forEach((e) => {
    s = s.replace(e, `<a href="#${e.slice(2, 10)}">${e}</a>`);
  });
  return s;
};
fetch(DB_URL)
  .then((res) => res.json())
  .then((data) => {
    data.forEach((item) => {
      const sec = d.createElement("section");
      sec.setAttribute("id", item.id);
      sec.innerHTML = `<p>${r.getFullYear()}/${r.getMonth()}/${r.getDate()} ${r.getHours()}:${r.getMinutes()}:${r.getSeconds()}.${r.getMilliseconds()}</p><p>${g(
        item.message
      )}</p>`;
      if (item.id != "server") sec[t[0]]("contextmenu", c);
      d[t[1]]("main").appendChild(sec);
    });
  });

const ws = new WebSocket(WS_URL);
const i = d[t[1]]("input");
const b = d[t[1]]("button");
const l = d[t[1] + "All"]("li");

l[0][t[0]]("click", () => {
  i.value = "|>" + z + "<|" + i.value;
});
l[1][t[0]]("click", (e) => {
  if (n != "") navigator.clipboard.writeText(n);
});
i[t[0]]("input", () => {
  b.disabled = !i.value;
});
b[t[0]]("click", () => {
  ws.send(i.value);
  i.value = "";
  b.disabled = true;
});
const u = d[t[1]]("ul");
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  const sec = d.createElement("section");
  sec.setAttribute("id", data.id);
  const r = new Date(data.time);
  sec.innerHTML = `<p>${r.getFullYear()}/${r.getMonth()}/${r.getDate()} ${r.getHours()}:${r.getMinutes()}:${r.getSeconds()}.${r.getMilliseconds()}</p><p>${g(
    data.message
  )}</p>`;
  if (data.id != "server") sec[t[0]]("contextmenu", c);
  d[t[1]]("main").appendChild(sec);
};
d.body[t[0]]("click", () => {
  u.style.display = "none";
});
