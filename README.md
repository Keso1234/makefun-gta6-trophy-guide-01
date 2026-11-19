[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Keso1234/makefun-gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Keso1234/makefun-gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Leonida Trophy Guide — make.fun gta6-trophy-guide-01 entry

An entry for the [make.fun](https://make.fun) bounty
[gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01): an offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI, with a checklist saved in the browser, a roadmap to the platinum, missable flags, filters and a spoiler setting.

## What it is

**Leonida Trophy Guide** — a static web app (plain HTML, CSS and ES modules, no build step, no network requests) that runs from its own files.

- **All 55 official trophies** with their official names, descriptions and grades (1 platinum, 2 gold, 6 silver, 46 bronze), plus a guide for each in this entry's own words: how to get it, steps, a tip, difficulty and time estimates, chapter or area, and the PSN target where PlayStation tracks a count (250 stunts, 42 Shooting Range challenges, 100 WAiNK spots, and more).
- **Tracker:** tick trophies off; progress, per-trophy notes and a Next-up queue are saved in the browser (localStorage). Export saves them to a file; Import restores them.
- **Filters:** search across names, descriptions and guide text; filter by kind (story, missable, collectibles, activities, online — the game lists no online trophies) and by grade; sort by official order, name, grade, difficulty or missable first.
- **Roadmap to the platinum:** five stages built from the official descriptions — story first, strangers and side missions, activities, collectibles, then money and cleanup — with earned counts per stage.
- **Missables:** 10 trophies flagged from the official descriptions as possible one-time moments, each with its reason stated and marked unconfirmed, since mission replay has not been verified for GTA VI yet.
- **Spoiler setting:** hides the names and descriptions of unearned story trophies until they are earned (earned ones stay revealed).
- **Cited guidance:** every trophy's guide names its sources beside it — the official list on Exophase for name, description and grade, PSNProfiles for PSN targets, and the guide's own advice from the official description. Where the official description does not pin down a place or step, the guide says so instead of inventing one. No guide text was copied from another site, and the app shows no Rockstar artwork.

## How to run

```sh
node serve.ts --port 8080
```

Then open `http://localhost:8080` in desktop Chrome. No account, no network.

Screenshot staging: `?demo=1` loads sample progress (13 of 55 earned) for preview; `?view=roadmap|missables|planner`, `?kind=`, `?grade=`, `?search=`, `?spoiler=on` and `?trophy=<name>` pick the view shown. Screenshots in `screenshots/` were taken at 1280×800 with those parameters.

`main.ts` (Node 22) is the entrypoint: it copies `app/` and `screenshots/` to `/output` and writes `dossier.json` with the vendored make.fun library (`vendor/makefun-frontend.ts`).

## License

MIT — see [LICENSE](LICENSE).

Built for make.fun — sign up with referral code taaana65: https://make.fun/r/taaana65
