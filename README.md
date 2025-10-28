# Letter Writer WYSIWYG

A split-view letter composition experience built with React and Vite. The left pane walks through a guided, multi-step form while the right pane renders a paginated, print-ready preview of the letter that updates in real time.

## Features

- Multi-step form that captures recipient details, subject/reference, greeting, body, closing, and copy recipients.
- Real-time preview that mirrors the structure of a formal letter, complete with pagination cues and highlighted sections for the active step.
- Responsive layout that adapts from a desktop split view to a single-column experience on small screens.
- Reset control to clear the draft and start over instantly.

## Getting started

```bash
npm install
npm run dev
```

Open the printed URL (defaults to [http://localhost:5173](http://localhost:5173)) in your browser to use the editor. Update the form fields on the left to see the preview refresh immediately.

To produce an optimised production build, run:

```bash
npm run build
```

The generated assets will be available in the `dist/` folder.
