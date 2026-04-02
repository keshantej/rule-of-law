"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, GraduationCap, ShieldCheck } from "lucide-react";

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
        <div key={`heading-${index}`} className="border-t border-ink/10 pt-5 first:border-t-0 first:pt-0">
          <h3 className="text-xl font-semibold tracking-[-0.03em] text-ink">{block.replace(/^###\s+/, "")}</h3>
        </div>
      );
    }

    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    const listLines = lines.filter((line) => /^[-*]\s+/.test(line));

    if (listLines.length === lines.length) {
      return (
        <div key={`list-${index}`} className="space-y-3">
          {listLines.map((line) => (
            <div key={line} className="flex items-start gap-3 text-sm leading-7 text-ink/78">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gold" />
              <p className="flex-1">{line.replace(/^[-*]\s+/, "")}</p>
            </div>
          ))}
        </div>
      );
    }

    return (
      <p key={`paragraph-${index}`} className="text-sm leading-8 text-ink/78">
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
    <main className="px-5 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Certification</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
              Review the teaching points and complete the knowledge checks before presenting.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-white/80">
              Work through one module at a time. Read the lesson, review the takeaways, and use the quiz to confirm the main points before you rehearse.
            </p>
          </div>

          <aside className="rounded-[1.75rem] border border-paper/10 bg-paper p-6 text-ink">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Module progress</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink">{moduleCompletion}%</p>
              </div>
              <div className="rounded-full border border-ink/10 bg-paper p-3 text-gold">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink/10">
              <div className="h-full rounded-full bg-gradient-to-r from-ember to-gold transition-all duration-300" style={{ width: `${moduleCompletion}%` }} />
            </div>
            <div className="mt-5 space-y-3">
              {certificationChecklist.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm leading-6 text-ink/78">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-gold" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-ink/10 pt-5">
              <Link href="/presenter" className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition hover:bg-ember">
                Open presenter
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/presentation" className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-gold/45 hover:text-gold">
                Open presentation
              </Link>
            </div>
          </aside>
        </section>

        <section className="grid gap-6 xl:grid-cols-[17rem_minmax(0,1fr)]">
          <aside className="rounded-[1.75rem] border border-paper/10 bg-paper p-5 text-ink">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Modules</p>
            <div className="mt-4 space-y-2">
              {lms.modules.map((entry, index) => (
                <button
                  key={entry.module_id}
                  type="button"
                  onClick={() => setModuleIndex(index)}
                  className={[
                    "w-full rounded-2xl px-4 py-4 text-left text-sm transition",
                    index === moduleIndex ? "bg-ink text-paper" : "bg-white text-ink/80 hover:border-gold/40"
                  ].join(" ")}
                >
                  <p className="text-[11px] uppercase tracking-[0.22em] opacity-70">Module {index + 1}</p>
                  <p className="mt-1 font-semibold">{entry.title}</p>
                </button>
              ))}
            </div>
          </aside>

          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <article className="rounded-[1.75rem] border border-paper/10 bg-paper p-6 text-ink">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Module overview</p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-ink">{module.title}</h2>
                  </div>
                  <div className="rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-ink/58">
                    {module.quiz_questions.length} questions
                  </div>
                </div>
                <p className="mt-4 text-base leading-8 text-ink/78">{module.overview}</p>
              </article>

              <aside className="rounded-[1.75rem] border border-paper/10 bg-paper p-6 text-ink">
                <div className="flex items-center gap-3">
                  <div className="rounded-full border border-ink/10 bg-white p-3 text-gold">
                    <ClipboardCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Next step</p>
                    <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-ink">Finish this module, then rehearse in Presenter.</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3 text-sm leading-7 text-ink/74">
                  <p>Read the lesson content once without rushing.</p>
                  <p>Use the takeaways as your short explanation notes.</p>
                  <p>Answer the quiz and review the feedback before moving on.</p>
                </div>
                <div className="mt-5 border-t border-ink/10 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Downloads</p>
                  <div className="mt-3 space-y-2">
                    {downloads.map((asset) => (
                      <a key={asset.asset_id} href={asset.href} className="block rounded-xl border border-ink/10 bg-white px-3 py-3 text-sm transition hover:border-gold/40 hover:text-gold">
                        <p className="font-semibold text-ink">{asset.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-ink/52">{asset.format}</p>
                      </a>
                    ))}
                  </div>
                </div>
              </aside>
            </div>

            <article className="rounded-[1.75rem] border border-paper/10 bg-paper text-ink shadow-horizon">
              <div className="border-b border-ink/10 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">What to learn</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {module.learning_objectives.map((objective) => (
                    <div key={objective} className="rounded-2xl border border-ink/10 bg-white px-4 py-4 text-sm leading-6 text-ink/78">
                      {objective}
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Lesson content</p>
                  <div className="mt-4 space-y-5">
                    {renderLessonBody(module.lesson_body_markdown)}
                  </div>
                </div>
                <div className="border-t border-ink/10 p-6 lg:border-l lg:border-t-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Key takeaways</p>
                  <div className="mt-4 space-y-3">
                    {module.key_takeaways.map((takeaway) => (
                      <div key={takeaway} className="flex items-start gap-3 rounded-2xl border border-ink/10 bg-white px-4 py-4 text-sm leading-7 text-ink/78">
                        <GraduationCap className="mt-1 h-4 w-4 text-gold" />
                        <span>{takeaway}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>

            {quiz ? (
              <article className="rounded-[1.75rem] border border-paper/10 bg-paper p-6 text-ink">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Knowledge check</p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-ink">
                      Question {quizIndex + 1} of {module.quiz_questions.length}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuizIndex((value) => Math.max(value - 1, 0))}
                      disabled={quizIndex === 0}
                      className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-gold/45 hover:text-gold disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuizIndex((value) => Math.min(value + 1, module.quiz_questions.length - 1))}
                      disabled={quizIndex === module.quiz_questions.length - 1}
                      className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-gold/45 hover:text-gold disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.25rem] border border-ink/10 bg-white px-5 py-5">
                  <p className="font-semibold text-ink">{quiz.question}</p>
                  <div className="mt-4 space-y-2 text-sm leading-6 text-ink/78">
                    {quiz.choices.map((choice) => (
                      <button
                        key={choice}
                        type="button"
                        onClick={() => setResponses((state) => ({ ...state, [quizKey]: choice }))}
                        className={[
                          "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition",
                          selectedChoice === choice ? "border-gold/45 bg-paper text-ink" : "border-ink/10 bg-white hover:border-gold/35"
                        ].join(" ")}
                      >
                        <span className={[
                          "mt-1 h-4 w-4 rounded-full border",
                          selectedChoice === choice ? "border-gold bg-gold/15" : "border-ink/20"
                        ].join(" ")} />
                        <span className="flex-1">{choice}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setRevealed((state) => ({ ...state, [quizKey]: true }))}
                      disabled={!selectedChoice}
                      className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition hover:bg-ember disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Check answer
                    </button>
                    {isOpen ? (
                      <button
                        type="button"
                        onClick={() => setRevealed((state) => ({ ...state, [quizKey]: false }))}
                        className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-gold/45 hover:text-gold"
                      >
                        Hide feedback
                      </button>
                    ) : null}
                  </div>

                  {isOpen ? (
                    <div className={[
                      "mt-4 rounded-xl border px-4 py-4 text-sm leading-7",
                      isCorrect ? "border-green-300 bg-green-50 text-ink" : "border-gold/30 bg-paper text-ink/82"
                    ].join(" ")}>
                      <p className="font-semibold text-ink">
                        {isCorrect ? "Correct." : "Review this one again."}
                      </p>
                      <p className="mt-2"><span className="font-semibold text-ink">Answer:</span> {quiz.answer}</p>
                      <p className="mt-2"><span className="font-semibold text-ink">Why:</span> {quiz.rationale}</p>
                    </div>
                  ) : null}
                </div>
              </article>
            ) : null}

            <article className="rounded-[1.75rem] border border-paper/10 bg-paper p-6 text-ink">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Reflection and discussion</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-ink/10 bg-white px-4 py-4">
                  <p className="text-sm font-semibold text-ink">Reflection prompts</p>
                  <div className="mt-3 space-y-2 text-sm leading-7 text-ink/78">
                    {module.reflection_questions.map((question) => (
                      <p key={question}>{question}</p>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-ink/10 bg-white px-4 py-4">
                  <p className="text-sm font-semibold text-ink">Discussion prompt</p>
                  <p className="mt-3 text-sm leading-7 text-ink/78">
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
