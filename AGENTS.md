# Grand Theft Developer: a GTA VI-style developer portfolio

A developer portfolio built on the layout and motion of the GTA VI website (https://www.rockstargames.com/VI). Fan-made, not affiliated with Rockstar Games.

- **Layout and motion** match the live site exactly: layout, type scale, colours, timing and easing.
- **Content and artwork** are ours: the text in the Content section below, and the illustrations, logo and videos in `src/assets/`.

## Inputs

1. The user's prompts.
2. This file.
3. `src/assets/` (artwork, logo, fonts, `hosted-media.json`) and the screen recordings in `src/references/`.
4. The live site: the source for layout, sizes, timing and motion only.

There is no earlier code, notes or known values. Never assume a value from memory or from how similar sites usually work; find it on the live site.

## Stack

React + Vite, Tailwind CSS, GSAP (ScrollTrigger), Lenis for smooth scrolling. Plain JavaScript, no TypeScript.

## Method: Record → Measure → Extract → Rebuild → Diff

1. **Record:** `src/references/` holds one screen recording per section of the live site. They are the reference for motion and never ship.
2. **Measure:** with playwright-core and headless Chrome, dump computed styles and bounding boxes from the live site, sampling every 50px of scroll at 375, 768, 1024, 1440, 1920 and 2560px wide, plus phone landscape.
3. **Extract:** read the live site's front-end code for exact triggers, durations, eases and values. Prefer these to values fitted from recordings.
4. **Rebuild:** build from the numbers.
5. **Diff:** run the same measurement on localhost and compare.

Rules:
- Measure before building. When something looks off, measure both sites; never adjust by eye.
- Before trusting live-site numbers, check that headless Chrome received the same page a real browser does (compare with the recordings).
- When a value breaks the pattern found so far, measure it at every width instead of forcing it into the pattern.

## Definition of done

A section is done only when:
- its diff is within 1px / 1% at every width above. Mobile is part of the section, never a follow-up;
- its motion matches its recording, checked frame by frame;
- its handoffs work: what happens to the previous section as it arrives, pins, navbar changes, and the cursor glow (a soft light behind the page that follows the pointer: match its size, colour, blur, layering, and when it fades or returns);
- its text fits its artwork;
- `prefers-reduced-motion: reduce` gives a readable, static version, and everything clickable works by keyboard with a visible focus outline;
- nothing earlier broke: re-run earlier sections' checks after changing shared code.

Report what was checked and what still doesn't match.

## Tools

- Measuring and diff scripts live in `tools/` and stay reusable: they take a URL, a viewport width and selectors.
- Measurement output and temporary files go in `.measure/`, which is git-ignored.

## Assets

src/assets/
brand/              the logo poster (VI + wordmark) and the loader logo
fonts/              Outfit and Barlow Condensed (free, Google Fonts)
site/               every image the page loads, already cut to size
hero/             collage pieces + logo layers, desktop + mobile
meet-the-developer/  services/  highlights/  clients/  blog/  footer/
source/             the original artwork, grouped by shape, and the hero piece outlines
hosted-media.json   Cloudinary links to the two scroll-scrubbed videos

- Use `site/` as delivered and never edit it by hand. If a slot needs a different crop, re-cut it from `source/` with a script in `tools/`.
- On the first pass through the assets, record which file belongs to which section under Findings, and keep that map current.

## Artwork

Our own artwork only. Never download, hotlink or trace Rockstar's images, video, logos or fonts.

- Measure each artwork slot on the live site (box size, aspect ratio, crop, focal point) at every width and fit our art to it. Never upscale past the original size. When square art fills a wide or tall slot, place it whole and fill the rest with a blurred extension, so text baked into the art stays readable.
- Check every crop at desktop and phone widths: the subject stays in view and clear of the text over it. Put a card's text on the side where the art leaves room.
- **Hero:** match the live site's layer count, canvas size and positions so the intro lines up; measure them first. The poster shown after the intro must match the intro's last frame pixel for pixel, or the logo flickers at the swap. All logo layers come from the same source, so they stack exactly.
- If no asset fits a slot, use a plain placeholder of the right size and list it under Open differences.

## Scroll-scrubbed videos

- Import their links from `src/assets/hosted-media.json`; never copy URLs into components.
- Build renditions with Cloudinary URL transformations: keep every frame, add a keyframe every few frames, drop the audio, and give portrait phones a 9:16 crop that follows the subject. The poster is the first frame of the same crop, so nothing jumps when the video takes over.
- Check each video's real length and frame count before mapping it to scroll, and how many pixels of scroll each frame gets. If a short clip would step, play it over part of the scroll range and hold the first and last frames either side.

## Page map

| Live section | Our section |
|---|---|
| Loader | Loader, with our loader logo as the shape |
| Navbar | GTD monogram, menu icon, and a "Hire Me" pill that appears as the hero scrolls away |
| Hero (layered intro) | Our collage and logo, tagline, "Hire Me" button, tech tags, fan-made line |
| Launch Trailer | Meet the Developer: pinned scene, a wide featured card, and three project cards |
| Ultimate Edition | Services: scroll-scrubbed video backdrop and two service cards |
| Vice City, USA. | Miami, USA.: bio over the scroll-scrubbed city video |
| Feature cards | Four wide cards: Open to Work, After Hours, Case Study, Off the Clock |
| Shop | Clients: two cards |
| Featured News | Blog: three posts |
| Footer | Logo, "Build Your Own" pill, socials, links, disclaimer, "Rated D for Developer" badge |

Keep our own titles whatever the live site's headings say, and don't build promo strips or banners above the page. When the live page has something this page map doesn't, ask the user before building it.

## Content

Put all of the copy below in one content file, `src/content.js`, with one object per section. Components read from it, so a viewer can make the site theirs by editing that file and swapping the artwork. Several images have titles painted into them; the copy below matches them, so if you change one, change the other.

- **Voice:** first person ("I build…"). The developer's name appears only in the page title, the meta description and the bio.
- **Samples:** the name, projects, clients, numbers and links are samples for viewers to replace. Keep every link in one `LINKS` object, all set to `#`. Never present samples as real: where artwork shows real company logos or badges, label it "Sample".
- **Disclaimer:** "Fan-made GTA VI-style portfolio. Not affiliated with Rockstar Games." appears in the hero, the footer and the meta description. Never remove it.

**Page:** title "Grand Theft Developer · Jarvis, Full-Stack Developer". Description: "Portfolio of Jarvis, a full-stack developer in Miami. Fan-made GTA VI-style portfolio. Not affiliated with Rockstar Games."

**Favicon:** add one: the "GTD" monogram from the navbar, in white bold condensed letters on the dark page colour.

**Navbar:** GTD monogram (links to the top), menu icon, pill "Hire Me".

**Hero**
- Tagline (in the release date's place, two lines): "Full-stack developer" / "Booking spring 2027"
- Button: "Hire Me"
- Tech tags (in the platform logos' place): "React", "Node.js", "PostgreSQL"
- Fan-made line: the disclaimer, small, under the hero

**Meet the Developer**
- Scene: eyebrow "Watch", title "Meet the Developer", play button
- Featured card (above the project cards, in the live "An Extended Look" card's place, sportbike art): eyebrow "Watch"; title "Ride Along"; button "Play"
- Project cards, in the order of their art (eyebrow → title): "AI" → "AI Book Assistant"; "3D Web" → "3D Basketball Website"; "Mobile" → "React Native Language App" (longer titles take the live site's smaller headline size)

**Services**
- Card 1 (the big card, neon-sign art): title "Code Rescue"; text "For existing teams: slow pages, flaky deploys or a codebase nobody wants to touch. I find the problems, fix them and leave it documented."; button "See What's Included"
- Card 2 (the wide card, rooftop art): eyebrow "For new products"; title "Full-Stack / Builds"; text "Product, API and database, designed and shipped end to end, from the first sketch to production. Typically six to ten weeks."; button "Start a Project"

**Miami, USA.**
- Title: "Miami, USA."
- Bio: "I'm Jarvis, a full-stack developer who has spent eight years building products for startups, agencies and teams that need to ship fast without breaking things. I work across the whole stack, from the interface people see to the API and database behind it, and I care about code the next developer will thank me for."

**Four wide cards** (in this order, text alternating left and right, so each sits where its art leaves room)
| Eyebrow | Title | Text | Button |
|---|---|---|---|
| Status | Open to Work | Available for freelance and contract work from spring 2027, remote or on site in Miami. | Hire Me |
| Community | After Hours | When the deploy's done, I'm out with Miami's dev crowd: meetups, talks and the occasional late-night hackathon. | View All |
| Case Study | The Heist: Shipped in Six Weeks | How I rebuilt a booking platform's checkout and cut drop-offs by 31%. | Read the Case Study |
| Personal | Off the Clock | Open-source contributor, weekend game jammer and the one who always brings the coffee to the meetup. | More About Me |

**Clients** (header "Clients", link "View All")
- Card 1 (key-rack art): eyebrow "Sample Clients"; title "Startups, Agencies and Product Teams"; button "See All Clients"
- Card 2 (postcard art): eyebrow "Sample Review"; title "“Incredibly fast, detail-oriented, and easy to work with.”"; button "Read the Review"

**Blog** (header "Blog", link "View all")
- "700 AI Agents Escaped and Became Hackers" (November 3, 2026)
- "Agentic Engineering in 2026" (October 21, 2026)
- "Think System Design & Architecture" (October 8, 2026)

**Footer**
- Logo
- Pill (in the newsletter pill's place): "Build Your Own" / "Want a portfolio like this? Here's how it was built, step by step."
- Socials: GitHub, LinkedIn, X, YouTube
- Links: Email, Résumé, Privacy
- Badge (in the rating badge's place): "Rated D for Developer" / "Clean Code, Mild Refactoring, Frequent Coffee."
- "© 2026 Grand Theft Developer." and the disclaimer

## Project memory

This file is the only context that carries between prompts and sessions. Keep it current so a new session can pick up exactly where the last one stopped.

- **Progress:** update it at the end of every task, before replying: done, in progress, next, and open differences from the live site. Write it for someone with no other context.
- **Findings:** add facts as they're established (asset map, how sizes scale, breakpoints, colours, fonts, code layout, non-obvious problems) with where each was measured.
- Keep both short. Delete anything proven wrong, and collapse finished work into one line.

## Git

- Commits are authored by the user. **Never add an AI co-author or attribution line** to commits or PRs.
- Commit only when asked. Never force-push.

## Progress

**Done:** scaffold (React 19, Vite 8, Tailwind 4, GSAP 3.15, Lenis 1.3, playwright-core); measuring tools. **Navbar + Hero static layout** and **Loader + hero intro** (2026-11-18), diffed and checked frame by frame (details in Findings). **Hero scroll-out, nav pill, background + cursor glow, Meet the Developer, Services** (2026-11-18): `src/components/{Background,MeetTheDeveloper,ProjectCards,Card,Services,ScrollVideo}.jsx` + `.css`, `src/lib/{gsap,background,media}.js`, `tools/cut-art.py`. All ported from the live JS/CSS (Findings › Scroll sections). Checked at all 7 widths with `tools/selectors/{mtd,cards,svc}.json`: hero scale/fades, pill reveal, scene pin/fades/zoom, Services fade/brightness/zoom and cursor-glow opacity match live per 50px of scroll (glow within .015, backdrop within .05 where visible); every card box (card, picture parallax, play icon, CTA, dots pill) matches live within 1px except heights that grow with our longer titles. Keyboard: all links reachable with visible outlines; tabbing to the scene's play button scrolls the scene into view. Reduced motion: no pins/fades/video, scene and Services are static blocks, poster instead of video. Hero diff and intro timing re-checked after the shared changes: unchanged.

**Rest of the page** (2026-11-18): Miami, USA., wide cards, Clients, Blog, footer. Files: `src/components/{Miami,Highlights,Clients,Blog,Footer,SectionHead,Carousel}.jsx` + CSS (`Rows.css` for Clients/Blog), `ScrollVideo.css`; the carousel was moved out of `ProjectCards.jsx` into `Carousel.jsx` (shared). Checked with `tools/selectors/rest.json` at all 7 widths: every box, size and colour matches live except copy-driven heights/sizes (listed below). Miami motion sampled against live at 1440 and 375 (`.measure/rest/motion.js`): wrapper fade, pin, zoom, mask, fade-out and glow match exactly; mask/text-gradient timing differs slightly because live offsets those triggers by a % of the text block, which is 30–140px shorter in ours. Keyboard: all new links reachable with visible outlines. Reduced motion: static poster + text, no pins. Earlier sections re-checked after the shared changes (MTD/Services cards unchanged; phone parallax now closer to live than the old baseline).

**Whole-page pass** (2026-11-18): every section re-diffed against live at 1440, 1920, 375 and 844×390 (`.measure/audit/`): no regressions; frame-by-frame vs `05`/`06` matches. Scroll videos now decode every frame up front (WebCodecs) and draw to a canvas, as live: every frame shows with no lag at any scroll speed (before: about 1 in 3 skipped). Hero button pulse, poster dim on hover and cursor-glow squash on press built and checked against live. Fourth wide card (After Hours, in live card 2's slot with its colours, text side and page theme) added; card tops 455px apart as live, theme colours match live's card 2 range.

**Fix: Meet the Developer not interactive** (2026-11-18): `.mtd` was `position: relative` + `z-index: -1`, so `<main>` sat over the whole section and took every tap, click and swipe (project carousel, cards, scene play button). Now static, as live. Checked: touch swipes move the project, Clients and Blog carousels at 375 and 1024; cards are hit-testable at every scroll position; screenshots of the hero → scene handoff are pixel-identical before and after at 1440 and 375.

**In progress:** none.

**Favicon** (2026-11-18): `public/favicon.ico` (16/32/48px), the GTD monogram in white on #0c0d1b, made by `tools/make-favicon.mjs`; linked as live does (one `rel=icon` 48x48 .ico, currently `?v=2`). Served 200 in dev and build.

**Next:** intro VI layer without the hole (see below).

**Open differences:**
- Intro art: our 10 shards fill the live 9-shard + logo-hole slots; from 1.7 to 2.4s our VI shows the collage's cut-out where live is solid; our VI letters are smaller. Needs a VI layer without the hole.
- Loader shape: `loader-logo.svg` is solid letters (live: thin outline) and wide.
- Phone landscape (844×390): tagline wraps to 4 lines (live 3), row 20px taller, poster 10px higher. Text widths differ by copy (tagline, button, tags, nav pill, scene title), so x positions of those differ; boxes match.
- Chevron stays hidden (hidden at rest live too; live pulses its opacity behind `visibility: hidden`).
- `hero/mobile/poster.avif` is 640×640 (layers 1366): soft on tablets.
- Fan-made line: absolutely placed at the hero's foot (live has nothing there) and fades with the hero row.
- Copy-driven heights: project titles wrap to 2–3 lines (live 1), so project cards are taller (+35px at 1440, +119 at 1024, +33 at 375) and everything below shifts by that much; "Meet the Developer" wraps to 2 lines on portrait phones; phone featured card is 33px shorter (live title wraps, ours doesn't).
- Services wide card: text on the left (live right) because the rooftop art's developer stands right of centre.
- Carousel (<1280px): native scroll-snap + mouse drag instead of live's Embla; dots are buttons (live dots' clickability unknown).
- Scene art (1672×858) and the Services video (1280×720) are upscaled on large screens (live uses 2112–3840px sources); ultrawide/phone-landscape (<768) card rules are from CSS only, not measured live.
- Services video is 34 frames (live 300): it plays only while the backdrop is fully shown and holds its first/last frames either side (~34px of scroll per frame at 1440, 16px at 375).
- On portrait phones the scene's play button sits over the developer's shirt print (the art is cropped to a narrow slice; crop is 80% 15%).
- Not ported: nav text colour themes (`--_1637kzg1/2`), live nav links not raising the glow is mirrored by excluding `nav`.
- Lenis is installed but not used: the live page uses native scroll and ScrollTrigger `scrub: true`; Lenis would add smoothing live doesn't have.
- Copy-driven (ours vs live): Miami bio 4–6 lines (live 5–7), so the section is 28–141px shorter; wide-card titles take bigger sizes (shorter titles); Clients card 2 title (57 chars) wraps to 3 lines, so both Clients cards are 18–40px taller (shorter at 768/landscape); blog titles are 1 line at 375 (live 2), cards 20px shorter; footer pill text is 1 line (live 2) and its title 1 line at 768 (live 2), so the pill is 20–27px shorter. Services cards at 375 are 39px taller than live (copy), which shifts everything below.
- After Hours art is 1024×410 (slot 1153×461 at 1440): soft on desktop. Its phone cut (`mission-4-mobile`) puts the head above the text over a blurred extension of the art.
- iOS/iPadOS (and browsers without WebCodecs) seek the `<video>` instead, as live does; in headless tests that path still skips about 1 frame in 3 at normal scroll speed (keyframe every 3 frames; Cloudinary gives no denser non-fragmented file).
- Clients card 2: live art is a cut-out with no fade; ours is a painting, so it gets the same fade as card 1. Text sits over the bottom third of both square artworks (dimmed by the fade), as on live.
- Footer: our copyright + disclaimer block under the badge has no live counterpart (sizes chosen: 3u text, 1u gap). Rating badge image is our own 48×72 SVG. Social/link hover colour (#fff9cb) and pill outline width are not measured.
- Blog header is a grid (live flex); the title box is wider, the visible text identical.

## Findings

**Tools** (all tested 2026-11-18 against rockstargames.com/VI and localhost)
- `tools/measure.mjs --url U --selectors F.json [--side live|local] [--widths ...] [--step 50] [--all] [--visible] [--css text] [--inventory] [--shots N]` → `.measure/<label>/<width>.json`. Widths: 375, 768, 1024, 1440, 1920, 2560, `landscape` (844×390, mobile+touch), or `WxH`. Sends the normal Chrome UA. `--inventory` lists every distinct text style with a selector.
- `tools/diff.mjs A B [--px 1 --pct 1 --ignore props]` pairs files by width, groups repeated offsets, exits 1 when out of tolerance.
- `tools/frames.mjs <video> --at 1,2 | --every 0.5` grabs frames via Chrome (no ffmpeg on this machine).
- Selector files live in `tools/selectors/` as `{name: {live, local}}`. Live class names are hashed (e.g. `h5._191jtbmx`) and may change on redeploy.
- Recordings are 2988×1666 px (Retina, about 1494×833 CSS px); `00-full-page.mov` is 2996×1718, 33.9s.
- If a dev server was running while packages or `vite.config.js` changed, it serves a blank page (`504 Outdated Optimize Dep`); restart it.

**Live site** (measured 2026-11-18)
- Headless Chrome gets the real page (HTTP 200, same hero as the recordings, mobile layout at 375). Page uses native scroll: `scrollTo` lands exactly.
- Changed since the recordings: a "PRE-LOAD NOW" strip on top (60px at 1440; not in the page map, don't build it; hide it when measuring). The scene after the hero is now titled "Pre-Load Now" (was "Launch Trailer" in `04`); it is the Watch scene our Meet the Developer scene replaces, and its cards are now a wide card + three (recording `03`), not three.
- A OneTrust cookie dialog exists in the DOM (`#onetrust-*`, `.ot-*`); exclude it from measurements.
- Page heights: 375 → 11283, 768 → 11893, 1024 → 10834, 1440 → 12904, 1920 → 15913, 2560 → 21184, landscape → 7610.
- Background `body` rgb(12, 13, 27) = `#0c0d1b` at every width; `html` transparent; text white. In `src/index.css` as `--color-page`.
- Fonts (`--inventory`, 1440): ArtDecoRegular 400 (small print, dates), ArtDecoMedium 500 (body, buttons, nav), ArtDecoBold 700 (Pre-Load title), ArtDecoCondensedBold 700 uppercase (all titles and eyebrows). We map Regular/Medium/Bold → Outfit 400/500/700 and Condensed → Barlow Condensed 700 (`font-condensed`). Barlow 900 is unused so far.
- Several hero elements exist two or three times (desktop and mobile variants, one hidden with 0×0). Measure with `--all` and pick the visible one.
- Wide image slots (all `img`, scroll 0): 2.5:1, 1153×461 at 1440 and 1882×753 at 2560. Six of them: the "An Extended Look" card (y 2822 at 1440), one at y 6399, and the four stacked feature cards (y 9095, 9550, 10005, 10461; 455px apart). None at 375 (other shape there, not yet measured).

**Lower sections** (live CSS/JS read and measured at all 7 widths 2026-11-18; values in the component headers)
- Live theme markers are `[data-theme]` elements (hero, scene, MTD cards, Services, Vice City root, each feature card, Shop, News, footer). Colours per marker are in `Background.jsx` THEMES (fill/spotlight at 1440, touch gradient at 375).
- Vice City ("back-of-box", chunk 030): root `margin-top:-150lvh`, grid rows `100lvh−(1.1T+6u)` / `1.1T+6u` / min-content, text `margin-top:250lvh`; T=18u (10u phones). ScrollTrigger offsets like `top-=90%` are % of the trigger's height, not the viewport.
- Wide-card right side mask is `calc(100% + x)` (95% at rest), not mirrored. Feature cards are `short` on portrait phones.
- Shop card = our `tile` shape (3:2 spacer, MD title table, fade from 1/3). Header link: text ≥768; below, 8u chip (Shop) or bare 6u arrow (News).
- Footer uses design-system px × platform scale (1/1.125/1.25/1.375 at 1024/1920/2560) for logo (144px) and pill type (16/14px); the rest is in u. Rating image fixed 48×72.
- Measuring live with 7 parallel browsers makes some widths fall back to lofi (no pins; 375 and 1440 did); run live measurements at most 2–3 at a time and check page height (375 → 11283, 1440 → 12904).

**Assets** (checked 2026-11-18; see `src/assets/README.md` for the full table)
- `site/` matches the README map: meet-the-developer card-1/2/3 = AI Book Assistant / 3D Basketball / React Native; highlights mission-1/2/3 = sunset-coast / alligator-float / vault-heist (mission-4 is ours, see below); services card-tall = site-glow (desktop 1641×887, mobile 481×887), card-short = rooftop; hero desktop 2560×1440, mobile 1366×1366 (10 shards + logo-vi, logo-gta, poster-logo, poster).
- Wide cards: Open to Work = sunset-coast (`mission-1`), After Hours = after-hours-nightclub (`mission-4`, top-aligned 2.5:1 cut that drops the watermark, plus `mission-4-mobile` for portrait phones; both from `tools/cut-art.py`), Case Study = vault-heist (`mission-3`), Off the Clock = alligator-float (`mission-2`); text left, right, left, right. After Hours colours = live card 2 (bg #243152, CTA #e6ffa3 / #0d0c1a measured; same palette as the Services wide card); page theme `indigo` (#0d0c1a / #142242). Clients = `clients/clients.avif` (key rack), `clients/testimonial.avif` (postcard); Blog = `blog/post-1..3`; footer logo = `footer/logo.avif` (807×540, same size as live).
- Featured card (Ride Along) = `source/scenes/sportbike-rider.png` (1672×941), cut to `site/meet-the-developer/featured-{desktop,mobile}.avif`. Also used in the hero collage.
- Square art in tall slots (MTD cards, clients) is 1254×1858 with a blurred extension below the art, as AGENTS.md asks.
- Too small for 2.5:1 slots at 2560 (1882px wide), so these stop short of full sharpness rather than upscale: alligator-float 1774, sportbike 1672 after cropping, and **after-hours-nightclub only 1024×572 (1024×410 at 2.5:1), smaller than the 1153px slot at 1440**. It also has a sparkle watermark in the bottom-right corner.
- Problems: `tools/dev-assets.py` and `portfolio.config.js`, which the assets README names, don't exist. `hero/mobile/poster.avif` is 640×640 while its layers are 1366×1366. card-3 art says "duolingo clone" (a real brand), not "Language App". `clients.avif` shows real company logos and needs a "Sample" label.

**Measuring the live hero** (2026-11-18)
- The live page has a promo strip whose height feeds the nav's `top` and the hero's `padding-top` (52px phone portrait, 32 phone landscape, 60 ≥768). We don't build it, so measure with it off: `--css ':root,html{--_1qwkqln0:0!important;--promo-banner-height:0px!important;--_1qwkqln1:0px!important} nav{--_1qwkqln1:0px!important} ._1bkvte7{display:none!important}'`, plus `--visible --all --wait 12000`. `--css` is injected before page scripts run; injecting it after load fails because ScrollTrigger freezes the hero's padding into inline styles.
- Recipe: `node tools/measure.mjs --url https://www.rockstargames.com/VI --selectors tools/selectors/hero.json --side live --visible --all --to 0 --wait 12000 --css "<above>" --label live-hero`; local side: `--side local --wait 1500 --label local-hero`; then `node tools/diff.mjs .measure/live-hero .measure/local-hero`.
- `tools/fetch-js.mjs --url U` saves every script a page loads to `.measure/js/` (grep it with Python; the shell's `grep` is ugrep and rejects long patterns). `tools/record.mjs --url U --width W --mark M [--init-js tools/init/live-loader-marks.js]` records a load as timestamped frames via CDP screencast (no ffmpeg needed), named by seconds from a performance mark. Our site marks `loader:fadeout|complete|enable-scroll` and `intro:play`; the init script adds `loader:fadeout` to the live site. In `src/references/01-hero-intro.mp4` the live fadeout is at ≈3.8s.
- More tools: `tools/dom.mjs` (element tree with boxes), `tools/eval.mjs` (run JS on a page), `tools/css-grep.py` (rules matching a class, with their @media context; the stylesheet dump is `.measure/css/live-all.css`, made with eval.mjs over `document.styleSheets`).

**Live scale and breakpoints** (from the live CSS, confirmed by measurement at all 7 widths)
- Every size is k × `--u`, with `--u = min(1vw, 25.6px) / x0`; x0 = 1 base, 3 at 768–1023, 3.5 at 1024–1439, 4 at ≥1440, 4.5 at aspect ≥ 2.25, 2 for phone landscape <768. Ported as `--u` in `src/index.css`. 844×390 "landscape" is ≥768, so it takes the 768–1023 values (x0 3), not the phone-landscape ones.
- Side gutter `--gutter`: 7.5vw <1024, 10vw ≥1024, 13vw ≥1440, 64u ≥1920.
- Hero: 100svh grid, content centred; inner width min(100%, 120svh), poster 16:9. Aspect 0.6–1: min(80%, 60svh), 1:1. Aspect ≤0.6: 160:177. Phones (<768) with aspect ≤1: min(100%, 40svh). Aspect ≥2.25: min(100%, 150svh), 64:27. Stack gap 8u (6u phones). The row is 3 equal columns with 2.5u padding.
- Phone portrait: tagline above the poster (line-height 1, centred), then tags row (margin 3.5u/2u, gap 6u, 4.5u tall), then the button (margin-top 2.5u, 12u tall, 4u text, 6u padding).
- Type: tagline 6u / 1.2 / -0.01em uppercase, glow `0 0 28px #e6dcff40`. Hero button 4.5u text, min 24u × 14u, padding 7u. Nav pill 3.5u, min 24u × 10u, padding 5u. Buttons -0.015em, line-height 1. ArtDeco Medium maps to Outfit 500.
- Nav: padding 6u (<768), 7u (768–1023), 10u (≥1024). Logo and menu boxes 12u; mark width 7u (<768) / 9u. Menu bars 5u × round(1u, .5px) on phones, 7u × round(1.5u, .5px) from 768; gap equals bar height. Right group gap 2.5u / 4u.
- Colours: pill bg `#ffb2c6` with text `#0c0d1b` (hero button resting state = the low end of its pulse); hero button hover `#fdfbff` / `#9c4958`; nav pill hover `#fc97b1`; icon hover `#fff9cb`. Chevron 0.45 × max(5vw, 10vh) tall, `#ffb2c6`, hidden at rest.
- Hero button pulse (live code): GSAP yoyo repeat -1, 1.75s sine.inOut, from box-shadow `0 2px 50px 0 rgba(255,178,198,.15)` / color `#2D2B4F` / bg `#ffb0c4` to `0 2px 75px 0 hsla(344,100%,85%,.45)` / `#693C56` / `#FED6E3`; reverts on hover/focus, restarts on leave. On hover the poster dims to opacity .6 (0.5s sine.inOut).
- Hero scroll-out (live code, for the next pass): pinned ScrollTrigger, start top top, end bottom top, scrub; scale 1 → .9 (.85 on mobile); scroll indicator fades out first (circ.out, 40% of the range); row/header/poster fade out from 50% (power3.out).
- Hero button (built, `Hero.jsx` bindButton): the 1.75s yoyo pulse above (3.5s loop; sampled equal to live). Hover/focus reverts it and dims the poster to .6; press squashes the glow to .6×.4, brightness 1.3 (0.4s sine.inOut); on release live also drops the glow to .5 though the pointer is still over the button (measured, not traced), and ours does too. GSAP effects must clean up with `revert()`, not `kill()`, or React's dev double-mount leaves inline colours behind.

**Intro** (live JS, read 2026-11-18; full values are in `src/intro/fob.js` and `Loader.jsx`)
- Loader: overlay `linear-gradient(189deg, #1f1f38 .55%, #18182d 30.38%, #111222 65.19%, #0c0d1b 100%)`, z 501; logo 24u with a 2.15s loop (pulse, colour breathe, diagonal shimmer). Done loading (15s timeout) → wait for the loop to end → `fadeout` → logo opacity 0 (1000ms, cubic-bezier(.2,0,.8,1)) → overlay 0 (1300ms, cubic-bezier(.4,0,.8,1)) → `complete`. Scroll and clicks stay blocked until the hero sends `enable-scroll`.
- Hero intro starts on `fadeout`. A canvas 100vw × 150svh centred on the poster draws 12 full-frame layers. Each layer's natural width is the 85vw srcset slot (DPR-independent); scale per layer is 5000/(5000+max(z,-4999)). Camera = poster width / 85vw for the whole run, so the zoom comes from the content column's scale 1.4286 → 1 (3.53s power2.inOut). Shards fly in over 2.6s (power3.inOut) from per-breakpoint depths; at 2.6s the row/header/nav fade in over 1.5s (button 0.78s). At ≈4.14s the DOM poster + logo fade in (0.5s), then `enable-scroll` and the canvas is hidden.
- Breakpoints for the layer order: portrait aspect ≤ .6, square .6–1, ultrawide ≥ 2.25 (or < 768px wide and ≥ 2), else landscape.
- Shard map (live piece → our shard), desktop: heli 1, jl 2, speedboat 3, raul 4, gal 5, lambo 6, gator 7, boobie 8, biker 9, hole 10. Mobile: heli 1, jl 2, biker 3, gal 4, boobie 5, hole 6, gator 7, lambo 8, raul 9, speedboat 10.

**Assets, added 2026-11-18**
- Meet the Developer: scene = `site/meet-the-developer/scene.avif` (developer right of centre at x ≈ .76; portrait screens crop at 80% 15%); featured card = `featured-desktop.avif` (1672×669, 2.5:1) and `featured-mobile.avif` (593×941), cut from `source/scenes/sportbike-rider.png` by `tools/cut-art.py`; project cards = card-1/2/3.
- Services: big card = `card-tall-desktop.avif` / `card-tall-mobile.avif` (text right, sign on the left); wide card = `card-short.avif` (16:9, cropped by CSS at 50% 0%, phones 80% 0%; text left).
- Hero collage: `source/posters/sunset-codeposter.png` and `full-stack-developer.png` are near-identical (only the laptop text differs), so desktop shard 8 (middle right) was re-cut from `sportbike-rider` (focal .66, .5) by `tools/hero-shard.py`, which also rebuilds `poster.avif` = the 10 shards over #1c012e (poster vs shards: mean diff ≈2, AVIF noise, as before). The mobile set uses neither poster twice. Old files in `.measure/hero-backup/`.
- `tools/cut-art.py` cuts slots `site/` lacks (crop box from a focal point, AVIF, never upscaled). PIL here encodes AVIF.

**Scroll sections** (live JS/CSS read and measured 2026-11-18; long-form notes were in `.measure/specs/{cards,scrollmation,background}.md`, which is git-ignored)
- Live sets `gsap.defaults({ease:"none", duration:100})` globally (ported in `src/lib/gsap.js`), and `overflow-x: clip` on html and body (without it the 200vw Services glow made touch layouts 1152px wide).
- Hero scroll-out: pin (no spacing) top top → bottom top; units of 180: chevron container out 0–40 circ.out, scale 1→.9 (.85 <768) 0–100, row/header/collage out 50–120 power3.out, logo out 50–180. Nav pill: autoAlpha 0→1 0.3s power2.inOut when `.hero__inner` top passes 40% vh above the viewport (≈430px at 1024).
- Background (live `_1637kzg`): fixed fill z-4 (touch: 189deg gradient), glow z-3 (150vmax radial spotlight→transparent, opacity .5, 3% noise; hidden on `pointer: coarse`; quickTo x/y 0.4s linear, starts at 0,0; hover on a/button → 1, 0.5s sine.inOut), overlay z-2 (#0C0D1B → transparent in the intro, 0.557s→2.6s linear). Glow fades in with the hero UI (2.6s, 1.504s power1.inOut). Glow opacity vs scroll at 1440: .5→0 315–814 (scene enters), 0→.5 1620–1845 (cards' top bottom+25%→bottom), →0 3800–3980 (cards' bottom center-40% +20%), Services cards same pair, Vice City content top bottom +30% → .5 for the rest. Themes: each `[data-theme]` section scrubs body/fill/glow colour from top bottom → top top (or until fully in view if shorter): base #0c0d1b / #1f1f38; raised (Services) #18182d / #2f2e52; feature cards #0f0c1a/#2d1f36, #0d0c1a/#142242, #071012/#142e25, #0d0c1a/#16203f; Shop #1e1728/#31223e; News and footer base.
- Scene (live `._6sjiom`): section `z-index: -1` but `position: static`, so the z-index does nothing (keep it static: positioned, it drops the section under `<main>` and nothing in it can be clicked); scene 135lvh, margin-top -65lvh, pinned top top → cards top top (art 1.2→1, content 1.05→.9); enter over +100%: backdrop autoAlpha power3.in + brightness .2→1 (0–61), text 30–100, play 70–110; leave as cards go bottom→top. Unit --s = 1.8vh (3vh phone portrait, 2.25vh ultrawide/phone landscape): title min(16u, 4s) Outfit 700 .15em, eyebrow min(6u, 1.5s) Barlow 700 #fbd9e0, play max(5vw,10vh) (≥1440 max(7vw,10vh)).
- Cards (live `.s7pzuf`): radius 3u/7u (≥768), padding 13u, text max 92u; wide 5:2 (radial mask following the pointer, rest -5%/140%), big 37:20 (no mask, text centred), half = 1:1 spacer + text (linear mask). Headline size by length (≤13/≤23/≤30/≤40/>40 chars) → wide 15/14/13/12/11u, big & half 18/17/16/14/11u, project row ≥1280 13/12/11/10/8u, phones 12/11/10/10/8u (short cards 10/9/8/8/8u). Card scale .985→1 as it reaches mid-screen; picture parallax speed .97 (scale (h+c)/h, c = k(vh+h)/(1−k), k = .03/.97). Hover/focus: picture .8→1, text drop-shadows, CTA colour, 1s ease-out; focus outline 4px/4px in the card's accent. Themes per card are in `ProjectCards.jsx` / `Services.jsx`.
- Project row (live `._158v41`): margin-top 135lvh, padding 32u (20u <768), row gap 8u; column gap 12/16/18/22.5/25/27.5px at 375/768/1024/1440/1920/2560; 1 per page <768 portrait, 2 per page <1280, static row of 3 ≥1280; dots pill 16u×12u.
- Services (live `.gihvh7`): backdrop 135lvh, margin-top -65lvh, z-1, pinned top top → cards top top, video zoom 1→1.1; progress from backdrop top at 25% vh to cards top; enter over +100% from that start; leave from cards top at 80% vh (60% <768) to top: out 0–100, brightness →.2 80–100, cards glow out 80–100. Cards start (100lvh − 48u) + 135lvh below the section top (135lvh <768); cards 8u apart, padding-bottom 32u (20u).
- Videos (live "scrollmation"): frame = floor((N−1)·p), no smoothing; poster under the video, no fade. Our engine (`ScrollVideo.jsx` + `src/lib/frames.js`): desktop/Android fetch the file, demux it (minimal MP4 parser, non-fragmented only) and decode every frame with WebCodecs (`prefer-software`), then draw the current one on a canvas (z 2, between video and poster); iOS/iPadOS or no WebCodecs seek the `<video>`, one seek in flight, latest target applied on `seeked`. `videoRef` gets [video, canvas] so the zoom hits both. Checked: decoded frame k equals the `<video>`'s frame k (mean diff 0.1 vs 5–9 for neighbours); frame 0 vs poster 2.6; scrolling 15px per frame shows 148/148 city frames with zero lag at 1440 and 375. Cloudinary `ki_` below ≈0.1s returns a fragmented MP4 with no denser keyframes; keep `ki_0.125`. Renditions, ours: `src/lib/media.js` builds `ki_0.125,ac_none` renditions and a 9:16 `c_fill,g_auto` crop for portrait phones; portrait posters use a fixed `c_crop` x (services 438, city 699) because image g_auto crops differently from video g_auto. Services clip: 34 frames (1.4167s); city: 149 frames. Live city ("back-of-box") ScrollTriggers: pin wrapper top top → content top top (zoom 1→1.1), progress root top top → content top top, fade-in +100% (<768) / +150%, radial mask from content top-=150%/-90% bottom, wrapper out over the second half.
- Headless live never draws the city video's canvas (dark even at opacity 1): compare that section against `05-vice-city.mov`. Run live one browser at a time with `--wait 20000`; 4 at once pushed it into lofi.
- Live headless at 768 and 844×390 may fall back to the lofi experience (15s load timeout): no pins there; compare card internals, not section positions, at those widths.
