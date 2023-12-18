# Embedded Economy SVG and utility
## The SVG
An SVG of the Embedded Economy diagram ([*embedded-economy.svg*](https://github.com/burkmarr/doughnutjs/blob/main/embedded/embedded-economy.svg)) has been created based on a JPEG image avalable from the
[DEAL website](https://drive.google.com/drive/u/0/folders/1KsZp26_dQPlnyEuM4nHVcFn7dwErfGcE). Text in the SVG is in 
English, but it would be quite easy to edit a copy 
in a text editor to translate the text. There may be some
positional issues with translated text. If there is a strong requirement for an SVG
in a lanaguage other than English and you ran into positional
issues when trying it yourself, please raise an issue on
this repository to request it. If you do create a version for another language, please consider
raising a pull request to merge it into this repo (or contact
me separately).

Elements in the SVG have been marked up with CSS classes to make
modifying the appearance of elements, or groups of elements,
relatively easy. If you have CSS and/or Javascript skills, you could use this many of the classes in the SVG to style or animate elements of the SVG when included in a web page.

## Utility to generate a customised Embedded Economy diagram
This *[interactive utility](https://burkmarr.github.io/doughnutjs/embedded/interactive.html)* provides an easy to use graphical user interface around the Embedded Economy SVG to generate customised Embedded Economy diagrames with user-specified colours and/or opacities. *You do not need any technical skills to use this tool*. The resulting diagrams are downloadable in SVG or PNG format.

In general the SVG format is preferrable because it scales without pixellating, but in some circumstances the PNG format will be preferable. For example Microsoft Word cannot render the curved text (SVG textPath element), so to use in an MS Word document, you should download a PNG version.

Full instructions on how to use the interactive utility are included in the utility itself.

