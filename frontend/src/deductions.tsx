import { RootState, store } from "store";
import { evaluateCheckCard } from "checkCardEvaluator";
import { alertActions } from "store/slices/alertSlice";
import { CommentsState } from "store/slices/commentsSlice";

export type Query = {
  code: number[];
  verifierIdx: number;
  result: boolean;
};

const myWorker = new Worker(
  `${process.env.PUBLIC_URL || ""}/wasm/worker.mjs`
);

function checkDigits(state: RootState, possibleCodes: string[]) {
  const digits = { triangle: new Set(), square: new Set(), circle: new Set() };
  for (const code of possibleCodes) {
    digits.triangle.add(Number(code[0]));
    digits.square.add(Number(code[1]));
    digits.circle.add(Number(code[2]));
  }
  for (const { shape, digit } of state.digitCode) {
    if (digits[shape].has(digit)) {
      return false;
    }
  }

  return true;
}

function checkVerifiers(state: RootState, possibleVerifiers: number[][]) {
  for (let i = 0; i < state.comments.length; i += 1) {
    const firstCard = state.comments[i].criteriaCards[0];
    for (const criteria of firstCard.irrelevantCriteria) {
      // the verifiers are 1-indexed in the frontend
      if (possibleVerifiers[i].includes(criteria - 1)) {
        return false;
      }
    }
    // extreme mode
    const secondCard = state.comments[i].criteriaCards[1] || {
      irrelevantCriteria: [],
    };
    for (const criteria of secondCard.irrelevantCriteria) {
      if (
        possibleVerifiers[i].includes(criteria - 1 + firstCard.criteriaSlots)
      ) {
        return false;
      }
    }
  }
  return true;
}

