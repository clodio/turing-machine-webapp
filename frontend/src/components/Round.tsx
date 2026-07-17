import SolvedIcon from "@mui/icons-material/CheckBoxRounded";
import UnsolvedIcon from "@mui/icons-material/DisabledByDefaultRounded";
import BlankBoxIcon from "@mui/icons-material/CheckBoxOutlineBlankRounded";
import DeleteIcon from "@mui/icons-material/UndoRounded";
import CircleOutlineIcon from "@mui/icons-material/PanoramaFishEye";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Dialog from "@mui/material/Dialog";
import { alpha, useTheme } from "@mui/material/styles";
import { useAppDispatch } from "hooks/useAppDispatch";
import { useAppSelector } from "hooks/useAppSelector";
import { FC, useRef, useState } from "react";
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
  const dispatch = useAppDispatch();
  const [showCardDialog, setShowCardDialog] = useState(false);

  // Refs toujours à jour — évite les stale closures dans useLongPress
  const queryStateRef = useRef(query.state);
  queryStateRef.current = query.state;
  console.log(`[VerifierButton render] verifier=${verifier} query.state=${query.state} queryStateRef.current=${queryStateRef.current}`);
  const isAvailableRef = useRef(isAvailable);
  isAvailableRef.current = isAvailable;
  const onVerifyRef = useRef(onVerify);
  onVerifyRef.current = onVerify;
  const isVerifyingRef = useRef(false);

  const { card } = useCriteriaCard(verifier, 0);
  const language = useAppSelector((state) => state.settings.language);
  const isMultiplayer = useAppSelector((state) => state.game.mode === "multiplayer");
  const cardImageSources = getCardImageSources(card, language);

  const isMultiplayerRef = useRef(isMultiplayer);
  isMultiplayerRef.current = isMultiplayer;

  // Callback stable (deps vides) qui lit toujours les valeurs actuelles via les refs
  const handleShortPress = useRef(() => {
    console.log(`[handleShortPress] verifier=${verifier} isAvailableRef=${isAvailableRef.current} queryStateRef=${queryStateRef.current} isVerifyingRef=${isVerifyingRef.current}`);
    if (!isAvailableRef.current) return;

    if (!isMultiplayerRef.current && queryStateRef.current !== "unknown") {
      dispatch(
        alertActions.openAlert({
          level: "info",
          message: "Cette lettre a déjà été vérifiée pour cette manche.",
        })
      );
      return;
    }

    if (isVerifyingRef.current) return;
    isVerifyingRef.current = true;
    onVerifyRef.current().finally(() => {
      isVerifyingRef.current = false;
    });
  }).current;

  const longPressHandlers = useLongPress(
    () => setShowCardDialog(true),
    handleShortPress
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
  isCurrentRound: boolean;
  isMultiplayer: boolean;
};

const Round: FC<Props> = ({ round, index, isCurrentRound, isMultiplayer }) => {
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
      {isMultiplayer ? (
        <Grid container spacing={0}>
          {([ "triangle", "square", "circle"] as Shape[]).map((shape) => {
            const codeEntry = round.code.find((c) => c.shape === shape)!;
            return (
              <Grid key={shape} item xs={4} sx={{ textAlign: "center" }}>
                <Box
                  width={1}
                  mb={1}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <ShapeIcon
                    shape={shape as "triangle" | "square" | "circle"}
                  />
                </Box>
                {([5, 4, 3, 2, 1] as Digit[]).map((digit) => {
                  const isSelected = codeEntry.digit === digit;
                  return (
                    <Box key={digit} width={1} position="relative">
                      <IconButton
                        id={`rounds__round-${index + 1}-${shape}-digit-${digit}-button`}
                        aria-label={`${shape} ${digit}`}
                        color="primary"
                        sx={{
                          height: theme.spacing(6),
                          width: theme.spacing(6),
                        }}
                        onClick={() => {
                          dispatch(
                            roundsActions.updateCodeDigit({
                              index,
                              shape,
                              digit: isSelected ? null : digit,
                            })
                          );
                        }}
                      >
                        <SingleCharLabel>{digit}</SingleCharLabel>
                        {isSelected && (
                          <Box
                            position="absolute"
                            top={0}
                            left={0}
                            sx={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: theme.palette.primary.main,
                            }}
                          >
                            <CircleOutlineIcon fontSize="large" />
                          </Box>
                        )}
                      </IconButton>
                    </Box>
                  );
                })}
              </Grid>
            );
          })}
        </Grid>
      ) : (
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
      )}

      <Box mt={0.5}>
        <Grid container spacing={0.5}>
          {round.queries.map((query) => (
            <Grid item xs={2} key={query.verifier}>
              {(() => {
                const isAvailable =
                  query.verifier.charCodeAt(0) - "A".charCodeAt(0) <
                  availableVerifierCount;

                const handleVerify = async () => {
                  // (0) Not current round
                  if (!isCurrentRound) {
                    dispatch(
                      alertActions.openAlert({
                        level: "warning",
                        message:
                          "Veuillez jouer dans la manche en cours.",
                      })
                    );
                    return;
                  }

                  // (1) Code incomplete
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
                  if (verifiedLettersCount >= 3) {
                    dispatch(
                      alertActions.openAlert({
                        level: "info",
                        message:
                          "Veuillez démarrer une nouvelle manche.",
                      })
                    );
                    return;
                  }

                  // Code complete + unknown => auto verify and set solved/unsolved
                  const code = codeDigits as number[];
                  const newState = await verifySingleQuery(
                    state,
                    code,
                    query.verifier
                  );

                  // Set the query state directly to the result
                  dispatch(
                    roundsActions.setQueryState({
                      index,
                      verifier: query.verifier,
                      newState,
                    })
                  );

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
