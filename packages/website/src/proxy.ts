import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const middleware = clerkMiddleware();

export default function proxy(...args: Parameters<typeof middleware>) {
  // Public pages never need a session; the API enforces access on its own.
  if (
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    !process.env.CLERK_SECRET_KEY
  ) {
    return NextResponse.next();
  }
  return middleware(...args);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api)(.*)",
  ],
};
