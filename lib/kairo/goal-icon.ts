import {
  Rocket, Code, Palette, Music, Dumbbell, Trophy, BookOpen, GraduationCap,
  PenLine, Briefcase, DollarSign, TrendingUp, Heart, Leaf, Utensils, Plane,
  Home, Camera, Mic, Globe, Users, Target, type LucideIcon,
} from "lucide-react";
import type { GoalIconKey } from "./goal-icon-keys";

const MAP: Record<GoalIconKey, LucideIcon> = {
  rocket: Rocket, code: Code, design: Palette, music: Music, fitness: Dumbbell,
  trophy: Trophy, study: BookOpen, school: GraduationCap, writing: PenLine,
  career: Briefcase, money: DollarSign, growth: TrendingUp, health: Heart,
  habit: Leaf, cooking: Utensils, travel: Plane, home: Home, photo: Camera,
  speaking: Mic, language: Globe, community: Users, target: Target,
};

/** Resolve a goal's icon key to a component (Target is the safe default). */
export function goalIcon(key: string | null | undefined): LucideIcon {
  return (key && MAP[key as GoalIconKey]) || Target;
}
