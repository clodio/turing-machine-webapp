const isProduction = process.env.NODE_ENV === "production";

export const registerServiceWorker = () => {
  if (!isProduction || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    const serviceWorkerUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

    navigator.serviceWorker.register(serviceWorkerUrl).catch(() => {
      // Silent failure: the app works online even if SW registration fails.
    });
  });
};
