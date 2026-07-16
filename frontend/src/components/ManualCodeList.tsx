import Button from "@mui/material/Button";
import { usePaletteMode } from "hooks/usePaletteMode";
import { useEffect, useRef, useState } from "react";
import Collapse from "@mui/material/Collapse";
import Tooltip from "@mui/material/Tooltip";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import MagnifyIcon from "@mui/icons-material/ManageSearchRounded";
import { useAppDispatch } from "hooks/useAppDispatch";
import { useAppSelector } from "hooks/useAppSelector";
import { manualCodeListActions } from "store/slices/manualCodeListSlice";
import type { CodeStateValue } from "store/slices/manualCodeListSlice";

// Les 125 codes (111 a 555), groupes par premier chiffre
function buildAllCodes(): { [key: number]: string[] } {
  const result: { [key: number]: string[] } = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
  };
  for (let b = 1; b <= 5; b += 1) {
    for (let y = 1; y <= 5; y += 1) {
      for (let p = 1; p <= 5; p += 1) {
        result[b].push(`${b}${y}${p}`);
      }
    }
  }
  return result;
}

const allCodes = buildAllCodes();

export function ManualCodeList() {
  const { theme } = usePaletteMode();
  const dispatch = useAppDispatch();
  const codeStates = useAppSelector((state) => state.manualCodeList);
  const digitCode = useAppSelector((state) => state.digitCode);

  const [expanded, setExpanded] = useState(false);
  const [hide, setHide] = useState(false);
  const isDraggingRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const touchedCodesRef = useRef<Set<string>>(new Set());
  const blockedCodesRef = useRef<Set<string>>(new Set());

  function getState(code: string): CodeStateValue {
    return codeStates[code] ?? "normal";
  }

  function handleClick(code: string) {
    dispatch(manualCodeListActions.toggleCode(code));
  }

  function resetDragState() {
    isDraggingRef.current = false;
    activePointerIdRef.current = null;
    touchedCodesRef.current.clear();
  }

  function applyDragToggle(code: string) {
    if (touchedCodesRef.current.has(code)) {
      return;
    }
    touchedCodesRef.current.add(code);
    handleClick(code);
  }

  function handlePointerDown(code: string, event: React.PointerEvent) {
    // Sur mobile, evite le scroll pendant le drag sur les codes.
    event.preventDefault();
    isDraggingRef.current = true;
    activePointerIdRef.current = event.pointerId;
    touchedCodesRef.current.clear();
    applyDragToggle(code);
  }

  function handlePointerEnter(code: string) {
    if (!isDraggingRef.current) {
      return;
    }
    applyDragToggle(code);
  }

  function toggleExpanded() {
    setExpanded((v) => !v);
  }

  function toggleHidden() {
    setHide((v) => !v);
  }

  useEffect(() => {
    const blockedByShape = {
      triangle: new Set<number>(),
      square: new Set<number>(),
      circle: new Set<number>(),
    };

    for (const { shape, digit } of digitCode) {
      blockedByShape[shape].add(digit);
    }

    const nextBlockedCodes = new Set<string>();
    for (let b = 1; b <= 5; b += 1) {
      for (let y = 1; y <= 5; y += 1) {
        for (let p = 1; p <= 5; p += 1) {
          if (
            blockedByShape.triangle.has(b) ||
            blockedByShape.square.has(y) ||
            blockedByShape.circle.has(p)
          ) {
            nextBlockedCodes.add(`${b}${y}${p}`);
          }
        }
      }
    }

    const updates: Record<string, CodeStateValue> = {};

    for (const code of nextBlockedCodes) {
      if (!blockedCodesRef.current.has(code)) {
        updates[code] = "greyed";
      }
    }

    for (const code of blockedCodesRef.current) {
      if (!nextBlockedCodes.has(code) && (codeStates[code] ?? "normal") === "greyed") {
        updates[code] = "normal";
      }
    }

    blockedCodesRef.current = nextBlockedCodes;

    if (Object.keys(updates).length > 0) {
      dispatch(manualCodeListActions.setCodesState(updates));
    }
  }, [digitCode, codeStates, dispatch]);

  // Uses refs-only drag state; listeners are intentionally attached once.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    const handleGlobalPointerMove = (event: PointerEvent) => {
      if (!isDraggingRef.current) {
        return;
      }
      if (
        activePointerIdRef.current !== null &&
        event.pointerId !== activePointerIdRef.current
      ) {
        return;
      }

      const target = document.elementFromPoint(event.clientX, event.clientY);
      if (!(target instanceof Element)) {
        return;
      }

      const codeElement = target.closest("[data-code-item='true']");
      const code = codeElement?.getAttribute("data-code");
      if (!code) {
        return;
      }
      applyDragToggle(code);
    };

    window.addEventListener("pointermove", handleGlobalPointerMove, {
      passive: false,
    });
    window.addEventListener("pointerup", resetDragState);
    window.addEventListener("pointercancel", resetDragState);

    return () => {
      window.removeEventListener("pointermove", handleGlobalPointerMove);
      window.removeEventListener("pointerup", resetDragState);
      window.removeEventListener("pointercancel", resetDragState);
    };
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <Paper
      component="section"
      id="manual-code-list-section"
      sx={{ width: 320, margin: theme.spacing(0, "auto", 2) }}
    >
      <Box p={2} mt={2}>
        <Box display="flex" justifyContent="space-between" zIndex={1}>
          <Button onClick={toggleExpanded}>
            {expanded ? "Masquer les codes" : "Afficher les codes"}
          </Button>
          {expanded && (
            <IconButton onClick={toggleHidden} disabled={!expanded}>
              <Tooltip
                id="manual-code-list-filter"
                title={hide ? "Afficher les codes gris" : "Masquer les codes gris"}
              >
                <MagnifyIcon />
              </Tooltip>
            </IconButton>
          )}
        </Box>

        <Collapse in={expanded}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              columnGap: "4px",
              rowGap: 0,
              mt: 1,
            }}
          >
            {[1, 2, 3, 4, 5].map((number) => (
              <Box
                key={number}
                sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
              >
                {allCodes[number].map((code) => {
                  const codeState = getState(code);
                  if (hide && codeState === "greyed") {
                    return null;
                  }

                  return (
                    <Box
                      key={code}
                      component="span"
                      data-code-item="true"
                      data-code={code}
                      onPointerDown={(event) => handlePointerDown(code, event)}
                      onPointerEnter={() => handlePointerEnter(code)}
                      onPointerUp={resetDragState}
                      sx={{
                        cursor: "pointer",
                        userSelect: "none",
                        touchAction: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        my: "1px",
                        borderRadius: "3px",
                        color:
                          codeState === "greyed"
                            ? theme.palette.text.disabled
                            : theme.palette.text.primary,
                        textDecoration: codeState === "greyed" ? "line-through" : "none",
                        border:
                          codeState === "outlined"
                            ? `1.5px solid ${theme.palette.text.primary}`
                            : "1.5px solid transparent",
                      }}
                    >
                      {code}
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
        </Collapse>
      </Box>
    </Paper>
  );
}
