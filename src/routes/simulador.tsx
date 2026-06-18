import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/simulador")({
  component: SimuladorRedirect,
});

function SimuladorRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Scroll to the simulator section once we land on the homepage
    const tryScroll = () => {
      const el = document.getElementById("simulador-ambiente");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return true;
      }
      return false;
    };
    if (!tryScroll()) {
      const t = setTimeout(tryScroll, 300);
      return () => clearTimeout(t);
    }
  }, []);
  return <Navigate to="/" hash="simulador-ambiente" replace />;
}