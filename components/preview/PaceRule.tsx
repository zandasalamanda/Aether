// The page's only divider, and it is a readout rather than decoration.
//
// The lit part of the gradient sits where you are in the goal, and it travels
// further right at each section, so the page's own furniture makes the argument a
// second time without ever saying so. An earlier version drew this as three hard
// segments, which read as a chart wedged between quiet sections. One continuous
// fade carries the same idea without the choppiness.
export function PaceRule({ at }: { at: number }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-5" aria-hidden>
      <div className="rule-fade" style={{ ["--rule-peak" as string]: `${at}%` }} />
    </div>
  );
}
