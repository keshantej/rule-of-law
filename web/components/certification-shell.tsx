"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, ClipboardCheck, GraduationCap, ShieldCheck } from "lucide-react";

import type { DownloadAsset, LMSArtifact } from "@/lib/types";

interface CertificationShellProps {
  lms: LMSArtifact;
  downloads: DownloadAsset[];
}

function renderLessonBody(markdown: string) {
  const blocks = markdown
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    if (block.startsWith("### ")) {
      return (
        <div key={`heading-${index}`} className="border-t border-paper/10 pt-5 first:border-t-0 first:pt-0">
          <h3 className="text-xl font-semibold tracking-[-0.03em] text-paper">{block.replace(/^###\s+/, "")}</h3>
        </div>
      );
    }

    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const listLines = lines.filter((line) => /^[-*]\s+/.test(line));

    if (listLines.length === lines.length) {
      return (
        <div key={`list-${index}`} className="space-y-3">
          {listLines.map((line) => (
            <div key={line} className="flex items-start gap-3 text-sm leading-7 text-paper/74">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gold" />
              <p className="flex-1">{line.replace(/^[-*]\s+/, "")}</p>
            </div>
          ))}
        </div>
      );
    }

    return (
      <p key={`paragraph-${index}`} className="text-sm leading-8 text-paper/74">
        {block}
      </p>
    );
  });
}

