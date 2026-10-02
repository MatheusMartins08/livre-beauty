"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { ArrowsHorizontal } from "@phosphor-icons/react";

export function BeforeAfterSlider() {
  const [position, setPosition] = useState(50);
  const id = useId();
  return (
    <div className="comparison">
      <div className="comparison-images">
        <Image
          src="/images/result-after-01.jpg"
          alt="Referência ilustrativa de cabelo após finalização, da mesma sessão fotográfica"
          fill
          sizes="(max-width: 767px) 100vw, 60vw"
        />
        <div
          className="comparison-before"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
        >
          <Image
            src="/images/result-before-01.jpg"
            alt="Referência ilustrativa de cabelo durante o cuidado, da mesma sessão fotográfica"
            fill
            sizes="(max-width: 767px) 100vw, 60vw"
          />
        </div>
        <span className="comparison-label before">Natural</span>
        <span className="comparison-label after">Finalizado</span>
        <div className="comparison-line" style={{ left: `${position}%` }}>
          <span>
            <ArrowsHorizontal size={23} aria-hidden="true" />
          </span>
        </div>
        <input
          id={id}
          type="range"
          min="0"
          max="100"
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          aria-label="Comparar referências de cabelo"
          aria-valuetext={`${position}% da referência natural visível`}
          className="comparison-range"
        />
      </div>
      <p className="demo-note">
        Comparação ilustrativa da mesma sessão de banco de imagens. Fotografias
        com poses diferentes; não representa um resultado realizado pelo Livre
        Beauty.
      </p>
    </div>
  );
}
