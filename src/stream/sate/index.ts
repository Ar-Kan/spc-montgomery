import { max } from "lodash";
import { DataSample } from "../data";
import { ControlLimits } from "../data/utils";
import {
  getAlternatingPoints,
  getPointsInLimit,
  getPointsNonRandom,
  getPointsWithTrend,
  stateFromPointSignal,
} from "./utils";

export enum SignalStateType {
  OK,
  WARNING,
  ALERT,
}

export enum ActionSignal {
  /*One or more points outside the control limits.*/
  POC = "POC",
  /*Two of three consecutive points outside the two-sigma warning limits but still inside the control limits.*/
  TWO_THREE_2s = "2/3-2s",
  /*Four of five consecutive points beyond the one-sigma limits.*/
  FOUR_FIVE_1s = "4/5-1s",
  /*A run of eight consecutive points on one side of the center line.*/
  EIGHT_OS = "8OS",
  /*Six points in a row steadily increasing or decreasing.*/
  SIX_TREND = "6Trend",
  /*Fifteen points in a row in zone C (both above and below the center line).*/
  FIFTEEN_C = "15C",
  /*Fourteen points in a row alternating up and down.*/
  FOURTEEN_ALT = "14Alt",
  /*Eight points in a row on both sides of the center line with none in zone C.*/
  EIGHT_BS = "8BS",
  /*An unusual or nonrandom pattern in the data.*/
  NR = "NR",
  /*One or more points near a warning or control limit.*/
  PNL = "PNL",
}

export interface SignalState {
  state: SignalStateType;
  timestamp: number;
}

export type SignalStateMap = Record<ActionSignal, SignalState>;

export const actionSignalsState: SignalStateMap = {
  [ActionSignal.POC]: { state: SignalStateType.OK, timestamp: 0 },
  [ActionSignal.TWO_THREE_2s]: { state: SignalStateType.OK, timestamp: 0 },
  [ActionSignal.FOUR_FIVE_1s]: { state: SignalStateType.OK, timestamp: 0 },
  [ActionSignal.EIGHT_OS]: { state: SignalStateType.OK, timestamp: 0 },
  [ActionSignal.SIX_TREND]: { state: SignalStateType.OK, timestamp: 0 },
  [ActionSignal.FIFTEEN_C]: { state: SignalStateType.OK, timestamp: 0 },
  [ActionSignal.FOURTEEN_ALT]: { state: SignalStateType.OK, timestamp: 0 },
  [ActionSignal.EIGHT_BS]: { state: SignalStateType.OK, timestamp: 0 },
  [ActionSignal.NR]: { state: SignalStateType.OK, timestamp: 0 },
  [ActionSignal.PNL]: { state: SignalStateType.OK, timestamp: 0 },
};

