import { defineField, defineType } from "sanity";

export const sceneOverride = defineType({
  name: "sceneOverride",
  title: "Scene Override",
  type: "document",
  fields: [
    defineField({
      name: "scene_id",
      title: "Scene ID",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "override_type",
      title: "Override Type",
      type: "string",
      options: {
        list: [
          { title: "Presentation-safe", value: "presentation_safe" },
          { title: "Locked claim override", value: "locked_claim_override" }
        ]
      },
      validation: (rule) => rule.required()
    }),
    defineField({ name: "kicker", title: "Kicker", type: "string" }),
    defineField({ name: "title", title: "Display title", type: "string" }),
    defineField({ name: "display_lines", title: "Display lines", type: "array", of: [{ type: "string" }] }),
    defineField({ name: "visual_treatment", title: "Visual treatment", type: "text", rows: 4 }),
    defineField({ name: "speaker_prompt", title: "Speaker prompt", type: "text", rows: 4 }),
    defineField({ name: "event_intro", title: "Event intro", type: "text", rows: 4 }),
    defineField({ name: "local_context", title: "Local context", type: "text", rows: 4 }),
    defineField({ name: "generated_scaffolding_note", title: "Generated scaffolding note", type: "string" }),
    defineField({
      name: "partner_links",
      title: "Partner links",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "label", title: "Label", type: "string" }),
            defineField({ name: "href", title: "Href", type: "string" }),
            defineField({ name: "description", title: "Description", type: "string" }),
            defineField({ name: "is_placeholder", title: "Is placeholder", type: "boolean", initialValue: false })
          ]
        }
      ]
    })
  ]
});
