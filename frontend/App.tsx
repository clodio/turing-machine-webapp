import { FC } from "react";
import { Provider as StoreProvider } from "react-redux";
import { store } from "./store";
import Root from "./views/Root";
import { useAppSelector } from "hooks/useAppSelector";
import { useEffect } from "react";
import { prefetchRemoteCardsForLanguage } from "pwa/prefetchRemoteCards";

const AppContent: FC = () => {
  const language = useAppSelector((state) => state.settings.language);

  useEffect(() => {
    prefetchRemoteCardsForLanguage(language);
  }, [language]);

  return <Root />;
};

const App: FC = () => {
  return (
    <StoreProvider store={store}>
      <AppContent />
    </StoreProvider>
  );
};

export default App;
