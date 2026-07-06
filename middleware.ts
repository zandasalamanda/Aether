import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Clerk when configured; otherwise a pass-through so the app runs in demo mode.
const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && !!process.env.CLERK_SECRET_KEY;

export default hasClerk ? clerkMiddleware() : function middleware() { return NextResponse.next(); };

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpg|jpeg|gif|png|svg|ico|webp|woff2?|ttf|map|txt|xml)).*)",
    "/(api|trpc)(.*)",
  ],
};