function checkLetters(state: RootState, possibleLetters: string[][]) {
  if (!state.comments[0].nightmare) {
    return true;
  }
  for (let i = 0; i < state.comments.length; i += 1) {
    const letters = state.comments[i].letters;
    for (const letter of letters) {
      if (letter.isIrrelevant && possibleLetters[i].includes(letter.letter)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Fonction de vérification d'une lettre spécifique (A-F) lors d'un clic dans une manche.
 * Réécrite pour ne tester que le code actuel contre la lettre sélectionnée.
 */
/**
 * Version corrigée : On envoie toutes les cartes pour garder les index alignés,
 * mais on ne pose qu'une seule question au worker pour la lettre cliquée.
 */
export async function verifySingleQuery(
  state: RootState,
  code: number[],
  verifier: string // Exemple: "A", "B", etc.
): Promise<"solved" | "unsolved"> {
  const currentComment = state.comments.find(({ verifier: v }) => v === verifier);
  const checkCardId = currentComment?.criteriaCards?.[0]?.cryptCard?.id;
  if (checkCardId) {
    const directEvaluation = evaluateCheckCard(checkCardId, code);
    if (directEvaluation !== null) {
      if (directEvaluation) {
        store.dispatch(
          alertActions.openAlert({
            message: `OK: La lettre ${verifier} accepte le code ${code.join("")} !`,
            level: "success",
          })
        );
        return "solved";
      }
      store.dispatch(
        alertActions.openAlert({
          message: `KO: Le code ${code.join("")} ne passe pas le test ${verifier}.`,
          level: "error",
        })
      );
      return "unsolved";
    }
  }

  const numVerifiers = state.comments.length;

  const mode = (() => {
    if (state.comments[0].nightmare) return 2;
    if (state.comments[0].criteriaCards.length > 1) return 1;
    return 0;
  })();

  // IMPORTANT : Le worker WASM a besoin de la liste complète des cartes 
  // pour que l'index de la lettre corresponde au bon emplacement.
  const allCards = [
    ...state.comments.map(({ criteriaCards }) => criteriaCards[0].id),
    ...(mode === 1
      ? state.comments.map(({ criteriaCards }) => criteriaCards[1]?.id).filter(Boolean)
      : []),
  ];

  const verifierIdxChar = verifier.charCodeAt(0);

  // 2. On demande au worker les deux hypothèses pour cette même lettre:
  // vrai puis faux. Le verdict est déterministe si une seule hypothèse est possible.
  const resultTrue = await waitForWorker({
    type: "solve_wasm",
    verifierCards: allCards,
    queries: [{ code, verifierIdx: verifierIdxChar, result: true }],
    mode,
    numVerifiers,
  });

  const resultFalse = await waitForWorker({
    type: "solve_wasm",
    verifierCards: allCards,
    queries: [{ code, verifierIdx: verifierIdxChar, result: false }],
    mode,
    numVerifiers,
  });

  const hasTrueSolution = !!resultTrue && resultTrue.codes.length > 0;
  const hasFalseSolution = !!resultFalse && resultFalse.codes.length > 0;

  // LOGS pour debug dans la console du navigateur (F12)
  console.log(
    `Test Lettre ${verifier} avec code ${code.join("")}`,
    { hasTrueSolution, hasFalseSolution, resultTrue, resultFalse }
  );

  // 3. Application des règles de décision

  if (hasTrueSolution && !hasFalseSolution) {
    store.dispatch(
      alertActions.openAlert({
        message: `OK: La lettre ${verifier} accepte le code ${code.join("")} (solved) !`,
        level: "success",
      })
    );
    return "solved";
  }

  if (!hasTrueSolution && hasFalseSolution) {
    store.dispatch(
      alertActions.openAlert({
        message: `KO: Le code ${code.join("")} ne passe pas le test ${verifier} (unsolved).`,
        level: "error",
      })
    );
    return "unsolved";
  }

  // Aucun scénario possible: état incohérent (saisie/configuration probablement incorrecte).
  if (!hasTrueSolution && !hasFalseSolution) {
    store.dispatch(
      alertActions.openAlert({
        message: `KO: Aucune solution possible pour ${code.join("")} avec le test ${verifier}. Vérifiez la configuration de la partie.`,
        level: "warning",
      })
    );
    return "unsolved";
  }

  // Les deux scénarios existent encore: résultat non déterministe avec les infos actuelles.
  store.dispatch(
    alertActions.openAlert({
      message: `Le test ${verifier} est ambigu pour ${code.join("")} avec les contraintes actuelles.`,
      level: "info",
    })
  );
  return "unsolved";
}


export async function checkDeductions(state: RootState) {
  const numVerifiers = state.comments.length;
  const mode = (() => {
    if (state.comments[0].nightmare) {
      return 2;
    }
    if (state.comments[0].criteriaCards.length > 1) {
      return 1;
    }
    return 0;
  })();
  const cards = [
    ...state.comments.map(({ criteriaCards }) => {
      return criteriaCards[0].id;
    }),
    ...(mode === 1
      ? state.comments.map(({ criteriaCards }) => {
          return criteriaCards[1].id;
        })
      : []),
  ];

  const queries: Query[] = [];
  for (const round of state.rounds) {
    const code: number[] = [];
    for (const { digit } of round.code) {
      if (!(digit !== null && digit >= 1 && digit <= 5)) {
        continue;
      }
      code.push(digit);
    }
    if (code.length !== 3) {
      continue;
    }
    for (const query of round.queries) {
      if (query.state === "unknown") {
        continue;
      }
      queries.push({
        code,
        verifierIdx: query.verifier.charCodeAt(0),
        result: query.state === "solved",
      });
    }
  }

  const result = await waitForWorker({
    type: "solve_wasm",
    verifierCards: cards,
    queries,
    mode,
    numVerifiers,
  });

  if (result.codes.length === 0) {
    store.dispatch(
      alertActions.openAlert({
        message: `There are no more possible codes.
          Please double-check that you have the correct verifiers and that your query results are correct.
          If this problem still occurs, please file a bug report.`,
        level: "error",
      })
    );
  } else if (
    !(
      checkVerifiers(state, result.possibleVerifiers) &&
      checkDigits(state, result.codes) &&
      checkLetters(state, result.possibleLetters)
    )
  ) {
    store.dispatch(
      alertActions.openAlert({
        message: `You have made an invalid deduction!`,
        level: "warning",
      })
    );
  } else {
    store.dispatch(
      alertActions.openAlert({
        message: `All deductions are valid so far!`,
        level: "success",
      })
    );
  }
}

export async function getPossibleCodes(comments: CommentsState) {
  const cards = comments.map(({ criteriaCards }) => {
    return criteriaCards.map((card) => card.id);
  });
  const possibleVerifiers: number[][] = [];
  for (const comment of comments) {
    const current: number[] = [];
    let criteriaIdx = 0;
    for (const criteriaCard of comment.criteriaCards) {
      for (let i = 0; i < criteriaCard.criteriaSlots; i += 1) {
        if (!criteriaCard.irrelevantCriteria.includes(i + 1)) {
          current.push(criteriaIdx);
        }
        criteriaIdx += 1;
      }
    }
    possibleVerifiers.push(current);
  }

  return waitForWorker({
    type: "get_possible_codes",
    cards,
    possibleVerifiers,
  });
}

export async function getPossibleCodesFromState(state: RootState) {
  const numVerifiers = state.comments.length;
  const mode = (() => {
    if (state.comments[0].nightmare) {
      return 2;
    }
    if (state.comments[0].criteriaCards.length > 1) {
      return 1;
    }
    return 0;
  })();

  const cards = [
    ...state.comments.map(({ criteriaCards }) => criteriaCards[0].id),
    ...(mode === 1
      ? state.comments.map(({ criteriaCards }) => criteriaCards[1].id)
      : []),
  ];

  const queries: Query[] = [];
  for (const round of state.rounds) {
    const code: number[] = [];
    for (const { digit } of round.code) {
      if (!(digit !== null && digit >= 1 && digit <= 5)) {
        continue;
      }
      code.push(digit);
    }
    if (code.length !== 3) {
      continue;
    }
    for (const query of round.queries) {
      if (query.state === "unknown") {
        continue;
      }
      queries.push({
        code,
        verifierIdx: query.verifier.charCodeAt(0),
        result: query.state === "solved",
      });
    }
  }

  const result = await waitForWorker({
    type: "solve_wasm",
    verifierCards: cards,
    queries,
    mode,
    numVerifiers,
  });

  // Filtre les codes impossibles selon la section DigitCode (chiffres marqués incorrects).
  const filteredCodes = result.codes.filter((code: string) => {
    return !state.digitCode.some(({ shape, digit }) => {
      if (shape === "triangle") {
        return Number(code[0]) === digit;
      }
      if (shape === "square") {
        return Number(code[1]) === digit;
      }
      return Number(code[2]) === digit;
    });
  });

  return { codes: filteredCodes };
}

export function getFinalCodesFromCheckCards(state: RootState) {
  const codes: string[] = [];
  const checkCardIds = state.comments
    .map(({ criteriaCards }) => criteriaCards[0]?.cryptCard?.id)
    .filter((id): id is number => typeof id === "number");

  if (checkCardIds.length !== state.comments.length) {
    return { codes };
  }

  for (let blue = 1; blue <= 5; blue += 1) {
    for (let yellow = 1; yellow <= 5; yellow += 1) {
      for (let purple = 1; purple <= 5; purple += 1) {
        const code = [blue, yellow, purple];
        const matchesAllChecks = checkCardIds.every((checkCardId) =>
          evaluateCheckCard(checkCardId, code) === true
        );
        if (matchesAllChecks) {
          codes.push(`${blue}${yellow}${purple}`);
        }
      }
    }
  }

  return { codes };
}

/**
 * Vérifie si un code est la solution correcte du puzzle en vérifiant
 * qu'il passe ALL les critères (check cards).
 * 
 * @param state État Redux
 * @param code Code à vérifier [triangle, square, circle]
 * @returns { isCorrect: boolean; message: string }
 */
export function checkIfCodeIsSolution(
  state: RootState,
  code: number[]
): { isCorrect: boolean; message: string } {
  if (code.length !== 3) {
    return { isCorrect: false, message: "Le code doit avoir exactement 3 chiffres." };
  }

  const checkCardIds = state.comments
    .map(({ criteriaCards }) => criteriaCards[0]?.cryptCard?.id)
    .filter((id): id is number => typeof id === "number");

  if (checkCardIds.length !== state.comments.length) {
    return { isCorrect: false, message: "Configuration incomplète: check cards manquantes." };
  }

  // Teste si ce code passe TOUS les check cards
  const isCorrect = checkCardIds.every((checkCardId) =>
    evaluateCheckCard(checkCardId, code) === true
  );

  const codeStr = code.join("");
  if (isCorrect) {
    return {
      isCorrect: true,
      message: `✅ Le code ${codeStr} est correct!`,
    };
  } else {
    return {
      isCorrect: false,
      message: `❌ Le code ${codeStr} n'est pas la solution.`,
    };
  }
}

let workId = 0;
const promiseResolves: { [id: number]: any } = {};
async function waitForWorker(data: { [key: string]: any }): Promise<any> {
  const currentWorkId = workId++;
  return new Promise((res) => {
    promiseResolves[currentWorkId] = res;
    myWorker.postMessage({ ...data, id: currentWorkId });
  });
}

myWorker.onmessage = function onmessage(e) {
  const data = e.data;
  const resolve = promiseResolves[data.id];
  resolve(data);
  delete promiseResolves[data.id];
};
