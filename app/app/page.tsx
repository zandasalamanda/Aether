import { redirect } from "next/navigation";

export default function AppIndex() {
  // The galaxy is home. It's where you create your first goal and where
  // everything lives.
  redirect("/app/map");
}
