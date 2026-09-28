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
  b.onclick = () => { cur = i; mark(); };
  rot.appendChild(b);
});
function mark() { [...rot.children].forEach((b, i) => b.classList.toggle("on", i === cur)); }
mark();

/* ---------- player (YouTube IFrame API) ---------- */
let player = null, dragging = false, lastVid = "", msg = "";
const fmt = (t) => { t = Math.max(0, Math.floor(t || 0)); return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"); };
const setP = (el) => el.style.setProperty("--p", ((el.value - el.min) / (el.max - el.min) * 100) + "%");

function ui() {
  $("pp").textContent = playing ? "❚❚" : "▶";
  $("pp").setAttribute("aria-label", playing ? "Pause" : "Play");
  $("hp").textContent = playing ? "Radio pause karo" : "Radio chalao";
  $("ts").textContent = msg || "Nukkad FM radio";
}

function refreshSong() {
  let d = {};
  try { d = player && player.getVideoData ? player.getVideoData() : {}; } catch (e) {}
  if (d && d.title) $("tt").textContent = d.title;
  if (d && d.video_id && d.video_id !== lastVid) {
    lastVid = d.video_id;
    $("art").src = "https://i.ytimg.com/vi/" + d.video_id + "/hqdefault.jpg";
  }
}

function tick() {
  if (!player || !player.getDuration) return;
  refreshSong();
  const dur = player.getDuration() || 0, cur = player.getCurrentTime() || 0;
  $("time").textContent = fmt(cur) + " / " + fmt(dur);
  if (!dragging && dur) { $("seek").value = cur / dur * 100; setP($("seek")); }
}
setInterval(tick, 500);

function loadYT(cb) {
  if (window.YT && window.YT.Player) return cb();
  window.onYouTubeIframeAPIReady = cb;
  const s = document.createElement("script");
  s.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(s);
}

function startPlaylist() {
  const id = playlists[cur].id;
  if (!id) { msg = "config.js mein YouTube playlist ID daalo"; ui(); return; }
  msg = ""; $("tt").textContent = "Gaana load ho raha hai...";
  loadYT(() => {
    if (player) { player.loadPlaylist({ list: id, listType: "playlist", index: 0 }); return; }
    player = new YT.Player("yt", {
      width: "200", height: "200",
      playerVars: { listType: "playlist", list: id, autoplay: 1, playsinline: 1 },
      events: {
        onReady: (e) => { e.target.setLoop(true); e.target.setVolume(+$("vol").value); e.target.playVideo(); },
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.PLAYING) playing = true;
          if (e.data === YT.PlayerState.PAUSED) playing = false;
          ui(); refreshSong();
        },
        onError: () => player.nextVideo()
      }
    });
  });
}

function toggle() {
  if (!player) { startPlaylist(); return; }
  if (playing) player.pauseVideo(); else player.playVideo();
}

mark();
[...rot.children].forEach((b, i) => { b.onclick = () => { cur = i; mark(); startPlaylist(); }; });
$("pp").onclick = toggle;
$("hp").onclick = toggle;
$("next").onclick = () => player ? player.nextVideo() : startPlaylist();
$("prev").onclick = () => player ? player.previousVideo() : startPlaylist();

const seek = $("seek"), vol = $("vol");
seek.oninput = () => { dragging = true; setP(seek); };
seek.onchange = () => {
  if (player && player.getDuration) player.seekTo(player.getDuration() * seek.value / 100, true);
  dragging = false;
};
vol.oninput = () => { setP(vol); if (player && player.setVolume) player.setVolume(+vol.value); };
setP(seek); setP(vol);
ui();

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
