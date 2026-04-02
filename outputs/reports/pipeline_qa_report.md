# Pipeline QA Report

- Run ID: `run_43359784a8bc`
- Generated At: `2026-04-01T01:37:15+00:00`
- Overall Status: `warning`

## required_artifacts
- Status: `pass`
- Message: All configured artifact files are present.

## web_experience_contract
- Status: `pass`
- Message: Web experience JSON matches its schema.

## nonpartisan_language
- Status: `pass`
- Message: No prohibited partisan language detected.

## presentation_scene_count
- Status: `pass`
- Message: Web presentation contains the expected 16 scenes.

## field_guide_timings
- Status: `pass`
- Message: Field guide timings are internally consistent.

## web_speaker_tracks
- Status: `pass`
- Message: Web speaker tracks are structurally consistent.

## handout_length
- Status: `pass`
- Message: Handout length is within the target range at 300 words.

## lms_requirements
- Status: `pass`
- Message: All LMS modules include objectives and quiz questions.

## appendices_labeling
- Status: `pass`
- Message: Appendices section is present and labeled.

## definition_consistency
- Status: `warning`
- Message: Definition language differs more than expected across deliverables.

## web_alignment
- Status: `pass`
- Message: Every web scene is linked to one or more manual sections.

## presenter_separation
- Status: `pass`
- Message: Presenter-only content is structurally separated from public scene content.

## resource_links
- Status: `pass`
- Message: Web resource links are present and placeholder flags are consistent.

## traceability_support
- Status: `pass`
- Message: Manual sections and web scenes maintain source support or explicit generated-scaffolding labels.

## llm_review::unsupported claims
- Status: `pass`
- Message: The introductory letter makes broad claims about the civic duty of lawyers and the impact of Rule of Law Day without direct citation to source material. However, these claims are generally supported by the listed canons and are appropriate for a framing letter.
- Detail: No action required, but consider adding a footnote or reference to the relevant canons for clarity.

## llm_review::inconsistent definitions
- Status: `warning`
- Message: The definition of 'Rule of Law' and its four principles is presented in both sections, but the language and order differ slightly. This could cause confusion for learners.
- Detail: Standardize the definition and order of the four principles across all sections for consistency.

## llm_review::partisan wording
- Status: `pass`
- Message: No overtly partisan language detected. The manual emphasizes nonpartisan values and explicitly states that the Rule of Law is not a political issue.
- Detail: No action required.

## llm_review::manual / web drift
- Status: `pass`
- Message: No evidence of drift from source canons or web resources. Generated scaffolding is clearly labeled.
- Detail: No action required.

## llm_review::implausible speaker timings
- Status: `pass`
- Message: No speaker timings present in the manual content.
- Detail: No action required.

## llm_review::presenter-only content leaking into public presentation content
- Status: `pass`
- Message: No presenter-only notes or content detected in public-facing sections.
- Detail: No action required.

## llm_review::missing or mislabeled resource placeholders
- Status: `warning`
- Message: No explicit resource placeholders (e.g., for slides, handouts, or external links) are present in the 'How to Use This Manual' section, which may limit usability for presenters.
- Detail: Add clear placeholders or references for supplementary resources where appropriate.

## llm_review::missing LMS learning objectives or assessments
- Status: `warning`
- Message: No learning objectives or assessment items are present in the manual. This is a critical omission for LMS integration and effective civic education.
- Detail: Add a section at the beginning or end of the manual listing clear learning objectives and suggested assessment questions or activities.

## llm_review::mislabeled appendices
- Status: `pass`
- Message: No appendices are present or referenced in the provided content.
- Detail: No action required unless appendices are intended.

## llm_review::source hierarchy violations
- Status: `pass`
- Message: Source hierarchy is respected; primary canons are cited for substantive claims, and generated scaffolding is clearly labeled.
- Detail: No action required.
