export enum ProcessState {
  IN_CONTROL,
  UNCONTROLLED,
  DRIFTING,
  TRENDING,
}

export default function ProcessStateActions({
  processState,
  setProcessState,
}: {
  processState: ProcessState;
  setProcessState: (state: ProcessState) => void;
}) {
  return (
    <fieldset>
      <legend>Process State</legend>
      <div>
        <label>
          <input
            type="radio"
            checked={processState === ProcessState.IN_CONTROL}
            onChange={() => setProcessState(ProcessState.IN_CONTROL)}
          />
          In Control
        </label>
      </div>
      <div>
        <label>
          <input
            type="radio"
            checked={processState === ProcessState.UNCONTROLLED}
            onChange={() => setProcessState(ProcessState.UNCONTROLLED)}
          />
          Uncontrolled
        </label>
      </div>
      <div>
        <label>
          <input
            type="radio"
            checked={processState === ProcessState.DRIFTING}
            onChange={() => setProcessState(ProcessState.DRIFTING)}
          />
          Drift
        </label>
      </div>
      <div>
        <label>
          <input
            type="radio"
            checked={processState === ProcessState.TRENDING}
            onChange={() => setProcessState(ProcessState.TRENDING)}
          />
          Trend
        </label>
      </div>
    </fieldset>
  );
}