export function signalCheck({
  stream: _stream,
  lastState,
  pollingInterval,
  controlLimits,
}: {
  stream: DataSample[];
  lastState: SignalStateMap;
  pollingInterval: number;
  controlLimits: ControlLimits;
}): SignalStateMap {
  const stream = _stream.slice(-20);
  if (stream.length === 0) {
    return actionSignalsState;
  }

  const lastSample = stream[stream.length - 1];
  const lastSignalTimestamp = max(
    Object.values(lastState).map((state: SignalState) => state.timestamp),
  );

  if (lastSignalTimestamp) {
    const timePassed = lastSample.timestamp - lastSignalTimestamp;
    if (timePassed < pollingInterval) {
      return actionSignalsState;
    }
  }

  const { UCL, LCL, U1sCL, L1sCL, UWL, LWL, MEAN } = controlLimits;

  // 1. One or more points outside the control limits.
  const POC = stateFromPointSignal({
    lastSample,
    samples: [
      getPointsInLimit({
        stream,
        window: 1,
        limit: UCL,
        position: "above",
      }),
      getPointsInLimit({
        stream,
        window: 1,
        limit: LCL,
        position: "below",
      }),
    ],
  });

  // 2. Two of three consecutive points outside the two-sigma
  //    warning limits but still inside the control limits.
  const TWO_THREE_2S = stateFromPointSignal({
    lastSample,
    samples: [
      getPointsInLimit({
        stream,
        window: 3,
        threshold: 2,
        limit: UWL,
        position: "above",
      }),
      getPointsInLimit({
        stream,
        window: 3,
        threshold: 2,
        limit: LWL,
        position: "below",
      }),
    ],
  });

  // 3. Four of five consecutive points beyond the one-sigma limits.
  const FOUR_FIVE_1S = stateFromPointSignal({
    lastSample,
    samples: [
      getPointsInLimit({
        stream,
        window: 5,
        threshold: 4,
        limit: U1sCL,
        position: "above",
      }),
      getPointsInLimit({
        stream,
        window: 5,
        threshold: 4,
        limit: L1sCL,
        position: "below",
      }),
    ],
  });

  // 4. A run of eight consecutive points on one side of the center line.
  const EIGHT_ONE_SIDE = stateFromPointSignal({
    lastSample,
    samples: [
      getPointsInLimit({
        stream,
        window: 8,
        limit: MEAN,
        position: "above",
      }),
      getPointsInLimit({
        stream,
        window: 8,
        limit: MEAN,
        position: "below",
      }),
    ],
  });

  // 5. Six points in a row steadily increasing or decreasing.
  const SIX_TREND = stateFromPointSignal({
    lastSample,
    samples: [
      getPointsWithTrend({
        stream,
        window: 6,
        trend: "increasing",
      }),
      getPointsWithTrend({
        stream,
        window: 6,
        trend: "decreasing",
      }),
    ],
  });

  // 6. Fifteen points in a row in zone C (zero to one-sigma) - both above and below the center line.
  const FIFTEEN_C = stateFromPointSignal({
    lastSample,
    samples: [
      getPointsInLimit({
        stream,
        window: 15,
        limit: [L1sCL, U1sCL],
        position: "in",
      }),
    ],
  });

  // 7. Fourteen points in a row alternating up and down.
  const FOURTEEN_ALT = stateFromPointSignal({
    lastSample,
    samples: [
      getAlternatingPoints({
        stream,
        window: 14,
      }),
    ],
  });

  // 8. Eight points in a row on both sides of the center line with none in zone C (zero to one-sigma).
  const EIGHT_BOTH_SIDE = stateFromPointSignal({
    lastSample,
    samples: [
      getPointsInLimit({
        stream,
        window: 8,
        limit: [L1sCL, U1sCL],
        position: "out",
      }),
    ],
  });

  // 9. An unusual or nonrandom pattern in the data.
  const NON_RANDOM = stateFromPointSignal({
    lastSample,
    samples: [
      getPointsNonRandom({
        stream,
        window: 10,
      }),
    ],
  });

  // 10. One or more points near a warning or control limit.
  const tol = 0.02;
  const ONE_NEAR_LIMIT = stateFromPointSignal({
    lastSample,
    samples: [
      getPointsInLimit({
        stream,
        window: 1,
        limit: [UCL - UCL * tol, UCL + UCL * tol],
        position: "in",
      }),
      getPointsInLimit({
        stream,
        window: 1,
        limit: [LCL - LCL * tol, LCL + LCL * tol],
        position: "in",
      }),
      getPointsInLimit({
        stream,
        window: 1,
        limit: [UWL - UWL * tol, UWL + UWL * tol],
        position: "in",
      }),
      getPointsInLimit({
        stream,
        window: 1,
        limit: [LWL - LWL * tol, LWL + LWL * tol],
        position: "in",
      }),
    ],
  });

  return {
    [ActionSignal.POC]: POC,
    [ActionSignal.TWO_THREE_2s]: TWO_THREE_2S,
    [ActionSignal.FOUR_FIVE_1s]: FOUR_FIVE_1S,
    [ActionSignal.EIGHT_OS]: EIGHT_ONE_SIDE,
    [ActionSignal.SIX_TREND]: SIX_TREND,
    [ActionSignal.FIFTEEN_C]: FIFTEEN_C,
    [ActionSignal.FOURTEEN_ALT]: FOURTEEN_ALT,
    [ActionSignal.EIGHT_BS]: EIGHT_BOTH_SIDE,
    [ActionSignal.NR]: NON_RANDOM,
    [ActionSignal.PNL]: ONE_NEAR_LIMIT,
  };
}
