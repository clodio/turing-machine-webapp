import { listRemoteCardUrlsForLanguage } from "utils/cardImages";

const PREFETCH_MESSAGE_TYPE = "PREFETCH_REMOTE_CARDS";

const postPrefetchMessage = (
  serviceWorker: ServiceWorker,
  language: string
) => {
  serviceWorker.postMessage({
    type: PREFETCH_MESSAGE_TYPE,
    urls: listRemoteCardUrlsForLanguage(language),
  });
};

export const prefetchRemoteCardsForLanguage = (language?: string) => {
  if (!language || !("serviceWorker" in navigator)) {
    return;
  }

  if (navigator.serviceWorker.controller) {
    postPrefetchMessage(navigator.serviceWorker.controller, language);
    return;
  }

  navigator.serviceWorker.ready
    .then((registration) => {
      if (registration.active) {
        postPrefetchMessage(registration.active, language);
      }
    })
    .catch(() => {
      // Silent failure: fallback to normal network image loading.
    });
};
