import * as React from "react";
import { FC } from "react";
import {
  Select as BaseSelect,
  SelectProps,
  SelectRootSlotProps,
} from "@mui/base/Select";
import { Option as BaseOption, optionClasses } from "@mui/base/Option";
import { SelectOption } from "@mui/base/useOption";
import { styled } from "@mui/system";
import { Popper as BasePopper } from "@mui/base/Popper";
import KeyboardArrowDownRounded from "@mui/icons-material/KeyboardArrowDownRounded";
import PersonRounded from "@mui/icons-material/PersonRounded";
import GroupsRounded from "@mui/icons-material/GroupsRounded";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { GameMode } from "store/slices/gameSlice";

type Props = {
  disabled?: boolean;
  prefixId?: string;
  onChange?: (value: GameMode) => void;
  value: GameMode;
  timerSeconds?: number;
  isTimerRunning?: boolean;
};

type ModeOption = {
  mode: GameMode;
  label: string;
};

const availableModes: ModeOption[] = [
  { mode: "solo", label: "Solo" },
  { mode: "multiplayer", label: "Multijoueur" },
];

const getModeIcon = (mode: GameMode, isDarkMode: boolean) => {
  const iconColor = isDarkMode ? "common.white" : "inherit";
  return mode === "multiplayer" ? (
    <GroupsRounded sx={{ color: iconColor }} />
  ) : (
    <PersonRounded sx={{ color: iconColor }} />
  );
};

const GameModeSelect: FC<Props> = (props) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const selectedMode = availableModes.find((m) => m.mode === props.value) || availableModes[0];

  return (
    <Select
      id={`${props.prefixId}-select`}
      disabled={props.disabled}
      value={selectedMode}
      renderValue={(selected: SelectOption<ModeOption> | null) => {
        const mode = selected?.value.mode || "solo";
        const showTimer =
          mode === "multiplayer" && props.isTimerRunning && typeof props.timerSeconds === "number";

        return (
          <Box display="flex" alignItems="center" gap={0.5}>
            {getModeIcon(mode, isDarkMode)}
            {showTimer && (
              <Box
                sx={(theme) => ({
                  px: 0.6,
                  py: 0.1,
                  borderRadius: 1,
                  fontSize: "0.7rem",
                  lineHeight: 1.4,
                  color: "white",
                  backgroundColor:
                    (props.timerSeconds || 0) <= 3
                      ? theme.palette.error.main
                      : theme.palette.primary.main,
                })}
              >
                {props.timerSeconds}s
              </Box>
            )}
          </Box>
        );
      }}
      onChange={(_, value) => {
        if (!value) {
          return;
        }
        props.onChange && props.onChange(value.mode);
      }}
    >
      {availableModes.map((mode) => (
        <Option key={mode.mode} value={mode}>
          <Box display="flex" alignItems="center" gap={1}>
            {getModeIcon(mode.mode, isDarkMode)}
            {mode.label}
          </Box>
        </Option>
      ))}
    </Select>
  );
};

export default GameModeSelect;

const Select = React.forwardRef(function CustomSelect(
  props: SelectProps<ModeOption, false>,
  ref: React.ForwardedRef<any>
) {
  const slots: SelectProps<ModeOption, false>["slots"] = {
    root: Button,
    listbox: Listbox,
    popper: Popper,
    ...props.slots,
  };

  return <BaseSelect {...props} ref={ref} slots={slots} />;
});

const Button = React.forwardRef(function Button<
  TValue extends {},
  Multiple extends boolean,
>(
  props: SelectRootSlotProps<TValue, Multiple>,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  const theme = useTheme();
  const { ownerState, ...other } = props;

  return (
    <StyledButton type="button" {...other} ref={ref}>
      {other.children}
      <KeyboardArrowDownRounded
        className="game-mode-select-arrow"
        fontSize="large"
        sx={{ color: theme.palette.primary.light }}
      />
    </StyledButton>
  );
});

const StyledButton = styled("button", { shouldForwardProp: () => true })(
  ({ theme }) => `
  box-sizing: border-box;
  min-width: 98px;
  padding: 8px 30px 8px 8px;
  text-align: left;
  line-height: 1.5;
  background: none;
  border: none;
  position: relative;
  opacity: unset;

  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 120ms;
  -webkit-appearance: none;

  &:hover {
    cursor: pointer;
  }

  & .game-mode-select-arrow {
    position: absolute;
    right: 2px;
    top: 50%;
    transform: translateY(-50%);
  }
  `
);

const Listbox = styled("ul")(
  ({ theme }) => `
  font-family: "Plus Jakarta Sans";
  font-size: 1rem;
  box-sizing: border-box;
  padding: 6px;
  margin: 2px 0;
  min-width: 160px;
  border-radius: 8px;
  overflow: auto;
  outline: 0px;
  background: ${theme.palette.background.paper};
  border: 1px solid ${theme.palette.divider};
  `
);

const Option = styled(BaseOption)(
  ({ theme }) => `
  list-style: none;
  padding: 6px;
  border-radius: 4px;
  cursor: default;

  &.${optionClasses.selected},
  &.${optionClasses.highlighted}.${optionClasses.selected} {
    background-color: ${theme.palette.action.selected};
    color: ${theme.palette.text.primary};
  }

  &:hover,
  &.${optionClasses.highlighted} {
    background-color: ${theme.palette.action.hover};
    color: ${theme.palette.text.primary};
  }

  &:hover {
    cursor: pointer;
  }
  `
);

const Popper = styled(BasePopper)`
  z-index: 10;
`;
