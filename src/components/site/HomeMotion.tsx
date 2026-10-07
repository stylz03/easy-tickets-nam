"use client";

import { useEffect } from "react";

export default function HomeMotion() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("home-atmosphere");
    root.dataset.scene = "desert";
    const scenes = Array.from(document.querySelectorAll<HTMLElement>("[data-scene]"));
    let frame = 0;
    const updateScene = () => {
      frame = 0;
      const marker = window.innerHeight * 0.48;
      let scene = "desert";
      for (const section of scenes) {
        if (section.getBoundingClientRect().top > marker) break;
        scene = section.dataset.scene ?? scene;
      }
      root.dataset.scene = scene;
    };
    const requestScene = () => {
      if (!frame) frame = window.requestAnimationFrame(updateScene);
    };
    updateScene();
    window.addEventListener("scroll", requestScene, { passive: true });
    window.addEventListener("resize", requestScene);
    return () => {
      window.removeEventListener("scroll", requestScene);
      window.removeEventListener("resize", requestScene);
      if (frame) window.cancelAnimationFrame(frame);
      root.classList.remove("home-atmosphere");
      delete root.dataset.scene;
    };
  }, []);

  return null;
}
