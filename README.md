# NFL Field demo

This is a small static web app that renders an NFL football field (120 yards long including 10-yard endzones, 160 feet wide) as an SVG.

Files added:
- `index.html` — main page
- `styles.css` — simple responsive styles
- `script.js` — draws the SVG field and markings

How to view:
1. Open `index.html` in your browser (double-click or use a local server).
2. The field scales to your viewport while preserving proportions.

Notes:
- Units in the SVG are set so 1 unit = 1 yard for easy math.
- Hash marks and yard lines are drawn programmatically in `script.js`.
