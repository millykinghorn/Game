# Across the Bar

A first-person runner for iPad. Level 1: get from the street, through the courtyard and the bar, to her at the DJ booth, dodging people, puddles and flying drinks. Works offline once it's been added to the Home Screen.

## How to play
- You run forward automatically.
- Tap the **left** or **right** half of the screen to step one lane over.
- Bumping into someone or getting splashed adds **3 s**; slipping in a puddle adds **1 s**.
- On a laptop: ← / → (or A / D).

## Put it on GitHub Pages
1. Create a new repository on your personal GitHub account (e.g. `across-the-bar`).
   - On a free account, Pages only works from a **public** repo.
2. Upload everything in this folder to the repo (drag the files into **Add file → Upload files**, keeping the `js/` and `icons/` folders).
   - `preview.html` and `style-frames/` are only for design previews and can be left out.
3. Go to **Settings → Pages**, set **Source** to *Deploy from a branch*, choose `main` and `/ (root)`, and save.
4. After a minute or two the game is live at `https://<your-username>.github.io/across-the-bar/`.

## Install on the iPad (offline)
1. Open that link in **Safari** while online, and let it load fully.
2. Tap **Share → Add to Home Screen**.
3. Open it from the new icon. From now on it works in aeroplane mode too.

## Updating the game
After uploading new files, open the game once while online; it fetches the latest version and refreshes its offline copy. If you add new files, list them in `sw.js` (the `FILES` list) and bump the version in `CACHE` (e.g. `v1` → `v2`).

## Where things live
| File | What it does |
|---|---|
| `js/level1.js` | **Level design:** speed, penalties, lanes, every obstacle, the background crowd and the ending message. Most tweaks happen here. |
| `js/world.js` | Builds the courtyard and bar, the people, and her (`makeCharacter2`). |
| `js/obstacles.js` | How obstacles move, throw drinks and collide. |
| `js/main.js` | Game loop, tapping, camera, timer and ending. |
| `sw.js`, `manifest.webmanifest`, `icons/` | Offline support and the Home Screen icon. |

To change the ending message, edit `message` in `js/level1.js` (`\n` starts a new line).

## Testing shortcuts
- `index.html?d=30` starts the run 30 m in (best times aren't saved for these runs).
