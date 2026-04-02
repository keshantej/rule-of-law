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
        <div key={`heading-${index}`} className="border-t border-navy/10 pt-5 first:border-t-0 first:pt-0">
          <h3 className="text-xl font-semibold tracking-[-0.03em] text-navy">{block.replace(/^###\s+/, "")}</h3>
        </div>
      );
    }

    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const listLines = lines.filter((line) => /^[-*]\s+/.test(line));

    if (listLines.length === lines.length) {
      return (
        <div key={`list-${index}`} className="space-y-3">
          {listLines.map((line) => (
            <div key={line} className="flex items-start gap-3 text-sm leading-7 text-navy/76">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-ember" />
              <p className="flex-1">{line.replace(/^[-*]\s+/, "")}</p>
            </div>
          ))}
        </div>
      );
    }

    return (
      <p key={`paragraph-${index}`} className="text-sm leading-8 text-navy/78">
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
    <main className="bg-paper px-5 py-12 md:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember">Certification</p>
        <h1 className="mt-3 max-w-5xl text-4xl font-semibold tracking-[-0.05em] text-navy md:text-6xl">
          Review the training modules, lesson content, and knowledge checks before presenting.
        </h1>
        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="max-w-3xl text-lg leading-8 text-navy/72">
            This page is for preparation. Use it to review the source-based lesson content, confirm the main teaching points, and check your understanding before you present.
          </div>
          <div className="rounded-[1.75rem] border border-navy/10 bg-dune p-6 shadow-horizon">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ember">Module progress</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-navy">{moduleCompletion}%</p>
              </div>
              <div className="rounded-full border border-navy/10 bg-white/70 p-3 text-ember">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/80">
              <div className="h-full rounded-full bg-gradient-to-r from-ember to-gold transition-all duration-300" style={{ width: `${moduleCompletion}%` }} />
            </div>
            <div className="mt-5 space-y-3">
              {certificationChecklist.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-navy/10 bg-white/75 px-4 py-3 text-sm leading-6 text-navy/78">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-ember" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-navy/10 pt-5">
              <Link href="/presenter" className="inline-flex items-center gap-2 rounded-full border border-navy/10 bg-white px-4 py-2 text-sm font-semibold text-navy transition hover:border-ember/40 hover:text-ember">
                Open presenter tab
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/presentation" className="inline-flex items-center gap-2 rounded-full border border-navy/10 bg-white px-4 py-2 text-sm font-semibold text-navy transition hover:border-ember/40 hover:text-ember">
                View presentation
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)_22rem]">
          <aside className="rounded-[1.75rem] border border-navy/10 bg-[#fcf8ef] p-5 shadow-horizon">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ember">Modules</p>
            <div className="mt-4 space-y-2">
              {lms.modules.map((entry, index) => (
                <button
                  key={entry.module_id}
                  type="button"
                  onClick={() => setModuleIndex(index)}
                  className={[
                    "w-full rounded-2xl px-4 py-4 text-left text-sm transition",
                    index === moduleIndex ? "bg-navy text-paper" : "bg-white text-navy/78 hover:bg-sand"
                  ].join(" ")}
                >
                  <p className="text-[11px] uppercase tracking-[0.22em] opacity-70">Module {index + 1}</p>
                  <p className="mt-1 font-semibold">{entry.title}</p>
                </button>
              ))}
            </div>
          </aside>

          <section className="space-y-6">
            <article className="rounded-[1.75rem] border border-navy/10 bg-white p-6 shadow-horizon">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ember">Module overview</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-navy">{module.title}</h2>
                </div>
                <div className="rounded-full border border-navy/10 bg-[#fcf8ef] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-navy/62">
                  {module.quiz_questions.length} question check
                </div>
              </div>
              <p className="mt-4 text-base leading-8 text-navy/76">{module.overview}</p>
            </article>

            <article className="rounded-[1.75rem] border border-navy/10 bg-[#fcf8ef] p-6 shadow-horizon">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ember">What to learn</p>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {module.learning_objectives.map((objective) => (
                  <div key={objective} className="rounded-2xl border border-navy/10 bg-white px-4 py-4 text-sm leading-6 text-navy/78">
                    {objective}
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[1.75rem] border border-navy/10 bg-white p-6 shadow-horizon">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ember">Lesson content</p>
              <div className="mt-4 space-y-5">
                {renderLessonBody(module.lesson_body_markdown)}
              </div>
            </article>

            <article className="rounded-[1.75rem] border border-navy/10 bg-[#fcf8ef] p-6 shadow-horizon">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ember">Key takeaways</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {module.key_takeaways.map((takeaway) => (
                  <div key={takeaway} className="flex items-start gap-3 rounded-2xl border border-navy/10 bg-white px-4 py-4 text-sm leading-7 text-navy/78">
                    <GraduationCap className="mt-1 h-4 w-4 text-ember" />
                    <span>{takeaway}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[1.75rem] border border-navy/10 bg-white p-6 shadow-horizon">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ember">Knowledge check</p>
              <div className="mt-5 space-y-4">
                {module.quiz_questions.map((quiz, index) => {
                  const key = `${module.module_id}-${index}`;
                  const isOpen = Boolean(revealed[key]);
                  const selectedChoice = responses[key];
                  const isCorrect = selectedChoice === quiz.answer;
                  return (
                    <div key={key} className="rounded-[1.25rem] border border-navy/10 bg-paper px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <p className="font-semibold text-navy">{index + 1}. {quiz.question}</p>
                        <span className="rounded-full border border-navy/10 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-navy/55">
                          Knowledge check
                        </span>
                      </div>
                      <div className="mt-3 space-y-2 text-sm leading-6 text-navy/76">
                        {quiz.choices.map((choice) => (
                          <button
                            key={choice}
                            type="button"
                            onClick={() => setResponses((state) => ({ ...state, [key]: choice }))}
                            className={[
                              "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition",
                              selectedChoice === choice
                                ? "border-ember/40 bg-white text-navy"
                                : "border-transparent bg-white hover:border-navy/10"
                            ].join(" ")}
                          >
                            <span className={[
                              "mt-1 h-4 w-4 rounded-full border",
                              selectedChoice === choice ? "border-ember bg-ember/15" : "border-navy/20"
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
                          className="rounded-full border border-navy/10 bg-white px-4 py-2 text-sm font-semibold text-navy transition hover:border-ember/40 hover:text-ember disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          Check answer
                        </button>
                        {isOpen ? (
                          <button
                            type="button"
                            onClick={() => setRevealed((state) => ({ ...state, [key]: false }))}
                            className="rounded-full border border-navy/10 bg-white px-4 py-2 text-sm font-semibold text-navy transition hover:border-ember/40 hover:text-ember"
                          >
                            Hide feedback
                          </button>
                        ) : null}
                      </div>
                      {isOpen ? (
                        <div className={[
                          "mt-4 rounded-xl border px-4 py-4 text-sm leading-7",
                          isCorrect ? "border-green-200 bg-green-50 text-navy/82" : "border-ember/20 bg-white text-navy/78"
                        ].join(" ")}>
                          <p className="font-semibold text-navy">
                            {isCorrect ? "Correct." : "Review this one again."}
                          </p>
                          <p className="mt-2"><span className="font-semibold text-navy">Answer:</span> {quiz.answer}</p>
                          <p className="mt-2"><span className="font-semibold text-navy">Why:</span> {quiz.rationale}</p>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="rounded-[1.75rem] border border-navy/10 bg-navy p-6 text-paper shadow-horizon">
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
            <div className="rounded-[1.75rem] border border-navy/10 bg-white p-6 shadow-horizon">
              <div className="flex items-center gap-3">
                <div className="rounded-full border border-navy/10 bg-[#fcf8ef] p-3 text-ember">
                  <ClipboardCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember">How to use this page</p>
                  <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-navy">Review the content, check your answers, then move into rehearsal.</p>
                </div>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-navy/78">
                <p>Use <span className="font-semibold text-navy">Certification</span> to confirm the substance and practice how you would explain it.</p>
                <p>Move to <span className="font-semibold text-navy">Presenter</span> when you are ready to rehearse timing, transitions, and audience handling.</p>
                <p>Open <span className="font-semibold text-navy">Resources</span> when you need downloadable materials or follow-up links.</p>
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-navy/10 bg-navy p-6 text-paper shadow-horizon">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Downloadables</p>
              <div className="mt-5 space-y-3">
                {downloads.map((asset) => (
                  <a key={asset.asset_id} href={asset.href} className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-4 transition hover:border-gold/40 hover:text-gold">
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
