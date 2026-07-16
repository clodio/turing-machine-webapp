import { CHECK_CARD_ID_TO_NAME } from "./checkCardIdToName";

type CodeTriple = [number, number, number];
type CheckCardEvaluator = (code: CodeTriple) => boolean;

const countDigit = (code: CodeTriple, digit: number) =>
  code.filter((value) => value === digit).length;

const countEven = (code: CodeTriple) =>
  code.filter((value) => value % 2 === 0).length;

const sumDigits = (code: CodeTriple) =>
  code.reduce((result, value) => result + value, 0);

const hasTriple = ([blue, yellow, purple]: CodeTriple) =>
  blue === yellow && yellow === purple;

const hasDouble = ([blue, yellow, purple]: CodeTriple) =>
  (blue === yellow || blue === purple || yellow === purple) &&
  !hasTriple([blue, yellow, purple]);

const isAscending = ([blue, yellow, purple]: CodeTriple) =>
  blue < yellow && yellow < purple;

const isDescending = ([blue, yellow, purple]: CodeTriple) =>
  blue > yellow && yellow > purple;

const hasThreeConsecutiveAsc = ([blue, yellow, purple]: CodeTriple) =>
  yellow === blue + 1 && purple === yellow + 1;

const hasTwoConsecutiveAsc = ([blue, yellow, purple]: CodeTriple) =>
  (yellow === blue + 1) !== (purple === yellow + 1);

const hasNoConsecutiveAsc = ([blue, yellow, purple]: CodeTriple) =>
  yellow !== blue + 1 && purple !== yellow + 1;

const hasNoConsecutiveAscDesc = ([blue, yellow, purple]: CodeTriple) =>
  yellow !== blue + 1 &&
  purple !== yellow + 1 &&
  yellow !== blue - 1 &&
  purple !== yellow - 1;

const hasTwoConsecutiveAscDesc = ([blue, yellow, purple]: CodeTriple) =>
  (yellow === blue + 1) !== (purple === yellow + 1) ||
  (yellow === blue - 1) !== (purple === yellow - 1);

const hasThreeConsecutiveAscDesc = ([blue, yellow, purple]: CodeTriple) =>
  (yellow === blue + 1 && purple === yellow + 1) ||
  (yellow === blue - 1 && purple === yellow - 1);

const checkCardNames = [
  "purple_eq_4",
  "no_one",
  "two_threes",
  "sum_even",
  "blue_plus_purple_eq_4",
  "blue_plus_yellow_lt_6",
  "purple_eq_1",
  "blue_eq_purple",
  "one_triple",
  "yellow_plus_purple_eq_6",
  "two_consecutive_asc",
  "descending",
  "sum_is_multiple_of_4",
  "yellow_lt_blue_purple",
  "sum_eq_6",
  "no_consecutive_asc_desc",
  "blue_plus_yellow_gt_6",
  "purple_lt_blue_yellow",
  "yellow_gt_blue_purple",
  "three_consecutive_asc",
  "one_twin",
  "yellow_gt_3",
  "no_consecutive_asc",
  "one_one",
  "three_evens",
  "sum_lt_6",
  "no_fours",
  "one_four",
  "yellow_lt_3",
  "yellow_plus_purple_eq_4",
  "purple_lt_3",
  "purple_even",
  "ascending",
  "blue_eq_3",
  "yellow_gt_1",
  "purple_gt_1",
  "blue_gt_3",
  "blue_lt_4",
  "yellow_eq_4",
  "two_ones",
  "yellow_eq_3",
  "purple_gt_3",
  "purple_le_blue_yellow",
  "yellow_even",
  "no_order",
  "blue_eq_1",
  "no_twin",
  "evens_lt_odds",
  "three_consecutive_asc_desc",
  "no_repeat",
  "no_evens",
  "yellow_odd",
  "one_even",
  "purple_eq_3",
  "sum_is_multiple_of_5",
  "two_fours",
  "blue_lt_yellow",
  "yellow_le_blue_purple",
  "blue_odd",
  "sum_is_multiple_of_3",
  "yellow_eq_1",
  "sum_odd",
  "blue_lt_yellow_purple",
  "blue_plus_purple_eq_6",
  "purple_gt_blue_yellow",
  "blue_lt_purple",
  "two_evens",
  "blue_eq_4",
  "yellow_gt_purple",
  "blue_le_yellow_purple",
  "evens_gt_odds",
  "no_three",
  "blue_gt_1",
  "purple_odd",
  "blue_gt_yellow_purple",
  "blue_ge_yellow_purple",
  "yellow_lt_4",
  "sum_gt_6",
  "yellow_gt_4",
  "blue_gt_purple",
  "blue_plus_yellow_eq_4",
  "blue_gt_4",
  "purple_gt_4",
  "blue_gt_yellow",
  "blue_eq_yellow",
  "one_double",
  "two_consecutive_asc_desc",
  "blue_plus_yellow_eq_6",
  "blue_even",
  "yellow_ge_blue_purple",
  "yellow_eq_purple",
  "blue_lt_3",
  "one_three",
  "purple_lt_4",
  "yellow_lt_purple",
] as const;

