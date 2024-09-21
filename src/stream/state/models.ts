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

export const signalDescriptions = [
  {
    action: ActionSignal.POC,
    description: "One or more points outside the control limits.",
  },
  {
    action: ActionSignal.TWO_THREE_2s,
    description:
      "Two of three consecutive points outside the two-sigma warning limits but still inside the control limits.",
  },
  {
    action: ActionSignal.FOUR_FIVE_1s,
    description: "Four of five consecutive points beyond the one-sigma limits.",
  },
  {
    action: ActionSignal.EIGHT_OS,
    description: "A run of eight consecutive points on one side of the center line.",
  },
  {
    action: ActionSignal.SIX_TREND,
    description: "Six points in a row steadily increasing or decreasing.",
  },
  {
    action: ActionSignal.FIFTEEN_C,
    description: "Fifteen points in a row in zone C (both above and below the center line).",
  },
  {
    action: ActionSignal.FOURTEEN_ALT,
    description: "Fourteen points in a row alternating up and down.",
  },
  {
    action: ActionSignal.EIGHT_BS,
    description: "Eight points in a row on both sides of the center line with none in zone C.",
  },
  {
    action: ActionSignal.NR,
    description: "An unusual or nonrandom pattern in the data.",
  },
  {
    action: ActionSignal.PNL,
    description: "One or more points near a warning or control limit.",
  },
] as const;
