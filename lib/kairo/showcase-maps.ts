// Pre-built, hardcoded maps shown on the landing page's interactive planet cluster and
// the "watch a goal become a plan" surface — NOT AI-generated. Each is a real, plausible
// plan, and most steps carry ONE real, hand-checked resource (a specific YouTube video
// with a thumbnail, or a cited article from a reputable source), mirroring how the app
// attaches deep research to each step. Colors are distinct palette hues; the brand gold
// stays on the catchphrase + CTA.

export interface ShowcaseResource {
  kind: "watch" | "read";
  /** The real title of the video or article. */
  title: string;
  /** watch: a real YouTube video id (drives the thumbnail + link). */
  videoId?: string;
  /** read: a real article URL. */
  url?: string;
  /** read: the publisher, e.g. "NerdWallet". */
  source?: string;
}

export interface ShowcaseNode {
  title: string;
  res?: ShowcaseResource;
}
export interface ShowcaseMilestone {
  title: string;
  subs: ShowcaseNode[];
  res?: ShowcaseResource;
}
export interface ShowcaseMap {
  id: string;
  /** full title for the opened map header */
  title: string;
  /** short label for the orbiting planet */
  short: string;
  /** icon key from GOAL_ICON_KEYS */
  icon: string;
  color: string;
  milestones: ShowcaseMilestone[];
}

const watch = (videoId: string, title: string): ShowcaseResource => ({ kind: "watch", videoId, title });
const read = (url: string, title: string, source: string): ShowcaseResource => ({ kind: "read", url, title, source });

