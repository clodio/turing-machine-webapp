import SolvedIcon from "@mui/icons-material/CheckBoxRounded";
import UnsolvedIcon from "@mui/icons-material/DisabledByDefaultRounded";
import BlankBoxIcon from "@mui/icons-material/CheckBoxOutlineBlankRounded";
import DeleteIcon from "@mui/icons-material/UndoRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Dialog from "@mui/material/Dialog";
import { alpha, useTheme } from "@mui/material/styles";
import { useAppDispatch } from "hooks/useAppDispatch";
import { useAppSelector } from "hooks/useAppSelector";
import { FC, useState } from "react";
import { verifySingleQuery } from "deductions";
import { alertActions } from "store/slices/alertSlice";
import { RoundsState, roundsActions } from "store/slices/roundsSlice";
import { gameActions } from "store/slices/gameSlice";
import ShapeIcon from "./ShapeIcon";
import SingleCharLabel from "./SingleCharLabel";
import TextField from "./TextField";
import { useCriteriaCard } from "hooks/useCriteriaCard";
import { useLongPress } from "hooks/useLongPress";
import { getCardImageSources } from "utils/cardImages";

// Component enfant pour chaque button de lettre avec long press
type VerifierButtonProps = {
  query: RoundsState[number]["queries"][number];
  verifier: Verifier;
  isAvailable: boolean;
  roundIndex: number;
  hasCompleteCode: boolean;
  verifiedLettersCount: number;
  onVerify: () => Promise<void>;
};

