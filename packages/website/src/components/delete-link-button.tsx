"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export const DeleteLinkButton = ({ id }: { id: string }) => {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    if (
      pending ||
      !window.confirm(
        "Delete this short link? It will stop redirecting, and its alias stays reserved.",
      )
    )
      return;
    setError(null);
    setPending(true);
    try {
      const response = await fetch(`/api/inkbyte/links/${id}`, {
        method: "DELETE",
      });
      if (!response.ok)
        throw new Error("Could not delete the link. Try again.");
      router.refresh();
    } catch {
      setError("Could not delete the link. Try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="ink-button ink-button-quiet px-2 py-1 text-xs"
        aria-label="Delete link"
        title="Delete link"
        disabled={pending}
        onClick={remove}
      >
        <Trash2 aria-hidden size={14} />
      </button>
      {error ? (
        <span role="alert" className="text-xs text-rose-deep">
          {error}
        </span>
      ) : null}
    </>
  );
};
