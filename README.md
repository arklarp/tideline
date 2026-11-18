# tideline

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/arklarp/tideline/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/arklarp/tideline/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

A one-button swinging game across a drowning neon city. Hold to throw a line to the next mast,
release to fly, lean with the arrow keys. Every spark you carry raises the flood a little; take
thirteen and the last lighthouse burns again.

No libraries, no fonts, no image files, no network: `game/` is a canvas, a handful of ES modules
and synthesised sound, so it runs from a static file server on any desktop browser.

## Run it

```sh
node serve.ts        # or: python3 -m http.server 8080, then open /game/
```

## Screenshots

`?shot=start|play|win|lose&seed=7` freezes a deterministic frame of the game, which is how the four
images in `screenshots/` were taken. `node main.ts` stages `game/` and `screenshots/` into
`$MAKEFUN_OUTPUT_DIR` (default `/output`) and writes the entry's `dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>