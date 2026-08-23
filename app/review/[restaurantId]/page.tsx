"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

function Star({
  value,
  filled,
  onSelect,
}: {
  value: number;
  filled: boolean;
  onSelect: (value: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-label={`${value} star${value === 1 ? "" : "s"}`}
      className="p-1 transition-opacity hover:opacity-70"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-10 w-10"
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
    </button>
  );
}

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = String(params.restaurantId);

  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch(`/api/restaurants/${restaurantId}`);
      if (!response.ok) {
        setNotFound(true);
        return;
      }
      const data = await response.json();
      setRestaurantName(data.name);
    }
    load();
  }, [restaurantId]);

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

  const canSubmit = rating >= 1 && comment.trim().length > 0 && !submitting;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId: Number(restaurantId),
        rating,
        comment,
      }),
    });

    if (response.status === 201) {
      router.push(`/restaurant/${restaurantId}`);
      return;
    }

    let backendMessage = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      if (data.error) backendMessage = data.error;
    } catch {
      // keep the factual fallback
    }
    setError(backendMessage);
    setSubmitting(false);
  }

  return (
    <main className="min-h-screen bg-[#FAF9F7] text-[#1C1917]">
      <div className="mx-auto w-full max-w-[560px] px-6 py-16">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            {restaurantName ?? "Loading…"}
          </h1>
          <p className="mt-1 text-sm text-stone-500">Write a review</p>
        </header>

        <form onSubmit={handleSubmit} className="mt-12 space-y-10">
          <section>
            <label className="block text-sm font-medium text-stone-700">
              Your rating
            </label>
            <div className="mt-3 flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  value={star}
                  filled={star <= rating}
                  onSelect={setRating}
                />
              ))}
            </div>
          </section>

          <section>
            <label
              htmlFor="comment"
              className="block text-sm font-medium text-stone-700"
            >
              Your review
            </label>
            <textarea
              id="comment"
              rows={4}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="What did you think?"
              className="mt-3 w-full rounded-lg border border-stone-300 bg-white px-4 py-3 leading-relaxed outline-none focus:border-[#C2410C]"
            />
          </section>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-lg bg-[#1C1917] px-4 py-3 text-sm font-medium text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-30 hover:opacity-90"
          >
            {submitting ? "Submitting…" : "Submit review"}
          </button>
        </form>
      </div>
    </main>
  );
}
