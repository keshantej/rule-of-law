"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Award, CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, GraduationCap, ShieldCheck } from "lucide-react";

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
        <div key={`heading-${index}`} className="border-t border-white/[0.06] pt-5 first:border-t-0 first:pt-0">
          <h3 className="text-lg font-semibold tracking-[-0.02em] text-white">{block.replace(/^###\s+/, "")}</h3>
        </div>
      );
    }

    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const listLines = lines.filter((line) => /^[-*]\s+/.test(line));

    if (listLines.length === lines.length) {
      return (
        <div key={`list-${index}`} className="space-y-2.5">
          {listLines.map((line) => (
            <div key={line} className="flex items-start gap-3 text-sm leading-7 text-white/55">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold/50" />
              <p className="flex-1">{line.replace(/^[-*]\s+/, "")}</p>
            </div>
          ))}
        </div>
      );
    }

    return (
      <p key={`paragraph-${index}`} className="text-sm leading-8 text-white/55">
        {block}
      </p>
    );
  });
}

export function CertificationShell({ lms, downloads }: CertificationShellProps) {
  const [moduleIndex, setModuleIndex] = useState(0);
  const [quizIndex, setQuizIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const module = lms.modules[Math.min(moduleIndex, Math.max(0, lms.modules.length - 1))];
  const quiz = module.quiz_questions[quizIndex];

  useEffect(() => {
    setQuizIndex(0);
  }, [moduleIndex]);

  const certificationChecklist = useMemo(
    () => [
      "Review the module overview and lesson content.",
      "Check the key takeaways before moving into the quiz.",
      "Complete each knowledge check and read the feedback.",
      "Move to Presenter when you are ready to rehearse."
    ],
    []
  );

  const answeredCount = module.quiz_questions.filter((_, index) => {
    const key = `${module.module_id}-${index}`;
    return Boolean(revealed[key]);
  }).length;

  const moduleCompletion = Math.round((answeredCount / Math.max(module.quiz_questions.length, 1)) * 100);
  const quizKey = `${module.module_id}-${quizIndex}`;
  const selectedChoice = responses[quizKey];
  const isOpen = Boolean(revealed[quizKey]);
  const isCorrect = selectedChoice === quiz?.answer;

  return (
    <main className="px-5 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/[0.06] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
              <Award className="h-3.5 w-3.5" />
              Certification
            </div>
            <h1 className="mt-5 text-3xl font-semibold leading-[1.12] tracking-[-0.04em] text-white md:text-5xl">
              Review the teaching points and complete the knowledge checks before presenting.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/55">
              Work through one module at a time. Read the lesson, review the takeaways, and use the quiz to confirm the main points before you rehearse.
            </p>
          </div>

          <aside className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/80">Module progress</p>
                <p className="mt-1.5 text-3xl font-semibold tracking-[-0.04em] text-white">{moduleCompletion}%</p>
              </div>
              <div className="rounded-xl bg-gold/10 p-2.5 text-gold">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full bg-gradient-to-r from-ember/80 to-gold/80 transition-all duration-300" style={{ width: `${moduleCompletion}%` }} />
            </div>
            <div className="mt-4 space-y-2">
              {certificationChecklist.map((item) => (
                <div key={item} className="flex items-start gap-2.5 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 text-xs leading-5 text-white/50">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/60" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
              <Link href="/presenter" className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-ink transition hover:bg-gold/90">
                Open presenter
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link href="/presentation" className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-medium text-paper/55 transition hover:border-gold/30 hover:text-gold">
                Open presentation
              </Link>
            </div>
          </aside>
        </section>

        {/* Module content */}
        <section className="grid gap-6 xl:grid-cols-[16rem_minmax(0,1fr)]">
          {/* Module list sidebar */}
          <aside className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/80">Modules</p>
            <div className="mt-3 space-y-1.5">
              {lms.modules.map((entry, index) => (
                <button
                  key={entry.module_id}
                  type="button"
                  onClick={() => setModuleIndex(index)}
                  className={[
                    "w-full rounded-lg px-3 py-3 text-left text-xs transition",
                    index === moduleIndex
                      ? "bg-gold/15 text-gold ring-1 ring-gold/20"
                      : "text-paper/45 hover:bg-white/[0.03] hover:text-paper/65"
                  ].join(" ")}
                >
                  <p className="text-[10px] uppercase tracking-[0.22em] opacity-60">Module {index + 1}</p>
                  <p className="mt-1 font-semibold">{entry.title}</p>
                </button>
              ))}
            </div>
          </aside>

          <div className="space-y-5">
            {/* Module overview + next step */}
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
              <article className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/80">Module overview</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">{module.title}</h2>
                <div className="mt-1 inline-block rounded-md bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-paper/35">
                  {module.quiz_questions.length} questions
                </div>
                <p className="mt-3 text-sm leading-7 text-white/55">{module.overview}</p>
              </article>

              <aside className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gold/10 p-2.5 text-gold">
                    <ClipboardCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/80">Next step</p>
                    <p className="mt-1 text-sm font-semibold text-white/80">Finish this module, then rehearse.</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-xs leading-6 text-white/45">
                  <p>Read the lesson content once without rushing.</p>
                  <p>Use the takeaways as short explanation notes.</p>
                  <p>Answer the quiz and review the feedback.</p>
                </div>
                <div className="mt-4 border-t border-white/[0.06] pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/80">Downloads</p>
                  <div className="mt-3 space-y-1.5">
                    {downloads.map((asset) => (
                      <a key={asset.asset_id} href={asset.href} className="block rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 text-xs transition hover:border-gold/20 hover:text-gold">
                        <p className="font-semibold text-paper/60">{asset.title}</p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-paper/30">{asset.format}</p>
                      </a>
                    ))}
                  </div>
                </div>
              </aside>
            </div>

            {/* Learning objectives + lesson content */}
            <article className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03]">
              <div className="border-b border-white/[0.06] p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/80">What to learn</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {module.learning_objectives.map((objective) => (
                    <div key={objective} className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3.5 text-xs leading-5 text-white/50">
                      {objective}
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_19rem]">
                <div className="p-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/80">Lesson content</p>
                  <div className="mt-4 space-y-4">
                    {renderLessonBody(module.lesson_body_markdown)}
                  </div>
                </div>
                <div className="border-t border-white/[0.06] p-6 lg:border-l lg:border-t-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/80">Key takeaways</p>
                  <div className="mt-4 space-y-2.5">
                    {module.key_takeaways.map((takeaway) => (
                      <div key={takeaway} className="flex items-start gap-2.5 rounded-xl border border-white/[0.04] bg-white/[0.02] px-3.5 py-3.5 text-xs leading-6 text-white/50">
                        <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/60" />
                        <span>{takeaway}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>

            {/* Quiz */}
            {quiz ? (
              <article className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/80">Knowledge check</p>
                    <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">
                      Question {quizIndex + 1} of {module.quiz_questions.length}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQuizIndex((value) => Math.max(value - 1, 0))}
                      disabled={quizIndex === 0}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-paper/55 transition hover:border-gold/30 hover:text-gold disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuizIndex((value) => Math.min(value + 1, module.quiz_questions.length - 1))}
                      disabled={quizIndex === module.quiz_questions.length - 1}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-paper/55 transition hover:border-gold/30 hover:text-gold disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      Next
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-5">
                  <p className="font-medium text-white/80">{quiz.question}</p>
                  <div className="mt-4 space-y-2 text-sm text-white/55">
                    {quiz.choices.map((choice) => (
                      <button
                        key={choice}
                        type="button"
                        onClick={() => setResponses((state) => ({ ...state, [quizKey]: choice }))}
                        className={[
                          "flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-xs transition",
                          selectedChoice === choice
                            ? "border-gold/30 bg-gold/[0.06] text-white/75"
                            : "border-white/[0.06] bg-white/[0.01] hover:border-white/10"
                        ].join(" ")}
                      >
                        <span className={[
                          "mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border",
                          selectedChoice === choice ? "border-gold bg-gold/20" : "border-white/15"
                        ].join(" ")} />
                        <span className="flex-1 leading-5">{choice}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setRevealed((state) => ({ ...state, [quizKey]: true }))}
                      disabled={!selectedChoice}
                      className="rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-ink transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-35"
                    >
                      Check answer
                    </button>
                    {isOpen ? (
                      <button
                        type="button"
                        onClick={() => setRevealed((state) => ({ ...state, [quizKey]: false }))}
                        className="rounded-lg border border-white/[0.08] px-4 py-2 text-xs font-medium text-paper/55 transition hover:border-gold/30 hover:text-gold"
                      >
                        Hide feedback
                      </button>
                    ) : null}
                  </div>

                  {isOpen ? (
                    <div className={[
                      "mt-4 rounded-xl border px-4 py-4 text-xs leading-6",
                      isCorrect
                        ? "border-green-500/20 bg-green-500/[0.06] text-white/70"
                        : "border-gold/20 bg-gold/[0.06] text-white/60"
                    ].join(" ")}>
                      <p className="font-semibold text-white/85">
                        {isCorrect ? "Correct." : "Review this one again."}
                      </p>
                      <p className="mt-2"><span className="font-semibold text-white/75">Answer:</span> {quiz.answer}</p>
                      <p className="mt-2"><span className="font-semibold text-white/75">Why:</span> {quiz.rationale}</p>
                    </div>
                  ) : null}
                </div>
              </article>
            ) : null}

            {/* Reflection */}
            <article className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/80">Reflection and discussion</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-4">
                  <p className="text-xs font-semibold text-white/70">Reflection prompts</p>
                  <div className="mt-3 space-y-2 text-xs leading-6 text-white/45">
                    {module.reflection_questions.map((question) => (
                      <p key={question}>{question}</p>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-4">
                  <p className="text-xs font-semibold text-white/70">Discussion prompt</p>
                  <p className="mt-3 text-xs leading-6 text-white/45">
                    {module.discussion_prompt || "Use this module as a basis for small-group discussion after review."}
                  </p>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}
