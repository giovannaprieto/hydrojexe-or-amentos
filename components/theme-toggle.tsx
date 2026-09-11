"use client";

import { useSyncExternalStore } from "react";

import { IconMoon, IconSun } from "@/components/icons";

type Tema = "light" | "dark";

function subscribe(callback: () => void) {
  const obs = new MutationObserver(callback);
  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => obs.disconnect();
}

function getSnapshot(): Tema {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot(): Tema {
  return "light";
}

/** Alterna o fundo do sistema entre claro e escuro. A escolha fica salva
 *  no navegador; o script no <html> a reaplica antes da primeira pintura. */
export function ThemeToggle() {
  const tema = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const escuro = tema === "dark";

  const alternar = () => {
    const proximo: Tema = escuro ? "light" : "dark";
    document.documentElement.classList.toggle("dark", proximo === "dark");
    try {
      localStorage.setItem("theme", proximo);
    } catch {
      /* localStorage indisponível — ignora */
    }
  };

  return (
    <button
      type="button"
      onClick={alternar}
      title={escuro ? "Usar fundo claro" : "Usar fundo escuro"}
      aria-label={escuro ? "Usar fundo claro" : "Usar fundo escuro"}
      aria-pressed={escuro}
      className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-100 hover:text-navy-900 dark:text-navy-300 dark:hover:bg-white/10 dark:hover:text-white"
    >
      {escuro ? <IconSun className="size-5" /> : <IconMoon className="size-5" />}
    </button>
  );
}
