# doughnutjs
Library for ecological economics visualisations.

## TODO
- Checks for non-element objects, e.g. id attribute on chart; permitted element type etc.
- Check validity of converter values
- What about top-level defaults which are propogated and reqired on elements? Probaly best to keep propogating them
but account for them in unpermittedProps - don't remove. Actually maybe these should go in globals?
- Error trapping on invalid values to api functions
- Real units modifier - r
- Add options for arcs including gaps and rounded corners.
- Test and deal with images that are not square.
- Implement rough styles
- Fading of arcs towards outer and inner edge
- Test transitions across recipes
- Rough up – should just be a function to call on any path attribute in D3 stuff 
- Expmt with different rough up params, particularly the one that takes out the randomness 
- Experiment with converting shape rotations to a transform – should help on some roughed up styles 
- Transition global needs to be replaced with optional params for transition e.g. duration, delay etc.

