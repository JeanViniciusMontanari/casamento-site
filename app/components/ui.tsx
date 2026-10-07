"use client";

import { ChangeEvent, ReactNode } from "react";

/* =========================================================
    Input
  ========================================================= */

type InputProps = {
  name: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  min?: string;
  inputMode?:
    | "text"
    | "search"
    | "email"
    | "tel"
    | "url"
    | "none"
    | "numeric"
    | "decimal";
};

export function Input({ type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      className="p-4 rounded-2xl border border-[#d9c3a4]/80 bg-white/84 outline-none w-full text-base shadow-inner focus:border-[#8a5b2b] transition-all"
      {...props}
    />
  );
}

/* =========================================================
    TextArea
  ========================================================= */

type TextAreaProps = {
  name: string;
  placeholder: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
};

export function TextArea(props: TextAreaProps) {
  return (
    <textarea
      rows={4}
      className="p-4 rounded-2xl border border-[#d9c3a4]/80 bg-white/84 outline-none w-full text-base shadow-inner focus:border-[#8a5b2b] transition-all"
      {...props}
    />
  );
}

/* =========================================================
    Section
  ========================================================= */

type SectionProps = {
  id?: string;
  title: string;
  children: ReactNode;
  wide?: boolean;
  onBack?: () => void;
};

export function Section({ id, title, children, wide = false, onBack }: SectionProps) {
  return (
    <section
      id={id}
      className={`${wide ? "max-w-7xl" : "max-w-4xl"} mx-auto px-3 sm:px-4 md:px-6 py-8 md:py-14 sm:py-20 animate-[sectionReveal_0.75s_cubic-bezier(.2,.8,.2,1)_both]`}
    >
      <div className="relative overflow-hidden bg-white/72 backdrop-blur-2xl rounded-[24px] md:rounded-[40px] p-4 sm:p-5 md:p-12 shadow-[inset_0_1px_0_rgba(255,255,255,0.78),0_28px_80px_rgba(80,50,20,0.14)] border border-white/70 before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.75),transparent_32%)]">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center mb-6 md:mb-10 gap-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl text-[#8a5b2b] text-center md:text-left">
            {title}
          </h2>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="bg-[#f7efe3] border border-[#caa36d] px-4 py-2 rounded-xl hover:bg-white text-sm md:text-base"
            >
              Voltar ao Início
            </button>
          )}
        </div>

        <div className="relative z-10">{children}</div>
      </div>
    </section>
  );
}
