"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type ApiReview = {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
};

type RestaurantPageData = {
  name: string;
  cuisine: string;
  area: string;
  averageRating: number | null;
  totalReviews: number;
  latestReview: ApiReview | null;
  reviews: ApiReview[];
};

function Star({ filled, size }: { filled: boolean; size: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={size}
      fill={filled ? "#C2410C" : "none"}
      stroke={filled ? "#C2410C" : "#D6D3D1"}
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <polygon
        strokeWidth="0"
        points="12,2.5 15.1,8.6 21.9,9.6 17,14.3 18.2,21 12,17.8 5.8,21 7,14.3 2.1,9.6 8.9,8.6"
        stroke={filled ? "#C2410C" : "#D6D3D1"}
        fill={filled ? "#C2410C" : "none"}
      />
    </svg>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} filled={star <= rating} size="h-4 w-4" />
      ))}
    </div>
  );
}

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
});

export default function RestaurantPage() {
  const params = useParams();
  const id = String(params.id);

  const [data, setData] = useState<RestaurantPageData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const response = await fetch(`/api/restaurants/${id}`);
      if (!response.ok) {
        setNotFound(true);
        return;
      }
      setData(await response.json());
    }
    load();
  }, [id]);

  if (notFound) {
    return (
      <main className="min-h-screen bg-[#FAF9F7] text-[#1C1917]">
        <div className="mx-auto w-full max-w-[560px] px-6 py-24 text-center">
          <p className="text-lg">This restaurant does not exist.</p>
          <p className="mt-2 text-sm text-stone-500">
            Check the address and try again.
          </p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#FAF9F7] text-[#1C1917]">
        <div className="mx-auto w-full max-w-[560px] px-6 py-24">
          <p className="text-sm text-stone-400">Loading…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF9F7] text-[#1C1917]">
      <div className="mx-auto w-full max-w-[560px] px-6 py-16">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">{data.name}</h1>
          <p className="mt-1 text-sm text-stone-500">
            {data.cuisine} · {data.area}
          </p>
        </header>

        <section className="mt-12">
          <div className="flex items-baseline gap-3">
            <span data-testid="average-rating" className="text-6xl font-semibold tracking-tight">
              {data.averageRating ?? "—"}
            </span>
            <span className="text-sm text-stone-500">
              {data.totalReviews}{" "}
              {data.totalReviews === 1 ? "review" : "reviews"}
            </span>
          </div>
        </section>

        {data.latestReview ? (
          <>
            <section className="mt-10 rounded-xl border border-[#C2410C]/30 bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-widest text-[#C2410C]">
                  Latest
                </span>
                <span className="text-xs text-stone-400">
                  {dateFormat.format(new Date(data.latestReview.createdAt))}
                </span>
              </div>
              <div className="mt-3">
                <StarRow rating={data.latestReview.rating} />
              </div>
              <p className="mt-2 leading-relaxed">{data.latestReview.comment}</p>
            </section>

            {data.reviews.length > 0 && (
              <section className="mt-8">
                <ul className="divide-y divide-stone-200">
                  {data.reviews.map((review) => (
                    <li key={review.id} className="py-4">
                      <div className="flex items-center justify-between">
                        <StarRow rating={review.rating} />
                        <span className="text-xs text-stone-400">
                          {dateFormat.format(new Date(review.createdAt))}
                        </span>
                      </div>
                      <p className="mt-2 leading-relaxed text-stone-700">
                        {review.comment}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        ) : (
          <section className="mt-10 rounded-xl border border-dashed border-stone-300 p-8 text-center">
            <p className="font-medium">No reviews yet</p>
            <p className="mt-1 text-sm text-stone-500">
              Be the first to tell Ludhiana how the burrito was.
            </p>
          </section>
        )}

        <footer className="mt-12 border-t border-stone-200 pt-6">
          <Link
            href={`/review/${id}`}
            className="text-sm font-medium text-[#C2410C] hover:underline"
          >
            Write a review →
          </Link>
        </footer>
      </div>
    </main>
  );
}
