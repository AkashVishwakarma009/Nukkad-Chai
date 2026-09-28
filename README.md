# Nukkad FM

## Setup (10 minute)
1. https://console.firebase.google.com par naya project banao.
2. Build > **Realtime Database** > Create database (test mode ya rules niche wale).
3. Project settings > Your apps > **Web (</>)** app add karo, aur config `config.js` mein paste karo
   (`databaseURL` zaroor check karo).
4. Realtime Database > Rules mein `database.rules.json` ka content paste karo.
5. `config.js` mein apni YouTube playlist IDs, songs, WhatsApp link aur email daalo.

## Chalane ke liye
ES modules use hote hain, isliye file double-click karke nahi, server se kholo:
    npx serve .        (ya)   python3 -m http.server

## Deploy (free)
    npm i -g firebase-tools
    firebase login
    firebase init      # Hosting + Database, existing project chuno
    firebase deploy
(Netlify / Vercel / GitHub Pages par bhi folder seedha upload ho jata hai.)
