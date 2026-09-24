import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PRODUCTS = 120;
const CONCURRENCY = 3;

// =========================================================
// LIMPA E FORMATA PREÇO
// =========================================================

function cleanPrice(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value <= 0) return null;

    return `R$ ${value.toFixed(2).replace(".", ",")}`;
  }

  if (typeof value !== "string") {
    return null;
  }

  const text = value
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00a0/g, " ")
    .trim();

  const match = text.match(
    /(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+(?:[.,]\d{2})?)/i,
  );

  if (!match) {
    return null;
  }

  const raw = match[1];

  const number = raw.includes(",")
    ? Number(raw.replace(/\./g, "").replace(",", "."))
    : Number(raw);

  if (!Number.isFinite(number) || number <= 0) {
    return null;
  }

  return `R$ ${number.toFixed(2).replace(".", ",")}`;
}

// =========================================================
// DECODIFICA HTML
// =========================================================

function decodeHtml(text: string): string {
  return text
    .replace(/&quot;/gi, '"')
    .replace(/&#34;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ");
}

// =========================================================
// EXTRAI PREÇO DO HTML
// =========================================================

function extractPrice(html: string): string | null {
  const decoded = decodeHtml(html);

  // -------------------------------------------------------
  // JSON-LD
  // -------------------------------------------------------

  const jsonLdBlocks =
    decoded.match(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
    ) ?? [];

  for (const block of jsonLdBlocks) {
    const json = block
      .replace(/^<script[^>]*>/i, "")
      .replace(/<\/script>$/i, "")
      .trim();

    try {
      const parsed = JSON.parse(json);

      const nodes = Array.isArray(parsed)
        ? parsed
        : [
            parsed,
            ...(Array.isArray(parsed?.["@graph"])
              ? parsed["@graph"]
              : []),
          ];

      for (const node of nodes) {
        const offers = node?.offers;

        const candidates = Array.isArray(offers)
          ? offers
          : [offers];

        for (const offer of candidates) {
          const price = cleanPrice(
            offer?.price ??
              offer?.lowPrice ??
              offer?.priceSpecification?.price,
          );

          if (price) {
            return price;
          }
        }
      }
    } catch {
      // JSON inválido, continua
    }
  }

  // -------------------------------------------------------
  // META TAGS
  // -------------------------------------------------------

  const metaPatterns = [
    /<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i,

    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']product:price:amount["']/i,

    /<meta[^>]+itemprop=["']price["'][^>]+content=["']([^"']+)["']/i,

    /<meta[^>]+content=["']([^"']+)["'][^>]+itemprop=["']price["']/i,
  ];

  for (const pattern of metaPatterns) {
    const match = decoded.match(pattern);

    const price = cleanPrice(match?.[1]);

    if (price) {
      return price;
    }
  }

  // -------------------------------------------------------
  // PADRÕES DE PREÇO
  // -------------------------------------------------------

  const structuredPatterns = [
    /["'](?:price|salePrice|bestPrice|currentPrice)["']\s*:\s*["']?(\d+(?:[.,]\d{2})?)["']?/gi,

    /(?:pre[cç]o|price)[^\d]{0,80}(\d{1,3}(?:\.\d{3})*,\d{2})/gi,
  ];

  for (const pattern of structuredPatterns) {
    const match = pattern.exec(decoded);

    const price = cleanPrice(match?.[1]);

    if (price) {
      return price;
    }
  }

  return null;
}

// =========================================================
// EXTRAI ID DO ANÚNCIO DO MERCADO LIVRE
// =========================================================

function extractMercadoLivreItemId(
  url: string,
): string | null {
  try {
    const parsed = new URL(url);

    // -----------------------------------------------------
    // 1. pdp_filters=item_id
    // -----------------------------------------------------

    const pdpFilters =
      parsed.searchParams.get("pdp_filters");

    if (pdpFilters) {
      const match = pdpFilters.match(
        /item_id:(MLB\d+)/i,
      );

      if (match) {
        return match[1].toUpperCase();
      }
    }

    // -----------------------------------------------------
    // 2. wid
    // -----------------------------------------------------

    const wid =
      parsed.searchParams.get("wid");

    if (wid && /^MLB\d+$/i.test(wid)) {
      return wid.toUpperCase();
    }

    // -----------------------------------------------------
    // 3. ID no caminho
    // -----------------------------------------------------

    const pathMatch =
      parsed.pathname.match(
        /\b(MLB\d{8,})\b/i,
      );

    if (pathMatch) {
      return pathMatch[1].toUpperCase();
    }

    return null;
  } catch {
    return null;
  }
}

// =========================================================
// EXTRAI PREÇO DA PÁGINA USANDO PLAYWRIGHT
// =========================================================

async function fetchMercadoLivreWithPlaywright(
  url: string,
): Promise<string | null> {
  let browser: Awaited<
    ReturnType<typeof chromium.launch>
  > | null = null;

  try {
    const itemId =
      extractMercadoLivreItemId(url);

    console.log(
      "==========================================",
    );

    console.log(
      "[Mercado Livre] Iniciando Playwright",
    );

    console.log(
      "[Mercado Livre] URL:",
      url,
    );

    console.log(
      "[Mercado Livre] Anúncio:",
      itemId ?? "não identificado",
    );

    console.log(
      "==========================================",
    );

    browser = await chromium.launch({
      headless: true,

      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const context =
      await browser.newContext({
        locale: "pt-BR",

        timezoneId:
          "America/Sao_Paulo",

        viewport: {
          width: 1366,
          height: 900,
        },

        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
      });

    const page =
      await context.newPage();

    // -----------------------------------------------------
    // Bloqueia recursos que não são necessários
    // -----------------------------------------------------

    await page.route(
      "**/*",
      async (route) => {
        const type =
          route.request().resourceType();

        if (
          type === "image" ||
          type === "font" ||
          type === "media"
        ) {
          await route.abort();
          return;
        }

        await route.continue();
      },
    );

    // -----------------------------------------------------
    // Abre a página real
    // -----------------------------------------------------

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // -----------------------------------------------------
    // Espera a página carregar os elementos
    // -----------------------------------------------------

    await page.waitForTimeout(2500);

    // -----------------------------------------------------
    // Tenta localizar elementos conhecidos do
    // Mercado Livre
    // -----------------------------------------------------

    const selectors = [
      // preço atual
      ".andes-money-amount__fraction",

      ".ui-pdp-price__second-line .andes-money-amount__fraction",

      ".ui-pdp-price__main-container .andes-money-amount__fraction",

      "[data-testid='price-part']",

      ".ui-pdp-price",

      // possíveis seletores antigos
      ".price-tag-fraction",

      ".price-tag-amount",
    ];

    for (const selector of selectors) {
      try {
        const elements =
          await page.locator(
            selector,
          ).all();

        for (const element of elements) {
          const text =
            await element.textContent();

          const price =
            cleanPrice(text);

          if (price) {
            console.log(
              `[Mercado Livre] Preço encontrado pelo seletor ${selector}: ${price}`,
            );

            await browser.close();

            return price;
          }
        }
      } catch {
        // Continua para o próximo seletor
      }
    }

    // -----------------------------------------------------
    // Tenta procurar no texto completo da página
    // -----------------------------------------------------

    const bodyText =
      await page.locator("body").innerText();

    const pricePatterns = [
      /R\$\s*\d{1,3}(?:\.\d{3})*,\d{2}/g,

      /R\$\s*\d+(?:,\d{2})?/g,
    ];

    for (const pattern of pricePatterns) {
      const matches =
        bodyText.match(pattern);

      if (!matches) {
        continue;
      }

      for (const match of matches) {
        const price =
          cleanPrice(match);

        if (price) {
          console.log(
            `[Mercado Livre] Preço encontrado no texto: ${price}`,
          );

          await browser.close();

          return price;
        }
      }
    }

    // -----------------------------------------------------
    // Tenta extrair do HTML final renderizado
    // -----------------------------------------------------

    const renderedHtml =
      await page.content();

    const htmlPrice =
      extractPrice(renderedHtml);

    if (htmlPrice) {
      console.log(
        `[Mercado Livre] Preço encontrado no HTML renderizado: ${htmlPrice}`,
      );

      await browser.close();

      return htmlPrice;
    }

    console.log(
      "[Mercado Livre] Não foi possível encontrar o preço.",
    );

    // -----------------------------------------------------
    // Mostra parte do título para ajudar no diagnóstico
    // -----------------------------------------------------

    try {
      const title =
        await page.title();

      console.log(
        "[Mercado Livre] Título da página:",
        title,
      );
    } catch {
      // ignora
    }

    await browser.close();

    return null;
  } catch (error) {
    console.error(
      "[Mercado Livre] Erro no Playwright:",
      error,
    );

    if (browser) {
      try {
        await browser.close();
      } catch {
        // ignora
      }
    }

    return null;
  }
}

// =========================================================
// CONSULTA HTML DE OUTRAS LOJAS
// =========================================================

async function fetchHtmlProductPrice(
  url: string,
): Promise<string | null> {
  try {
    console.log(
      `[Preço] Consultando página: ${url}`,
    );

    const response = await fetch(url, {
      method: "GET",

      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",

        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

        "Accept-Language":
          "pt-BR,pt;q=0.9,en;q=0.7",
      },

      redirect: "follow",

      cache: "no-store",

      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.log(
        `[Preço] HTTP ${response.status}: ${url}`,
      );

      return null;
    }

    const html =
      await response.text();

    const price =
      extractPrice(html);

    if (price) {
      console.log(
        `[Preço] Encontrado ${price}: ${url}`,
      );
    } else {
      console.log(
        `[Preço] Não encontrado: ${url}`,
      );
    }

    return price;
  } catch (error) {
    console.error(
      `[Preço] Erro ao consultar ${url}:`,
      error,
    );

    return null;
  }
}

// =========================================================
// CONSULTA PRODUTO
// =========================================================

async function fetchProductPrice(
  url: string,
): Promise<string | null> {
  try {
    const hostname =
      new URL(url)
        .hostname
        .toLowerCase();

    // -----------------------------------------------------
    // MERCADO LIVRE
    // -----------------------------------------------------

    if (
      hostname.includes(
        "mercadolivre.com.br",
      ) ||
      hostname.includes(
        "mercadolibre.com",
      )
    ) {
      // NÃO usa mais a API do Mercado Livre.
      //
      // O motivo é que ela está retornando 403
      // para os anúncios do seu site.

      return await fetchMercadoLivreWithPlaywright(
        url,
      );
    }

    // -----------------------------------------------------
    // OUTRAS LOJAS
    // -----------------------------------------------------

    return await fetchHtmlProductPrice(
      url,
    );
  } catch (error) {
    console.error(
      "[Preço] URL inválida:",
      url,
      error,
    );

    return null;
  }
}

// =========================================================
// ATUALIZA PREÇOS
// =========================================================

async function getProductPrices(
  products: {
    id: number;
    url: string;
  }[],
) {
  const uniqueProducts =
    Array.from(
      new Map(
        products.map((product) => [
          product.id,
          product,
        ]),
      ).values(),
    );

  const prices: Record<
    string,
    string
  > = {};

  const failed: number[] = [];

  // -------------------------------------------------------
  // Processamento em grupos
  // -------------------------------------------------------

  for (
    let start = 0;
    start < uniqueProducts.length;
    start += CONCURRENCY
  ) {
    const batch =
      uniqueProducts.slice(
        start,
        start + CONCURRENCY,
      );

    const results =
      await Promise.all(
        batch.map(
          async (product) => {
            const price =
              await fetchProductPrice(
                product.url,
              );

            return {
              product,
              price,
            };
          },
        ),
      );

    // -----------------------------------------------------
    // Guarda resultados
    // -----------------------------------------------------

    for (const result of results) {
      const id =
        String(result.product.id);

      if (result.price) {
        prices[id] =
          result.price;
      } else {
        failed.push(
          result.product.id,
        );
      }
    }
  }

  return {
    prices,
    failed,
  };
}

// =========================================================
// POST /api/gift-prices
// =========================================================

export async function POST(
  request: NextRequest,
) {
  try {
    const body =
      await request.json();

    const products =
      Array.isArray(
        body?.products,
      )
        ? body.products
        : [];

    // -----------------------------------------------------
    // Valida produtos
    // -----------------------------------------------------

    const sanitized =
      products
        .filter(
          (product: any) =>
            Number.isInteger(
              product?.id,
            ) &&
            typeof product?.url ===
              "string",
        )
        .map(
          (product: any) => ({
            id: product.id,
            url: product.url.trim(),
          }),
        )
        .filter(
          (product: {
            id: number;
            url: string;
          }) =>
            /^https?:\/\//i.test(
              product.url,
            ),
        )
        .slice(
          0,
          MAX_PRODUCTS,
        );

    // -----------------------------------------------------
    // Nenhum produto
    // -----------------------------------------------------

    if (!sanitized.length) {
      return NextResponse.json(
        {
          prices: {},
          failed: [],
          total: 0,
          updated: 0,
          updatedAt:
            new Date().toISOString(),
        },
      );
    }

    console.log(
      "==========================================",
    );

    console.log(
      "[Preços] Iniciando atualização",
    );

    console.log(
      `[Preços] Produtos: ${sanitized.length}`,
    );

    console.log(
      "==========================================",
    );

    // -----------------------------------------------------
    // CONSULTA OS PREÇOS
    //
    // Sem cache.
    //
    // Cada Ctrl + Shift + P faz uma nova consulta.
    // -----------------------------------------------------

    const result =
      await getProductPrices(
        sanitized,
      );

    const updatedAt =
      new Date().toISOString();

    console.log(
      "==========================================",
    );

    console.log(
      "[Preços] Atualização concluída",
    );

    console.log(
      `[Preços] Total: ${sanitized.length}`,
    );

    console.log(
      `[Preços] Atualizados: ${
        Object.keys(
          result.prices,
        ).length
      }`,
    );

    console.log(
      `[Preços] Falharam: ${
        result.failed.length
      }`,
    );

    console.log(
      "Presentes que não puderam ser atualizados:",
      result.failed,
    );

    console.log(
      "==========================================",
    );

    // -----------------------------------------------------
    // RETORNA PARA O PAGE.TSX
    // -----------------------------------------------------

    return NextResponse.json(
      {
        prices:
          result.prices,

        failed:
          result.failed,

        total:
          sanitized.length,

        updated:
          Object.keys(
            result.prices,
          ).length,

        updatedAt,

        forced:
          body?.force === true,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",

          Pragma:
            "no-cache",

          Expires:
            "0",
        },
      },
    );
  } catch (error) {
    console.error(
      "Erro ao atualizar preços:",
      error,
    );

    return NextResponse.json(
      {
        prices: {},

        failed: [],

        total: 0,

        updated: 0,

        error:
          "Não foi possível atualizar os preços agora.",

        updatedAt:
          new Date().toISOString(),
      },
      {
        status: 200,

        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      },
    );
  }
}