export function CertificationShell({ lms, downloads }: CertificationShellProps) {
  const [moduleIndex, setModuleIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const module = lms.modules[Math.min(moduleIndex, Math.max(0, lms.modules.length - 1))];
  const certificationChecklist = useMemo(
    () => [
      "Review the selected module and its key takeaways.",
      "Answer and check the knowledge-check questions below.",
      "Open the presenter workspace and rehearse the matching talk track.",
      "Download the field guide, handout, and manual before presenting."
    ],
    []
  );
  const answeredCount = module.quiz_questions.filter((_, index) => {
    const key = `${module.module_id}-${index}`;
    return Boolean(revealed[key]);
  }).length;
  const moduleCompletion = Math.round((answeredCount / Math.max(module.quiz_questions.length, 1)) * 100);

  return (
    <main className="px-5 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Certification</p>
        <h1 className="mt-3 max-w-5xl text-4xl font-semibold tracking-[-0.05em] text-paper md:text-6xl">
          Review the teaching points and complete the knowledge checks before presenting.
        </h1>
        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="max-w-3xl text-lg leading-8 text-paper/72">
            Use this page to review each module, confirm the key points, and check your understanding before you rehearse or present.
          </div>
          <div className="rounded-[1.75rem] border border-paper/10 bg-paper/5 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Module progress</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-paper">{moduleCompletion}%</p>
              </div>
              <div className="rounded-full border border-paper/10 bg-paper/10 p-3 text-gold">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-paper/10">
              <div className="h-full rounded-full bg-gradient-to-r from-ember to-gold transition-all duration-300" style={{ width: `${moduleCompletion}%` }} />
            </div>
            <div className="mt-5 space-y-3">
              {certificationChecklist.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-paper/10 bg-paper/5 px-4 py-3 text-sm leading-6 text-paper/72">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-gold" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-paper/10 pt-5">
              <Link href="/presenter" className="inline-flex items-center gap-2 rounded-full border border-paper/10 bg-paper/10 px-4 py-2 text-sm font-semibold text-paper transition hover:border-gold/45 hover:text-gold">
                Open presenter tab
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/presentation" className="inline-flex items-center gap-2 rounded-full border border-paper/10 bg-paper/10 px-4 py-2 text-sm font-semibold text-paper transition hover:border-gold/45 hover:text-gold">
                View presentation
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)_22rem]">
          <aside className="rounded-[1.75rem] border border-paper/10 bg-paper/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Modules</p>
            <div className="mt-4 space-y-2">
              {lms.modules.map((entry, index) => (
                <button
                  key={entry.module_id}
                  type="button"
                  onClick={() => setModuleIndex(index)}
                  className={[
                    "w-full rounded-2xl px-4 py-4 text-left text-sm transition",
                    index === moduleIndex ? "bg-paper text-ink" : "bg-[#111b2b] text-paper/78 hover:bg-[#162338]"
                  ].join(" ")}
                >
                  <p className="text-[11px] uppercase tracking-[0.22em] opacity-70">Module {index + 1}</p>
                  <p className="mt-1 font-semibold">{entry.title}</p>
                </button>
              ))}
            </div>
          </aside>

          <section className="space-y-6">
            <article className="rounded-[1.75rem] border border-paper/10 bg-[#111b2b] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Module overview</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-paper">{module.title}</h2>
                </div>
                <div className="rounded-full border border-paper/10 bg-paper/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-paper/58">
                  {module.quiz_questions.length} question check
                </div>
              </div>
              <p className="mt-4 text-base leading-8 text-paper/72">{module.overview}</p>
            </article>

            <article className="rounded-[1.75rem] border border-paper/10 bg-paper/[0.04] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">What to learn</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {module.learning_objectives.map((objective) => (
                  <div key={objective} className="rounded-2xl border border-paper/10 bg-[#111b2b] px-4 py-4 text-sm leading-6 text-paper/72">
                    {objective}
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[1.75rem] border border-paper/10 bg-[#111b2b] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Lesson content</p>
              <div className="mt-4 space-y-5">
                {renderLessonBody(module.lesson_body_markdown)}
              </div>
            </article>

            <article className="rounded-[1.75rem] border border-paper/10 bg-paper/[0.04] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Key takeaways</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {module.key_takeaways.map((takeaway) => (
                  <div key={takeaway} className="flex items-start gap-3 rounded-2xl border border-paper/10 bg-[#111b2b] px-4 py-4 text-sm leading-7 text-paper/72">
                    <GraduationCap className="mt-1 h-4 w-4 text-gold" />
                    <span>{takeaway}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[1.75rem] border border-paper/10 bg-[#111b2b] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Knowledge check</p>
              <div className="mt-5 space-y-4">
                {module.quiz_questions.map((quiz, index) => {
                  const key = `${module.module_id}-${index}`;
                  const isOpen = Boolean(revealed[key]);
                  const selectedChoice = responses[key];
                  const isCorrect = selectedChoice === quiz.answer;
                  return (
                    <div key={key} className="rounded-[1.25rem] border border-paper/10 bg-paper/[0.05] px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <p className="font-semibold text-paper">{index + 1}. {quiz.question}</p>
                        <span className="rounded-full border border-paper/10 bg-paper/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-paper/55">
                          Knowledge check
                        </span>
                      </div>
                      <div className="mt-3 space-y-2 text-sm leading-6 text-paper/72">
                        {quiz.choices.map((choice) => (
                          <button
                            key={choice}
                            type="button"
                            onClick={() => setResponses((state) => ({ ...state, [key]: choice }))}
                            className={[
                              "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition",
                              selectedChoice === choice
                                ? "border-gold/45 bg-paper/10 text-paper"
                                : "border-transparent bg-[#0d1727] hover:border-paper/10"
                            ].join(" ")}
                          >
                            <span className={[
                              "mt-1 h-4 w-4 rounded-full border",
                              selectedChoice === choice ? "border-gold bg-gold/15" : "border-paper/20"
                            ].join(" ")} />
                            <span className="flex-1">{choice}</span>
                          </button>
                        ))}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setRevealed((state) => ({ ...state, [key]: true }))}
                          disabled={!selectedChoice}
                          className="rounded-full border border-paper/10 bg-paper/10 px-4 py-2 text-sm font-semibold text-paper transition hover:border-gold/45 hover:text-gold disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          Check answer
                        </button>
                        {isOpen ? (
                          <button
                            type="button"
                            onClick={() => setRevealed((state) => ({ ...state, [key]: false }))}
                            className="rounded-full border border-paper/10 bg-paper/10 px-4 py-2 text-sm font-semibold text-paper transition hover:border-gold/45 hover:text-gold"
                          >
                            Hide feedback
                          </button>
                        ) : null}
                      </div>
                      {isOpen ? (
                        <div className={[
                          "mt-4 rounded-xl border px-4 py-4 text-sm leading-7",
                          isCorrect ? "border-green-400/30 bg-green-500/10 text-paper/82" : "border-gold/20 bg-paper/10 text-paper/78"
                        ].join(" ")}>
                          <p className="font-semibold text-paper">
                            {isCorrect ? "Correct." : "Review this one again."}
                          </p>
                          <p className="mt-2"><span className="font-semibold text-paper">Answer:</span> {quiz.answer}</p>
                          <p className="mt-2"><span className="font-semibold text-paper">Why:</span> {quiz.rationale}</p>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="rounded-[1.75rem] border border-paper/10 bg-[#111b2b] p-6 text-paper">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Reflection and discussion</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-sm font-semibold text-paper">Reflection prompts</p>
                  <div className="mt-3 space-y-2 text-sm leading-7 text-paper/76">
                    {module.reflection_questions.map((question) => (
                      <p key={question}>{question}</p>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-sm font-semibold text-paper">Discussion prompt</p>
                  <p className="mt-3 text-sm leading-7 text-paper/76">{module.discussion_prompt || "Use this module as a basis for small-group discussion after review."}</p>
                </div>
              </div>
            </article>
          </section>

          <aside className="space-y-5">
            <div className="rounded-[1.75rem] border border-paper/10 bg-paper/5 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full border border-paper/10 bg-paper/10 p-3 text-gold">
                  <ClipboardCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Next step</p>
                  <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-paper">Finish the module, then move to Presenter to rehearse.</p>
                </div>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-paper/72">
                <p>Use <span className="font-semibold text-paper">Certification</span> to confirm the substance.</p>
                <p>Use <span className="font-semibold text-paper">Presenter</span> to rehearse timing and transitions.</p>
                <p>Use <span className="font-semibold text-paper">Resources</span> for downloadables and follow-up links.</p>
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-paper/10 bg-[#111b2b] p-6 text-paper">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Downloadables</p>
              <div className="mt-5 space-y-3">
                {downloads.map((asset) => (
                  <a key={asset.asset_id} href={asset.href} className="block rounded-2xl border border-paper/10 bg-paper/5 px-4 py-4 transition hover:border-gold/40 hover:text-gold">
                    <p className="font-semibold">{asset.title}</p>
                    <p className="mt-1 text-sm text-paper/65">{asset.description}</p>
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
