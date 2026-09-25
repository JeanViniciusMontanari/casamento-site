"use client";

/* =========================================================
    IMPORTS
  ========================================================= */

import React, {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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

type Gift = {
  id: number;
  name: string;
  value: string;
  image: string;
  link?: string;
};

type GiftResponse = {
  gifts?: Record<string, string>;
};

type GiftPriceResponse = {
  prices?: Record<string, string>;
  updatedAt?: string;
  total?: number;
  updated?: number;
  failed?: Array<{ id: number; url: string; reason?: string }>;
  error?: string;
};

type GiftFilter = "todos" | "disponiveis" | "reservados";
type GiftSort = "relevancia" | "menor-preco" | "maior-preco" | "az";
type GiftCategory =
  | "todas"
  | "pix"
  | "cozinha"
  | "eletro"
  | "banho"
  | "decoracao"
  | "organizacao";

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

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyh-Aeo2tH331m6XWV7xcTrlR9cE0e9hQyDDaAtx1W-TiMlpik4gRk3OOZ7oUVWWbE7/exec";

const GOOGLE_MAPS_URL = "https://maps.app.goo.gl/L1cr1U27FxV6tqaUA";

const WEDDING_DATE = new Date("2027-01-15T17:00:00");
const GIFT_PRICE_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;
const LIGHT_PARTICLE_INDICES = Array.from({ length: 18 }, (_, index) => index);
const MUSIC_START_TIME = 261;
const MUSIC_VOLUME = 0.35;
const MUSIC_FADE_IN_DURATION = 1800;
const MUSIC_FADE_OUT_DURATION = 1200;
const GOOGLE_MAPS_QR_CODE = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(GOOGLE_MAPS_URL)}`;

const PIX_GIFT_NAME = "Presente via PIX";
const PIX_KEY = "05545294163";
const PIX_RECEIVER_NAME = "Larissa Moitinho Ferreira da Silva";
const PIX_RECEIVER_CITY = "Sinop";

/* =========================================================
    FUNÇÕES AUXILIARES
  ========================================================= */

function cleanText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeGift(gift: Gift): Gift {
  return {
    ...gift,
    name: cleanText(gift.name),
    value: cleanText(gift.value),
    image: cleanText(gift.image),
    link: gift.link?.trim(),
  };
}

function formatPhone(value: string) {
  const numbers = value.replace(/\D/g, "").slice(0, 11);

  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 6)
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }

  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
}

function removeAccents(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "");
}

function parseGiftPrice(value: string) {
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

function getGiftCategory(gift: Gift): GiftCategory {
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
    LISTA DE PRESENTES
  ========================================================= */

const gifts: Gift[] = [
  {
    id: 1,
    name: PIX_GIFT_NAME,
    value: "",
    image: "/pix.png",
  },
  {
    id: 2,
    name: "Chaleira com Apito Diamond Havan Casa 2,7 Litros - Baunilha",
    value: "R$ 129,99",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/c/h/chaleira-com-apito-diamond-havan-casa-2-7-litros_1149637.webp",
    link: "https://www.havan.com.br/chaleira-com-apito-diamond-havan-casa-2-7-litros-baunilha/p",
  },
  {
    id: 3,
    name: "Aspirador Pó e Água WAP GTW Inox 20 com Soprador 1600W 160Mbar 20 Litros",
    value: "R$ 391,41",
    image: "https://http2.mlstatic.com/D_NQ_NP_2X_688766-MLU72675480418_112023-F.webp",
    link: "https://www.mercadolivre.com.br/aspirador-po-e-agua-wap-gtw-inox-20-com-soprador-1600w-160mbar-20-litros/p/MLB6346501",
  },
  {
    id: 4,
    name: "Jogo De Facas Plenus 05 Peças E Suporte Madeira Tramontina - Preto e Madeira",
    value: "R$ 129,99",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/j/o/jogo-de-facas-plenus-06-pecas--suporte-madeira-tramontina_690534.webp",
    link: "https://www.havan.com.br/jogo-de-facas-plenus-05-pecas-e-suporte-madeira-tramontina-preto-e-madeira/p",
  },
  {
    id: 5,
    name: "Grill e Sanduicheira Philco Inox 2 em 1",
    value: "R$ 149,90",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/g/r/grill-e-sanduicheira-philco-inox-2-em-1-pgr21pi_1236880_1.webp",
    link: "https://www.havan.com.br/grill-e-sanduicheira-philco-inox-2-em-1-pgr21pi/p",
  },
  {
    id: 6,
    name: "Prato De Bolo Com Pé Cristal Geneva Wolff - Transparente",
    value: "R$ 129,99",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/p/r/prato-de-bolo-com-pe-cristal-geneva-wolff_1107213.webp",
    link: "https://www.havan.com.br/prato-de-bolo-com-pe-cristal-geneva-wolff-transparente/p",
  },
  {
    id: 7,
    name: "Panela de Arroz Elétrica Inox Philco PH10P Visor Glass",
    value: "R$ 319,90",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/p/a/panela-de-arroz-ph10p-visor-glass-philco_1235870_1.webp",
    link: "https://www.havan.com.br/panela-de-arroz-ph10p-visor-glass-philco/p",
  },
  {
    id: 8,
    name: "Abajur De Cerâmica Pottery 32Cm Taschibra - Branco",
    value: "R$ 129,99",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/a/b/abajur-de-ceramica-pottery-32cm-taschibra_317063.webp",
    link: "https://www.havan.com.br/abajur-de-ceramica-pottery-32cm-taschibra-branco/p",
  },
  {
    id: 9,
    name: "Jogo de Assadeiras Retangular Sempre Nadir - 2 Peças",
    value: "R$ 69,99",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/j/o/jogo-de-assadeiras-retangular-sempre-nadir_1272077.webp",
    link: "https://www.havan.com.br/jogo-de-assadeiras-retangular-sempre-nadir-2-peas/p",
  },
  {
    id: 10,
    name: "Jogo de Xícaras para Café com Açucareiro e Suporte Oasis Hauskraft - 4 Peças",
    value: "R$ 99,99",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/j/o/jogo-de-xicaras-para-cafe-com-acucareiro-e-suporte-oasis-4-pecas_1065160.webp",
    link: "https://www.havan.com.br/jogo-de-xicaras-para-cafe-com-acucareiro-e-suporte-oasis-4-peas/p",
  },
  {
    id: 11,
    name: "Liquidificador Power Oster Jarra De Vidro 1250W OLIQ520",
    value: "R$ 329,90",
    image: "https://www.havan.com.br/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/l/i/liquidificador-power-oster-jarra-de-vidro-1250w-oliq520_1248819_1.webp",
    link: "https://www.havan.com.br/liquidificador-power-oster-jarra-de-vidro-1250w-oliq520/p",
  },
  {
    id: 12,
    name: "Forno Elétrico de Bancada Fischer Gourmet Grill 44 litros Preto",
    value: "R$ 844,99",
    image: "https://http2.mlstatic.com/D_NQ_NP_2X_825094-MLA99522260088_122025-F.webp",
    link: "https://www.mercadolivre.com.br/p/MLB15762560?attributes=COLOR:MLB14486838,VOLTAGE:MLB15762560&matt_tool=38524122&pdp_filters=item_id:MLB5500977002&ua=6Fkc1f2ElNLWIGDirQkBUPrdkcHbiHdAQJbMfp8QT04H6Kc#origin=share&sid=share&wid=MLB5500977002&action=copy",
  },
  {
    id: 13,
    name: "Mixer Britânia 3 em 1 Mixer Triturador e Batedor",
    value: "R$ 249,90",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/m/i/mixer-britania-3-em-1-mixer-triturador-e-batedor-bmx400p_1033311.webp",
    link: "https://www.havan.com.br/mixer-britania-3-em-1-mixer-triturador-e-batedor-bmx400p/p",
  },
  {
    id: 14,
    name: "Saladeira Ryo Maresia Oxford 1,6 Litros - Porcelana",
    value: "R$ 69,99",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/_/5/_531917.webp",
    link: "https://www.havan.com.br/saladeira-oxford-ryo-maresia-1-6-litros-porcelana/p",
  },
  {
    id: 15,
    name: "Chaleira Elétrica Electrolux 1,8L Efficient",
    value: "R$ 229,90",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/c/h/chaleira-eletrica-electrolux-1-8l-efficient-eek10_1151376_1.webp",
    link: "https://www.havan.com.br/chaleira-eletrica-electrolux-1-8l-efficient-eek10/p",
  },
  {
    id: 16,
    name: "Torradeira Elétrica Electrolux Efficient",
    value: "R$ 229,90",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/t/o/torradeira-eletrica-electrolux-efficientm-ets10_1050940_2.webp",
    link: "https://www.havan.com.br/torradeira-eletrica-electrolux-efficientm-ets10/p",
  },
  {
    id: 17,
    name: "Batedeira Perola 550 Double Bowl Preta 500W Britânia",
    value: "R$ trocar",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/b/a/batedeira-perola-550-double-bowl-preta-500w-britania_737638_2.webp",
    link: "https://www.havan.com.br/batedeira-perola-550-double-bowl-preta-500w-britania/p",
  },
  {
    id: 18,
    name: "Pipoqueira Loreto Tramontina 3,5 Litros - Grafite",
    value: "R$ 139,99",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/p/i/pipoqueira-loreto-tramontina-3-5-litros_1128349.webp",
    link: "https://www.havan.com.br/pipoqueira-loreto-tramontina-3-5-litros-grafite/p",
  },
  {
    id: 19,
    name: "Jarra De Vidro Com Tampa De Bambu Classic Lyor 1 Litro - Transparente",
    value: "R$ 59,99",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/j/a/jarra-de-vidro-com-tampa-de-bambu-classic-lyor-1-litro_930528.webp",
    link: "https://www.havan.com.br/jarra-de-vidro-com-tampa-de-bambu-classic-lyor-1-litro-transparente/p",
  },
  {
    id: 20,
    name: "Aparelho De Jantar E Chá Unni Brisa Oxford 20 Peças - Cerâmica",
    value: "R$ trocar",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/a/p/aparelho-de-jantar-e-cha-unni-brisa-oxford-20-pcs_1194991.webp",
    link: "https://www.havan.com.br/aparelho-de-jantar-e-cha-unni-brisa-oxford-20-pcs-cermica/p",
  },
  {
    id: 21,
    name: "Panela de Pressão Super Brinox 4,2 Litros - Mocha Mousse",
    value: "R$ 249,99",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/p/a/panela-de-pressao-mocha-mouse-linha-super-cind-42_1163802.webp",
    link: "https://www.havan.com.br/panela-de-pressao-super-brinox-4-2-litros-mocha-mousse/p",
  },
  {
    id: 22,
    name: "Jogo De Taças Sobremesa 230 Ml Havan Casa 6 Peças - Munique",
    value: "R$ 39,99",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/j/o/jogo-de-tacas-sobremesa-230ml-havan-casa-6-pecas_1061901.webp",
    link: "https://www.havan.com.br/jogo-de-tacas-sobremesa-230ml-havan-casa-6-pecas-munique/p",
  },
  {
    id: 23,
    name: "Cesto De Roupas Bambu Com Tampa 65 Litros Conthey - Amêndoa",
    value: "R$ 139,99",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/c/e/cesto-de-roupas-bambu-com-tampa-65-litros-conthey_940903.webp",
    link: "https://www.havan.com.br/cesto-de-roupas-bambu-com-tampa-65-litros-conthey-amndoa/p",
  },
  {
    id: 24,
    name: "Jogo de Jarra com Taças Ice L hermitage 7 Peças - Vidro",
    value: "R$ 129,99",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/j/o/jogo-de-jarra-com-tacas-ice-lhermitage-7-pecas_1008312.webp",
    link: "https://www.havan.com.br/jogo-de-jarra-com-tacas-ice-lhermitage-7-pecas-vidro/p",
  },
  {
    id: 25,
    name: "Jogo Taça Premium Transparente Havan Casa 365Ml - 6 Peças",
    value: "R$ 59,99",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/j/o/jogo-de-tacas-premium-transparente-havan-casa-365ml_1184818.webp",
    link: "https://www.havan.com.br/jogo-de-tacas-premium-transparente-havan-casa-365ml-6-peas/p",
  },
  {
    id: 26,
    name: "Travesseiro Nasa com Suporte Anatômico 46Cm X 66Cm Marcbrayn - Bege",
    value: "R$ 99,99",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/t/r/travesseiro-62x42cm-visco-basic-marcbrayn_1250132.webp",
    link: "https://www.havan.com.br/travesseiro-62x42cm-visco-basic-marcbrayn-bege/p",
  },
  {
    id: 27,
    name: "Travesseiro Nasa com Suporte Anatômico 46Cm X 66Cm Marcbrayn - Bege",
    value: "R$ 99,99",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/t/r/travesseiro-62x42cm-visco-basic-marcbrayn_1250132.webp",
    link: "https://www.havan.com.br/travesseiro-62x42cm-visco-basic-marcbrayn-bege/p",
  },
  {
    id: 28,
    name: "Lasanheira De Vidro Com Tampa 5 Litros Marinex - Transparente",
    value: "R$ 99,99",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/l/a/lasanheira-de-vidro-com-tampa-5-litros-marinex_1031876.webp",
    link: "https://www.havan.com.br/lasanheira-de-vidro-com-tampa-5-litros-marinex-transparente/p",
  },
  {
    id: 29,
    name: "Jogo de Xícaras com Pires Colibri Wolff 170Ml - 4 Peças",
    value: "R$ 79,99",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/j/o/jogo-de-xicaras-com-pires-colibri-wolff-190ml_1228984.webp",
    link: "https://www.havan.com.br/jogo-de-xicaras-com-pires-colibri-wolff-190ml-4-peas/p",
  },
  {
    id: 30,
    name: "Jogo de Banheiro Bambu Havan Casa 6 Peças - Preto",
    value: "R$ 149,99",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/j/o/jogo-de-banheiro-bambu-6-pecas_1221532.webp",
    link: "https://www.havan.com.br/jogo-de-banheiro-bambu-havan-casa-6-pecas-preto/p",
  },
  {
    id: 31,
    name: "Lixeira Quadrada com Pedal Havan Casa 12 Litros - Cinza",
    value: "R$ 119,99",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/l/i/lixeira-plastica-com-pedal-12l-havan-casa_1211250.webp",
    link: "https://www.havan.com.br/lixeira-plastica-com-pedal-12l-havan-casa-cinza/p",
  },
  {
    id: 32,
    name: "Passadeira A Vapor Klicke",
    value: "R$ 199,90",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/p/a/passadeira-a-vapor-klicke_1223869_1.webp",
    link: "https://www.havan.com.br/passadeira-a-vapor-klicke/p",
  },
  {
    id: 33,
    name: "Garrafa Térmica Com Trava Havan Casa 1,9 Litros - Aço Inox",
    value: "R$ trocar",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/g/a/garrafa-termica-com-trava-havan-casa-1-9-litros_1184372.webp",
    link: "https://www.havan.com.br/garrafa-termica-com-trava-havan-casa-1-9-litros-ao-inox/p",
  },
  {
    id: 34,
    name: "Jogo De Jantar Opaline Marselha Havan Casa - 12 Peças",
    value: "R$ 199,99",
    image: "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/j/o/jogo-de-jantar-opaline-marselha-havan-casa_1183504.webp",
    link: "https://www.havan.com.br/jogo-de-jantar-opaline-marselha-havan-casa-12-peas/p",
  },
  {
    id: 35,
    name: "Lavadora de Alta Pressão Wap 2000W WL4000",
    value: "R$ 1.099,90",
    image: "https://www.havan.com.br/media/catalog/product/cache/74c1057f7991b4edb2bc7bdaa94de933/l/a/lavadora-de-alta-pressao-wap-2000w-wl4000_900362_1.webp",
    link: "https://www.havan.com.br/lavadora-de-alta-pressao-wap-2000w-wl4000/p",
  },
  {
    id: 36,
    name: "Samsung Vision AI TV 48 Polegadas OLED 4K S85H + Soundbar Samsung B450F",
    value: "R$ 5.509,05",
    image: "https://samsungbrshop.vtexassets.com/arquivos/ids/298299-600-auto?v=639239674745600000",
    link: "https://shop.samsung.com/br/samsung-vision-ai-tv-48-oled-4k-s85h-mais-soundbar-samsung-b450f/p?idsku=16047",
  },
  {
    id: 37,
    name: "Máquina de Lavar Brastemp",
    value: "R$ 2.697,05",
    image: "https://brastemp.vtexassets.com/arquivos/ids/293054-828-auto/01_Brastemp_Lavadora_BWK14BB_Imagem_Frontal.webp?v=639220497857030000&quality=80",
    link: "https://www.brastemp.com.br/maquina-de-lavar-brastemp-14kg-branca-com-ciclo-tira-manchas-advanced-e-smart-sensor-bwk14bb/p",
  },
  {
    id: 38,
    name: "Cooktop 4 Bocas Dako Supreme Com Mesa de Vidro e Tripla Chama Preto Bivol",
    value: "R$ 488,05",
    image: "https://http2.mlstatic.com/D_NQ_NP_2X_912486-MLA100063714741_122025-F.webp",
    link: "https://www.mercadolivre.com.br/cooktop-4-bocas-dako-supreme-com-mesa-de-vidro-e-tripla-chama-preto-bivolt/p/MLB23455094",
  },
  {
    id: 39,
    name: "Chuveiro Acqua Duo Preto Fosco Black Matte 5500w Lorenzetti",
    value: "R$ 654,41",
    image: "https://http2.mlstatic.com/D_NQ_NP_2X_843200-MLU77341664949_062024-F.webp",
    link: "https://www.mercadolivre.com.br/chuveiro-acqua-duo-preto-fosco-black-matte-5500w-lorenzetti/p/MLB25170948",
  },
  {
    id: 40,
    name: "Panificadora Multipane 12 Programações Com Função Timer e Antiaderente Potência de 550 W Cor Preto Britânia",
    value: "R$ 888",
    image: "https://http2.mlstatic.com/D_NQ_NP_2X_873422-MLA40301247641_012020-F.webp",
    link: "https://www.mercadolivre.com.br/panificadora-multipane-12-programacoes-com-funcao-timer-e-antiaderente-potencia-de-550-w-cor-preto-britania/p/MLB14489716",
  },
  {
    id: 41,
    name: "Geladeira Inteligente com Flex Freeze B= Smart Brastemp Frost Free Inverse Inox",
    value: "R$ 4.899,99",
    image: "https://brastemp.vtexassets.com/arquivos/ids/288175-828-auto/Brastemp_Geladeira_BRE68AK_Imagem_Frontal.webp?v=639160190448000000&quality=80",
    link: "https://www.brastemp.com.br/geladeira-inteligente-b--smart-brastemp-frost-free-inverse-477-litros-inox---bre68ak-326199093/p",
  },
  {
    id: 42,
    name: "Lava-Louças Electrolux 10 Serviços LL10X com Função Higienizar Inox",
    value: "R$ 3.361,46",
    image: "https://http2.mlstatic.com/D_NQ_NP_2X_646778-MLA92016050767_092025-F.webp",
    link: "https://www.mercadolivre.com.br/lava-loucas-electrolux-10-servicos-ll10x-com-funcao-higienizar-inox/p/MLB36263784",
  },
  {
    id: 43,
    name: "Fritadeira Airfryer Duplo Cesto Preto Philips Walita Preto",
    value: "R$ 854",
    image: "https://http2.mlstatic.com/D_NQ_NP_2X_920323-MLA99867509313_112025-F.webp",
    link: "https://www.mercadolivre.com.br/p/MLB49537772?attributes=COLOR:MLB50912399,VOLTAGE:MLB49537772&matt_tool=38524122&pdp_filters=item_id:MLB5922903940&ua=gxnPnmKECwr_ydOn4Zfwh9k3GyrPlywqaUVCjUpHBlkOReY#origin=share&sid=share&wid=MLB5922903940&action=copy",
  },
  {
    id: 44,
    name: "Sofá Retrátil Reclinável 2,10m",
    value: "Verificar em loja local",
    image: "https://http2.mlstatic.com/D_NQ_NP_2X_856611-MLU72700629685_112023-F.webp",
    link: "",
  },
  {
    id: 45,
    name: "Ar Condicionado Split LG Dual Inverter AI Voice 9000 BTU Frio",
    value: "R$ 1.799,00",
    image: "https://http2.mlstatic.com/D_NQ_NP_2X_731149-MLA114601143193_072026-F.webp",
    link: "https://www.mercadolivre.com.br/ar-condicionado-split-lg-dual-inverter-ai-voice-9000-btu-frio/p/MLB66277100?pdp_filters=item_id:MLB6879863154#is_advertising=true&searchVariation=MLB66277100&backend_model=search-backend&be_origin=backend&position=1&search_layout=grid&type=pad&tracking_id=22e92bef-015c-4ca6-9b0b-ac25e045e63d&ad_domain=VQCATCORE_LST&ad_position=1&ad_click_id=ZDEwNGI0MWUtZWJjMi00NDZlLWFkOTUtYmZiNDI1MDlhMTUw",
  },
  {
    id: 46,
    name: "Ar Condicionado Inverter LG Dual Voice AI 12.000 Btus Frio R-32",
    value: "R$ 2.059",
    image: "https://http2.mlstatic.com/D_NQ_NP_2X_731149-MLA114601143193_072026-F.webp",
    link: "https://www.mercadolivre.com.br/ar-condicionado-inverter-lg-dual-voice-ai-12000-btus-frio-r-32/p/MLB65887529#polycard_client=search-desktop&be_origin=backend&overlay_label=not_apply&search_layout=grid&position=7&type=product&tracking_id=22e92bef-015c-4ca6-9b0b-ac25e045e63d&wid=MLB5245309349&sid=search",
  },
  {
    id: 47,
    name: "Mesa de Jantar",
    value: "Verificar em loja local",
    image: "/mesa.png",
    link: "",
  },
];

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

  const [pixPayload, setPixPayload] = useState("");
  const [pixQrCode, setPixQrCode] = useState("");
  const [showPixModal, setShowPixModal] = useState(false);

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

  const [giftReservations, setGiftReservations] = useState<
    Record<string, string>
  >({});
  const [giftPrices, setGiftPrices] = useState<Record<string, string>>({});
  const [giftPricesLoading, setGiftPricesLoading] = useState(false);
  const [giftPricesUpdatedAt, setGiftPricesUpdatedAt] = useState<string | null>(null);
  const [giftPricesStatus, setGiftPricesStatus] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<Feedback>(null);
  const [rsvpConfirmation, setRsvpConfirmation] =
    useState<RsvpConfirmation>(null);
  const [giftSearch, setGiftSearch] = useState("");
  const [giftFilter, setGiftFilter] = useState<GiftFilter>("todos");
  const [giftSort, setGiftSort] = useState<GiftSort>("relevancia");
  const [giftCategory, setGiftCategory] = useState<GiftCategory>("todas");
  const [loadingScreen, setLoadingScreen] = useState(true);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [giftGuestName, setGiftGuestName] = useState("");
  const [giftPixValue, setGiftPixValue] = useState("");
  const [giftSubmitting, setGiftSubmitting] = useState(false);
  const [visibleGiftCount, setVisibleGiftCount] = useState(16);

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
    }

    updateCountdown();
    const removeScript = loadReservedGifts();

    const interval = setInterval(updateCountdown, 1000);

    return () => {
      clearInterval(interval);
      removeScript();
    };
  }, []);

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
  }, [loadGiftPrices, GIFT_PRICE_REFRESH_INTERVAL_MS]);

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
  /* =========================================================
      MEMOS
    ========================================================= */

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

  /* =========================================================
      FEEDBACK
    ========================================================= */

  function clearGiftFilters() {
    setGiftSearch("");
    setGiftFilter("todos");
    setGiftSort("relevancia");
    setGiftCategory("todas");
  }

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

  /* =========================================================
      FUNÇÕES PIX
    ========================================================= */

  function formatPixValue(value: string) {
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

  function generatePixPayload(value: string) {
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
      PRESENTES
    ========================================================= */

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

      {activeSection === "presentes" && (
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
                  onClick={goHome}
                  className="rounded-2xl border border-[#d7a945] bg-white/72 px-7 py-3 text-base font-semibold text-[#7a4b2a] shadow-sm transition-all hover:bg-white"
                >
                  Voltar ao Início
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

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

type SectionProps = {
  id?: string;
  title: string;
  children: ReactNode;
  wide?: boolean;
  onBack?: () => void;
};

function Section({ id, title, children, wide = false, onBack }: SectionProps) {
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

function Input({ type = "text", ...props }: InputProps) {
  return (
    <input
      type={type}
      className="p-4 rounded-2xl border border-[#d9c3a4]/80 bg-white/84 outline-none w-full text-base shadow-inner focus:border-[#8a5b2b] transition-all"
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
      className="p-4 rounded-2xl border border-[#d9c3a4]/80 bg-white/84 outline-none w-full text-base shadow-inner focus:border-[#8a5b2b] transition-all"
      {...props}
    />
  );
}