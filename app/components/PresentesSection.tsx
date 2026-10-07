"use client";

/* =========================================================
    IMPORTS
  ========================================================= */

import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Input } from "./ui";
import { GOOGLE_SCRIPT_URL } from "../lib/constants";
import { removeAccents } from "../lib/format";
import { Gift, gifts, PIX_GIFT_NAME } from "../lib/gifts-data";
import {
  GIFT_PRICE_REFRESH_INTERVAL_MS,
  GiftCategory,
  GiftFilter,
  GiftPriceResponse,
  GiftResponse,
  GiftSort,
  PIX_KEY,
  generatePixPayload,
  formatPixValue,
  getGiftCategory,
  normalizeGift,
  parseGiftPrice,
} from "../lib/gift-utils";

/* =========================================================
    TIPOS
  ========================================================= */

type PresentesSectionProps = {
  /** true quando a seção "presentes" está aberta na página */
  active: boolean;
  /** volta para a página inicial (mesmo handler usado pelas outras seções) */
  onBack: () => void;
  /** exibe a notificação de sucesso/erro compartilhada com o resto do site */
  showFeedback: (type: "success" | "error", message: string) => void;
};

/* =========================================================
    COMPONENTE: PRESENTES
    Tudo relacionado à lista de presentes, filtros, reserva e PIX
    fica isolado aqui. O page.tsx só precisa renderizar:
    <PresentesSection active={...} onBack={...} showFeedback={...} />
  ========================================================= */

