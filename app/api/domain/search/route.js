import { NextResponse } from "next/server";
import {
  checkDomainAvailability,
  suggestAlternatives,
} from "@/lib/apiServices/porkbunService";

/**
 * GET /api/domain/search?q=davidsplumbing.com
 *
 * Checks a domain's availability and — if taken — returns smart alternatives.
 */
export async function GET(request) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q")?.trim().toLowerCase();

  if (!query || !query.includes(".")) {
    return NextResponse.json(
      { error: "Provide a full domain name, e.g. ?q=davidsplumbing.com" },
      { status: 400 },
    );
  }

  try {
    const result = await checkDomainAvailability(query);

    if (result.available) {
      return NextResponse.json({
        query,
        available: true,
        price: result.price,
        priceUsd: result.priceUsd,
        firstYearPromo: result.firstYearPromo,
        regularPriceUsd: result.regularPriceUsd,
        premium: result.premium,
        suggestions: [],
      });
    }

    // Domain is taken — fetch alternatives concurrently
    const suggestions = await suggestAlternatives(query, 6);

    return NextResponse.json({
      query,
      available: false,
      suggestions,
    });
  } catch (err) {
    console.error("[GET /api/domain/search]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
