export interface SimulationState {
  capital: number;
  baseBurn: number;
  inflation: number; // e.g., 20 for 20%
  patchBleeds: boolean;
  bleedAmount: number;
  pauseGoals: boolean;
  monthlyGoalCost: number;
}

export interface ProjectionPoint {
  month: number;
  capitalRemaining: number;
  isBaseline: boolean;
}

export const runRunwaySimulation = (state: SimulationState) => {
  // 1. Calculate the Adjusted Burn Rate
  let adjustedBurn = state.baseBurn * (1 + (state.inflation / 100));
  
  if (state.patchBleeds) {
    adjustedBurn -= state.bleedAmount;
  }
  
  if (!state.pauseGoals) {
    adjustedBurn += state.monthlyGoalCost;
  }

  // Prevent infinite loops if burn is 0 or negative
  if (adjustedBurn <= 0) adjustedBurn = 1; 

  // 2. Generate the 24-Month Projection Array for the Chart
  const projection: ProjectionPoint[] = [];
  let currentSimCapital = state.capital;
  let currentBaselineCapital = state.capital;
  const baselineBurn = state.baseBurn + state.monthlyGoalCost;

  for (let i = 0; i <= 24; i++) {
    projection.push({
      month: i,
      capitalRemaining: Math.max(0, currentSimCapital),
      isBaseline: false
    });
    currentSimCapital -= adjustedBurn;
    currentBaselineCapital -= baselineBurn;
  }

  // 3. Calculate exact runway numbers
  const simulatedRunwayMonths = state.capital / adjustedBurn;
  const baselineRunwayMonths = state.capital / baselineBurn;

  return {
    projection,
    simulatedRunwayMonths: Number(simulatedRunwayMonths.toFixed(1)),
    baselineRunwayMonths: Number(baselineRunwayMonths.toFixed(1)),
    adjustedBurn,
  };
};
