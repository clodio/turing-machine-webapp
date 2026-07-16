import { CriteriaCard } from "../hooks/useCriteriaCard";
import { Letter } from "../store/slices/commentsSlice";
import { FC, useState } from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import SingleCharLabel from "./SingleCharLabel";
import Incorrect from "@mui/icons-material/HorizontalRuleRounded";
import Dialog from "@mui/material/Dialog";
import { useLongPress } from "../hooks/useLongPress";
import { useAppSelector } from "hooks/useAppSelector";
import { getCardImageSources } from "utils/cardImages";

type LettersProps = {
  card: Undefinable<CriteriaCard>;
  verifier: Verifier;
  letters: Undefinable<Letter[]>
  toggleLetter: (verifier: Verifier) => void;
};

// Composant enfant pour chaque lettre
type LetterButtonProps = {
  letter: Letter;
  verifier: Verifier;
  card: Undefinable<CriteriaCard>;
  onToggleLetter: (verifier: Verifier) => void;
  language: string;
};

const LetterButton: FC<LetterButtonProps> = ({ letter, verifier, card, onToggleLetter, language }) => {
  const theme = useTheme();
  const [showCardDialog, setShowCardDialog] = useState(false);
  const cardImageSources = getCardImageSources(card, language);

  const longPressHandlers = useLongPress(
    () => setShowCardDialog(true),
    () => onToggleLetter(letter.letter)
  );

  return (
    <>
      <Box position="relative">
        <IconButton
          id={`digit-code__${verifier}-${letter.letter}-button`}
          color="primary"
          sx={{
            height: theme.spacing(6),
            width: theme.spacing(6),
            userSelect: "none",
            touchAction: "none",
          }}
          onMouseDown={longPressHandlers.onMouseDown}
          onMouseUp={longPressHandlers.onMouseUp}
          onMouseLeave={longPressHandlers.onMouseLeave}
          onTouchStart={longPressHandlers.onTouchStart}
          onTouchEnd={longPressHandlers.onTouchEnd}
          onClickCapture={longPressHandlers.onClickCapture}
        >
          <SingleCharLabel>{letter.letter}</SingleCharLabel>
          <Box
            position="absolute"
            top={4}
            left={4}
            sx={{color: theme.palette.text.primary}}
          >
            {letter.isIrrelevant && (
              <Incorrect
                fontSize="large"
                sx={{transform: "rotate(-45deg)"}}
              />
            )}
          </Box>
        </IconButton>
      </Box>

      {/* Dialog pour afficher la carte au long press */}
      <Dialog
        open={showCardDialog}
        onClose={() => setShowCardDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img
            src={cardImageSources.primary}
            alt={`Carte ${verifier}`}
            onError={(event) => {
              if (!cardImageSources.fallback) {
                return;
              }

              if (event.currentTarget.dataset.fallbackApplied === "true") {
                return;
              }

              event.currentTarget.dataset.fallbackApplied = "true";
              event.currentTarget.src = cardImageSources.fallback;
            }}
            style={{
              maxWidth: "100%",
              height: "auto",
              borderRadius: theme.shape.borderRadius,
            }}
          />
        </Box>
      </Dialog>
    </>
  );
};

const Letters: FC<LettersProps> = ({card, verifier, letters, toggleLetter}) => {
  const language = useAppSelector((state) => state.settings.language);

  return (
    !card?.nightmare ? <></> :
      <Box display={"flex"} justifyContent={"center"}>
        {letters?.map((letter) => (
          <LetterButton
            key={letter.letter}
            letter={letter}
            verifier={verifier}
            card={card}
            onToggleLetter={toggleLetter}
            language={language}
          />
        ))}
      </Box>
  );
};

export default Letters;
