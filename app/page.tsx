'use client';

import React, {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useEffect,
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

export default function WeddingSite() {
  const weddingDate = new Date('2027-01-15T19:00:00');

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

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

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const difference = weddingDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [weddingDate]);

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

  function goHome() {
    setActiveSection(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-[#f7f3ed] text-[#6d4c2f] font-serif">
      <section className="relative overflow-hidden min-h-screen flex items-center justify-center px-6 py-16">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20" />

        <div className="relative max-w-5xl w-full text-center">
          <div className="bg-white/80 backdrop-blur-md rounded-[40px] shadow-2xl p-8 md:p-14 border border-[#d8b98a]">
            <div className="w-52 h-52 mx-auto rounded-full overflow-hidden border-4 border-[#b48b56] shadow-xl mb-8">
              <img
                src="https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=1974&auto=format&fit=crop"
                alt="Noivos"
                className="w-full h-full object-cover"
              />
            </div>

            <p className="uppercase tracking-[0.3em] text-sm text-[#9c7a4f] mb-4">
              Nosso Casamento
            </p>

            <h1 className="text-5xl md:text-7xl text-[#8a5b2b] mb-4">
              Larissa &amp; Vinicius
            </h1>

            <p className="text-xl md:text-2xl mb-6">15 de Janeiro de 2027</p>

            <p className="max-w-2xl mx-auto text-lg leading-8 mb-10">
              Estamos muito felizes em compartilhar esse momento especial com
              vocês.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
              {[
                ['Dias', timeLeft.days],
                ['Horas', timeLeft.hours],
                ['Minutos', timeLeft.minutes],
                ['Segundos', timeLeft.seconds],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="bg-white rounded-3xl p-6 shadow-lg border border-[#eadcc7]"
                >
                  <div className="text-4xl font-bold">{value}</div>
                  <div className="uppercase text-sm mt-2 tracking-widest">
                    {label}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              <MenuButton
                filled
                onClick={() => setActiveSection('confirmacao')}
              >
                Confirmar Presença
              </MenuButton>

              <MenuButton onClick={() => setActiveSection('local')}>
                Local
              </MenuButton>

              <MenuButton onClick={() => setActiveSection('presentes')}>
                Presentes
              </MenuButton>

              <MenuButton onClick={() => setActiveSection('historia')}>
                Nossa História
              </MenuButton>
            </div>
          </div>
        </div>
      </section>

      {activeSection === 'confirmacao' && (
        <Section title="Confirmar Presença" onBack={goHome}>
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
        <Section title="Local da Cerimônia" onBack={goHome}>
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
        <Section title="Lista de Presentes" wide onBack={goHome}>
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
        <Section title="Nossa História" onBack={goHome}>
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
  filled?: boolean;
};

function MenuButton({
  children,
  onClick,
  filled = false,
}: MenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        filled
          ? 'bg-[#8a5b2b] hover:bg-[#74491f] text-white py-4 rounded-2xl shadow-lg transition-all'
          : 'bg-white border border-[#caa36d] py-4 rounded-2xl shadow-lg hover:bg-[#f7efe3] transition-all'
      }
    >
      {children}
    </button>
  );
}

type SectionProps = {
  title: string;
  children: ReactNode;
  wide?: boolean;
  onBack?: () => void;
};

function Section({
  title,
  children,
  wide = false,
  onBack,
}: SectionProps) {
  return (
    <section
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