const checkCardEvaluators: CheckCardEvaluator[] = [
  ([, , purple]) => purple === 4,
  (code) => countDigit(code, 1) === 0,
  (code) => countDigit(code, 3) === 2,
  (code) => sumDigits(code) % 2 === 0,
  ([blue, , purple]) => blue + purple === 4,
  ([blue, yellow]) => blue + yellow < 6,
  ([, , purple]) => purple === 1,
  ([blue, , purple]) => blue === purple,
  (code) => hasTriple(code),
  ([, yellow, purple]) => yellow + purple === 6,
  (code) => hasTwoConsecutiveAsc(code),
  (code) => isDescending(code),
  (code) => sumDigits(code) % 4 === 0,
  ([blue, yellow, purple]) => yellow < blue && yellow < purple,
  (code) => sumDigits(code) === 6,
  (code) => hasNoConsecutiveAscDesc(code),
  ([blue, yellow]) => blue + yellow > 6,
  ([blue, yellow, purple]) => purple < blue && purple < yellow,
  ([blue, yellow, purple]) => yellow > blue && yellow > purple,
  (code) => hasThreeConsecutiveAsc(code),
  (code) => hasDouble(code),
  ([, yellow]) => yellow > 3,
  (code) => hasNoConsecutiveAsc(code),
  (code) => countDigit(code, 1) === 1,
  (code) => countEven(code) === 3,
  (code) => sumDigits(code) < 6,
  (code) => countDigit(code, 4) === 0,
  (code) => countDigit(code, 4) === 1,
  ([, yellow]) => yellow < 3,
  ([, yellow, purple]) => yellow + purple === 4,
  ([, , purple]) => purple < 3,
  ([, , purple]) => purple % 2 === 0,
  (code) => isAscending(code),
  ([blue]) => blue === 3,
  ([, yellow]) => yellow > 1,
  ([, , purple]) => purple > 1,
  ([blue]) => blue > 3,
  ([blue]) => blue < 4,
  ([, yellow]) => yellow === 4,
  (code) => countDigit(code, 1) === 2,
  ([, yellow]) => yellow === 3,
  ([, , purple]) => purple > 3,
  ([blue, yellow, purple]) => purple <= blue && purple <= yellow,
  ([, yellow]) => yellow % 2 === 0,
  (code) => !isAscending(code) && !isDescending(code),
  ([blue]) => blue === 1,
  (code) => !hasDouble(code),
  (code) => countEven(code) < 2,
  (code) => hasThreeConsecutiveAscDesc(code),
  ([blue, yellow, purple]) =>
    blue !== yellow && blue !== purple && yellow !== purple,
  (code) => countEven(code) === 0,
  ([, yellow]) => yellow % 2 !== 0,
  (code) => countEven(code) === 1,
  ([, , purple]) => purple === 3,
  (code) => sumDigits(code) % 5 === 0,
  (code) => countDigit(code, 4) === 2,
  ([blue, yellow]) => blue < yellow,
  ([blue, yellow, purple]) => yellow <= blue && yellow <= purple,
  ([blue]) => blue % 2 !== 0,
  (code) => sumDigits(code) % 3 === 0,
  ([, yellow]) => yellow === 1,
  (code) => sumDigits(code) % 2 !== 0,
  ([blue, yellow, purple]) => blue < yellow && blue < purple,
  ([blue, , purple]) => blue + purple === 6,
  ([blue, yellow, purple]) => purple > blue && purple > yellow,
  ([blue, , purple]) => blue < purple,
  (code) => countEven(code) === 2,
  ([blue]) => blue === 4,
  ([, yellow, purple]) => yellow > purple,
  ([blue, yellow, purple]) => blue <= yellow && blue <= purple,
  (code) => countEven(code) >= 2,
  (code) => countDigit(code, 3) === 0,
  ([blue]) => blue > 1,
  ([, , purple]) => purple % 2 !== 0,
  ([blue, yellow, purple]) => blue > yellow && blue > purple,
  ([blue, yellow, purple]) => blue >= yellow && blue >= purple,
  ([, yellow]) => yellow < 4,
  (code) => sumDigits(code) > 6,
  ([, yellow]) => yellow > 4,
  ([blue, , purple]) => blue > purple,
  ([blue, yellow]) => blue + yellow === 4,
  ([blue]) => blue > 4,
  ([, , purple]) => purple > 4,
  ([blue, yellow]) => blue > yellow,
  ([blue, yellow]) => blue === yellow,
  (code) => hasDouble(code),
  (code) => hasTwoConsecutiveAscDesc(code),
  ([blue, yellow]) => blue + yellow === 6,
  ([blue]) => blue % 2 === 0,
  ([blue, yellow, purple]) => yellow >= blue && yellow >= purple,
  ([, yellow, purple]) => yellow === purple,
  ([blue]) => blue < 3,
  (code) => countDigit(code, 3) === 1,
  ([, , purple]) => purple < 4,
  ([, yellow, purple]) => yellow < purple,
];

function resolveCheckCardIndex(checkCardId: number): number | null {
  const checkCardName = CHECK_CARD_ID_TO_NAME[checkCardId];
  if (!checkCardName) {
    return null;
  }
  const index = checkCardNames.indexOf(checkCardName as (typeof checkCardNames)[number]);
  return index === -1 ? null : index;
}

export function getCheckCardName(checkCardId: number): string | null {
  const index = resolveCheckCardIndex(checkCardId);
  if (index === null) {
    return null;
  }
  return checkCardNames[index] ?? null;
}

export function evaluateCheckCard(checkCardId: number, code: number[]): boolean | null {
  if (code.length !== 3) {
    return null;
  }
  const index = resolveCheckCardIndex(checkCardId);
  if (index === null) {
    return null;
  }
  const evaluator = checkCardEvaluators[index];
  if (!evaluator) {
    return null;
  }
  return evaluator(code as CodeTriple);
}
