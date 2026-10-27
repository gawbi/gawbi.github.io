import { useEffect } from "react";
import { MotionConfig } from "motion/react";
import { initSmoothScroll } from "./lib/smooth";
import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Bugi } from "./components/Bugi";
import { Humanoid } from "./components/Humanoid";
import { Work } from "./components/Work";
import { Outro, Path, Principles, PrivateWork } from "./components/Story";

export default function App() {
  useEffect(() => initSmoothScroll(), []);

  return (
    <MotionConfig reducedMotion="user">
      <Nav />
      <main>
        <Hero />
        <Bugi />
        <Humanoid />
        <Work />
        <Principles />
        <PrivateWork />
        <Path />
        <Outro />
      </main>
    </MotionConfig>
  );
}
