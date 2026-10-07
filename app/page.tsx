"use client";

/* =========================================================
    IMPORTS
  ========================================================= */

import React, {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import PresentesSection from "./components/PresentesSection";
import { Input, TextArea, Section } from "./components/ui";
import { GOOGLE_SCRIPT_URL } from "./lib/constants";
import { cleanText, formatPhone } from "./lib/format";

/* =========================================================
    TYPES
  ========================================================= */

type RsvpData = {
  name: string;
  email: string;
  phone: string;
  guests: string;
  guestNames: string;
  message: string;
};

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

type RsvpConfirmation = {
  name: string;
  email: string;
  guests: string;
} | null;

/* =========================================================
    CONSTANTES
  ========================================================= */

const GOOGLE_MAPS_URL = "https://maps.app.goo.gl/L1cr1U27FxV6tqaUA";

const WEDDING_DATE = new Date("2027-01-15T17:00:00");
const LIGHT_PARTICLE_INDICES = Array.from({ length: 18 }, (_, index) => index);
const MUSIC_START_TIME = 261;
const MUSIC_VOLUME = 0.35;
const MUSIC_FADE_IN_DURATION = 1800;
const MUSIC_FADE_OUT_DURATION = 1200;
const GOOGLE_MAPS_QR_CODE = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(GOOGLE_MAPS_URL)}`;


/* =========================================================
    COMPONENTE PRINCIPAL
  ========================================================= */

export default function WeddingSite() {
  /* =========================================================
      REFS
    ========================================================= */
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioFadeRef = useRef<number | null>(null);

  /* =========================================================
      STATES
    ========================================================= */

  const [musicPlaying, setMusicPlaying] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [rsvpData, setRsvpData] = useState<RsvpData>({
    name: "",
    email: "",
    phone: "",
    guests: "",
    guestNames: "",
    message: "",
  });

  const [feedback, setFeedback] = useState<Feedback>(null);
  const [rsvpConfirmation, setRsvpConfirmation] =
    useState<RsvpConfirmation>(null);
  const [loadingScreen, setLoadingScreen] = useState(true);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const difference = WEDDING_DATE.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
      }
    };

    updateCountdown();

    const interval = setInterval(updateCountdown, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0;

    return () => {
      if (audioFadeRef.current) {
        window.clearInterval(audioFadeRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoadingScreen(false), 4000);
    return () => window.clearTimeout(timer);
  }, []);

  function showFeedback(type: "success" | "error", message: string) {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback(null), 4200);
  }

  function stopAudioFade() {
    if (audioFadeRef.current) {
      window.clearInterval(audioFadeRef.current);
      audioFadeRef.current = null;
    }
  }

  function fadeAudioVolume(
    audio: HTMLAudioElement,
    targetVolume: number,
    duration: number,
    onComplete?: () => void,
  ) {
    stopAudioFade();

    const startVolume = audio.volume;
    const startTime = performance.now();

    audioFadeRef.current = window.setInterval(() => {
      const progress = Math.min((performance.now() - startTime) / duration, 1);
      audio.volume = startVolume + (targetVolume - startVolume) * progress;

      if (progress >= 1) {
        stopAudioFade();
        audio.volume = targetVolume;
        onComplete?.();
      }
    }, 16);
  }

  async function playMusicWithFade() {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (audio.currentTime === 0) {
        audio.currentTime = MUSIC_START_TIME;
      }

      audio.volume = 0;
      await audio.play();
      setMusicPlaying(true);
      fadeAudioVolume(audio, MUSIC_VOLUME, MUSIC_FADE_IN_DURATION);
    } catch (error) {
      console.error("Erro ao tocar música:", error);
      setMusicPlaying(false);
    }
  }

  function pauseMusicWithFade() {
    const audio = audioRef.current;
    if (!audio) return;

    fadeAudioVolume(audio, 0, MUSIC_FADE_OUT_DURATION, () => {
      audio.pause();
      setMusicPlaying(false);
    });
  }

  /* =========================================================
      CONTROLE DE MÚSICA
    ========================================================= */

  async function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      await playMusicWithFade();
    } else {
      pauseMusicWithFade();
    }
  }

  async function restartMusicFromSelectedTime() {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = MUSIC_START_TIME;
    await playMusicWithFade();
  }

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    const nextValue = name === "phone" ? formatPhone(value) : value;

    setRsvpData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));
  }

  /* =========================================================
      RSVP
    ========================================================= */

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);

    const confirmedRsvp = {
      ...rsvpData,
      name: cleanText(rsvpData.name),
      email: cleanText(rsvpData.email),
      phone: rsvpData.phone,
      guests: cleanText(rsvpData.guests),
      guestNames: cleanText(rsvpData.guestNames),
      message: cleanText(rsvpData.message),
    };

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
          type: "rsvp",
          ...confirmedRsvp,
        }),
      });

      setRsvpConfirmation({
        name: confirmedRsvp.name,
        email: confirmedRsvp.email,
        guests: confirmedRsvp.guests,
      });

      showFeedback(
        "success",
        "Presença confirmada! Enviamos a confirmação para o e-mail informado.",
      );

      setRsvpData({
        name: "",
        email: "",
        phone: "",
        guests: "",
        guestNames: "",
        message: "",
      });
    } catch (error) {
      console.error(error);
      showFeedback(
        "error",
        error instanceof Error
          ? error.message
          : "Erro ao enviar confirmação. Tente novamente.",
      );
    } finally {
      setSending(false);
    }
  }

  /* =========================================================
      SCROLL E NAVEGAÇÃO
    ========================================================= */

  function smoothScrollTo(targetY: number, duration: number) {
    const startY = window.scrollY;
    const difference = targetY - startY;
    const startTime = performance.now();

    function step(currentTime: number) {
      const progress = Math.min((currentTime - startTime) / duration, 1);

      const ease =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      window.scrollTo(0, startY + difference * ease);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  function openSection(section: string) {
    setActiveSection(section);

    setTimeout(() => {
      const element = document.getElementById("conteudo");

      if (element) {
        const targetY =
          element.getBoundingClientRect().top + window.scrollY - 12;
        smoothScrollTo(targetY, 1100);
      }
    }, 150);
  }

  function goHome() {
    smoothScrollTo(0, 1200);

    setTimeout(() => {
      setActiveSection(null);
    }, 1200);
  }

  return (
    <div className="min-h-screen bg-[#f7f3ed] text-[#6d4c2f] font-serif overflow-x-hidden font-[var(--font-body)]">
      <style jsx global>{`
        @media (max-width: 768px) {
          html {
            scroll-behavior: auto;
          }

          * {
            -webkit-tap-highlight-color: transparent;
          }

          .mobile-soft {
            backdrop-filter: blur(10px) !important;
            box-shadow: 0 10px 24px rgba(80, 50, 20, 0.12) !important;
          }

          .mobile-no-heavy-animation {
            animation: none !important;
          }

          .mobile-hero-bg {
            transform: scale(1.01) !important;
            background-position: center top !important;
          }

          input,
          select,
          textarea {
            font-size: 16px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      {loadingScreen && <LoadingScreen />}
      <LightParticles />

      <a
        href="https://wa.me/556699766684?text=Olá!%20Gostaria%20de%20tirar%20uma%20dúvida%20sobre%20o%20casamento."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar com a noiva pelo WhatsApp"
        className="fixed bottom-4 right-4 md:bottom-7 md:right-7 z-50 flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-full border border-[#d9b56f]/70 bg-white/90 text-[#1f8f4d] shadow-[0_14px_34px_rgba(0,0,0,0.22),0_0_0_8px_rgba(217,181,111,0.10),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-white animate-[whatsappPulse_4.2s_ease-in-out_infinite] mobile-soft"
      >
        <svg
          viewBox="0 0 32 32"
          aria-hidden="true"
          className="h-6 w-6 md:h-7 md:w-7 fill-current"
        >
          <path d="M16.04 4C9.4 4 4 9.31 4 15.84c0 2.09.56 4.12 1.62 5.91L4 28l6.43-1.59a12.2 12.2 0 0 0 5.61 1.39C22.68 27.8 28 22.49 28 15.96 28 9.31 22.68 4 16.04 4Zm0 21.66c-1.78 0-3.51-.48-5.03-1.4l-.36-.21-3.81.94.96-3.66-.24-.38a9.7 9.7 0 0 1-1.48-5.11c0-5.34 4.46-9.68 9.96-9.68 5.38 0 9.84 4.46 9.84 9.8 0 5.34-4.42 9.7-9.84 9.7Zm5.46-7.26c-.3-.15-1.77-.86-2.05-.96-.27-.1-.47-.15-.67.15-.2.29-.77.95-.95 1.14-.17.2-.35.22-.65.07-.3-.15-1.27-.46-2.42-1.47-.9-.79-1.5-1.77-1.67-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.58-.92-2.16-.24-.56-.49-.49-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.29-1.05 1.01-1.05 2.47s1.08 2.87 1.23 3.07c.15.2 2.12 3.18 5.15 4.46.72.3 1.28.48 1.72.62.72.22 1.38.19 1.9.11.58-.09 1.77-.72 2.02-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35Z" />
        </svg>
      </a>

      <audio
        ref={audioRef}
        src="/musica.mp3"
        preload="auto"
        onEnded={restartMusicFromSelectedTime}
      />

      <button
        type="button"
        onClick={toggleMusic}
        className="fixed top-4 right-4 md:top-7 md:right-7 z-50 flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full border border-[#e7c98e]/70 bg-white/88 text-[#8a5b2b] shadow-[0_10px_28px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:bg-white animate-[musicPulse_4.4s_ease-in-out_infinite] mobile-soft"
        aria-label={musicPlaying ? "Pausar" : "Tocar"}
      >
        {musicPlaying ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M8 5h3v14H8zm5 0h3v14h-3z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4 ml-[2px]"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {rsvpConfirmation && (
        <div className="fixed inset-0 z-[65] bg-black/55 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="relative bg-white max-w-lg w-full rounded-[32px] p-7 md:p-8 shadow-[0_30px_80px_rgba(0,0,0,0.35)] text-center overflow-hidden animate-[modalEntrance_0.45s_ease-out_both]">
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#e9d0a9]/45 rounded-full blur-2xl" />
            <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-[#f4e7d3]/70 rounded-full blur-2xl" />

            <div className="relative">
              <div className="mx-auto mb-5 w-16 h-16 rounded-full bg-[#f7efe3] border border-[#e5cfad] flex items-center justify-center text-3xl shadow-inner">
                💍
              </div>

              <p className="uppercase tracking-[0.28em] text-[11px] text-[#b08a55] mb-3">
                presença confirmada
              </p>

              <h2 className="text-3xl md:text-4xl text-[#8a5b2b] mb-4 leading-tight">
                Obrigado, {rsvpConfirmation.name.split(" ")[0] || "convidado"}!
              </h2>

              <p className="text-[#6d4c2f] leading-7 mb-5">
                Sua confirmação foi recebida com carinho. Enviamos também uma
                mensagem de confirmação para o e-mail informado.
              </p>

              <div className="bg-[#fbf6ee] border border-[#eadcc7] rounded-3xl p-4 text-left mb-6">
                <p className="text-sm text-[#8a6a45] mb-2">
                  <strong>E-mail:</strong> {rsvpConfirmation.email}
                </p>
                {rsvpConfirmation.guests && (
                  <p className="text-sm text-[#8a6a45] mb-2">
                    <strong>Quantidade:</strong> {rsvpConfirmation.guests}{" "}
                    convidado(s)
                  </p>
                )}
                <p className="text-sm text-[#8a6a45] mb-2">
                  <strong>Data:</strong> 15 de Janeiro de 2027
                </p>
                <p className="text-sm text-[#8a6a45]">
                  <strong>Horário:</strong> 17:00
                </p>
              </div>

              <button
                type="button"
                onClick={() => setRsvpConfirmation(null)}
                className="w-full bg-[#8a5b2b] hover:bg-[#74491f] text-white py-3.5 rounded-2xl shadow-lg transition-all font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[70] max-w-[92vw] rounded-2xl px-5 py-3 text-sm md:text-base shadow-xl border ${
            feedback.type === "success"
              ? "bg-white text-[#5d7a3a] border-[#d8e7c4]"
              : "bg-white text-[#9a3d2f] border-[#f0c9c0]"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <section className="relative min-h-[100svh] flex items-center justify-center px-4 sm:px-6 py-8 sm:py-10 md:py-16 overflow-hidden isolate bg-[#100b07]">
        <div
          className="absolute inset-0 bg-cover bg-center animate-[heroBgBreath_18s_ease-in-out_infinite] mobile-hero-bg"
          style={{
            backgroundImage: "url('/fundo-site.png')",
            transform: "scale(1.02)",
          }}
        />

        {/* Escurecimento suave da imagem de fundo */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.35)_50%,rgba(0,0,0,0.50)_100%)]" />

        {/* Iluminação dourada suave no centro */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,218,146,0.12)_0%,transparent_68%)] mix-blend-screen" />

        <div className="relative max-w-[960px] w-full text-center text-white drop-shadow-[0_10px_34px_rgba(0,0,0,0.56)] px-1 sm:px-0">
          <p className="uppercase tracking-[0.16em] sm:tracking-[0.34em] md:tracking-[0.48em] text-[9px] sm:text-xs md:text-sm mb-4 sm:mb-5 md:mb-8 leading-5 animate-[organicReveal_1.05s_cubic-bezier(.2,.8,.2,1)_0.1s_both]">
            Um novo capítulo em nossa história começa
          </p>

          <h1 className="font-[var(--font-title)] text-[clamp(3.1rem,13.5vw,8.1rem)] mb-4 sm:mb-5 md:mb-7 leading-[0.88] tracking-[0.015em] drop-shadow-[0_12px_34px_rgba(0,0,0,0.86)] animate-[heroTitle_1.35s_cubic-bezier(.2,.8,.2,1)_0.25s_both]">
            <span className="inline-block bg-[linear-gradient(180deg,#fff8e8_0%,#f0d69a_42%,#c7963f_100%)] bg-clip-text text-transparent">Larissa</span>
            <span className="mx-2 inline-block text-[#f2ddb0]">&amp;</span>
            <span className="inline-block bg-[linear-gradient(180deg,#fff8e8_0%,#f0d69a_42%,#c7963f_100%)] bg-clip-text text-transparent">Vinicius</span>
          </h1>

          <p className="text-xl sm:text-2xl md:text-3xl mb-3 md:mb-4 drop-shadow-[0_4px_14px_rgba(0,0,0,0.58)] animate-[heroFadeUp_1s_ease-out_0.45s_both]">
            15 de Janeiro de 2027
          </p>

          <div className="mb-7 md:mb-11 flex items-center justify-center gap-5 animate-[heroFadeUp_1s_ease-out_0.6s_both]">
            <span className="h-px w-16 sm:w-20 bg-gradient-to-r from-transparent via-[#d9b56f] to-[#d9b56f]" />

            <p className="text-[#d9b56f] text-base md:text-lg font-semibold tracking-wide drop-shadow-[0_4px_14px_rgba(0,0,0,0.58)]">
              17:00 horas
            </p>

            <span className="h-px w-16 sm:w-20 bg-gradient-to-l from-transparent via-[#d9b56f] to-[#d9b56f]" />
          </div>

          <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl leading-7 md:leading-8 mb-7 md:mb-11 drop-shadow-[0_4px_14px_rgba(0,0,0,0.58)] px-2 animate-[heroFadeUp_1s_ease-out_0.75s_both]">
            Estamos muito felizes em compartilhar esse momento especial com
            vocês...
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4 max-w-3xl mx-auto mb-7 md:mb-12 animate-[heroFadeUp_1s_ease-out_0.9s_both]">
            {[
              ["Dias", timeLeft.days],
              ["Horas", timeLeft.hours],
              ["Minutos", timeLeft.minutes],
              ["Segundos", timeLeft.seconds],
            ].map(([label, value], index) => (
              <div
                key={String(label)}
                className="group relative overflow-hidden bg-white/12 backdrop-blur-2xl rounded-2xl md:rounded-3xl px-2.5 py-3.5 md:p-6 border border-[#e2be74]/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.38),inset_0_0_28px_rgba(255,231,179,0.08),0_18px_48px_rgba(0,0,0,0.28)] transition-all duration-300 hover:scale-[1.018] hover:bg-white/17 hover:border-[#f0d494]/48 before:absolute before:inset-0 before:bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.18),transparent)] before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700"
                style={{
                  animation: `heroFadeUp 0.9s ease-out ${0.95 + index * 0.08}s both`,
                }}
              >
                <div
                  key={String(value)}
                  className="relative z-10 font-[var(--font-title)] text-3xl min-[380px]:text-4xl sm:text-5xl md:text-6xl leading-none animate-[numberTick_0.34s_ease-out_both]"
                >
                  {value}
                </div>
                <div className="relative z-10 uppercase text-[9px] min-[380px]:text-[10px] md:text-sm mt-2 tracking-[0.18em] text-[#e7c98e] opacity-95">
                  {label}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4 max-w-3xl mx-auto animate-[heroFadeUp_1s_ease-out_1.18s_both]">
            <MenuButton
              icon="calendar"
              onClick={() => openSection("confirmacao")}
            >
              Confirmar Presença
            </MenuButton>

            <MenuButton icon="pin" onClick={() => openSection("local")}>
              Local
            </MenuButton>

            <MenuButton icon="gift" onClick={() => openSection("presentes")}>
              Presentes
            </MenuButton>

            <MenuButton icon="heart" onClick={() => openSection("historia")}>
              Nossa História
            </MenuButton>
          </div>
        </div>
      </section>

      {activeSection === "confirmacao" && (
        <Section id="conteudo" title="Confirmar Presença" onBack={goHome}>
          <div className="mb-6 rounded-[26px] border border-[#eadcc7] bg-white/64 p-5 text-center shadow-[0_16px_36px_rgba(80,50,20,0.08)]">
            <p className="font-[var(--font-title)] text-3xl text-[#8a5b2b] md:text-4xl">
              Sua presença tornará esse dia ainda mais especial.
            </p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#7a5b3a] md:text-base">
              Confirme com carinho para prepararmos cada detalhe da recepção.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 md:gap-6">
            <Input
              name="name"
              placeholder="Nome completo"
              value={rsvpData.name}
              onChange={handleChange}
              required
            />

            <Input
              name="email"
              type="email"
              placeholder="Seu e-mail"
              value={rsvpData.email}
              onChange={handleChange}
              required
            />

            <Input
              name="phone"
              type="tel"
              placeholder="Telefone com DDD"
              value={rsvpData.phone}
              onChange={handleChange}
              required
            />

            <Input
              name="guests"
              type="number"
              min="1"
              placeholder="Quantidade de convidados da família"
              value={rsvpData.guests}
              onChange={handleChange}
            />

            <TextArea
              name="guestNames"
              placeholder="Nome dos convidados da família"
              value={rsvpData.guestNames}
              onChange={handleChange}
            />

            <TextArea
              name="message"
              placeholder="Mensagem para os noivos"
              value={rsvpData.message}
              onChange={handleChange}
            />

            <button
              type="submit"
              disabled={sending}
              className="bg-[#8a5b2b] hover:bg-[#74491f] disabled:opacity-60 text-white py-4 rounded-2xl shadow-lg text-base md:text-lg transition-all"
            >
              {sending ? "Enviando..." : "Confirmar Presença"}
            </button>
          </form>
        </Section>
      )}

      {activeSection === "local" && (
        <Section id="conteudo" title="Local da Cerimônia" onBack={goHome}>
          <div className="grid gap-6 md:grid-cols-[1.05fr_0.95fr] md:items-center">
            <div className="text-center md:text-left">
              <p className="font-[var(--font-title)] text-3xl md:text-5xl text-[#8a5b2b] mb-3">
                Cerradu&apos;s Festa e Lazer
              </p>

              <p className="text-base md:text-lg mb-6 leading-8 text-[#6d4c2f]">
                Toque no botão para abrir a rota ou escaneie o QR Code com a
                câmera do celular.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <a
                  href={GOOGLE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex justify-center items-center bg-[#8a5b2b] hover:bg-[#74491f] text-white px-6 md:px-5 sm:px-8 py-4 rounded-2xl shadow-lg transition-all hover:-translate-y-0.5"
                >
                  Abrir no Google Maps
                </a>

                <a
                  href={`https://waze.com/ul?q=${encodeURIComponent("Cerradu's Festa e Lazer")}&navigate=yes`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex justify-center items-center bg-[#f7efe3]/90 border border-[#caa36d] text-[#8a5b2b] px-6 md:px-5 sm:px-8 py-4 rounded-2xl shadow-md transition-all hover:bg-white hover:-translate-y-0.5"
                >
                  Abrir no Waze
                </a>
              </div>
            </div>

            <div className="mx-auto w-full max-w-xs rounded-[32px] border border-white/70 bg-white/65 backdrop-blur-2xl p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_24px_60px_rgba(80,50,20,0.16)] text-center">
              <img
                src={GOOGLE_MAPS_QR_CODE}
                alt="QR Code do local do casamento"
                className="mx-auto rounded-2xl bg-white p-3 shadow-inner"
                loading="lazy"
                decoding="async"
              />
              <p className="mt-4 text-sm text-[#7a5b3a] leading-6">
                Escaneie para abrir a localização no Google Maps.
              </p>
            </div>
          </div>
        </Section>
      )}

      <PresentesSection
        active={activeSection === "presentes"}
        onBack={goHome}
        showFeedback={showFeedback}
      />

      {activeSection === "historia" && (
        <Section id="conteudo" title="Nossa História" onBack={goHome}>
          <p className="text-base md:text-lg leading-8 md:leading-9 text-center">
            A história do casal se inicia de forma simples, mas com os planos de
            Deus sendo escritos em cada detalhe. O noivo morava em Itaúba e a
            noiva em Sinop. Em 2022, o noivo começou a frequentar a mesma igreja
            que a noiva já fazia parte. Sem imaginar o que o futuro reservava,
            os dois passaram a compartilhar o mesmo ambiente de fé, comunhão e
            adoração. Com o passar do tempo, o noivo começou a olhar para a
            noiva com carinho e admiração. Em oração, apresentou a Deus o desejo
            que nascia em seu coração e, com muita fé, escreveu esse pedido em
            um papel que foi levado pelo pastor da igreja em uma viagem para
            Israel. O tempo continuou seguindo seu curso, e aos poucos os dois
            começaram a se aproximar mais. A afinidade cresceu naturalmente,
            especialmente porque ambos serviam juntos no departamento de louvor
            da igreja, unidos pelo mesmo propósito e amor pela presença de Deus.
            Entre conversas, risadas, ensaios e momentos compartilhados, nasceu
            uma linda história de amor. Até que, no dia 10 de setembro de 2023,
            aconteceu o tão esperado pedido de namoro — um momento marcante que
            deu início oficialmente à caminhada dos dois como casal. Hoje,
            depois de tantos planos, orações e confirmações, eles estão noivos e
            prestes a viver uma nova etapa de suas vidas: o casamento. Uma
            história construída com fé, amizade, amor e a certeza de que tudo
            aconteceu no tempo perfeito de Deus.
          </p>
        </Section>
      )}

      <style jsx>{`
        @keyframes heroKicker {
          from {
            opacity: 0;
            transform: translateY(18px);
            filter: blur(4px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes heroTitle {
          from {
            opacity: 0;
            transform: translateY(26px) scale(0.96);
            filter: blur(7px);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes heroFadeUp {
          from {
            opacity: 0;
            transform: translateY(22px);
            filter: blur(5px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes heroBgBreath {
          0%,
          100% {
            filter: brightness(0.88) saturate(1.03) contrast(1.02);
          }

          50% {
            filter: brightness(1.01) saturate(1.1) contrast(1.05);
          }
        }

        @keyframes goldLight {
          0%,
          100% {
            opacity: 0.42;
            transform: translateX(-1.5%) scale(1);
          }

          50% {
            opacity: 0.72;
            transform: translateX(1.5%) scale(1.02);
          }
        }

        @keyframes numberTick {
          from {
            opacity: 0.75;
            transform: translateY(5px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        :global(:root) {
          --font-title: "Cormorant Garamond", Georgia, serif;
          --font-body: "Montserrat", system-ui, sans-serif;
        }

        :global(body) {
          font-family: var(--font-body);
          background: #f7f3ed;
        }

        :global(::selection) {
          background: rgba(215, 169, 69, 0.28);
          color: #5f371f;
        }

        :global(h1),
        :global(h2),
        :global(h3) {
          font-family: var(--font-title);
        }

        @keyframes organicReveal {
          from {
            opacity: 0;
            transform: translate3d(0, 24px, 0) scale(0.985);
            filter: blur(8px);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes sectionReveal {
          from {
            opacity: 0;
            transform: translateY(26px);
            filter: blur(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes cinemaGlow {
          0%,
          100% {
            opacity: 0.36;
            transform: translateX(-50%) scale(0.96);
          }
          50% {
            opacity: 0.66;
            transform: translateX(-50%) scale(1.04);
          }
        }

        @keyframes loaderScreenIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes loaderScreenOut {
          from {
            opacity: 1;
            visibility: visible;
          }
          to {
            opacity: 0;
            visibility: hidden;
          }
        }

        @keyframes loaderContentIn {
          from {
            opacity: 0;
            transform: translateY(22px) scale(0.97);
            filter: blur(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @keyframes loaderContentOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
          to {
            opacity: 0;
            transform: translateY(-18px) scale(1.025);
            filter: blur(8px);
          }
        }

        @keyframes musicPulse {
          0%,
          100% {
            box-shadow:
              0 10px 28px rgba(0, 0, 0, 0.20),
              inset 0 1px 0 rgba(255, 255, 255, 0.75);
          }

          50% {
            box-shadow:
              0 10px 28px rgba(0, 0, 0, 0.20),
              0 0 0 7px rgba(231, 201, 142, 0.10),
              inset 0 1px 0 rgba(255, 255, 255, 0.75);
          }
        }


        @keyframes whatsappPulse {
          0%,
          100% {
            box-shadow:
              0 10px 28px rgba(0, 0, 0, 0.22),
              inset 0 1px 0 rgba(255, 255, 255, 0.75);
          }

          50% {
            box-shadow:
              0 10px 28px rgba(0, 0, 0, 0.22),
              0 0 0 7px rgba(231, 201, 142, 0.10),
              inset 0 1px 0 rgba(255, 255, 255, 0.75);
          }
        }

        @keyframes modalEntrance {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#100b07] text-white animate-[loaderScreenIn_0.7s_ease-out_both,loaderScreenOut_0.85s_ease-in-out_3.15s_both]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(222,181,105,0.30),transparent_45%),linear-gradient(180deg,rgba(0,0,0,0.18),rgba(0,0,0,0.80))]" />
      <div className="absolute -top-32 left-1/2 h-80 w-[760px] -translate-x-1/2 rounded-full bg-[#e7c98e]/20 blur-3xl" />
      <div className="relative text-center px-6 animate-[loaderContentIn_1.1s_cubic-bezier(.2,.8,.2,1)_0.25s_both,loaderContentOut_0.75s_ease-in-out_3.05s_both]">
        <p className="uppercase tracking-[0.45em] text-[10px] md:text-xs text-[#e7c98e] mb-4">
          convite de casamento
        </p>
        <h2 className="font-[var(--font-title)] text-5xl md:text-7xl leading-none drop-shadow-[0_12px_38px_rgba(0,0,0,0.55)]">
          Larissa &amp; Vinicius
        </h2>
        <div className="mx-auto mt-7 h-[1px] w-40 bg-gradient-to-r from-transparent via-[#e7c98e] to-transparent" />
        <p className="mt-5 text-sm md:text-base text-white/74 tracking-[0.18em]">
          15 de Janeiro de 2027
        </p>
      </div>
    </div>
  );
}

function LightParticles() {
  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden hidden sm:block">
      {LIGHT_PARTICLE_INDICES.map((index) => (
        <span
          key={index}
          className="absolute rounded-full bg-white/70 animate-[lightFloat_9s_ease-in-out_infinite]"
          style={{
            left: `${(index * 17 + 9) % 100}%`,
            top: `${(index * 23 + 13) % 100}%`,
            width: `${2 + (index % 3)}px`,
            height: `${2 + (index % 3)}px`,
            opacity: 0.16 + (index % 4) * 0.04,
            boxShadow: "0 0 18px rgba(255, 231, 179, 0.65)",
            animationDelay: `${index * 0.55}s`,
            animationDuration: `${8 + (index % 5)}s`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes lightFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.12;
          }

          50% {
            transform: translate3d(12px, -18px, 0) scale(1.8);
            opacity: 0.34;
          }
        }
      `}</style>
    </div>
  );
}

type MenuButtonProps = {
  children: ReactNode;
  onClick: () => void;
  icon: "calendar" | "pin" | "gift" | "heart";
};

function MenuButton({ children, onClick, icon }: MenuButtonProps) {
  const icons = {
    calendar: (
      <path d="M7 2v3M17 2v3M3 8h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm4 9 2 2 4-5" />
    ),
    pin: (
      <path d="M12 21s7-5.3 7-12a7 7 0 1 0-14 0c0 6.7 7 12 7 12Zm0-9.5A2.5 2.5 0 1 0 12 6a2.5 2.5 0 0 0 0 5.5Z" />
    ),
    gift: (
      <path d="M20 12v9H4v-9M2 7h20v5H2V7Zm10 0v14M12 7H8.5A2.5 2.5 0 1 1 12 4.5V7Zm0 0h3.5A2.5 2.5 0 1 0 12 4.5V7Z" />
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
    ),
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl border border-white/75 bg-white/90 px-2.5 py-3 sm:px-3 sm:py-4 text-[#9b7634] shadow-[0_12px_32px_rgba(0,0,0,0.25)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:text-[#7b5820] hover:shadow-[0_18px_42px_rgba(0,0,0,0.32)]"
    >
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-[#d9b56f]/20 to-transparent -translate-x-full transition-transform duration-700 group-hover:translate-x-full" />

      <span className="relative z-10 flex items-center justify-center gap-1.5 sm:gap-2.5 text-[11px] min-[380px]:text-xs sm:text-sm md:text-base font-semibold">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-[#b58a3a]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {icons[icon]}
        </svg>

        <span className="leading-tight">{children}</span>
      </span>
    </button>
  );
}

