# Development notes
## Embedded Economy SVG
**Folder: embedded**

### Notes
- SVG font embedding: https://graphicdesign.stackexchange.com/questions/5162/how-do-i-embed-google-web-fonts-into-an-svg
- "use" element: https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/SVG_and_CSS
- https://stackoverflow.com/questions/9287544/how-to-select-an-element-within-an-embedded-object
- https://stackoverflow.com/questions/4906148/how-to-apply-a-style-to-an-embedded-svg
- https://tympanus.net/codrops/2019/01/22/svg-filter-effects-outline-text-with-femorphology/

## Doughnut and Planetary Limits charts
**Folder: doughnutjs**

### TODO
- Add options for arcs including gaps and rounded corners.
- Test and deal with images that are not square.
- Rough up – should just be a function to call on any path attribute in D3 stuff.
- Expmt with different rough up params, particularly the one that takes out the randomness.
- Experiment with converting shape rotations to a transform – should help on some roughed up styles.
- Transition global needs to be replaced with optional params for transition e.g. duration, delay etc.
- Fading of arcs towards outer and inner edge.
- Error trapping on invalid values to api functions.
- Recipe load falls over if image not found.
