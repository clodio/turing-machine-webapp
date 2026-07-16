import { CriteriaCard } from "hooks/useCriteriaCard";

const CARD_COUNT = 48;

const padCardId = (cardId: number) => String(cardId).padStart(2, "0");

const normalizeLanguage = (language?: string) => {
  if (!language) {
    return "";
  }

  return language.toUpperCase();
};

export const getLocalCardUrl = (cardId: number, language: string) =>
  `${process.env.PUBLIC_URL}/assets/cards/TM_GameCards_${language}-${padCardId(cardId)}.png`;

export const getRemoteCardUrl = (cardId: number, language: string) =>
  `https://turingmachine.info/images/criteriacards/${language}/TM_GameCards_${language}-${padCardId(cardId)}.png`;

export const getCardImageSources = (card?: CriteriaCard, language?: string) => {
  if (!card) {
    return { primary: "", fallback: "" };
  }

  const normalizedLanguage = normalizeLanguage(language);

  if (!normalizedLanguage) {
    return { primary: "", fallback: "" };
  }

  return {
    primary: getLocalCardUrl(card.id, normalizedLanguage),
    fallback: getRemoteCardUrl(card.id, normalizedLanguage),
  };
};

export const listRemoteCardUrlsForLanguage = (language?: string) => {
  const normalizedLanguage = normalizeLanguage(language);

  if (!normalizedLanguage) {
    return [] as string[];
  }

  return Array.from({ length: CARD_COUNT }, (_, index) =>
    getRemoteCardUrl(index + 1, normalizedLanguage)
  );
};
