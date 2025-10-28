# Letter Writer WYSIWYG

A split-view letter composition experience built with React and Vite. The left pane walks through a guided, multi-step form while the right pane renders a paginated, print-ready preview of the letter that updates in real time.

## Features

- Guided multi-step form covering Indian sender/recipient address blocks, subject and reference lines, body content, and closing details.
- Real-time Indian formal letter preview with A4 sizing, pagination cues, and highlights that track the active step.
- Print styles that hide the form and produce a press-ready layout; dedicated controls let you trigger the browser print dialog or export a PDF snapshot.
- Responsive layout that adapts from a desktop split view to a single-column experience on small screens.
- Reset control to clear the draft and start over instantly.

## Getting started

```bash
npm install
npm run dev
```

Open the printed URL (defaults to [http://localhost:5173](http://localhost:5173)) in your browser to use the editor. Update the form fields on the left to see the preview refresh immediately. Use the preview toolbar to print or download the draft as a PDF.

To produce an optimised production build, run:

```bash
npm run build
```

The generated assets will be available in the `dist/` folder.
