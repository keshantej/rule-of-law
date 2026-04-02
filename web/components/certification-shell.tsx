"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, GraduationCap } from "lucide-react";

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
        <h3 key={`heading-${index}`} className="border-t border-white/[0.04] pt-5 text-base font-semibold text-white/80 first:border-t-0 first:pt-0">
          {block.replace(/^###\s+/, "")}
        </h3>
      );
    }

    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const listLines = lines.filter((line) => /^[-*]\s+/.test(line));

    if (listLines.length === lines.length) {
      return (
        <div key={`list-${index}`} className="space-y-2">
          {listLines.map((line) => (
            <div key={line} className="flex items-start gap-2.5 text-sm leading-7 text-white/45">
              <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-gold/40" />
              <p>{line.replace(/^[-*]\s+/, "")}</p>
            </div>
          ))}
        </div>
      );
    }

    return (
      <p key={`paragraph-${index}`} className="text-sm leading-7 text-white/45">
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
    <main className="px-5 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/70">Certification</p>
            <h1 className="mt-3 max-w-lg text-3xl font-semibold leading-[1.12] tracking-[-0.03em] text-white sm:text-4xl">
              Know the material before you present it.
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/45">
              Work through each module, then use the quiz to confirm your understanding.
            </p>
          </div>
          <aside className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/70">Progress</p>
              <p className="mt-1 text-2xl font-semibold text-white">{moduleCompletion}%</p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-gradient-to-r from-ember/80 to-gold/80 transition-all duration-300" style={{ width: `${moduleCompletion}%` }} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/presenter" className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3.5 py-2 text-xs font-semibold text-ink transition hover:bg-gold/90">
                Presenter
                <ArrowRight className="h-3 w-3" />
              </Link>
              <Link href="/presentation" className="rounded-lg border border-white/8 px-3.5 py-2 text-xs font-medium text-paper/40 transition hover:text-white/60">
                Presentation
              </Link>
            </div>
          </aside>
        </div>

        {/* Module content */}
        <section className="mt-12 grid gap-8 xl:grid-cols-[14rem_minmax(0,1fr)]">
          {/* Module list */}
          <nav>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/70">Modules</p>
            <div className="mt-3 space-y-0.5">
              {lms.modules.map((entry, index) => (
                <button
                  key={entry.module_id}
                  type="button"
                  onClick={() => setModuleIndex(index)}
                  className={[
                    "w-full rounded-lg px-3 py-2.5 text-left text-xs transition",
                    index === moduleIndex
                      ? "bg-white/[0.06] text-gold"
                      : "text-paper/35 hover:text-paper/55"
                  ].join(" ")}
                >
                  <p className="text-[10px] uppercase tracking-[0.2em] opacity-50">Module {index + 1}</p>
                  <p className="mt-0.5 font-medium">{entry.title}</p>
                </button>
              ))}
            </div>
          </nav>

          <div className="space-y-10">
            {/* Overview */}
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-white">{module.title}</h2>
              <p className="mt-2 text-sm leading-7 text-white/45">{module.overview}</p>
            </div>

            {/* Learning objectives */}
            <div className="grid gap-3 sm:grid-cols-3">
              {module.learning_objectives.map((objective) => (
                <div key={objective} className="rounded-xl bg-white/[0.02] px-4 py-3 text-xs leading-5 text-white/40 ring-1 ring-white/[0.04]">
                  {objective}
                </div>
              ))}
            </div>

            {/* Lesson + takeaways */}
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/70">Lesson</p>
                <div className="mt-4 space-y-4">
                  {renderLessonBody(module.lesson_body_markdown)}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/70">Key takeaways</p>
                <div className="mt-4 space-y-3">
                  {module.key_takeaways.map((takeaway) => (
                    <div key={takeaway} className="flex items-start gap-2 text-xs leading-5 text-white/40">
                      <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/40" />
                      <span>{takeaway}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quiz */}
            {quiz ? (
              <div className="border-t border-white/[0.04] pt-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/70">Knowledge check</p>
                    <p className="mt-1 text-sm text-white/35">Question {quizIndex + 1} of {module.quiz_questions.length}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQuizIndex((v) => Math.max(v - 1, 0))}
                      disabled={quizIndex === 0}
                      className="rounded-lg p-2 text-paper/30 transition hover:text-paper/60 disabled:opacity-30"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuizIndex((v) => Math.min(v + 1, module.quiz_questions.length - 1))}
                      disabled={quizIndex === module.quiz_questions.length - 1}
                      className="rounded-lg p-2 text-paper/30 transition hover:text-paper/60 disabled:opacity-30"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="mt-4 text-sm font-medium text-white/70">{quiz.question}</p>

                <div className="mt-4 space-y-1.5">
                  {quiz.choices.map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => setResponses((s) => ({ ...s, [quizKey]: choice }))}
                      className={[
                        "flex w-full items-start gap-3 rounded-lg px-4 py-3 text-left text-xs leading-5 transition",
                        selectedChoice === choice
                          ? "bg-gold/[0.08] text-white/70 ring-1 ring-gold/25"
                          : "text-white/40 hover:bg-white/[0.02]"
                      ].join(" ")}
                    >
                      <span className={[
                        "mt-0.5 h-3 w-3 shrink-0 rounded-full border",
                        selectedChoice === choice ? "border-gold bg-gold/25" : "border-white/15"
                      ].join(" ")} />
                      <span>{choice}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRevealed((s) => ({ ...s, [quizKey]: true }))}
                    disabled={!selectedChoice}
                    className="rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-ink transition hover:bg-gold/90 disabled:opacity-30"
                  >
                    Check
                  </button>
                  {isOpen ? (
                    <button
                      type="button"
                      onClick={() => setRevealed((s) => ({ ...s, [quizKey]: false }))}
                      className="rounded-lg border border-white/8 px-4 py-2 text-xs text-paper/40 transition hover:text-white/60"
                    >
                      Hide
                    </button>
                  ) : null}
                </div>

                {isOpen ? (
                  <div className={[
                    "mt-4 rounded-lg px-4 py-4 text-xs leading-6",
                    isCorrect
                      ? "bg-green-500/[0.06] text-white/60 ring-1 ring-green-500/15"
                      : "bg-gold/[0.06] text-white/50 ring-1 ring-gold/15"
                  ].join(" ")}>
                    <p className="font-semibold text-white/75">{isCorrect ? "Correct." : "Not quite — review below."}</p>
                    <p className="mt-1.5"><span className="text-white/60">Answer:</span> {quiz.answer}</p>
                    <p className="mt-1"><span className="text-white/60">Why:</span> {quiz.rationale}</p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Reflection */}
            <div className="border-t border-white/[0.04] pt-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/70">Reflection</p>
              <div className="mt-4 grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-white/55">Prompts</p>
                  <div className="mt-2 space-y-2 text-xs leading-5 text-white/35">
                    {module.reflection_questions.map((q) => <p key={q}>{q}</p>)}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-white/55">Discussion</p>
                  <p className="mt-2 text-xs leading-5 text-white/35">
                    {module.discussion_prompt || "Use this module as a basis for small-group discussion."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
