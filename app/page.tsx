"use client";

import React, {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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

type GiftFilter = "todos" | "disponiveis" | "reservados";

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

type RsvpConfirmation = {
  name: string;
  email: string;
  guests: string;
} | null;

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyh-Aeo2tH331m6XWV7xcTrlR9cE0e9hQyDDaAtx1W-TiMlpik4gRk3OOZ7oUVWWbE7/exec";

const GOOGLE_MAPS_URL = "https://maps.app.goo.gl/L1cr1U27FxV6tqaUA";

const WEDDING_DATE = new Date("2027-01-15T19:00:00");
const MUSIC_START_TIME = 265;

const PIX_GIFT_NAME = "Presente via PIX";
const PIX_KEY = "05545294163";
const PIX_RECEIVER_NAME = "Larissa Moitinho Ferreira da Silva";
const PIX_RECEIVER_CITY = "Sinop";


function cleanText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function cleanUrl(value?: string) {
  return value?.trim();
}

function normalizeGift(gift: Gift): Gift {
  return {
    ...gift,
    name: cleanText(gift.name),
    value: cleanText(gift.value),
    image: cleanText(gift.image),
    link: cleanUrl(gift.link),
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

const gifts: Gift[] = [
  {
    id: 1,
    name: PIX_GIFT_NAME,
    value: "",
    image: "/pix.png",
  },
  {
    id: 2,
    name: "Forma Média Filetada Redonda Marinex 1,3 Litros - Vidro",
    value: "R$ 24,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/f/o/forma-media-filetada-redonda-1-3-litros-marinex_1116402.webp",
    link: "https://www.havan.com.br/forma-media-filetada-redonda-1-3-litros-marinex-vidro/p",
  },
  {
    id: 3,
    name: "Forma Redonda Com Fundo Removível Havan Casa 28Cm - Preto",
    value: "R$ 49,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/f/o/forma-redonda-fundo-removivel-28cm-solecasa_1109304.webp",
    link: "https://www.havan.com.br/forma-redonda-com-fundo-removivel-havan-casa-28cm-preto/p",
  },
  {
    id: 4,
    name: "Conjunto Para Churrasco Com 4 Peças Havan - Inox",
    value: "R$ 99,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/c/o/conjunto-para-churrasco-com-4-pecas-mb5077_207233_2.webp",
    link: "https://www.havan.com.br/conjunto-para-churrasco-com-4-pecas-mb5077-inox/p",
  },
  {
    id: 5,
    name: "Toalha de Banho 100% Algodão Unika Karsten 1 Pç - Branco",
    value: "R$ 79,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/t/o/toalha-de-banho-unika-karsten_1055765.webp",
    link: "https://www.havan.com.br/toalha-de-banho-unika-karsten-branco/p",
  },
  {
    id: 6,
    name: "Forma De Pudim Antiaderente Havan Casa 23Cm - Aço",
    value: "R$ 49,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/f/o/forma-para-pudim-antiaderente-havan-casa-23cm_1110270.webp",
    link: "https://www.havan.com.br/forma-para-pudim-antiaderente-havan-casa-23cm-ao/p",
  },
  {
    id: 7,
    name: "Chaleira com Apito Diamond Havan Casa 2,7 Litros - Baunilha",
    value: "R$ 129,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/c/h/chaleira-com-apito-diamond-havan-casa-2-7-litros_1149637.webp",
    link: "https://www.havan.com.br/chaleira-com-apito-diamond-havan-casa-2-7-litros-baunilha/p",
  },
  {
    id: 8,
    name: "Forma Retangular Antiaderente Havan Casa 40,5Cm - Cinza",
    value: "R$ 49,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/f/o/forma-retangular-antiaderente-havan-casa-40-5cm_1033356.webp",
    link: "https://www.havan.com.br/forma-retangular-antiaderente-havan-casa-40-5cm-cinza/p",
  },
  {
    id: 9,
    name: "Aspirador de Pó e Água Electrolux 11 Litros Smart 1400W A10N1",
    value: "R$ 399,90",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/a/s/aspirador-de-po-e-agua-electrolux-11-litros-smart-1400w-a10n1_940375_1.webp",
    link: "https://www.havan.com.br/aspirador-de-po-e-agua-electrolux-11-litros-smart-1400w-a10n1/p",
  },
  {
    id: 10,
    name: "Jogo De Churrasco 3 Peças Tramontina - 10239/604",
    value: "R$ 79,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/c/o/conjunto-tabua-para-churrasco-com-garfo-e-faca-tramontina_1182504.webp",
    link: "https://www.havan.com.br/conjunto-tabua-para-churrasco-com-garfo-e-faca-tramontina-10239604/p",
  },
  {
    id: 11,
    name: "Bandeja De Bambu Com Alça Havan Casa - 40CM",
    value: "R$ 79,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/b/a/bandeja-de-bambu-com-alca-havan-casa_1086467.webp",
    link: "https://www.havan.com.br/bandeja-de-bambu-com-alca-havan-casa-40cm/p",
  },
  {
    id: 12,
    name: "Jogo De Facas Plenus 05 Peças E Suporte Madeira Tramontina - Preto e Madeira",
    value: "R$ 129,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/j/o/jogo-de-facas-plenus-06-pecas--suporte-madeira-tramontina_690534.webp",
    link: "https://www.havan.com.br/jogo-de-facas-plenus-05-pecas-e-suporte-madeira-tramontina-preto-e-madeira/p",
  },
  {
    id: 13,
    name: "Jogo de Copos de Vidro Miami Havan Casa 360Ml - 6 Peças",
    value: "R$ 29,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/j/o/jogo-de-copos-de-vidro-havan-casa-miami-360ml_883754.webp",
    link: "https://www.havan.com.br/jogo-de-copos-de-vidro-havan-casa-miami-360ml-6-pecas/p",
  },
  {
    id: 14,
    name: "Toalha Super Banho 100% Algodão Wave Havan Casa 1 Pç - Violeta",
    value: "R$ 49,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/t/o/toalha-super-banho-wave-yaris_923211.webp",
    link: "https://www.havan.com.br/toalha-super-banho-wave-yaris-violeta/p",
  },
  {
    id: 15,
    name: "Grill e Sanduicheira Philco Inox 2 em 1",
    value: "R$ 149,90",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/g/r/grill-e-sanduicheira-philco-inox-2-em-1-pgr21pi_1236880_1.webp",
    link: "https://www.havan.com.br/grill-e-sanduicheira-philco-inox-2-em-1-pgr21pi/p",
  },
  {
    id: 16,
    name: "Prato De Bolo Com Pé Cristal Geneva Wolff - Transparente",
    value: "R$ 129,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/p/r/prato-de-bolo-com-pe-cristal-geneva-wolff_1107213.webp",
    link: "https://www.havan.com.br/prato-de-bolo-com-pe-cristal-geneva-wolff-transparente/p",
  },
  {
    id: 17,
    name: "Escorredor De Macarrão Mallana 24 Cm - Aço Inox",
    value: "R$ 29,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/e/s/escorredor-de-macarrao-24cm-havan_1149722.webp",
    link: "https://www.havan.com.br/escorredor-de-macarrao-mallana-24-cm-ao-inox/p",
  },
  {
    id: 18,
    name: "Pote Hermético Retangular Havan Casa 1,5 Litros - Vidro",
    value: "R$ 49,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/p/o/pote-hermetico-retangular-havan-casa-1-5-litros_1140139.webp",
    link: "https://www.havan.com.br/pote-hermetico-retangular-havan-casa-1-5-litros-vidro/p",
  },
  {
    id: 19,
    name: "Pote Hermético Retangular Havan Casa 840Ml - Vidro",
    value: "R$ 39,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/p/o/pote-hermetico-retangular-havan-casa-840ml-302375_1140167.webp",
    link: "https://www.havan.com.br/pote-hermetico-retangular-havan-casa-840ml-vidro/p",
  },
  {
    id: 20,
    name: "Pote Hermético Retangular Havan Casa 370Ml - Vidro",
    value: "R$ 19,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/p/o/pote-hermetico-retangular-havan-casa-370ml_1140180.webp",
    link: "https://www.havan.com.br/pote-hermetico-retangular-havan-casa-370ml-vidro/p",
  },
  {
    id: 21,
    name: "Jogo De Peneiras Havan Casa 3 Peças - Inox",
    value: "R$ 29,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/c/o/conjunto-de-3-peneiras-finecasa_1113420.webp",
    link: "https://www.havan.com.br/jogo-de-peneiras-havan-casa-3-pecas-inox/p",
  },
  {
    id: 22,
    name: "Porta Talheres 39X29x4,5Cm Finecasa - Bambu",
    value: "R$ 99,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/p/o/porta-talheres-39x29x4-5cm-finecasa_321433.webp",
    link: "https://www.havan.com.br/porta-talheres-39x29x4-5cm-finecasa-bambu/p",
  },
  {
    id: 23,
    name: "Panela de Arroz Elétrica Inox Philco PH10P Visor Glass",
    value: "R$ 319,90",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/p/a/panela-de-arroz-ph10p-visor-glass-philco_1235870_1.webp  ",
    link: "https://www.havan.com.br/panela-de-arroz-ph10p-visor-glass-philco/p",
  },
  {
    id: 24,
    name: "Abajur De Cerâmica Pottery 32Cm Taschibra - Branco",
    value: "R$ 129,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/a/b/abajur-de-ceramica-pottery-32cm-taschibra_317063.webp  ",
    link: "https://www.havan.com.br/abajur-de-ceramica-pottery-32cm-taschibra-branco/p",
  },
  {
    id: 25,
    name: "Jogo de Assadeiras Retangular Sempre Nadir - 2 Peças",
    value: "R$ 69,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/j/o/jogo-de-assadeiras-retangular-sempre-nadir_1272077.webp",
    link: "https://www.havan.com.br/jogo-de-assadeiras-retangular-sempre-nadir-2-peas/p",
  },
  {
    id: 26,
    name: "Saleiro Com Tampa E Colher Lyor 340Ml - Branco",
    value: "R$ 49,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/s/a/saleiro-com-tampa-e-colher-lyor-300ml_550833.webp",
    link: "https://www.havan.com.br/saleiro-com-tampa-e-colher-lyor-300ml-branco/p",
  },
  {
    id: 27,
    name: "Jogo de Xícaras para Café com Açucareiro e Suporte Oasis Hauskraft - 4 Peças",
    value: "R$ 99,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/j/o/jogo-de-xicaras-para-cafe-com-acucareiro-e-suporte-oasis-4-pecas_1065160.webp",
    link: "https://www.havan.com.br/jogo-de-xicaras-para-cafe-com-acucareiro-e-suporte-oasis-4-peas/p",
  },
  {
    id: 28,
    name: "Liquidificador Oster 1400W Full 3,2 Litros OLIQ610",
    value: "R$ 329,90",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/l/i/liquidificador-1400-full-oliq610-oster-1400w_887603_2.webp",
    link: "https://www.havan.com.br/liquidificador-1400-full-oliq610-oster-1400w/p  ",
  },
  {
    id: 29,
    name: "Americano Avulso 38 Cm Luna Havan Casa - Off White",
    value: "R$ 12,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/a/m/americano-avulso-luna-havan_1191496.webp",
    link: "https://www.havan.com.br/americano-avulso-luna-havan-off-white/p",
  },
  {
    id: 30,
    name: "Organizador com Cesto Ou Clear Fresh 5 Litros - Transparente e Branco",
    value: "R$ 69,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/o/r/organizador-com-cesto-ou-clear-fresh-5-litros_1246601.webp",
    link: "https://www.havan.com.br/organizador-com-cesto-ou-clear-fresh-5-litros-transparente-e-branco/p",
  },
  {
    id: 31,
    name: "Jogo De Porta Condimentos Com Suporte Havan Casa - 6 Peças",
    value: "R$ 89,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/j/o/jogo-de-porta-condimentos-com-suporte-havan-casa_1122504.webp",
    link: "https://www.havan.com.br/jogo-de-porta-condimentos-com-suporte-havan-casa-6-peas/p",
  },
  {
    id: 32,
    name: "Forno Elétrico Full Glass 50 Litros Philco",
    value: "R$ 799,90",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/f/o/forno-eletrico-full-glass-50-litros-philco-pfe50pe_874677_1.webp",
    link: "https://www.havan.com.br/forno-eletrico-full-glass-50-litros-philco-pfe50pe/p",
  },
  {
    id: 33,
    name: "Mixer Britânia 3 em 1 Mixer Triturador e Batedor",
    value: "R$ 249,90",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/m/i/mixer-britania-3-em-1-mixer-triturador-e-batedor-bmx400p_1033311.webp",
    link: "https://www.havan.com.br/mixer-britania-3-em-1-mixer-triturador-e-batedor-bmx400p/p",
  },
  {
    id: 34,
    name: "Saladeira Ryo Maresia Oxford 1,6 Litros - Porcelana",
    value: "R$ 69,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/_/5/_531917.webp",
    link: "https://www.havan.com.br/saladeira-oxford-ryo-maresia-1-6-litros-porcelana/p",
  },
  {
    id: 35,
    name: "Prato Raso Opaline Divine Hauskraft - 26,5CM",
    value: "R$ 19,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/p/r/prato-raso-divine-265cm-hauskraft_1157797.webp ",
    link: "https://www.havan.com.br/prato-raso-opaline-divine-hauskraft-265cm/p",
  },
  {
    id: 36,
    name: "Chaleira Elétrica Electrolux 1,8L Efficient ",
    value: "R$ 229,90",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/c/h/chaleira-eletrica-electrolux-1-8l-efficient-eek10_1151376_1.webp ",
    link: "https://www.havan.com.br/chaleira-eletrica-electrolux-1-8l-efficient-eek10/p",
  },
  {
    id: 37,
    name: "Torradeira Elétrica Electrolux Efficient ",
    value: "R$ 229,90",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/t/o/torradeira-eletrica-electrolux-efficientm-ets10_1050940_2.webp",
    link: "https://www.havan.com.br/torradeira-eletrica-electrolux-efficientm-ets10/p",
  },
  {
    id: 38,
    name: "Jogo de Fondue Preto Havan Casa - 11 Peças",
    value: "R$ 149,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/j/o/jogo-de-fondue-preto-havan-casa_1184750.webp",
    link: "https://www.havan.com.br/jogo-de-fondue-preto-havan-casa-11-peas/p",
  },
  {
    id: 39,
    name: "Organizador com Cesto Clear Fresh Martiplast 2,2L - Transparente",
    value: "R$ 49,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/o/r/organizador-com-cesto-clear-fresh-martiplast-2-2l_1246645.webp",
    link: "https://www.havan.com.br/organizador-com-cesto-clear-fresh-martiplast-2-2l-transparente/p",
  },
  {
    id: 40,
    name: "Organizador com Cesto Clear Fresh Martiplast 2,2L - Transparente",
    value: "R$ 49,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/o/r/organizador-com-cesto-clear-fresh-martiplast-2-2l_1246645.webp",
    link: "https://www.havan.com.br/organizador-com-cesto-clear-fresh-martiplast-2-2l-transparente/p",
  },
  {
    id: 41,
    name: "Batedeira Perola 550 Double Bowl Preta 500W Britânia",
    value: "R$ 199,90 ",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/b/a/batedeira-perola-550-double-bowl-preta-500w-britania_737638_2.webp",
    link: "https://www.havan.com.br/batedeira-perola-550-double-bowl-preta-500w-britania/p",
  },
  {
    id: 42,
    name: "Tábua De Churrasco Teca C/ Bandeja E Potes Inox Stolf - Madeira",
    value: "R$ 149,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/t/a/tabua-de-churrasco-teca-c--bandeja-e-potes-inox-stolf_749801.webp",
    link: "https://www.havan.com.br/tabua-de-churrasco-teca-c-bandeja-e-potes-inox-stolf-madeira/p",
  },
  {
    id: 43,
    name: "Faqueiro Laguna Tramontina 16 Peças - Inox",
    value: "R$ 99,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/f/a/faqueiro-laguna-tramontina-16-pecas_947681.webp",
    link: "https://www.havan.com.br/faqueiro-laguna-tramontina-16-pecas-inox/p",
  },
  {
    id: 44,
    name: "Jogo De Xicaras De Café Com Pires L Hermitage 80Ml 8 Peças - Transparente",
    value: "R$ 59,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/j/o/jogo-de-xicaras-de-cafe-com-pires-l-hermitage-8-pecas_768334.webp",
    link: "https://www.havan.com.br/jogo-de-xicaras-de-cafe-com-pires-l-hermitage-8-pecas-transparente/p",
  },
  {
    id: 45,
    name: "Pipoqueira Loreto Tramontina 3,5 Litros - Grafite",
    value: "R$ 139,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/p/i/pipoqueira-loreto-tramontina-3-5-litros_1128349.webp",
    link: "https://www.havan.com.br/pipoqueira-loreto-tramontina-3-5-litros-grafite/p",
  },
  {
    id: 46,
    name: "Jarra De Vidro Com Tampa De Bambu Classic Lyor 1 Litro - Transparente",
    value: "R$ 59,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/j/a/jarra-de-vidro-com-tampa-de-bambu-classic-lyor-1-litro_930528.webp",
    link: "https://www.havan.com.br/jarra-de-vidro-com-tampa-de-bambu-classic-lyor-1-litro-transparente/p",
  },
  {
    id: 47,
    name: "Aparelho De Jantar E Chá Unni Brisa Oxford 20 Peças - Cerâmica",
    value: "R$ 349,90",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/a/p/aparelho-de-jantar-e-cha-unni-brisa-oxford-20-pcs_1194991.webp",
    link: "https://www.havan.com.br/aparelho-de-jantar-e-cha-unni-brisa-oxford-20-pcs-cermica/p",
  },
  {
    id: 48,
    name: "Panela de Pressão Super Brinox 4,2 Litros - Mocha Mousse",
    value: "R$ 249,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/p/a/panela-de-pressao-mocha-mouse-linha-super-cind-42_1163802.webp",
    link: "https://www.havan.com.br/panela-de-pressao-super-brinox-4-2-litros-mocha-mousse/p",
  },
  {
    id: 49,
    name: "Jogo De Taças Sobremesa 230 Ml Havan Casa 6 Peças - Munique",
    value: "R$ 39,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/j/o/jogo-de-tacas-sobremesa-230ml-havan-casa-6-pecas_1061901.webp",
    link: "https://www.havan.com.br/jogo-de-tacas-sobremesa-230ml-havan-casa-6-pecas-munique/p",
  },
  {
    id: 50,
    name: "Cesto De Roupas Bambu Com Tampa 65 Litros Conthey - Amêndoa",
    value: "R$ 139,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/c/e/cesto-de-roupas-bambu-com-tampa-65-litros-conthey_940903.webp",
    link: "https://www.havan.com.br/cesto-de-roupas-bambu-com-tampa-65-litros-conthey-amndoa/p",
  },
  {
    id: 51,
    name: "Jogo de Jarra com Taças Ice L hermitage 7 Peças - Vidro",
    value: "R$ 129,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/j/o/jogo-de-jarra-com-tacas-ice-lhermitage-7-pecas_1008312.webp",
    link: "https://www.havan.com.br/jogo-de-jarra-com-tacas-ice-lhermitage-7-pecas-vidro/p",
  },
  {
    id: 52,
    name: "Porta Algodão E Cotonete Com Tampa My Box Lyor - Bambu",
    value: "R$ 39,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/p/o/porta-algodao-e-cotonete-com-tampa-de-bambu-my-box_1164015.webp",
    link: "https://www.havan.com.br/porta-algodao-e-cotonete-com-tampa-my-box-lyor-bambu/p",
  },
  {
    id: 53,
    name: "Jogo Taça Premium Transparente Havan Casa 365Ml - 6 Peças",
    value: "R$ 59,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/j/o/jogo-de-tacas-premium-transparente-havan-casa-365ml_1184818.webp",
    link: "https://www.havan.com.br/jogo-de-tacas-premium-transparente-havan-casa-365ml-6-peas/p",
  },
  {
    id: 54,
    name: "Travesseiro Nasa com Suporte Anatômico 46Cm X 66Cm Marcbrayn - Bege",
    value: "R$ 99,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/t/r/travesseiro-62x42cm-visco-basic-marcbrayn_1250132.webp",
    link: "https://www.havan.com.br/travesseiro-62x42cm-visco-basic-marcbrayn-bege/p",
  },
  {
    id: 55,
    name: "Travesseiro Nasa com Suporte Anatômico 46Cm X 66Cm Marcbrayn - Bege",
    value: "R$ 99,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/t/r/travesseiro-62x42cm-visco-basic-marcbrayn_1250132.webp",
    link: "https://www.havan.com.br/travesseiro-62x42cm-visco-basic-marcbrayn-bege/p",
  },
  {
    id: 56,
    name: "Varal De Chão Com Abas Maxi Mor - Branco",
    value: "R$ 179,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/v/a/varal-de-chao-com-abas-maxi-mor_1164097.webp",
    link: "https://www.havan.com.br/varal-de-chao-com-abas-maxi-mor-branco/p",
  },
  {
    id: 57,
    name: "Lasanheira De Vidro Com Tampa 5 Litros Marinex - Transparente",
    value: "R$ 99,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/l/a/lasanheira-de-vidro-com-tampa-5-litros-marinex_1031876.webp",
    link: "https://www.havan.com.br/lasanheira-de-vidro-com-tampa-5-litros-marinex-transparente/p",
  },
  {
    id: 58,
    name: "Jogo de Copos de Vidro Long Drink Dance Pasabahçe 320Ml - 6 Peças",
    value: "R$ 39,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/j/o/jogo-de-copos-de-vidro-long-drink-dance-pasabahce-320ml_1191315.webp",
    link: "https://www.havan.com.br/jogo-de-copos-de-vidro-long-drink-dance-pasabahce-320ml-6-peas/p",
  },
  {
    id: 59,
    name: "Porta Bolo De Bambu Com Tampa 28Cm - Havan Casa",
    value: "R$ 69,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/p/o/porta-bolo-de-bambu-com-tampa-28cm_1005989.webp",
    link: "https://www.havan.com.br/porta-bolo-de-bambu-com-tampa-28cm-havan-casa/p",
  },
  {
    id: 60,
    name: "Conjunto para Frios 3 peças - Diversos",
    value: "R$ 59,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/c/o/conjunto-para-frios-3-pecas-brinox_25053_1.webp",
    link: "https://www.havan.com.br/conjunto-para-frios-3-pecas-diversos/p",
  },
  {
    id: 61,
    name: "Escorredor De Louça Com Porta Copos Arthi - Aço Cromado",
    value: "R$ 89,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/e/s/escorredor-berco-em-aco-cromado-com-porta-copos-arthi_795466.webp",
    link: "https://www.havan.com.br/escorredor-berco-em-aco-cromado-com-porta-copos-arthi-ao-cromado/p",
  },
  {
    id: 62,
    name: "Mini Processador de Alimentos Britânia 360ml Função Pulsar 2P",
    value: "R$ 149,90",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/m/i/mini-processador-2p-britania_1239754_2.webp",
    link: "https://www.havan.com.br/mini-processador-2p-britania/p",
  },
  {
    id: 63,
    name: "Porta Talheres Querida Black Arthi - Preto",
    value: "R$ 44,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/p/o/porta-talheres-querida-black-arthi_900998.webp",
    link: "https://www.havan.com.br/porta-talheres-querida-black-arthi-preto/p",
  },
  {
    id: 64,
    name: "Porta-Guardanapos Querida Arthi",
    value: "R$ 24,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/p/o/porta-guardanapos-querida-arthi_1087591.webp",
    link: "https://www.havan.com.br/porta-guardanapos-querida-arthi-diversos/p",
  },
  {
    id: 65,
    name: "Suporte para Rolo de Papel Toalha Black Eco Design Arthi - 15cm",
    value: "R$ 39,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/s/u/suporte-para-rolo-de-papel-toalha-eco-design-black-arthi_967484.webp",
    link: "https://www.havan.com.br/suporte-para-rolo-de-papel-toalha-eco-design-black-arthi-15cm/p",
  },
  {
    id: 66,
    name: "Pegador Inox com Ponta de Silicone Weck 30Cm",
    value: "R$ 29,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/p/e/pegador-inox-com-ponta-de-silicone-cinza-30cm_1249909.webp",
    link: "https://www.havan.com.br/pegador-inox-com-ponta-de-silicone-cinza-30cm-diversos/p",
  },
  {
    id: 67,
    name: "Espatula de Silicone 28Cm Creme e Cinza Weck",
    value: "R$ 29,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/e/s/espatula-silicone-weck-28cm-cremecinza_1249984.webp",
    link: "https://www.havan.com.br/espatula-silicone-weck-28cm-cremecinza-diversos/p",
  },
  {
    id: 68,
    name: "Travessa Melamina Marmorizada 32X13cm Weck",
    value: "R$ 29,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/t/r/travessa-melamina-marmorizada-32x13-weck_1264257.webp",
    link: "https://www.havan.com.br/travessa-melamina-marmorizada-32x13-weck-diversos/p",
  },
  {
    id: 69,
    name: "Jogo de Xícaras com Pires Colibri Wolff 170Ml - 4 Peças",
    value: "R$ 79,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/j/o/jogo-de-xicaras-com-pires-colibri-wolff-190ml_1228984.webp",
    link: "https://www.havan.com.br/jogo-de-xicaras-com-pires-colibri-wolff-190ml-4-peas/p",
  },
  {
    id: 70,
    name: "Cesta De Pão Retangular Com Alça Havan Casa 25Cm - Natural",
    value: "R$ 34,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/c/e/cesta-de-pao-retangular-com-alca-havan-casa-25cm_1041343.webp",
    link: "https://www.havan.com.br/cesta-de-pao-retangular-com-alca-havan-casa-25cm-natural/p",
  },
  {
    id: 71,
    name: "Jogo de Banheiro Bambu Havan Casa 6 Peças - Preto",
    value: "R$ 149,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/j/o/jogo-de-banheiro-bambu-6-pecas_1221532.webp",
    link: "https://www.havan.com.br/jogo-de-banheiro-bambu-havan-casa-6-pecas-preto/p",
  },
  {
    id: 72,
    name: "Lixeira Quadrada com Pedal Havan Casa 12 Litros - Cinza",
    value: "R$ 119,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/l/i/lixeira-plastica-com-pedal-12l-havan-casa_1211250.webp",
    link: "https://www.havan.com.br/lixeira-plastica-com-pedal-12l-havan-casa-cinza/p",
  },
  {
    id: 73,
    name: "Jogo de Potes de Vidro Hauskraft - 5 Peças",
    value: "R$ 39,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/j/o/jogo-de-potes-de-vidro-borossilicato-hauskraft_1229391.webp",
    link: "https://www.havan.com.br/jogo-de-potes-de-vidro-borossilicato-hauskraft-5-peas/p",
  },
  {
    id: 74,
    name: "Pote Hermético Redondo De Vidro Hauskraft 1,2 Litros - LIEGE",
    value: "R$ 34,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/p/o/pote-hermetico-de-vidro-12l-liege-hauskraft_1200709.webp",
    link: "https://www.havan.com.br/pote-hermetico-de-vidro-12l-liege-hauskraft-liege/p",
  },
  {
    id: 75,
    name: "Pote Hermético Redondo De Vidro Hauskraft 900Ml - LIEGE",
    value: "R$ 29,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/p/o/pote-hermetico-de-vidro-12l-liege-hauskraft_1200709.webp",
    link: "https://www.havan.com.br/pote-hermetico-de-vidro-12l-liege-hauskraft-liege/p",
  },
  {
    id: 76,
    name: "Pote Hermético Redondo De Vidro Hauskraft 700Ml - LIEGE",
    value: "R$ 24,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/p/o/pote-hermetico-de-vidro-12l-liege-hauskraft_1200709.webp",
    link: "https://www.havan.com.br/pote-hermetico-de-vidro-12l-liege-hauskraft-liege/p",
  },
  {
    id: 77,
    name: "Descascador De Legumes Chef Pro Wolff 18Cm",
    value: "R$ 29,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/d/e/descascador-de-legumes-liga-de-zingo-wolff_1197436.webp",
    link: "https://www.havan.com.br/descascador-de-legumes-liga-de-zingo-wolff-diversos/p ",
  },
  {
    id: 78,
    name: "Pote Hermético Retangular Duo Lock 2,3 Litros Ou - Transparente",
    value: "R$ 49,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/p/o/pote-hermetico-retangular-duo-lock-2-3-litros-ou_1194602.webp",
    link: "https://www.havan.com.br/pote-hermetico-retangular-duo-lock-2-3-litros-ou-transparente/p ",
  },
  {
    id: 79,
    name: "Chaleira Com Bico Coador De Vidro Stanford 1 Litro - Hauskraft",
    value: "R$ 49,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/c/h/chaleira-com-bico-coador-de-vidro-stanford-1-litro_1194129.webp",
    link: "https://www.havan.com.br/chaleira-com-bico-coador-de-vidro-stanford-1-litro-hauskraft/p",
  },
  {
    id: 80,
    name: "Passadeira A Vapor Klicke",
    value: "R$ 199,90",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/p/a/passadeira-a-vapor-klicke_1223869_1.webp",
    link: "https://www.havan.com.br/passadeira-a-vapor-klicke/p ",
  },
  {
    id: 81,
    name: "Jogo De Pratos Para Sobremesa Safira Havan Casa - 7 Peças",
    value: "R$ 69,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/j/o/jogo-de-pratos-para-sobremesa-safira-havan-casa_1193339.webp",
    link: "https://www.havan.com.br/jogo-de-pratos-para-sobremesa-safira-havan-casa-7-peas/p",
  },
  {
    id: 82,
    name: "Jarra Com Tampa Royal Havan Casa 1,8 Litros - Vidro",
    value: "R$ 39,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/j/a/jarra-com-tampa-royal-havan-casa-1-8-litros_1192764.webp",
    link: "https://www.havan.com.br/jarra-com-tampa-royal-havan-casa-1-8-litros-vidro/p",
  },
  {
    id: 83,
    name: "Garrafa Térmica Com Trava Havan Casa 1,9 Litros - Aço Inox",
    value: "R$ 169,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/g/a/garrafa-termica-com-trava-havan-casa-1-9-litros_1184372.webp",
    link: "https://www.havan.com.br/garrafa-termica-com-trava-havan-casa-1-9-litros-ao-inox/p",
  },
  {
    id: 84,
    name: "Forma Pudim Lisa Havan Casa 23Cm - Cinza",
    value: "R$ 39,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/f/o/forma-pudim-lisa-havan-casa-23cm_1184308.webp",
    link: "https://www.havan.com.br/forma-pudim-lisa-havan-casa-23cm-cinza/p",
  },
  {
    id: 85,
    name: "Jogo De Jantar Opaline Marselha Havan Casa - 12 Peças",
    value: "R$ 199,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/j/o/jogo-de-jantar-opaline-marselha-havan-casa_1183504.webp",
    link: "https://www.havan.com.br/jogo-de-jantar-opaline-marselha-havan-casa-12-peas/p",
  },
  {
    id: 86,
    name: "Organizador Giratório Alto Com Divisória 25,5Cm Lume Ou - BEGE FECHADO",
    value: "R$ 69,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/o/r/organizador-giratorio-alto-com-divisoria-lume_1190171.webp ",
    link: "https://www.havan.com.br/organizador-giratorio-alto-com-divisoria-lume-bege-fechado/p",
  },
  {
    id: 87,
    name: "Meleira Soho em Cristal L Hermitage 360Ml - Transparente",
    value: "R$ 29,99",
    image:
      "https://www.havan.com.br/media/catalog/product/cache/820af7facfa7aca6eb3c138e3457dc8d/m/e/meleira-soho-em-cristal-l-hermitage-360ml_1173330.webp",
    link: "https://www.havan.com.br/meleira-soho-em-cristal-l-hermitage-360ml-transparente/p",
  },
];

export default function WeddingSite() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [rsvpConfirmation, setRsvpConfirmation] = useState<RsvpConfirmation>(null);
  const [giftSearch, setGiftSearch] = useState("");
  const [giftFilter, setGiftFilter] = useState<GiftFilter>("todos");
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [giftGuestName, setGiftGuestName] = useState("");
  const [giftPixValue, setGiftPixValue] = useState("");
  const [giftSubmitting, setGiftSubmitting] = useState(false);

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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.35;
  }, []);

  const normalizedGifts = useMemo(() => gifts.map(normalizeGift), []);

  const filteredGifts = useMemo(() => {
    const search = removeAccents(giftSearch).toLowerCase().trim();

    return normalizedGifts.filter((gift) => {
      const isPix = gift.name === PIX_GIFT_NAME;
      const reservedBy = isPix ? null : giftReservations[gift.name];
      const matchesSearch = removeAccents(gift.name)
        .toLowerCase()
        .includes(search);
      const matchesFilter =
        giftFilter === "todos" ||
        (giftFilter === "disponiveis" && !reservedBy) ||
        (giftFilter === "reservados" && !!reservedBy);

      return matchesSearch && matchesFilter;
    });
  }, [giftFilter, giftReservations, giftSearch, normalizedGifts]);

  function showFeedback(type: "success" | "error", message: string) {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback(null), 4200);
  }

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
      console.error("Erro ao tocar música:", error);
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
      console.error("Erro ao reiniciar música:", error);
      setMusicPlaying(false);
    }
  }

  function formatPixValue(value: string) {
    const clean = value.replace(/[^\d,.-]/g, "").replace(",", ".");
    const number = Number(clean);

    if (Number.isNaN(number) || number <= 0) return "";

    return number.toFixed(2);
  }

  function removeAccents(text: string) {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9 ]/g, "");
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
    <div className="min-h-screen bg-[#f7f3ed] text-[#6d4c2f] font-serif overflow-x-hidden">
      <FallingFlowers />
      <LightParticles />

      <audio
        ref={audioRef}
        src="/musica.mp3"
        preload="auto"
        onEnded={restartMusicFromSelectedTime}
      />

      <button
        type="button"
        onClick={toggleMusic}
        className="fixed bottom-6 right-4 md:bottom-7 md:right-7 z-50 bg-white/80 text-[#8a5b2b] border border-white/60 backdrop-blur-xl px-4 py-2.5 rounded-full shadow-[0_12px_35px_rgba(0,0,0,0.22)] hover:bg-white hover:scale-[1.02] transition-all duration-300 text-sm font-semibold animate-[musicPulse_3.2s_ease-in-out_infinite]"
        aria-label={musicPlaying ? "Pausar música" : "Tocar música"}
      >
        <div className="flex items-center gap-2">
          {musicPlaying ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M8 5h3v14H8zm5 0h3v14h-3z" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 ml-[2px]"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}

          <span>{musicPlaying ? "Nossa música" : "Tocar música"}</span>
        </div>
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
              className="w-full bg-[#8a5b2b] text-white py-3 rounded-2xl mb-3"
            >
              Copiar código PIX
            </button>

            <button
              type="button"
              onClick={() => setShowPixModal(false)}
              className="w-full bg-[#f7efe3] text-[#8a5b2b] border border-[#caa36d] py-3 rounded-2xl"
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
                    <strong>Quantidade:</strong> {rsvpConfirmation.guests} convidado(s)
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

      <section className="relative min-h-[100svh] flex items-center justify-center px-4 sm:px-6 py-8 sm:py-10 md:py-16 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center animate-[heroBgBreath_16s_ease-in-out_infinite]"
          style={{
            backgroundImage: "url('/fundo-site.png')",
            transform: "scale(1.08)",
          }}
        />

        <video
          autoPlay
          muted
          loop
          playsInline
          poster="/fundo-site.png"
          className="absolute inset-0 w-full h-full object-cover opacity-75 animate-[heroBgBreath_16s_ease-in-out_infinite]"
        >
          <source src="/video-bg.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 backdrop-blur-[1.4px] bg-[linear-gradient(180deg,rgba(8,6,4,0.50)_0%,rgba(20,14,9,0.42)_42%,rgba(7,5,3,0.68)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,245,218,0.18)_0%,rgba(255,255,255,0.04)_31%,rgba(0,0,0,0.58)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(226,183,105,0.17)_0%,transparent_35%,rgba(255,255,255,0.08)_52%,transparent_70%)] animate-[goldLight_8s_ease-in-out_infinite]" />
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/34 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/52 to-transparent" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:4px_4px] mix-blend-soft-light" />

        <div className="relative max-w-[920px] w-full text-center text-white drop-shadow-[0_10px_34px_rgba(0,0,0,0.50)] px-1 sm:px-0">
          <p className="uppercase tracking-[0.20em] sm:tracking-[0.38em] md:tracking-[0.52em] text-[10px] sm:text-xs md:text-sm mb-4 sm:mb-5 md:mb-8 leading-5 animate-[heroKicker_1s_ease-out_0.1s_both]">
            Um novo capítulo da nossa história começa
          </p>

          <h1 className="text-[clamp(3.2rem,10vw,7.4rem)] font-serif mb-4 sm:mb-5 md:mb-7 leading-[0.96] tracking-wide drop-shadow-[0_8px_28px_rgba(0,0,0,0.72)] animate-[heroTitle_1.25s_ease-out_0.25s_both]">
            Larissa &amp; Vinicius
          </h1>

          <p className="text-xl sm:text-2xl md:text-3xl mb-3 md:mb-4 drop-shadow-[0_4px_14px_rgba(0,0,0,0.58)] animate-[heroFadeUp_1s_ease-out_0.45s_both]">
            15 de Janeiro de 2027
          </p>

          <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl leading-7 md:leading-8 mb-7 md:mb-11 drop-shadow-[0_4px_14px_rgba(0,0,0,0.58)] px-2 animate-[heroFadeUp_1s_ease-out_0.6s_both]">
            17:00 H
          </p>

          <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl leading-7 md:leading-8 mb-7 md:mb-11 drop-shadow-[0_4px_14px_rgba(0,0,0,0.58)] px-2 animate-[heroFadeUp_1s_ease-out_0.75s_both]">
            Estamos muito felizes em compartilhar esse momento especial com
            vocês...
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4 max-w-3xl mx-auto mb-7 md:mb-12 animate-[heroFadeUp_1s_ease-out_0.9s_both]">
            {[
              ["Dias", timeLeft.days],
              ["Horas", timeLeft.hours],
              ["Minutos", timeLeft.minutes],
              ["Segundos", timeLeft.seconds],
            ].map(([label, value], index) => (
              <div
                key={String(label)}
                className="group bg-white/12 backdrop-blur-2xl rounded-2xl md:rounded-3xl px-3 py-4 md:p-6 border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.36),inset_0_-18px_35px_rgba(255,255,255,0.05),0_20px_48px_rgba(0,0,0,0.25)] transition-all duration-300 hover:scale-[1.012] hover:bg-white/17 hover:border-white/38"
                style={{ animation: `heroFadeUp 0.9s ease-out ${0.95 + index * 0.08}s both` }}
              >
                <div key={String(value)} className="text-3xl sm:text-4xl md:text-5xl font-bold leading-none animate-[numberTick_0.35s_ease-out_both]">
                  {value}
                </div>
                <div className="uppercase text-[10px] md:text-sm mt-2 tracking-widest opacity-95">
                  {label}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-3xl mx-auto animate-[heroFadeUp_1s_ease-out_1.18s_both]">
            <MenuButton onClick={() => openSection("confirmacao")}>
              Confirmar Presença
            </MenuButton>

            <MenuButton onClick={() => openSection("local")}>Local</MenuButton>

            <MenuButton onClick={() => openSection("presentes")}>
              Presentes
            </MenuButton>

            <MenuButton onClick={() => openSection("historia")}>
              Nossa História
            </MenuButton>
          </div>
        </div>

      </section>

      {activeSection === "confirmacao" && (
        <Section id="conteudo" title="Confirmar Presença" onBack={goHome}>
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
          <div className="text-center">
            <p className="text-xl md:text-2xl mb-4">
              Cerradu&apos;s Festa e Lazer
            </p>

            <p className="text-base md:text-lg mb-8">
              Clique no botão abaixo para abrir a rota no Google Maps.
            </p>

            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#8a5b2b] hover:bg-[#74491f] text-white px-6 md:px-8 py-4 rounded-2xl shadow-lg transition-all"
            >
              Abrir no Google Maps
            </a>
          </div>
        </Section>
      )}

      {activeSection === "presentes" && (
        <Section id="conteudo" title="Lista de Presentes" wide onBack={goHome}>
          <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <input
              type="search"
              value={giftSearch}
              onChange={(e) => setGiftSearch(e.target.value)}
              placeholder="Buscar presente por nome"
              className="w-full rounded-2xl border border-[#d9c3a4] bg-white px-4 py-3 outline-none text-base"
            />

            <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
              {[
                ["todos", "Todos"],
                ["disponiveis", "Disponíveis"],
                ["reservados", "Reservados"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGiftFilter(value as GiftFilter)}
                  className={`rounded-2xl border px-3 py-3 font-semibold transition-all ${
                    giftFilter === value
                      ? "bg-[#8a5b2b] text-white border-[#8a5b2b]"
                      : "bg-[#f7efe3] text-[#8a5b2b] border-[#caa36d] hover:bg-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <p className="mb-5 text-sm md:text-base text-[#7a5b3a]">
            {filteredGifts.length}{" "}
            {filteredGifts.length === 1
              ? "presente encontrado"
              : "presentes encontrados"}
            .
          </p>

          {filteredGifts.length === 0 ? (
            <div className="rounded-3xl border border-[#eadcc7] bg-[#f7efe3] p-8 text-center">
              Nenhum presente encontrado com os filtros atuais.
            </div>
          ) : (
            <div className="grid grid-cols-1 min-[430px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {filteredGifts.map((gift) => {
                const isPix = gift.name === PIX_GIFT_NAME;
                const reservedBy = isPix ? null : giftReservations[gift.name];

                return (
                  <div
                    key={gift.id}
                    className="border border-[#eadcc7] rounded-[18px] overflow-hidden shadow-md bg-white flex flex-col transition-all hover:-translate-y-1 hover:shadow-xl"
                  >
                    <img
                      src={gift.image}
                      alt={gift.name}
                      loading="lazy"
                      className={
                        isPix
                          ? "w-full h-36 min-[430px]:h-32 md:h-40 object-contain bg-white p-4"
                          : "w-full h-36 min-[430px]:h-32 md:h-40 object-contain bg-white p-3"
                      }
                    />

                    <div className="p-3 md:p-4 flex flex-col flex-1">
                      <h3
                        className="text-base min-[430px]:text-sm md:text-xl leading-5 md:leading-6 mb-2 overflow-hidden"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {gift.name}
                      </h3>

                      <p className="text-base md:text-lg mb-2 font-semibold">
                        {gift.value || "Valor livre"}
                      </p>

                      {isPix && (
                        <p className="text-xs md:text-sm mb-3 leading-5 text-[#7a5b3a]">
                          Contribua com qualquer valor.
                        </p>
                      )}

                      {reservedBy && (
                        <p className="mb-3 rounded-xl bg-[#f7efe3] px-3 py-2 text-xs md:text-sm font-semibold text-[#7a5b3a]">
                          Presente reservado
                        </p>
                      )}

                      {reservedBy ? (
                        <button
                          type="button"
                          disabled
                          className="w-full bg-gray-400 text-white py-2.5 rounded-xl cursor-not-allowed text-xs md:text-sm font-semibold mt-auto"
                        >
                          Presente Reservado
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => openGiftModal(gift)}
                            className="w-full bg-[#8a5b2b] hover:bg-[#74491f] text-white py-2.5 rounded-xl transition-all text-xs md:text-sm font-semibold mt-auto"
                          >
                            {isPix ? "Presentear via PIX" : "Quero Presentear"}
                          </button>

                          {gift.link && !isPix && (
                            <a
                              href={gift.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 block w-full text-center bg-[#f7efe3] border border-[#caa36d] text-[#8a5b2b] py-2.5 rounded-xl transition-all text-xs md:text-sm font-semibold hover:bg-white"
                            >
                              Comprar na Havan
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={goHome}
              className="bg-[#f7efe3] border border-[#caa36d] text-[#8a5b2b] px-8 py-3 rounded-2xl shadow-md hover:bg-white transition-all font-semibold"
            >
              Voltar ao Início
            </button>
          </div>
        </Section>
      )}

      {activeSection === "historia" && (
        <Section id="conteudo" title="Nossa História" onBack={goHome}>
          <p className="text-base md:text-lg leading-8 md:leading-9 text-center">
            Deus mudou o teu caminho até juntares com o meu e guardou a tua vida
            separando-a para mim. Para onde fores, irei. Onde tu repousares,
            repousarei. Teu Deus será o meu Deus. Teu caminho o meu será.
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
          0%, 100% {
            filter: brightness(0.88) saturate(1.03) contrast(1.02);
          }

          50% {
            filter: brightness(1.01) saturate(1.1) contrast(1.05);
          }
        }

        @keyframes goldLight {
          0%, 100% {
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


        @keyframes musicPulse {
          0%, 100% {
            box-shadow: 0 12px 35px rgba(0, 0, 0, 0.22);
          }

          50% {
            box-shadow: 0 12px 35px rgba(0, 0, 0, 0.22), 0 0 0 8px rgba(255, 255, 255, 0.14);
          }
        }
      `}</style>
    </div>
  );
}

function FallingFlowers() {
  const petals = Array.from({ length: 8 });

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden hidden sm:block">
      {petals.map((_, index) => (
        <span
          key={index}
          className="absolute block rounded-full animate-[petalFall_22s_linear_infinite]"
          style={{
            left: `${(index * 12.5) % 100}%`,
            top: "-40px",
            width: `${7 + (index % 4) * 3}px`,
            height: `${12 + (index % 5) * 3}px`,
            background:
              "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95), rgba(244,179,195,0.58) 45%, rgba(213,122,145,0.28) 100%)",
            boxShadow: "0 2px 8px rgba(255, 190, 205, 0.18)",
            opacity: 0.36,
            transform: `rotate(${index * 23}deg)`,
            animationDelay: `${index * 2.2}s`,
            animationDuration: `${20 + (index % 6)}s`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes petalFall {
          0% {
            transform: translate3d(0, -10vh, 0) rotate(0deg);
            opacity: 0;
          }

          12% {
            opacity: 0.35;
          }

          40% {
            transform: translate3d(25px, 35vh, 0) rotate(90deg);
          }

          70% {
            transform: translate3d(-18px, 70vh, 0) rotate(180deg);
          }

          90% {
            opacity: 0.3;
          }

          100% {
            transform: translate3d(16px, 110vh, 0) rotate(260deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

function LightParticles() {
  const particles = Array.from({ length: 18 });

  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden hidden sm:block">
      {particles.map((_, index) => (
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
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
            opacity: 0.12;
          }

          50% {
            transform: translate3d(12px, -18px, 0) scale(1.8);
            opacity: 0.34;
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

type MenuButtonProps = {
  children: ReactNode;
  onClick: () => void;
};

function MenuButton({ children, onClick }: MenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative overflow-hidden bg-white/86 text-[#8a5b2b] border border-white/72 backdrop-blur-xl hover:bg-white hover:text-[#74491f] py-[16px] md:py-[18px] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.18)] transition-all duration-300 font-semibold text-sm md:text-base hover:scale-[1.012] hover:-translate-y-0.5 hover:shadow-[0_14px_38px_rgba(0,0,0,0.24)] before:absolute before:inset-0 before:bg-[linear-gradient(115deg,transparent,rgba(255,255,255,0.58),transparent)] before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700"
    >
      <span className="relative z-10">{children}</span>
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
      className={`${wide ? "max-w-7xl" : "max-w-4xl"} mx-auto px-3 sm:px-4 md:px-6 py-8 md:py-20`}
    >
      <div className="bg-white rounded-[24px] md:rounded-[40px] p-4 sm:p-5 md:p-12 shadow-2xl border border-[#eadcc7]">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-10 gap-4">
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
      className="p-4 rounded-2xl border border-[#d9c3a4] outline-none w-full text-base"
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
      className="p-4 rounded-2xl border border-[#d9c3a4] outline-none w-full text-base"
      {...props}
    />
  );
}
