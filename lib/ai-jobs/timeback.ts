export interface TimeBackInputs {
  onetLow?: number | null;
  onetHigh?: number | null;
  workflowMinutes?: number | null;
  microtaskMinutes?: number | null;
  blueprintMinutes?: number | null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundSafe(value: number) {
  return Number.isFinite(value) ? Math.round(value) : 0;
}

export function midpoint(low?: number | null, high?: number | null) {
  if (low == null && high == null) {
    return 0;
  }
  if (low == null) {
    return high ?? 0;
  }
  if (high == null) {
    return low;
  }
  return Math.round((low + high) / 2);
}

export function deriveBlendedTimeBack(inputs: TimeBackInputs) {
  const onetLow = inputs.onetLow ?? 0;
  const onetHigh = inputs.onetHigh ?? 0;
  const onetMid = midpoint(inputs.onetLow, inputs.onetHigh);
  const workflowMinutes = inputs.workflowMinutes ?? 0;
  const microtaskMinutes = inputs.microtaskMinutes ?? 0;
  const blueprintMinutes = inputs.blueprintMinutes ?? 0;

  const strongestSource = Math.max(onetHigh, workflowMinutes, microtaskMinutes, blueprintMinutes);
  const practicalSource = Math.max(
    onetMid,
    roundSafe(workflowMinutes * 0.85),
    roundSafe(microtaskMinutes * 0.9),
    blueprintMinutes
  );

  const blendedLow = Math.max(
    onetLow,
    roundSafe(practicalSource * 0.78),
    roundSafe(workflowMinutes * 0.65),
    roundSafe(microtaskMinutes * 0.7)
  );

  const blendedHigh = Math.max(
    onetHigh,
    strongestSource,
    roundSafe(practicalSource * 1.2),
    blendedLow + 10
  );

  return {
    displayMinutes: clamp(practicalSource, 10, 180),
    rangeLow: clamp(blendedLow, 5, 180),
    rangeHigh: clamp(blendedHigh, clamp(blendedLow + 5, 10, 180), 180),
    sources: {
      onetLow,
      onetHigh,
      onetMid,
      workflowMinutes,
      microtaskMinutes,
      blueprintMinutes,
    },
  };
}

export function deriveBlockMidpointRange(
  blockRange?: { low: number; high: number } | null
) {
  if (!blockRange) {
    return 0;
  }

  return midpoint(blockRange.low, blockRange.high);
}
