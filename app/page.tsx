'use client';

import React, {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

type RsvpData = {
  name: string;
  email: string;
  phone: string;
  guests: string;
  guestNames: string;
  message: string;
};

type Gift = {
  id: number;
  name: string;
  value: string;
  image: string;
};

const GOOGLE_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyh-Aeo2tH331m6XWV7xcTrlR9cE0e9hQyDDaAtx1W-TiMlpik4gRk3OOZ7oUVWWbE7/exec';

const GOOGLE_MAPS_URL = 'https://maps.app.goo.gl/L1cr1U27FxV6tqaUA';

const WEDDING_DATE = new Date('2027-01-15T19:00:00');
const MUSIC_START_TIME = 265;

type GiftResponse = {
  gifts?: Record<string, string>;
};

const gifts: Gift[] = [
  {
    id: 1,
    name: 'Air Fryer',
    value: 'R$ 350',
    image:
      'https://images.unsplash.com/photo-1585515656973-8d6f4f5f1c9f?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 2,
    name: 'Jogo de Panelas',
    value: 'R$ 500',
    image:
      'https://images.unsplash.com/photo-1584990347449-ae0f58f5f6b7?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 3,
    name: 'Micro-ondas',
    value: 'R$ 700',
    image:
      'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 4,
    name: 'Liquidificador',
    value: 'R$ 250',
    image:
      'https://images.unsplash.com/photo-1622480916113-5d9a8a9d57d5?q=80&w=1200&auto=format&fit=crop',
  },
];

export default function WeddingSite() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    name: '',
    email: '',
    phone: '',
    guests: '',
    guestNames: '',
    message: '',
  });

  const [giftReservations, setGiftReservations] = useState<
    Record<string, string>
  >({});

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

    function loadReservedGifts() {
      const callbackName = `carregarPresentes_${Date.now()}`;
      const script = document.createElement('script');

      (window as any)[callbackName] = (data: GiftResponse) => {
        if (data?.gifts) {
          setGiftReservations(data.gifts);
        }

        delete (window as any)[callbackName];
        script.remove();
      };

      script.src = `${GOOGLE_SCRIPT_URL}?callback=${callbackName}`;
      script.async = true;

      script.onerror = () => {
        console.error('Erro ao carregar presentes reservados.');
        delete (window as any)[callbackName];
        script.remove();
      };

      document.body.appendChild(script);

      return () => {
        delete (window as any)[callbackName];
        script.remove();
      };
    }

    updateCountdown();
    const removeScript = loadReservedGifts();

    const interval = setInterval(updateCountdown, 1000);

    return () => {
      clearInterval(interval);
      removeScript();
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    audio.volume = 0.35;
  }, []);

  async function toggleMusic() {
    const audio = audioRef.current;

    if (!audio) return;

    try {
      if (audio.paused) {
        if (audio.currentTime === 0) {
          audio.currentTime = MUSIC_START_TIME;
        }

        await audio.play();
        setMusicPlaying(true);
      } else {
        audio.pause();
        setMusicPlaying(false);
      }
    } catch (error) {
      console.error('Erro ao tocar música:', error);
      setMusicPlaying(false);
    }
  }

  async function restartMusicFromSelectedTime() {
    const audio = audioRef.current;

    if (!audio) return;

    audio.currentTime = MUSIC_START_TIME;

    try {
      await audio.play();
      setMusicPlaying(true);
    } catch (error) {
      console.error('Erro ao reiniciar música:', error);
      setMusicPlaying(false);
    }
  }

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    setRsvpData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          type: 'rsvp',
          ...rsvpData,
        }),
      });

      alert('Presença confirmada com sucesso!');

      setRsvpData({
        name: '',
        email: '',
        phone: '',
        guests: '',
        guestNames: '',
        message: '',
      });
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar confirmação.');
    } finally {
      setSending(false);
    }
  }

  async function reserveGift(gift: Gift) {
    const guestName = window.prompt(
      'Digite seu nome para reservar este presente:'
    );

    if (!guestName || guestName.trim() === '') return;

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({
          type: 'gift',
          giftName: gift.name,
          giftValue: gift.value,
          guestName: guestName.trim(),
        }),
      });

      setGiftReservations((prev) => ({
        ...prev,
        [gift.name]: guestName.trim(),
      }));

      alert(`${guestName.trim()} reservou ${gift.name}.`);
    } catch (error) {
      console.error(error);
      alert('Erro ao reservar presente.');
    }
  }

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
      const element = document.getElementById('conteudo');

      if (element) {
        const targetY =
          element.getBoundingClientRect().top + window.scrollY - 30;

        smoothScrollTo(targetY, 1400);
      }
    }, 200);
  }

  function goHome() {
    setActiveSection(null);
    smoothScrollTo(0, 1200);
  }

  return (
    <div className="min-h-screen bg-[#f7f3ed] text-[#6d4c2f] font-serif">
      <FallingFlowers />
      <audio
        ref={audioRef}
        src="/musica.mp3"
        preload="auto"
        onEnded={restartMusicFromSelectedTime}
      />

      <button
        type="button"
        onClick={toggleMusic}
        className="fixed bottom-4 right-4 z-50 bg-white/80 text-[#8a5b2b] border border-white/70 backdrop-blur-md px-4 py-3 rounded-full shadow-lg hover:bg-[#8a5b2b] hover:text-white transition-all text-sm"
        aria-label={musicPlaying ? 'Pausar música' : 'Tocar música'}
      >
        {musicPlaying ? '⏸ Música' : '▶ Música'}
      </button>

      <section className="relative min-h-screen flex items-center justify-center px-6 py-16 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(rgba(35, 25, 20, 0.45), rgba(35, 25, 20, 0.55)), url('/fundo-site.png')",
          }}
        />

        <div className="absolute inset-0 bg-[#f7efe3]/10 backdrop-blur-[1px]" />

        <div className="relative max-w-4xl w-full text-center text-white">
          <p className="uppercase tracking-[0.45em] text-sm mb-6">
            Um novo capítulo da nossa história começa
          </p>

          <h1 className="text-6xl md:text-8xl font-serif mb-6 drop-shadow-lg">
            Larissa &amp; Vinicius
          </h1>

          <p className="text-2xl md:text-3xl mb-4 drop-shadow">
            15 de Janeiro de 2027
          </p>

          <p className="max-w-2xl mx-auto text-lg md:text-xl leading-8 mb-12 drop-shadow">
            Estamos muito felizes em compartilhar esse momento especial com
            vocês...
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-12">
            {[
              ['Dias', timeLeft.days],
              ['Horas', timeLeft.hours],
              ['Minutos', timeLeft.minutes],
              ['Segundos', timeLeft.seconds],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="bg-white/20 backdrop-blur-md rounded-3xl p-6 border border-white/40 shadow-xl"
              >
                <div className="text-4xl font-bold">{value}</div>
                <div className="uppercase text-sm mt-2 tracking-widest">
                  {label}
                </div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <MenuButton onClick={() => openSection('confirmacao')}>
              Confirmar Presença
            </MenuButton>

            <MenuButton onClick={() => openSection('local')}>
              Local
            </MenuButton>

            <MenuButton onClick={() => openSection('presentes')}>
              Presentes
            </MenuButton>

            <MenuButton onClick={() => openSection('historia')}>
              Nossa História
            </MenuButton>
          </div>
        </div>
      </section>

      {activeSection === 'confirmacao' && (
        <Section id="conteudo" title="Confirmar Presença" onBack={goHome}>
          <form onSubmit={handleSubmit} className="grid gap-6">
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
              placeholder="Telefone"
              value={rsvpData.phone}
              onChange={handleChange}
            />

            <Input
              name="guests"
              type="number"
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
              className="bg-[#8a5b2b] hover:bg-[#74491f] disabled:opacity-60 text-white py-4 rounded-2xl shadow-lg text-lg transition-all"
            >
              {sending ? 'Enviando...' : 'Confirmar Presença'}
            </button>
          </form>
        </Section>
      )}

      {activeSection === 'local' && (
        <Section id="conteudo" title="Local da Cerimônia" onBack={goHome}>
          <div className="text-center">
            <p className="text-2xl mb-4">Cerradu&apos;s Festa e Lazer</p>

            <p className="text-lg mb-8">
              Clique no botão abaixo para abrir a rota no Google Maps.
            </p>

            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#8a5b2b] hover:bg-[#74491f] text-white px-8 py-4 rounded-2xl shadow-lg transition-all"
            >
              Abrir no Google Maps
            </a>
          </div>
        </Section>
      )}

      {activeSection === 'presentes' && (
        <Section id="conteudo" title="Lista de Presentes" wide onBack={goHome}>
          <div className="grid md:grid-cols-2 gap-8">
            {gifts.map((gift) => {
              const reservedBy = giftReservations[gift.name];

              return (
                <div
                  key={gift.id}
                  className="border border-[#eadcc7] rounded-[30px] overflow-hidden shadow-lg"
                >
                  <img
                    src={gift.image}
                    alt={gift.name}
                    className="w-full h-64 object-cover"
                  />

                  <div className="p-6">
                    <h3 className="text-3xl mb-3">{gift.name}</h3>
                    <p className="text-xl mb-3">{gift.value}</p>

                    {reservedBy ? (
                      <>
                        <p className="mb-4 text-green-700 font-semibold">
                          Reservado por {reservedBy}
                        </p>

                        <button
                          type="button"
                          disabled
                          className="w-full bg-gray-400 text-white py-3 rounded-2xl cursor-not-allowed"
                        >
                          Presente Reservado
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => reserveGift(gift)}
                        className="w-full bg-[#8a5b2b] hover:bg-[#74491f] text-white py-3 rounded-2xl transition-all"
                      >
                        Quero Presentear
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {activeSection === 'historia' && (
        <Section id="conteudo" title="Nossa História" onBack={goHome}>
          <p className="text-lg leading-9 text-center">
            Deus mudou o teu caminho até juntares com o meu e guardou a tua
            vida separando-a para mim. Para onde fores, irei. Onde tu
            repousares, repousarei. Teu Deus será o meu Deus. Teu caminho o meu
            será.
          </p>
        </Section>
      )}
    </div>
  );
}

type MenuButtonProps = {
  children: ReactNode;
  onClick: () => void;
};

function MenuButton({ children, onClick }: MenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white/90 text-[#8a5b2b] border border-white/70 hover:bg-[#8a5b2b] hover:text-white py-4 rounded-2xl shadow-lg transition-all font-semibold"
    >
      {children}
    </button>
  );
}

type SectionProps = {
  id?: string;
  title: string;
  children: ReactNode;
  wide?: boolean;
  onBack?: () => void;
};

function Section({
  id,
  title,
  children,
  wide = false,
  onBack,
}: SectionProps) {
  return (
    <section
      id={id}
      className={`${wide ? 'max-w-6xl' : 'max-w-4xl'} mx-auto px-6 py-20`}
    >
      <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-2xl border border-[#eadcc7]">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <h2 className="text-4xl text-[#8a5b2b] text-center md:text-left">
            {title}
          </h2>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="bg-[#f7efe3] border border-[#caa36d] px-4 py-2 rounded-xl hover:bg-white"
            >
              Voltar ao Início
            </button>
          )}
        </div>

        {children}
      </div>
    </section>
  );
}

type InputProps = {
  name: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
};

function Input({ type = 'text', ...props }: InputProps) {
  return (
    <input
      type={type}
      className="p-4 rounded-2xl border border-[#d9c3a4] outline-none w-full"
      {...props}
    />
  );
}

type TextAreaProps = {
  name: string;
  placeholder: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
};

function TextArea(props: TextAreaProps) {
  return (
    <textarea
      rows={4}
      className="p-4 rounded-2xl border border-[#d9c3a4] outline-none w-full"
      {...props}
    />
  );
}

function FallingFlowers() {
  const petals = Array.from({ length: 18 });

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {petals.map((_, index) => (
        <span
          key={index}
          className="absolute block rounded-full animate-[petalFall_18s_linear_infinite]"
          style={{
            left: `${(index * 6.7) % 100}%`,
            top: '-40px',
            width: `${10 + (index % 4) * 3}px`,
            height: `${16 + (index % 5) * 3}px`,
            background:
              'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95), rgba(244,179,195,0.75) 45%, rgba(213,122,145,0.45) 100%)',
            boxShadow: '0 2px 8px rgba(255, 190, 205, 0.35)',
            opacity: 0.55,
            transform: `rotate(${index * 23}deg)`,
            animationDelay: `${index * 1.4}s`,
            animationDuration: `${16 + (index % 6)}s`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes petalFall {
          0% {
            transform: translate3d(0, -10vh, 0) rotate(0deg);
            opacity: 0;
          }

          10% {
            opacity: 0.45;
          }

          35% {
            transform: translate3d(35px, 35vh, 0) rotate(90deg);
          }

          65% {
            transform: translate3d(-25px, 70vh, 0) rotate(180deg);
          }

          90% {
            opacity: 0.4;
          }

          100% {
            transform: translate3d(20px, 110vh, 0) rotate(260deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}