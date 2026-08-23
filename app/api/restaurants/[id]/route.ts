import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL as string);

type ReviewRow = {
  id: number;
  rating: number;
  comment: string;
  created_at: Date | string;
};

function toApiReview(row: ReviewRow) {
  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const restaurantId = Number(id);
  if (!Number.isInteger(restaurantId)) {
    return NextResponse.json({ error: "restaurant not found" }, { status: 404 });
  }

  const [restaurant] =
    await sql`SELECT name, cuisine, area FROM restaurants WHERE id = ${restaurantId}`;
  if (!restaurant) {
    return NextResponse.json({ error: "restaurant not found" }, { status: 404 });
  }

  const [stats] = await sql`
    SELECT AVG(rating)::float AS average_rating, COUNT(*)::int AS total_reviews
    FROM reviews
    WHERE restaurant_id = ${restaurantId}
  `;

  const rows = (await sql`
    SELECT id, rating, comment, created_at
    FROM reviews
    WHERE restaurant_id = ${restaurantId}
    ORDER BY created_at DESC
  `) as ReviewRow[];

  const [latest, ...older] = rows;

  return NextResponse.json({
    name: restaurant.name,
    cuisine: restaurant.cuisine,
    area: restaurant.area,
    averageRating:
      stats.total_reviews === 0
        ? null
        : Math.round(stats.average_rating * 10) / 10,
    totalReviews: stats.total_reviews,
    latestReview: latest ? toApiReview(latest) : null,
    reviews: older.map(toApiReview),
  });
}
