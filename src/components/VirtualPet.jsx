import React, { useState, useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext.jsx";

const LS_KEY = "emovra_pet_type";

const PET_STAGES = {
  bird: [
    { minLevel: 1, emoji: "🥚", name: "Egg", nameKey: "egg" },
    { minLevel: 2, emoji: "🐣", name: "Hatchling", nameKey: "hatchling" },
    { minLevel: 4, emoji: "🐥", name: "Chick", nameKey: "chick" },
    { minLevel: 7, emoji: "🦆", name: "Fledgling", nameKey: "fledgling" },
    { minLevel: 10, emoji: "🦢", name: "Grown", nameKey: "grown" },
    { minLevel: 15, emoji: "🕊", name: "Soaring", nameKey: "soaring" },
  ],
  dragon: [
    { minLevel: 1, emoji: "🥚", name: "Egg", nameKey: "egg" },
    { minLevel: 2, emoji: "🦎", name: "Hatchling", nameKey: "hatchling" },
    { minLevel: 4, emoji: "🐲", name: "Young Dragon", nameKey: "youngDragon" },
    { minLevel: 7, emoji: "🐉", name: "Dragon", nameKey: "dragon" },
    { minLevel: 10, emoji: "🐉", name: "Mighty Dragon", nameKey: "mightyDragon" },
    { minLevel: 15, emoji: "🐉", name: "Ancient Dragon", nameKey: "ancientDragon" },
  ],
  dog: [
    { minLevel: 1, emoji: "🐶", name: "Puppy", nameKey: "puppy" },
    { minLevel: 2, emoji: "🐕", name: "Young Pup", nameKey: "youngPup" },
    { minLevel: 4, emoji: "🦮", name: "Loyal Dog", nameKey: "loyalDog" },
    { minLevel: 7, emoji: "🐕‍🦺", name: "Working Dog", nameKey: "workingDog" },
    { minLevel: 10, emoji: "🐩", name: "Distinguished Dog", nameKey: "distinguishedDog" },
    { minLevel: 15, emoji: "🐕", name: "Best Friend", nameKey: "bestFriend" },
  ],
  cat: [
    { minLevel: 1, emoji: "🐱", name: "Kitten", nameKey: "kitten" },
    { minLevel: 2, emoji: "🐈", name: "Young Cat", nameKey: "youngCat" },
    { minLevel: 4, emoji: "😼", name: "Independent Cat", nameKey: "independentCat" },
    { minLevel: 7, emoji: "🐈‍⬛", name: "Sleek Cat", nameKey: "sleekCat" },
    { minLevel: 10, emoji: "🐆", name: "Wise Cat", nameKey: "wiseCat" },
    { minLevel: 15, emoji: "🦁", name: "Legendary Cat", nameKey: "legendaryCat" },
  ],
};

const PET_OPTIONS = [
  { id: "bird", label: "Bird", icon: "🐣" },
  { id: "dragon", label: "Dragon", icon: "🐉" },
  { id: "dog", label: "Dog", icon: "🐶" },
  { id: "cat", label: "Cat", icon: "🐱" },
];

function stageFor(petType, level) {
  const stages = PET_STAGES[petType] || PET_STAGES.bird;
  let current = stages[0];
  for (const s of stages) {
    if (level >= s.minLevel) current = s;
  }
  return current;
}

export default function VirtualPet({ level = 1, xp = 0 }) {
  const { t } = useLanguage();
  const [petType, setPetType] = useState("bird");
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved && PET_STAGES[saved]) setPetType(saved);
  }, []);

  function choosePet(id) {
    setPetType(id);
    localStorage.setItem(LS_KEY, id);
    setShowPicker(false);
  }

  const stages = PET_STAGES[petType] || PET_STAGES.bird;
  const stage = stageFor(petType, level);
  const nextStage = stages.find((s) => s.minLevel > level);

  return (
    <div className="emovra-card-rise" style={{ animationDelay: "0.2s", background: "var(--card-bg, #fff)", padding: "20px", borderRadius: "24px", boxShadow: "0 4px 12px rgba(0,0,0,.08)", marginTop: "20px", textAlign: "center" }}>
      <div className="emovra-breathing" style={{ fontSize: 64, lineHeight: 1, display: "inline-block" }}>{stage.emoji}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-h)", marginTop: 8 }}>{t(`pet.stage.${stage.nameKey}`)}</div>
      <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
        {nextStage ? t("pet.growsInto", { stage: t(`pet.stage.${nextStage.nameKey}`).toLowerCase(), level: nextStage.minLevel }) : t("pet.fullyGrown")}
      </div>
      <div style={{ fontSize: 10, opacity: 0.4, marginTop: 6 }}>{t("pet.growsAsLevelUp")}</div>

      <button onClick={() => setShowPicker((s) => !s)} style={{ marginTop: 10, fontSize: 11, background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", padding: "6px 14px", borderRadius: 999, cursor: "pointer" }}>
        {showPicker ? t("pet.close") : t("pet.changePet")}
      </button>

      {showPicker && (
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {PET_OPTIONS.map((p) => (
            <button
              key={p.id}
              onClick={() => choosePet(p.id)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                padding: "10px 14px", borderRadius: 12, cursor: "pointer",
                border: petType === p.id ? "2px solid var(--accent)" : "1px solid var(--border)",
                background: petType === p.id ? "rgba(212,176,122,0.15)" : "transparent",
              }}
            >
              <span style={{ fontSize: 22 }}>{p.icon}</span>
              <span style={{ fontSize: 10, color: "var(--text)" }}>{t(`pet.type.${p.id}`)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
