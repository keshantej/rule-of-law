export type AudienceMode = "public" | "shared";

export interface SpeakerOnlyBlock {
  title: string;
  body: string;
}

export interface WebScene {
  scene_id: string;
  slug: string;
  title: string;
  kicker: string;
  display_lines: string[];
  speaker_notes: string;
  duration_tags: number[];
  audience_mode: AudienceMode;
  visual_treatment: string;
  speaker_only_blocks: SpeakerOnlyBlock[];
  resource_refs: string[];
  source_support: string[];
  generated_scaffolding: string[];
}

export interface WebPresentation {
  title: string;
  scenes: WebScene[];
}

export interface SpeakerTrackStep {
  scene_id: string;
  minutes: number;
  cue: string;
}

export interface SpeakerTrack {
  minutes: number;
  title: string;
  scene_ids: string[];
  steps: SpeakerTrackStep[];
  transition_note: string;
}

export interface ToolkitItem {
  toolkit_id: string;
  type: string;
  title: string;
  body: string;
  audience: string;
  speaker_only: boolean;
  source_support: string[];
}

export interface ResourceLink {
  label: string;
  href: string;
  description: string;
  is_placeholder: boolean;
}

export interface ResourceGroup {
  resource_group_id: string;
  title: string;
  description: string;
  links: ResourceLink[];
  source_support: string[];
}

export interface DownloadAsset {
  asset_id: string;
  title: string;
  format: string;
  href: string;
  description: string;
  source_path: string;
}

export interface LMSQuizQuestion {
  question: string;
  choices: string[];
  answer: string;
  rationale: string;
}

export interface LMSModule {
  module_id: string;
  title: string;
  learning_objectives: string[];
  overview: string;
  lesson_body_markdown: string;
  key_takeaways: string[];
  reflection_questions: string[];
  quiz_questions: LMSQuizQuestion[];
  discussion_prompt?: string;
  source_support: string[];
  generated_scaffolding: string[];
}

export interface LMSArtifact {
  modules: LMSModule[];
}

export interface ProvenanceEntry {
  ref_id: string;
  title: string;
  source_support: string[];
  generated_scaffolding: string[];
}

export interface QAAnnotation {
  annotation_id: string;
  level: "info" | "warning";
  message: string;
  ref_ids: string[];
}

export interface WebExperience {
  presentation: WebPresentation;
  speaker_tracks: SpeakerTrack[];
  speaker_toolkit: ToolkitItem[];
  resource_library: ResourceGroup[];
  downloads: DownloadAsset[];
  provenance_index: ProvenanceEntry[];
  qa_annotations: QAAnnotation[];
}

export interface SceneOverrideDocument {
  _id: string;
  scene_id: string;
  override_type: "presentation_safe" | "locked_claim_override";
  kicker?: string;
  title?: string;
  display_lines?: string[];
  visual_treatment?: string;
  speaker_prompt?: string;
  partner_links?: ResourceLink[];
  event_intro?: string;
  local_context?: string;
  generated_scaffolding_note?: string;
}
