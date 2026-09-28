import { firebaseConfig, playlists, songs, links } from "./config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, push, set, onValue, onDisconnect }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const $ = (id) => document.getElementById(id);
let cur = 0, playing = false;

/* ---------- static content ---------- */
$("spotify").href = links.spotify;
$("ytm").href = links.ytmusic;
$("wa").href = links.whatsapp;
$("mail").href = "mailto:" + links.email;
$("mail").textContent = links.email;
$("songs").innerHTML = songs.map(s => `<tr><td>${s[0]}</td><td>${s[1]}</td></tr>`).join("");

const rot = $("rot");
playlists.forEach((p, i) => {
  const b = document.createElement("button");
  b.innerHTML = `<b>${p.name}</b><span>${p.desc}</span>`;
  b.onclick = () => { cur = i; mark(); play(true); };
  rot.appendChild(b);
});
function mark() { [...rot.children].forEach((b, i) => b.classList.toggle("on", i === cur)); }
mark();

/* ---------- player ---------- */
function ui() {
  $("pp").textContent = playing ? "❚❚" : "▶";
  $("pp").setAttribute("aria-label", playing ? "Pause" : "Play");
  $("hp").textContent = playing ? "Radio band karo" : "Radio chalao";
  $("tt").textContent = playing ? "Nukkad FM · " + playlists[cur].name : "Nukkad FM";
  $("ts").textContent = playing ? "Abhi baj raha hai" : "Tune in karne ke liye play dabao";
}
function play(force) {
  const id = playlists[cur].id;
  if (!id) { $("ts").textContent = "config.js mein YouTube playlist ID daalo"; return; }
  if (playing && !force) { $("yt").src = "about:blank"; playing = false; ui(); return; }
  $("yt").src = "https://www.youtube.com/embed/videoseries?list=" + encodeURIComponent(id) + "&autoplay=1&loop=1";
  playing = true; ui();
}
$("pp").onclick = () => play(false);
$("hp").onclick = () => play(false);

/* ---------- live listener count (Firebase Realtime Database) ---------- */
try {
  if (firebaseConfig.apiKey.startsWith("YOUR_")) throw new Error("no config");
  const db = getDatabase(initializeApp(firebaseConfig));
  const me = push(ref(db, "listeners"));               // har visitor ka ek entry
  onValue(ref(db, ".info/connected"), (snap) => {
    if (snap.val() === true) {
      onDisconnect(me).remove();                        // tab band = entry delete
      set(me, { t: Date.now() });
    }
  });
  onValue(ref(db, "listeners"), (snap) => {
    const n = snap.exists() ? Object.keys(snap.val()).length : 0;
    $("live").textContent = n + (n === 1 ? " listener" : " listeners") + " abhi sun rahe hain";
  });
} catch (e) {
  $("live").textContent = "on air";                     // Firebase set nahi hua
}