const VerifierButton: FC<VerifierButtonProps> = ({
  query,
  verifier,
  isAvailable,
  roundIndex,
  hasCompleteCode,
  verifiedLettersCount,
  onVerify,
}) => {
  const theme = useTheme();
  const [showCardDialog, setShowCardDialog] = useState(false);
  const { card } = useCriteriaCard(verifier, 0);
  const language = useAppSelector((state) => state.settings.language);
  const cardImageSources = getCardImageSources(card, language);

  const longPressHandlers = useLongPress(
    () => setShowCardDialog(true),
    () => {
      if (isAvailable) {
        onVerify();
      }
    }
  );

  return (
    <>
      <Button
        id={`rounds__round-${
          roundIndex + 1
        }-verifier-${verifier.toLowerCase()}-button`}
        arial-label={verifier}
        disabled={!isAvailable}
        sx={{
          minWidth: "100%",
          p: 0,
          background:
            !isAvailable
              ? alpha(theme.palette.text.disabled, 0.12)
              : null,
          borderRadius: theme.spacing(
            0,
            0,
            verifier === "F" ? 2 : 0,
            verifier === "A" ? 2 : 0
          ),
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
        <Box width={1}>
          <Box
            sx={{
              textAlign: "center",
              borderRadius:
                verifier === "F"
                  ? theme.spacing(0, 0, 2, 0)
                  : null,
            }}
          >
            <SingleCharLabel disabled={!isAvailable}>
              {verifier}
            </SingleCharLabel>
            <Box position="relative">
              <Box>
                {!isAvailable && (
                  <BlankBoxIcon
                    sx={{ color: theme.palette.text.disabled }}
                  />
                )}
                {isAvailable && query.state === "unknown" && (
                  <BlankBoxIcon
                    sx={{ color: theme.palette.primary.main }}
                  />
                )}
                {isAvailable && query.state === "solved" && (
                  <SolvedIcon sx={{ color: theme.palette.primary.dark }} />
                )}
                {isAvailable && query.state === "unsolved" && (
                  <UnsolvedIcon
                    sx={{ color: theme.palette.secondary.dark }}
                  />
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Button>

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

type Props = {
  round: RoundsState[number];
  index: number;
};

const Round: FC<Props> = ({ round, index }) => {
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const state = useAppSelector((state) => state);
  const availableVerifierCount = state.comments.length;

  const codeDigits = round.code.map((c) => c.digit);
  const hasCompleteCode =
    codeDigits.length === 3 &&
    codeDigits.every((d) => d !== null && d >= 1 && d <= 5);

  const verifiedLettersCount = round.queries.filter(
    (q) => q.state !== "unknown"
  ).length;

  return (
    <Box>
      <Grid container spacing={0.5}>
        {round.code.map((code) => (
          <Grid key={code.shape} item xs={4}>
            <TextField
              prefixId={`rounds__round-${index + 1}-${code.shape}`}
              customRadius={
                code.shape !== "square"
                  ? code.shape === "triangle"
                    ? theme.spacing(2, 0, 0, 0)
                    : theme.spacing(0, 2, 0, 0)
                  : undefined
              }
              value={code.digit}
              onChange={(value) => {
                dispatch(
                  roundsActions.updateCodeDigit({
                    index,
                    shape: code.shape,
                    digit: value ? (Number(value) as Digit) : null,
                  })
                );
              }}
              iconRender={
                <ShapeIcon
                  shape={code.shape as "triangle" | "square" | "circle"}
                  sizeMultiplier={0.5}
                />
              }
              type="number"
            />
          </Grid>
        ))}
      </Grid>

      <Box mt={0.5}>
        <Grid container spacing={0.5}>
          {round.queries.map((query) => (
            <Grid item xs={2} key={query.verifier}>
              {(() => {
                const isAvailable =
                  query.verifier.charCodeAt(0) - "A".charCodeAt(0) <
                  availableVerifierCount;

                const handleVerify = async () => {
                  // (1) Code incomplete => toast 3s, do not change state (stay unknown)
                  if (!hasCompleteCode) {
                    dispatch(
                      alertActions.openAlert({
                        level: "info",
                        message:
                          "Veuillez saisir les 3 chiffres de cette manche pour pouvoir vérifier une lettre.",
                      })
                    );
                    return;
                  }

                  // (2) Already verified 3 letters => cannot verify another
                  if (verifiedLettersCount >= 3 && query.state === "unknown") {
                    dispatch(
                      alertActions.openAlert({
                        level: "info",
                        message:
                          "Veuillez démarrer une nouvelle manche.",
                      })
                    );
                    return;
                  }

                  // Code complete => auto verify and set solved/unsolved
                  const code = codeDigits as number[];
                  const newState = await verifySingleQuery(
                    state,
                    code,
                    query.verifier
                  );

                  // updateQueryState: unknown -> unsolved
                  dispatch(
                    roundsActions.updateQueryState({
                      index,
                      verifier: query.verifier,
                    })
                  );

                  // if solved => unsolved -> solved (second toggle)
                  if (newState === "solved") {
                    dispatch(
                      roundsActions.updateQueryState({
                        index,
                        verifier: query.verifier,
                      })
                    );
                  }

                  // Démarrer le timer en mode multijoueur après vérification réussie
                  if (state.game.mode === "multiplayer") {
                    dispatch(gameActions.startTimer());
                  }
                };

                return (
                  <VerifierButton
                    query={query}
                    verifier={query.verifier}
                    isAvailable={isAvailable}
                    roundIndex={index}
                    hasCompleteCode={hasCompleteCode}
                    verifiedLettersCount={verifiedLettersCount}
                    onVerify={handleVerify}
                  />
                );
              })()}
            </Grid>
          ))}
        </Grid>
      </Box>

      {round.isPristine && (
        <Box>
          <Box mt={2}>
            <Button
              id={`rounds__round-${index + 1}-undo-button`}
              aria-label="undo"
              color="secondary"
              fullWidth
              size="small"
              onClick={() => {
                dispatch(roundsActions.deleteRound(index));
              }}
            >
              <DeleteIcon />
            </Button>
          </Box>
        </Box>
      )}

      <Box my={2}>
        <Divider />
      </Box>
    </Box>
  );
};

export default Round;
