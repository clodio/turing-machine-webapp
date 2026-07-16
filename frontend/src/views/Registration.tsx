import Box from "@mui/material/Box";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import { useAppDispatch } from "hooks/useAppDispatch";
import { useAppSelector } from "hooks/useAppSelector";
import { FC, useEffect, useState } from "react";
import { registrationActions } from "store/slices/registrationSlice";
import { roundsActions } from "store/slices/roundsSlice";
import { commentsActions } from "store/slices/commentsSlice";
import { digitCodeActions } from "store/slices/digitCodeSlice";
import HashCodeRegistration from "components/HashCodeRegistration";
import ManualRegistration from "components/ManualRegistration";
import { Card } from "@mui/material";
import PasteRegistration from "components/PasteRegistration";
import AutoRegistration from "components/AutoRegistration";
import { parse as parseTuringInfo } from "parsing/turing-copy-paste";
import { parse as parseProblemBook } from "parsing/problem-book";
import { manualCodeListActions } from "store/slices/manualCodeListSlice";

const Registration: FC = () => {
  const dispatch = useAppDispatch();
  const registration = useAppSelector((state) => state.registration);
  const [registrationMethod, setRegristationMethod] = useState("paste");

  function changeRegistrationMethod(e: React.ChangeEvent<HTMLInputElement>) {
    setRegristationMethod((e.target as HTMLInputElement).value);
  }

  // Handle ?party_info= URL param on mount
  // Also restore saved game state when returning to the app
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlPartyInfo = params.get("party_info");
    const savedPartyInfo = registration.partyInfo;

    console.log("[RegistrationDebug] Registration useEffect", {
      urlPartyInfo: !!urlPartyInfo,
      savedPartyInfo: !!savedPartyInfo,
      registrationStatus: registration.status,
    });

    if (urlPartyInfo) {
      const cardText = decodeURIComponent(urlPartyInfo);
      const problem = parseTuringInfo(cardText) || parseProblemBook(cardText);
      if (problem) {
        // Only reset if this is a different party than the saved one
        if (urlPartyInfo !== savedPartyInfo) {
          console.log("[RegistrationDebug] Loading new party from URL");
          // New party: reset everything
          dispatch(registrationActions.updatePartyInfo(cardText));
          dispatch(registrationActions.updateHash(problem.code.toUpperCase()));
          dispatch(roundsActions.reset());
          dispatch(commentsActions.reset());
          dispatch(digitCodeActions.reset());
          dispatch(manualCodeListActions.reset());
          dispatch(registrationActions.fetchDone());
          dispatch(commentsActions.setCards(problem));
        } else if (registration.status !== "ready") {
          console.log("[RegistrationDebug] Same party, restoring from localStorage");
          // Same party but not loaded yet: restore from localStorage by just setting status
          dispatch(registrationActions.fetchDone());
        }
        // If same party and already ready: do nothing (state is already loaded from localStorage)
      }
    } else if (registration.status === "ready" && savedPartyInfo) {
      console.log("[RegistrationDebug] No URL but game is saved, keeping it loaded");
      // No URL but game is saved: keep it loaded
      // (state already loaded from localStorage)
    } else if (registration.status !== "ready" && savedPartyInfo) {
      // Fallback: if no URL, status not ready, but we have a saved partyInfo
      // Try to restore from the saved partyInfo (localStorage might have failed but partyInfo exists)
      console.log("[RegistrationDebug] Fallback: restoring from saved partyInfo");
      const cardText = savedPartyInfo;
      const problem = parseTuringInfo(cardText) || parseProblemBook(cardText);
      if (problem) {
        dispatch(registrationActions.fetchDone());
        // The other state (rounds, comments, etc.) should already be in Redux from preloadedState
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box
      id="registration-section"
      component="section"
      width="90%"
      margin="auto"
      mb={2}
    >
      
      {registration.status === "new" && (
        <FormControl>
          <FormLabel id="demo-controlled-radio-buttons-group">
            Game Setup
          </FormLabel>
          <RadioGroup
            row
            aria-labelledby="demo-controlled-radio-buttons-group"
            name="controlled-radio-buttons-group"
            value={registrationMethod}
            onChange={changeRegistrationMethod}
          >
            <FormControlLabel
              value="manual"
              control={<Radio />}
              label="Manual"
            />
            <FormControlLabel value="paste" control={<Radio />} label="Paste" />
            {/* <FormControlLabel
              value="turing-hash"
              control={<Radio />}
              label="Hashcode"
            /> */}
            <FormControlLabel value="auto" control={<Radio />} label="Auto" />
          </RadioGroup>
        </FormControl>
      )}
      {registrationMethod === "turing-hash" && <HashCodeRegistration />}
      {registrationMethod === "manual" && registration.status === "new" && (
        <Card>
          <Box m={2}>
            <ManualRegistration />
          </Box>
        </Card>
      )}
      {(registrationMethod === "paste" || registrationMethod === "auto") && (
        <PasteRegistration />
      )}
      {registrationMethod === "auto" && registration.status === "new" && (
        <AutoRegistration />
      )}
    </Box>
  );
};

export default Registration;
