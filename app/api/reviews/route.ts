import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL as string);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "request body must be valid JSON" },
      { status: 400 }
    );
  }

  const { restaurantId, rating, comment } = (body ?? {}) as {
    restaurantId?: unknown;
    rating?: unknown;
    comment?: unknown;
  };

  if (!Number.isInteger(rating) || (rating as number) < 1 || (rating as number) > 5) {
    return NextResponse.json(
      { error: "rating must be a whole number between 1 and 5" },
      { status: 400 }
    );
  }

  const trimmedComment = typeof comment === "string" ? comment.trim() : "";
  if (!trimmedComment) {
    return NextResponse.json(
      { error: "comment cannot be empty" },
      { status: 400 }
    );
  }

  const [restaurant] = await sql`SELECT id FROM restaurants WHERE id = ${restaurantId}`;
  if (!restaurant) {
    return NextResponse.json(
      { error: `restaurant ${String(restaurantId)} does not exist` },
      { status: 400 }
    );
  }

  const [review] = await sql`
    INSERT INTO reviews (restaurant_id, rating, comment)
    VALUES (${restaurantId}, ${rating}, ${trimmedComment})
    RETURNING id
  `;

  return NextResponse.json({ success: true, reviewId: review.id }, { status: 201 });
}
