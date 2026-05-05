# Arizona Rule of Law Ambassador Dashboard

This folder is the clean standalone handoff package.

## What To Publish

- `index.html`
- `deliverables/`

## Deliverables Included

- `arizona_rule_of_law_ambassador_manual.docx`
- `arizona_rule_of_law_ambassador_deck.pptx`
- `arizona_rule_of_law_field_guide.pdf`
- `arizona_rule_of_law_field_guide.docx`
- `arizona_rule_of_law_handout.pdf`
- `arizona_rule_of_law_lms_modules.docx`

## Deployment Notes

- No build step is required. This is a static HTML delivery.
- Keep the `deliverables` folder next to `index.html` so all download links continue to work.
- Any static host is fine: GitHub Pages, Vercel static hosting, Netlify, S3, or a standard web server.
- The page uses Google Fonts. If you need a fully offline package, self-host the fonts or replace them with local equivalents.

## Suggested Repo Shape

```text
/
  index.html
  deliverables/
    arizona_rule_of_law_ambassador_manual.docx
    arizona_rule_of_law_ambassador_deck.pptx
    arizona_rule_of_law_field_guide.pdf
    arizona_rule_of_law_field_guide.docx
    arizona_rule_of_law_handout.pdf
    arizona_rule_of_law_lms_modules.docx
```