export const SHOWCASE_MAPS: ShowcaseMap[] = [
  {
    id: "financial",
    title: "Build financial freedom",
    short: "Money",
    icon: "money",
    color: "#e6b877", // gold
    milestones: [
      {
        title: "Audit your money",
        res: read("https://www.nerdwallet.com/article/finance/how-to-budget", "How to Budget Money: A Step-By-Step Guide", "NerdWallet"),
        subs: [
          { title: "Track 30 days of spending", res: read("https://www.nerdwallet.com/finance/learn/tracking-monthly-expenses", "How to Track Your Monthly Expenses", "NerdWallet") },
          { title: "Find your biggest leaks", res: read("https://www.nerdwallet.com/finance/learn/best-expense-tracker-apps", "Best Apps to Track Expenses", "NerdWallet") },
        ],
      },
      {
        title: "Build a cushion",
        res: read("https://www.nerdwallet.com/banking/learn/why-you-should-save-a-rainy-day-fund-and-an-emergency-fund", "Rainy Day Fund vs. Emergency Fund", "NerdWallet"),
        subs: [
          { title: "Open a separate savings account", res: read("https://www.nerdwallet.com/banking/learn/emergency-fund-calculator", "Emergency Fund Calculator", "NerdWallet") },
          { title: "Automate a weekly transfer", res: read("https://www.nerdwallet.com/finance/learn/how-to-save-money", "How to Save Money: 28 Ways", "NerdWallet") },
        ],
      },
      {
        title: "Invest for growth",
        res: read("https://www.nerdwallet.com/retirement/learn/how-and-where-to-open-a-roth-ira", "How to Open a Roth IRA in 5 Steps", "NerdWallet"),
        subs: [
          { title: "Open a retirement account", res: read("https://www.nerdwallet.com/retirement/learn/how-and-where-to-open-an-ira", "How to Open an IRA in 4 Steps", "NerdWallet") },
        ],
      },
      { title: "Lasting stability", subs: [] },
    ],
  },
  {
    id: "fitness",
    title: "Get into the best shape of your life",
    short: "Fitness",
    icon: "fitness",
    color: "#d5896f", // coral
    milestones: [
      {
        title: "Set your baseline",
        res: watch("XhYSBi0hePA", "7 Exercises to Test Your Fitness Level at Home"),
        subs: [
          { title: "Take starting measurements" },
          { title: "Do a fitness test", res: watch("XhYSBi0hePA", "7 Exercises to Test Your Fitness Level at Home") },
        ],
      },
      {
        title: "Build the habit",
        res: watch("7GkMHPe_OXw", "20 Min Full Body Workout for Beginners (No Equipment)"),
        subs: [
          { title: "Train 4× a week for a month", res: watch("7GkMHPe_OXw", "20 Min Full Body Workout for Beginners (No Equipment)") },
        ],
      },
      {
        title: "Level up strength",
        res: watch("9udG51uTuls", "Every Type of Progressive Overload Explained in 8 Minutes"),
        subs: [
          { title: "Increase load each week", res: watch("9udG51uTuls", "Every Type of Progressive Overload Explained in 8 Minutes") },
        ],
      },
      { title: "Hit your peak", subs: [] },
    ],
  },
  {
    id: "language",
    title: "Become conversational in a new language",
    short: "Language",
    icon: "language",
    color: "#8fae9f", // sage
    milestones: [
      {
        title: "Learn 500 core words",
        res: watch("pm7Fhq7p6zU", "100 Most Common Spanish Words"),
        subs: [
          { title: "15 min of flashcards daily", res: read("https://ankilanguagelearning.com/", "Anki for Language Learning: The Complete Guide", "Anki Language Learning") },
        ],
      },
      { title: "Practice speaking", subs: [{ title: "Find a conversation partner" }] },
      { title: "Gain confidence", subs: [{ title: "Record yourself weekly" }] },
      { title: "Full conversation", subs: [] },
    ],
  },
  {
    id: "startup",
    title: "Launch your side project",
    short: "Startup",
    icon: "rocket",
    color: "#9aa6d4", // periwinkle
    milestones: [
      {
        title: "Validate the idea",
        res: watch("-nvJIfQnidw", "How to Validate Your Startup Idea for $50"),
        subs: [
          { title: "Write a one-line mission" },
          { title: "Sketch the core feature" },
        ],
      },
      {
        title: "Build the MVP",
        res: watch("Y6YTL_bmVFE", "Steve Blank: How to Build a Minimum Viable Product"),
        subs: [
          { title: "Ship the smallest version", res: watch("Y6YTL_bmVFE", "Steve Blank: How to Build a Minimum Viable Product") },
          { title: "Test with 5 people" },
        ],
      },
      { title: "Gather momentum", subs: [{ title: "Refine on feedback" }] },
      {
        title: "Launch day",
        res: read("https://www.producthunt.com/launch", "The Product Hunt Launch Guide", "Product Hunt"),
        subs: [],
      },
    ],
  },
  {
    id: "travel",
    title: "Plan the trip of a lifetime",
    short: "Travel",
    icon: "travel",
    color: "#7fb0ad", // teal
    milestones: [
      {
        title: "Pick a destination",
        res: read("https://www.nerdwallet.com/travel/learn/how-to-plan-a-trip", "How to Plan a Trip", "NerdWallet"),
        subs: [
          { title: "Research 3 places", res: read("https://www.nerdwallet.com/travel/learn/how-to-plan-a-trip", "How to Plan a Trip", "NerdWallet") },
          { title: "Set budget & dates", res: read("https://www.nerdwallet.com/travel/learn/best-days-book-flight-fly", "The Best Days to Book a Flight and When to Fly", "NerdWallet") },
        ],
      },
      {
        title: "Book the essentials",
        res: read("https://www.nerdwallet.com/travel/learn/how-to-shop-for-flights", "How to Book a Flight", "NerdWallet"),
        subs: [
          { title: "Lock flights & stays", res: read("https://www.nerdwallet.com/travel/learn/how-to-save-money-on-flights", "How to Save Money on Flights", "NerdWallet") },
        ],
      },
      { title: "Plan the itinerary", subs: [{ title: "List must-sees" }, { title: "Book experiences" }] },
      { title: "Depart ready", subs: [] },
    ],
  },
];
