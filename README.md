# Prana: personal health companion

A private, single-page health app. Store medical documents and lab reports, get medicine reminders, track protein, calories and water, and receive a personalised Indian diet plan and yoga routine.

No build step, no dependencies, no backend. Plain HTML, CSS and JavaScript.

## Run it in VS Code

1. Open this folder in VS Code (File > Open Folder).
2. Install the recommended extension **Live Server** (VS Code will suggest it).
3. Right-click `index.html` and choose **Open with Live Server**.

No VS Code? Run `npx serve .` in this folder, or double-click `prana-standalone.html` (the whole app in one file).

Use a local server (Live Server) rather than opening `index.html` by double-click when you can: browsers treat storage more reliably over `http://localhost`.

## Project layout

| Path | What it is |
| --- | --- |
| `index.html` | Page shell and font links |
| `css/styles.css` | All styling: themes (light, dark, auto), layout, components |
| `js/app.js` | The whole app, in this order: utilities and state, data (foods, poses, labs), calculation engines, UI helpers and views, actions and wiring |
| `prana-standalone.html` | Same app as one self-contained file |

Search `js/app.js` for these section markers to find your way around: `Nutrition`, `My plan`, `Yoga`, `Records`, `Profile and settings`, `Onboarding`, `Sample data`, `reminders`, `wiring`.

## Where things live

- **Foods:** the `FOODS` array (name, serving, kcal, protein, carbs, fat, tags). Add your own, or use the in-app Custom tab.
- **Meal ideas:** `COMBOS`, `PLAN_SLOTS`, `BOOSTERS`.
- **Yoga poses:** `POSES` (with `av` = avoid for a condition, `care` = go gently). Weekly themes are in `THEMES`.
- **Lab ranges and tips:** `LABS` and `TIPS`.
- **Targets (calories, protein, water):** the `body()` function. Mifflin-St Jeor, goal adjustment, Asian BMI cut-offs.
- **Colours and fonts:** CSS variables at the top of `css/styles.css`.

## Your data

Everything stays in the browser on the device you use:

- Profile, medicines, logs and lab values: `localStorage`, key `prana.v1`
- Uploaded document files: `IndexedDB`, database `prana-files`

Nothing is uploaded anywhere. Clearing browser data erases it, and it does not sync between devices. Use Profile > Backup to export a JSON copy (documents are not included in backups).

## Notes for running outside Claude

The app was built as a Claude artifact. Two optional features adapt automatically when run elsewhere:

- **Ask coach (AI):** hidden, because it needs Claude's sampling capability. Nothing else depends on it.
- **Saving files** (summary, backup, document copies): falls back to a normal browser download.

Reminders: toasts, chime and optional browser notifications work while the page is open. A web page cannot ring when the tab is closed; for that you would need a service worker and push backend, or a native app.

## Disclaimer

Prana offers general wellness guidance. It is not medical advice, does not diagnose, and never suggests changing a prescription. Follow your doctor.
