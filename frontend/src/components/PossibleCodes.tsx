import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import { usePaletteMode } from "hooks/usePaletteMode";
import { useAppSelector } from "hooks/useAppSelector";
import { useMemo, useState } from "react";
import Collapse from "@mui/material/Collapse";
import Tooltip from "@mui/material/Tooltip";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import MagnifyIcon from "@mui/icons-material/ManageSearchRounded";

function groupByFirst(isCodePossible: (code: string) => boolean) {
  const result: { [key: number]: { code: string; possible: boolean }[] } = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
  };
  for (let b = 1; b <= 5; b += 1) {
    for (let y = 1; y <= 5; y += 1) {
      for (let p = 1; p <= 5; p += 1) {
        const code = `${b}${y}${p}`;
        result[b].push({ code, possible: isCodePossible(code) });
      }
    }
  }
  return result;
}

export function PossibleCodes() {
  const { theme } = usePaletteMode();

  const [expanded, setExpanded] = useState(false);
  const [hide, setHide] = useState(false);

  function toggleExpanded() {
    setExpanded(!expanded);
  }

  function toggleHidden() {
    setHide(!hide);
  }

  const digitCode = useAppSelector((state) => state.digitCode);

  const possibleCodes = useMemo(() => {
    const blockedByShape = {
      triangle: new Set<number>(),
      square: new Set<number>(),
      circle: new Set<number>(),
    };

    for (const { shape, digit } of digitCode) {
      blockedByShape[shape].add(digit);
    }

    return groupByFirst((code) => {
      return (
        !blockedByShape.triangle.has(Number(code[0])) &&
        !blockedByShape.square.has(Number(code[1])) &&
        !blockedByShape.circle.has(Number(code[2]))
      );
    });
  }, [digitCode]);

  return (
    <Paper
      component="section"
      id="possible-codes-section"
      sx={{ width: 320, margin: theme.spacing(0, "auto", 2) }}
    >
      <Box p={2} mt={2}>
        <Box display="flex" justifyContent={"space-between"} zIndex={1}>
          <Button onClick={toggleExpanded}>
            {expanded ? "Masquer codes calculés" : "Afficher codes calculés"}
          </Button>
          {expanded && (
            <IconButton onClick={toggleHidden} disabled={!expanded}>
              <Tooltip
                id="button-report"
                title={
                  hide
                    ? "Afficher les nombres impossibles"
                    : "Masquer les nombres impossibles"
                }
              >
                <MagnifyIcon />
              </Tooltip>
            </IconButton>
          )}
        </Box>
        <Collapse in={expanded}>
          <Grid container spacing={8}>
            {[1, 2, 3, 4, 5].map((number) => (
              <Grid item xs={2} key={number}>
                {possibleCodes[number].map(({ code, possible }) => (
                  <Grid
                    item
                    xs={2}
                    hidden={!possible && hide}
                    key={code}
                    style={{
                      color: possible
                        ? theme.palette.text.primary
                        : theme.palette.text.disabled,
                    }}
                  >
                    {code}
                  </Grid>
                ))}
              </Grid>
            ))}
          </Grid>
        </Collapse>
      </Box>
    </Paper>
  );
}
