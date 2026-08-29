"use client";

import { useState, useTransition } from "react";

import { marcarEnviado } from "@/app/(app)/orcamentos/actions";

export function EnviarWhatsapp({
  id,
  numero,
  condominio,
}: {
  id: string;
  numero: string;
  condominio: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [msg, setMsg] = useState(
    `Olá! Segue a proposta da Hydrojexe para o ${condominio} — orçamento ${numero}. O PDF abre por este link:`,
  );
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  const enviar = () => {
    setErro(null);
    iniciar(async () => {
      const r = await marcarEnviado(id);
      if (!r.ok || !r.token) {
        setErro(r.error ?? "Não foi possível gerar o link.");
        return;
      }
      const link = `${window.location.origin}/publico/orcamento/${r.token}`;
      const texto = `${msg}\n${link}`;
      window.open(
        `https://wa.me/?text=${encodeURIComponent(texto)}`,
        "_blank",
        "noopener,noreferrer",
      );
      setAberto(false);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="hj-btn hj-btn-accent"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="size-[1.15em] shrink-0"
          aria-hidden
        >
          <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.5-5.8c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.8 1-.3.2-.5.1a6.5 6.5 0 0 1-1.9-1.2 7.3 7.3 0 0 1-1.3-1.7c-.1-.2 0-.4.1-.5l.4-.4.2-.4a.5.5 0 0 0 0-.5l-.8-1.9c-.2-.5-.4-.4-.5-.4h-.5a1 1 0 0 0-.7.3c-.3.3-1 .9-1 2.3s1 2.7 1.2 2.9a10 10 0 0 0 4 3.5c2.4 1 2.4.7 2.9.6s1.4-.6 1.6-1.1.2-1 .1-1.1z" />
        </svg>
        Enviar por WhatsApp
      </button>

      {aberto ? (
        <div className="hj-card hj-card-pad flex max-w-md flex-col gap-3">
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            rows={4}
            className="hj-control text-sm"
          />
          <p className="hj-hint">
            O link do PDF é acrescentado ao final. Ao enviar, o orçamento é
            marcado como <strong>Enviado</strong>.
          </p>
          {erro ? <p className="hj-alert hj-alert-error">{erro}</p> : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={enviar}
              disabled={pendente}
              className="hj-btn hj-btn-primary"
            >
              {pendente ? "Abrindo…" : "Abrir WhatsApp"}
            </button>
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="hj-btn hj-btn-ghost"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