export default function PresentesSection({
  active,
  onBack,
  showFeedback,
}: PresentesSectionProps) {
  /* ---------------------------------------------------------
      STATES
    --------------------------------------------------------- */

  const [pixPayload, setPixPayload] = useState("");
  const [pixQrCode, setPixQrCode] = useState("");
  const [showPixModal, setShowPixModal] = useState(false);

  const [giftReservations, setGiftReservations] = useState<
    Record<string, string>
  >({});
  const [giftPrices, setGiftPrices] = useState<Record<string, string>>({});
  const [giftPricesLoading, setGiftPricesLoading] = useState(false);
  const [giftPricesUpdatedAt, setGiftPricesUpdatedAt] = useState<string | null>(null);
  const [giftPricesStatus, setGiftPricesStatus] = useState<string | null>(null);

  const [giftSearch, setGiftSearch] = useState("");
  const [giftFilter, setGiftFilter] = useState<GiftFilter>("todos");
  const [giftSort, setGiftSort] = useState<GiftSort>("relevancia");
  const [giftCategory, setGiftCategory] = useState<GiftCategory>("todas");
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [giftGuestName, setGiftGuestName] = useState("");
  const [giftPixValue, setGiftPixValue] = useState("");
  const [giftSubmitting, setGiftSubmitting] = useState(false);
  const [visibleGiftCount, setVisibleGiftCount] = useState(16);

  /* ---------------------------------------------------------
      CARREGAR PRESENTES JÁ RESERVADOS (JSONP)
    --------------------------------------------------------- */

  useEffect(() => {
    const callbackName = `carregarPresentes_${Date.now()}`;
    const script = document.createElement("script");

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
      console.error("Erro ao carregar presentes reservados.");
      delete (window as any)[callbackName];
      script.remove();
    };

    document.body.appendChild(script);

    return () => {
      delete (window as any)[callbackName];
      script.remove();
    };
  }, []);

  /* ---------------------------------------------------------
      PREÇOS DOS PRESENTES (consulta nos anúncios)
    --------------------------------------------------------- */

  const loadGiftPrices = useRef(
    async (options?: { force?: boolean; signalCancelled?: () => boolean }) => {
      const products = gifts
        .filter((gift) => gift.name !== PIX_GIFT_NAME && gift.link)
        .map((gift) => ({ id: gift.id, url: gift.link!.trim() }));

      if (!products.length) return { ok: false as const };

      setGiftPricesLoading(true);

      try {
        const response = await fetch("/api/gift-prices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ products, force: options?.force === true }),
        });

        if (!response.ok) throw new Error("Falha ao consultar preços.");

        const data = (await response.json()) as GiftPriceResponse & {
          forced?: boolean;
        };

        if (!options?.signalCancelled?.()) {
          if (data?.prices) {
            setGiftPrices((previous) => ({
              ...previous,
              ...data.prices,
            }));
          }

          setGiftPricesUpdatedAt(data.updatedAt ?? new Date().toISOString());

          const total = Number(data.total ?? products.length);
          const updated = Number(data.updated ?? Object.keys(data.prices ?? {}).length);
          const failed = Array.isArray(data.failed) ? data.failed.length : 0;

          setGiftPricesStatus(
            failed > 0
              ? `${updated} preços consultados • ${failed} falharam; demais valores conforme cadastro`
              : `${updated} de ${total} preços consultados`,
          );

          if (failed > 0) {
            console.warn("Presentes que não puderam ser atualizados:", data.failed);
          }
        }

        return { ok: true as const, forced: Boolean(data?.forced), failed: data.failed ?? [] };
      } catch (error) {
        console.error("Erro ao atualizar preços dos presentes:", error);
        if (!options?.signalCancelled?.()) {
          setGiftPricesStatus("Não foi possível consultar os anúncios. Valores cadastrados exibidos.");
        }
        return { ok: false as const };
      } finally {
        if (!options?.signalCancelled?.()) setGiftPricesLoading(false);
      }
    },
  ).current;

  useEffect(() => {
    let cancelled = false;

    // Consulta inicial ao abrir o site.
    void loadGiftPrices({ signalCancelled: () => cancelled });

    // Consulta automática a cada 6 horas, forçando a busca nos anúncios.
    const interval = window.setInterval(() => {
      if (!cancelled && !document.hidden) {
        void loadGiftPrices({ force: true, signalCancelled: () => cancelled });
      }
    }, GIFT_PRICE_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [loadGiftPrices]);

  // Quando o usuário volta para a aba, também atualizamos os preços.
  useEffect(() => {
    function handleVisibilityChange() {
      if (!document.hidden) {
        void loadGiftPrices({ force: true });
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [loadGiftPrices]);

  // Atalho discreto (Ctrl/Cmd + Shift + P) para forçar uma atualização
  // dos preços dos presentes, ignorando o cache de 6h. Sem senha nem
  // token: apertou, o site busca os preços de novo nos anúncios.
  useEffect(() => {
    function handleForceRefreshShortcut(event: KeyboardEvent) {
      const isShortcut =
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        (event.key === "P" || event.key === "p");

      if (!isShortcut) return;

      event.preventDefault();
      event.stopPropagation();

      void loadGiftPrices({ force: true });
    }

    window.addEventListener("keydown", handleForceRefreshShortcut);
    return () => window.removeEventListener("keydown", handleForceRefreshShortcut);
  }, [loadGiftPrices]);

  /* ---------------------------------------------------------
      LISTA FILTRADA / ESTATÍSTICAS
    --------------------------------------------------------- */

  const normalizedGifts = useMemo(
    () =>
      gifts.map((gift) => {
        const normalized = normalizeGift(gift);
        const livePrice = giftPrices[String(gift.id)];

        return livePrice
          ? { ...normalized, value: livePrice }
          : normalized;
      }),
    [giftPrices],
  );

  const filteredGifts = useMemo(() => {
    const search = removeAccents(giftSearch).toLowerCase().trim();

    const result = normalizedGifts.filter((gift) => {
      const isPix = gift.name === PIX_GIFT_NAME;
      const reservedBy = isPix ? null : giftReservations[gift.name];
      const category = getGiftCategory(gift);
      const matchesSearch = removeAccents(gift.name)
        .toLowerCase()
        .includes(search);
      const matchesFilter =
        giftFilter === "todos" ||
        (giftFilter === "disponiveis" && !reservedBy) ||
        (giftFilter === "reservados" && !!reservedBy);
      const matchesCategory =
        giftCategory === "todas" || category === giftCategory;

      return matchesSearch && matchesFilter && matchesCategory;
    });

    return [...result].sort((a, b) => {
      if (giftSort === "menor-preco") {
        const aPrice = parseGiftPrice(a.value);
        const bPrice = parseGiftPrice(b.value);
        if (!Number.isFinite(aPrice)) return Number.isFinite(bPrice) ? 1 : 0;
        if (!Number.isFinite(bPrice)) return -1;
        return aPrice - bPrice;
      }
      if (giftSort === "maior-preco") {
        const aPrice = parseGiftPrice(a.value);
        const bPrice = parseGiftPrice(b.value);
        if (!Number.isFinite(aPrice)) return Number.isFinite(bPrice) ? 1 : 0;
        if (!Number.isFinite(bPrice)) return -1;
        return bPrice - aPrice;
      }
      if (giftSort === "az") return a.name.localeCompare(b.name, "pt-BR");
      return a.id - b.id;
    });
  }, [
    giftCategory,
    giftFilter,
    giftReservations,
    giftSearch,
    giftSort,
    normalizedGifts,
  ]);

  const giftStats = useMemo(() => {
    const reservableGifts = normalizedGifts.filter(
      (gift) => gift.name !== PIX_GIFT_NAME,
    );
    const reservedCount = reservableGifts.filter((gift) =>
      Boolean(giftReservations[gift.name]),
    ).length;
    const percentage = reservableGifts.length
      ? Math.round((reservedCount / reservableGifts.length) * 100)
      : 0;

    return {
      total: reservableGifts.length,
      reserved: reservedCount,
      available: reservableGifts.length - reservedCount,
      percentage,
    };
  }, [giftReservations, normalizedGifts]);

  useEffect(() => {
    setVisibleGiftCount(16);
  }, [giftCategory, giftFilter, giftSearch, giftSort]);

  const visibleGifts = filteredGifts.slice(0, visibleGiftCount);
  const hasMoreGifts = visibleGiftCount < filteredGifts.length;

  function clearGiftFilters() {
    setGiftSearch("");
    setGiftFilter("todos");
    setGiftSort("relevancia");
    setGiftCategory("todas");
  }

  /* ---------------------------------------------------------
      PIX (copiar código / chave)
    --------------------------------------------------------- */

  async function copyPixCode() {
    if (!pixPayload) {
      showFeedback("error", "Código PIX ainda não foi gerado.");
      return;
    }

    try {
      await navigator.clipboard.writeText(pixPayload.trim());
      showFeedback("success", "Código PIX copiado!");
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = pixPayload.trim();
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand("copy");
        showFeedback("success", "Código PIX copiado!");
      } catch {
        showFeedback(
          "error",
          "Não foi possível copiar automaticamente. Copie manualmente.",
        );
      }

      document.body.removeChild(textArea);
    }
  }

  async function copyPixKey() {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      showFeedback("success", "Chave PIX copiada!");
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = PIX_KEY;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand("copy");
        showFeedback("success", "Chave PIX copiada!");
      } catch {
        showFeedback(
          "error",
          "Não foi possível copiar a chave automaticamente.",
        );
      }

      document.body.removeChild(textArea);
    }
  }

  /* ---------------------------------------------------------
      RESERVAR / PRESENTEAR
    --------------------------------------------------------- */

  function openGiftModal(gift: Gift) {
    setSelectedGift(gift);
    setGiftGuestName("");
    setGiftPixValue("");
  }

  function closeGiftModal() {
    if (giftSubmitting) return;

    setSelectedGift(null);
    setGiftGuestName("");
    setGiftPixValue("");
  }

  async function confirmGiftReservation(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedGift) return;

    const isPix = selectedGift.name === PIX_GIFT_NAME;
    const guestName = giftGuestName.trim();

    if (!guestName) {
      showFeedback("error", "Digite seu nome para continuar.");
      return;
    }

    let giftValue = selectedGift.value;

    if (isPix) {
      const formattedPixValue = formatPixValue(giftPixValue);

      if (!formattedPixValue) {
        showFeedback("error", "Digite um valor válido para o PIX.");
        return;
      }

      giftValue = `R$ ${formattedPixValue.replace(".", ",")}`;

      const payload = generatePixPayload(formattedPixValue);

      setPixPayload(payload);
      setPixQrCode(
        `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
          payload,
        )}`,
      );
      setShowPixModal(true);
    }

    setGiftSubmitting(true);

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({
          type: "gift",
          giftName: selectedGift.name,
          giftValue,
          guestName,
        }),
      });

      if (!isPix) {
        setGiftReservations((prev) => ({
          ...prev,
          [selectedGift.name]: guestName,
        }));
      }

      showFeedback(
        "success",
        isPix
          ? "PIX gerado com sucesso! Agora é só escanear ou copiar o código."
          : "Presente reservado com sucesso!",
      );

      setSelectedGift(null);
      setGiftGuestName("");
      setGiftPixValue("");
    } catch (error) {
      console.error(error);
      showFeedback("error", "Erro ao registrar presente. Tente novamente.");
    } finally {
      setGiftSubmitting(false);
    }
  }

  /* ---------------------------------------------------------
      RENDER
    --------------------------------------------------------- */

  return (
    <>
      {showPixModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white max-w-md w-full rounded-[28px] p-6 shadow-2xl text-center">
            <h2 className="text-3xl text-[#8a5b2b] mb-4">PIX para presente</h2>

            <p className="text-[#6d4c2f] mb-4">
              Escaneie o QR Code ou copie o código PIX abaixo.
            </p>

            {pixQrCode && (
              <img
                src={pixQrCode}
                alt="QR Code PIX"
                className="mx-auto mb-4 rounded-xl"
                loading="lazy"
                decoding="async"
              />
            )}

            <textarea
              readOnly
              value={pixPayload}
              onFocus={(e) => e.target.select()}
              onClick={(e) => e.currentTarget.select()}
              className="w-full h-28 p-3 border border-[#d9c3a4] rounded-xl text-xs outline-none mb-4"
            />

            <button
              type="button"
              onClick={copyPixCode}
              className="w-full bg-[#8a5b2b] text-white py-3 rounded-2xl mb-3 font-semibold"
            >
              Copiar código PIX
            </button>

            <button
              type="button"
              onClick={copyPixKey}
              className="w-full bg-white text-[#8a5b2b] border border-[#caa36d] py-3 rounded-2xl mb-3 font-semibold"
            >
              Copiar chave PIX
            </button>

            <button
              type="button"
              onClick={() => setShowPixModal(false)}
              className="w-full bg-[#f7efe3] text-[#8a5b2b] border border-[#caa36d] py-3 rounded-2xl font-semibold"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
      {selectedGift && (
        <div className="fixed inset-0 z-[55] bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white max-w-md w-full rounded-[28px] p-6 shadow-2xl">
            <h2 className="text-2xl md:text-3xl text-[#8a5b2b] mb-2">
              {selectedGift.name === PIX_GIFT_NAME
                ? "Presentear via PIX"
                : "Reservar presente"}
            </h2>

            <p className="text-sm md:text-base text-[#7a5b3a] mb-5 leading-6">
              {selectedGift.name === PIX_GIFT_NAME
                ? "Informe seu nome e o valor que deseja presentear. Depois o QR Code será gerado automaticamente."
                : "Informe seu nome para registrar este presente como reservado."}
            </p>

            <form onSubmit={confirmGiftReservation} className="grid gap-4">
              <Input
                name="giftGuestName"
                placeholder="Seu nome"
                value={giftGuestName}
                onChange={(e) => setGiftGuestName(e.target.value)}
                required
              />

              {selectedGift.name === PIX_GIFT_NAME && (
                <Input
                  name="giftPixValue"
                  inputMode="decimal"
                  placeholder="Valor do PIX. Ex: 100,00"
                  value={giftPixValue}
                  onChange={(e) => setGiftPixValue(e.target.value)}
                  required
                />
              )}

              {selectedGift.name !== PIX_GIFT_NAME && (
                <p className="text-sm text-[#7a5b3a] bg-[#f7efe3] border border-[#eadcc7] rounded-2xl p-3">
                  Presente escolhido: <strong>{selectedGift.name}</strong>
                </p>
              )}

              <button
                type="submit"
                disabled={giftSubmitting}
                className="w-full bg-[#8a5b2b] hover:bg-[#74491f] disabled:opacity-60 text-white py-3 rounded-2xl shadow-lg transition-all font-semibold"
              >
                {giftSubmitting ? "Registrando..." : "Confirmar"}
              </button>

              <button
                type="button"
                onClick={closeGiftModal}
                disabled={giftSubmitting}
                className="w-full bg-[#f7efe3] text-[#8a5b2b] border border-[#caa36d] py-3 rounded-2xl disabled:opacity-60"
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}

      {active && (
        <section
          id="conteudo"
          className="relative mx-auto w-full max-w-[1760px] px-3 py-6 sm:px-5 md:px-8 md:py-10 animate-[sectionReveal_0.75s_cubic-bezier(.2,.8,.2,1)_both]"
        >
          <div className="relative overflow-hidden rounded-[24px] border border-[#eadcc7]/80 bg-[#fbf8f2] px-4 py-7 sm:px-6 md:px-8 lg:px-10 shadow-[0_18px_55px_rgba(80,50,20,0.09)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(224,185,98,0.15),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(224,185,98,0.14),transparent_32%)]" />

            <div className="relative z-10">
              <div className="mb-7 text-center md:mb-8">
                <h2 className="text-[2.35rem] leading-none sm:text-5xl md:text-[4rem] text-[#5f371f] tracking-[-0.03em]">
                  Nossos Presentes
                </h2>

                <div className="mx-auto mt-4 flex max-w-[520px] items-center justify-center gap-3 text-[#d7a945]">
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#d7a945] to-[#d7a945]" />
                  <span className="text-xl leading-none">❧</span>
                  <span className="text-base leading-none">✧</span>
                  <span className="text-xl leading-none">❧</span>
                  <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[#d7a945] to-[#d7a945]" />
                </div>

                <p className="mx-auto mt-5 max-w-[470px] text-[1.28rem] leading-[1.12] text-[#876c58] sm:text-[1.5rem]">
                  Escolha um presente e nos ajude a construir
                  <br className="hidden sm:block" /> nosso novo lar{' '}
                  <span className="text-[#d8aa45]">♥</span>
                </p>
              </div>

              <div className="mx-auto mb-7 max-w-[860px] rounded-[26px] border border-white/70 bg-white/64 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.78),0_18px_42px_rgba(80,50,20,0.09)] backdrop-blur-2xl sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-4 text-sm font-semibold text-[#684229] sm:text-base">
                  <span>{giftStats.percentage}% do nosso novo lar já foi montado</span>
                  <span className="text-[#b9892e]">{giftStats.reserved}/{giftStats.total}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[#eadcc7]">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#b78325,#e8c46f,#fff0b8)] shadow-[0_0_18px_rgba(214,166,56,0.45)] transition-all duration-700"
                    style={{ width: `${giftStats.percentage}%` }}
                  />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-center text-xs text-[#876c58] sm:grid-cols-3 sm:text-sm">
                  <span className="rounded-2xl bg-[#f7efe3]/80 px-3 py-2">{giftStats.available} disponíveis</span>
                  <span className="rounded-2xl bg-[#f7efe3]/80 px-3 py-2">{giftStats.reserved} reservados</span>
                  <span className="col-span-2 rounded-2xl bg-[#f7efe3]/80 px-3 py-2 sm:col-span-1">PIX livre</span>
                </div>
              </div>

              <div className="mx-auto mb-4 flex max-w-[1160px] flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#eadcc7] bg-white/58 px-4 py-3 text-sm text-[#7a5b3a] shadow-[0_8px_20px_rgba(80,50,20,0.05)]">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      giftPricesLoading ? "animate-pulse bg-[#d7a945]" : "bg-[#58a65c]"
                    }`}
                  />
                  <span>
                    {giftPricesLoading
                      ? "Atualizando preços dos anúncios..."
                      : giftPricesStatus ?? "Preços exibidos conforme cadastro; consultando anúncios"}
                  </span>
                </div>
                <span className="text-xs text-[#9a8064]">
                  {giftPricesUpdatedAt
                    ? `Última consulta: ${new Date(giftPricesUpdatedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}`
                    : "Os valores atuais dos anúncios serão carregados automaticamente"}
                </span>
              </div>

              <div className="mx-auto mb-4 max-w-[1160px]">
                <label className="relative block">
                  <span className="pointer-events-none absolute left-5 top-1/2 z-10 -translate-y-1/2 text-lg text-[#bd8e35]">⌕</span>
                  <input
                    value={giftSearch}
                    onChange={(e) => setGiftSearch(e.target.value)}
                    placeholder="Pesquisar presente..."
                    className="h-[58px] w-full rounded-[18px] border border-[#eadcc7] bg-white/70 pl-12 pr-4 text-base font-semibold text-[#684229] outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_10px_24px_rgba(80,50,20,0.06)] transition-all placeholder:text-[#a8927c] focus:border-[#d7a945] sm:text-lg"
                  />
                </label>
              </div>

              <div className="mx-auto mb-6 grid max-w-[1160px] grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                {[
                  ["todos", "🎁", "Todos"],
                  ["disponiveis", "✓", "Disponíveis"],
                  ["reservados", "▱", "Reservados"],
                  ["pix", "❖", "PIX"],
                ].map(([value, icon, label]) => {
                  const active =
                    value === "pix"
                      ? giftCategory === "pix"
                      : giftFilter === value && giftCategory !== "pix";

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        if (value === "pix") {
                          setGiftFilter("todos");
                          setGiftCategory("pix");
                          return;
                        }

                        setGiftFilter(value as GiftFilter);
                        setGiftCategory("todas");
                      }}
                      className={`flex min-h-[54px] items-center justify-center gap-2 rounded-full border px-3 py-2.5 text-base font-semibold shadow-[0_8px_20px_rgba(80,50,20,0.07)] transition-all duration-300 sm:text-lg md:text-xl ${
                        active
                          ? "border-[#d7a945] bg-[linear-gradient(135deg,#d6a638,#e7c069)] text-white shadow-[0_12px_24px_rgba(201,151,45,0.30)]"
                          : "border-[#eadcc7] bg-white/72 text-[#684229] hover:border-[#d7a945] hover:bg-white"
                      }`}
                    >
                      <span className="text-lg leading-none md:text-xl">{icon}</span>
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mx-auto mb-7 grid max-w-[1160px] gap-3 md:mb-8 md:grid-cols-2 md:gap-5">
                <label className="relative block">
                  <span className="pointer-events-none absolute left-6 top-1/2 z-10 -translate-y-1/2 text-[1.35rem] text-[#bd8e35]">
                    ⊞
                  </span>
                  <select
                    value={giftCategory}
                    onChange={(e) => setGiftCategory(e.target.value as GiftCategory)}
                    className="h-[58px] w-full appearance-none rounded-[14px] border border-[#e7d4b9] bg-white/56 pl-[3.7rem] pr-10 text-[1.25rem] font-semibold text-[#684229] outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-all focus:border-[#d7a945]"
                  >
                    <option value="todas">Categorias</option>
                    <option value="cozinha">Cozinha</option>
                    <option value="eletro">Eletrodomésticos</option>
                    <option value="banho">Banho</option>
                    <option value="decoracao">Mesa e decoração</option>
                    <option value="organizacao">Organização</option>
                    <option value="pix">PIX</option>
                  </select>
                  <span className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-lg text-[#684229]">⌄</span>
                </label>

                <label className="relative block">
                  <span className="pointer-events-none absolute left-6 top-1/2 z-10 -translate-y-1/2 text-[1.35rem] text-[#bd8e35]">
                    ≋
                  </span>
                  <select
                    value={giftSort}
                    onChange={(e) => setGiftSort(e.target.value as GiftSort)}
                    className="h-[58px] w-full appearance-none rounded-[14px] border border-[#e7d4b9] bg-white/56 pl-[3.7rem] pr-10 text-[1.25rem] font-semibold text-[#684229] outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-all focus:border-[#d7a945]"
                  >
                    <option value="relevancia">Ordenar</option>
                    <option value="menor-preco">Menor preço</option>
                    <option value="maior-preco">Maior preço</option>
                    <option value="az">Nome A-Z</option>
                  </select>
                  <span className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-lg text-[#684229]">⌄</span>
                </label>
              </div>

              {filteredGifts.length === 0 ? (
                <div className="rounded-[22px] border border-[#eadcc7] bg-white/70 p-8 text-center text-[#7a5b3a]">
                  Nenhum presente encontrado com os filtros atuais.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 min-[620px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {visibleGifts.map((gift, index) => {
                    const isPix = gift.name === PIX_GIFT_NAME;
                    const reservedBy = isPix ? null : giftReservations[gift.name];
                    const isReserved = Boolean(reservedBy);

                    return (
                      <article
                        key={gift.id}
                        className="group relative overflow-hidden rounded-[18px] border border-white/70 bg-white/76 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_8px_24px_rgba(80,50,20,0.07)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-[#e3c17a] hover:bg-white/88 hover:shadow-[0_16px_38px_rgba(80,50,20,0.12)]"
                        style={{ animation: `sectionReveal 0.58s ease-out ${Math.min(index, 12) * 0.035}s both` }}
                      >

                        <span
                          className={`absolute right-5 top-5 z-20 rounded-full px-3.5 py-1.5 text-sm font-bold shadow-sm ${
                            isReserved
                              ? "bg-[#ffd9dc] text-[#b31b1b]"
                              : "bg-[#d9f2d2] text-[#248620]"
                          }`}
                        >
                          {isReserved ? "Reservado" : "Disponível"}
                        </span>

                        <div className="flex h-[205px] items-center justify-center bg-white/48 px-8 pb-1 pt-10 sm:h-[220px]">
                          <img
                            src={gift.image}
                            alt={gift.name}
                            loading="lazy"
                            decoding="async"
                            className={`max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.035] ${
                              isPix ? "p-7" : ""
                            }`}
                          />
                        </div>

                        <div className="px-5 pb-5 pt-1 sm:px-6">
                          <h3 className="min-h-[76px] text-[1.45rem] leading-[1.15] text-[#633b22] sm:text-[1.58rem]">
                            {gift.name}
                          </h3>

                          {!isPix && gift.value && (
                            <p className="mt-2 text-xl font-bold text-[#b78325]">{gift.value}</p>
                          )}

                          {isPix && (
                            <p className="mt-2 text-sm leading-5 text-[#876c58]">
                              Contribua com qualquer valor por PIX.
                            </p>
                          )}

                          <button
                            type="button"
                            disabled={isReserved}
                            onClick={() => openGiftModal(gift)}
                            className={`mt-5 flex h-[54px] w-full items-center justify-center gap-2 rounded-[14px] text-[1.2rem] font-bold shadow-[0_10px_22px_rgba(178,126,31,0.18)] transition-all duration-300 ${
                              isReserved
                                ? "cursor-not-allowed bg-[#e8e1d8] text-[#9b8f82] shadow-none"
                                : "bg-[linear-gradient(135deg,#d6a638,#e5ba5f)] text-white hover:brightness-105"
                            }`}
                          >
                            <span>{isReserved ? "▱" : "🎁"}</span>
                            <span>{isReserved ? "Reservado" : "Presentear"}</span>
                          </button>

                          {!isPix && gift.link && (
                            <a
                              href={gift.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-3 flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] border border-[#d6a638] bg-white text-[1.08rem] font-bold text-[#9a6a17] shadow-[0_8px_18px_rgba(178,126,31,0.10)] transition-all duration-300 hover:bg-[#fff7e8] hover:brightness-105"
                            >
                              <span>🛒</span>
                              <span>Comprar na loja</span>
                            </a>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {hasMoreGifts && (
                <div className="mt-7 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleGiftCount((current) => current + 16)}
                    className="rounded-2xl border border-[#d7a945] bg-white/78 px-7 py-3 text-base font-bold text-[#8a5b2b] shadow-[0_10px_24px_rgba(80,50,20,0.08)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white"
                  >
                    Ver mais presentes ({filteredGifts.length - visibleGifts.length})
                  </button>
                </div>
              )}

              {(giftSearch || giftFilter !== "todos" || giftCategory !== "todas" || giftSort !== "relevancia") && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={clearGiftFilters}
                    className="text-sm font-semibold text-[#8a5b2b] underline decoration-[#d7a945]/60 underline-offset-4"
                  >
                    Limpar filtros
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setGiftFilter("todos");
                  setGiftCategory("pix");
                  window.setTimeout(() => {
                    document.getElementById("conteudo")?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }, 50);
                }}
                className="mt-6 flex w-full items-center justify-between rounded-[18px] border border-[#eadcc7] bg-[#f6efe4]/82 px-5 py-4 text-left shadow-[0_8px_24px_rgba(80,50,20,0.07)] transition-all hover:bg-white"
              >
                <span className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-3xl text-[#d6a638]">❖</span>
                  <span>
                    <span className="block text-[1.15rem] font-bold leading-tight text-[#633b22] sm:text-[1.3rem]">
                      Prefere presentear via PIX? Fique à vontade!
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-[#876c58] sm:text-base">
                      É só escolher o presente PIX ou fazer um PIX direto para nós.
                    </span>
                  </span>
                </span>
                <span className="text-3xl text-[#9a7653]">›</span>
              </button>

              <div className="mt-7 flex justify-center">
                <button
                  type="button"
                  onClick={onBack}
                  className="rounded-2xl border border-[#d7a945] bg-white/72 px-7 py-3 text-base font-semibold text-[#7a4b2a] shadow-sm transition-all hover:bg-white"
                >
                  Voltar ao Início
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
