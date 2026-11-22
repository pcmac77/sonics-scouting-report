# Sonics · After the Buzzer

A bilingual, full-screen basketball playground. Spin a procedural 3D basketball, tap to bounce, or take the three-bucket shooting challenge.

- Drag the ball to spin; tap to bounce.
- Choose **Take your shot**, then swipe straight upward. A medium swipe travels to the rim.
- The Shoot button and Space key provide an accessible straight shot. Escape returns to the playground.
- Three baskets trigger the arena celebration. Play again resets all scores.
- Sound is synthesized locally and starts muted. Idle motion can be paused and respects reduced-motion preferences.
- A lightweight quick-shot mode is available if WebGL is unavailable.

No player records, names, photos, rosters, accounts, analytics, external fonts or saved scores. No tournament feeds or scheduled data collection. Textures and sound are generated in the browser; runtime assets are served from this site. Scores exist only in memory and reset on reload. Old scouting browser preferences are removed on first visit.

## Develop

```sh
npm ci
npm run dev
node --test tests/game.test.mjs
npm run build
```

Node 22.12+; Vite, React and Three.js. GitHub Actions publishes `dist/` to the existing GitHub Pages address on pushes to main or manual runs. There is no scheduled workflow.

## 中文

全螢幕 Sonics 籃球樂園：拖曳旋轉、輕點彈跳，或挑戰投進三球。音效預設關閉，可暫停待機動畫。無球員個資、無帳號、無追蹤、無儲存分數；重新整理即重設。
