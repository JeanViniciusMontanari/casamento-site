import { cleanText, removeAccents } from "./format";
import { Gift, PIX_GIFT_NAME } from "./gifts-data";

/* =========================================================
    TYPES
  ========================================================= */

export type GiftResponse = {
  gifts?: Record<string, string>;
};

export type GiftPriceResponse = {
  prices?: Record<string, string>;
  updatedAt?: string;
  total?: number;
  updated?: number;
  failed?: Array<{ id: number; url: string; reason?: string }>;
  error?: string;
};

export type GiftFilter = "todos" | "disponiveis" | "reservados";
export type GiftSort = "relevancia" | "menor-preco" | "maior-preco" | "az";
export type GiftCategory =
  | "todas"
  | "pix"
  | "cozinha"
  | "eletro"
  | "banho"
  | "decoracao"
  | "organizacao";

/* =========================================================
    CONSTANTES
  ========================================================= */

export const GIFT_PRICE_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;

export const PIX_KEY = "05545294163";
export const PIX_RECEIVER_NAME = "Larissa Moitinho Ferreira da Silva";
export const PIX_RECEIVER_CITY = "Sinop";

/* =========================================================
    FUNÇÕES AUXILIARES - PRESENTES
  ========================================================= */

export function normalizeGift(gift: Gift): Gift {
  return {
    ...gift,
    name: cleanText(gift.name),
    value: cleanText(gift.value),
    image: cleanText(gift.image),
    link: gift.link?.trim(),
  };
}

export function parseGiftPrice(value: string) {
  const numeric = value
    .replace(/R\$/g, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const price = Number(numeric);
  return numeric && Number.isFinite(price) && price > 0
    ? price
    : Number.POSITIVE_INFINITY;
}

export function getGiftCategory(gift: Gift): GiftCategory {
  const name = removeAccents(gift.name).toLowerCase();

  if (gift.name === PIX_GIFT_NAME) return "pix";

  if (/toalha|travesseiro|banheiro|chuveiro|algodao|cotonete/.test(name)) {
    return "banho";
  }

  if (
    /aspirador|grill|sanduicheira|panela de arroz|liquidificador|forno|mixer|chaleira eletrica|torradeira|batedeira|processador|passadeira|lavadora|maquina de lavar|lava loucas|geladeira|panificadora/.test(
      name,
    )
  ) {
    return "eletro";
  }

  if (
    /abajur|bandeja|prato de bolo|jantar|tacas|xicaras|jarra|aparelho|americano/.test(
      name,
    )
  ) {
    return "decoracao";
  }

  if (/organizador|cesto|porta talheres|pote|lixeira|varal/.test(name)) {
    return "organizacao";
  }

  return "cozinha";
}

/* =========================================================
    FUNÇÕES AUXILIARES - PIX (BR Code / copia-e-cola)
  ========================================================= */

export function formatPixValue(value: string) {
  const clean = value.replace(/[^\d,.-]/g, "").replace(",", ".");
  const number = Number(clean);

  if (Number.isNaN(number) || number <= 0) return "";

  return number.toFixed(2);
}

function pixField(id: string, value: string) {
  const size = value.length.toString().padStart(2, "0");
  return `${id}${size}${value}`;
}

function crc16(payload: string) {
  let crc = 0xffff;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;

    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }

      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function generatePixPayload(value: string) {
  const amount = formatPixValue(value);
  const name = removeAccents(PIX_RECEIVER_NAME).substring(0, 25);
  const city = removeAccents(PIX_RECEIVER_CITY).substring(0, 15);
  const txid = "CASAMENTO";

  const merchantAccountInfo =
    pixField("00", "br.gov.bcb.pix") +
    pixField("01", PIX_KEY) +
    pixField("02", "Presente casamento");

  const payloadWithoutCrc =
    pixField("00", "01") +
    pixField("26", merchantAccountInfo) +
    pixField("52", "0000") +
    pixField("53", "986") +
    pixField("54", amount) +
    pixField("58", "BR") +
    pixField("59", name) +
    pixField("60", city) +
    pixField("62", pixField("05", txid)) +
    "6304";

  return payloadWithoutCrc + crc16(payloadWithoutCrc);
}
