import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Everything is private except the auth screens. Pages redirect to /login,
// API routes answer 404 to signed-out callers.
// The WhatsApp webhook is called by Meta and checks its own signature.
const isPublicRoute = createRouteMatcher(["/login(.*)", "/sign-up(.*)", "/api/webhooks/whatsapp"]);

export default clerkMiddleware(
  async (auth, req) => {
    if (!isPublicRoute(req)) {
      await auth.protect();
    }
  },
  { signInUrl: "/login", signUpUrl: "/sign-up" }
);

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
