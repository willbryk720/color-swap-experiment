// Array of all possible trial swap data.
// Alternatively, could read from excel sheet
const TRIALS = [
  { id: 0, swaps: [[2, 1]] },
  { id: 1, swaps: [[2, 3], [1, 2]] },
  { id: 2, swaps: [[1, 2], [2, 3], [1, 3]] },
  { id: 3, swaps: [[1, 3], [2, 1], [1, 2]] }
];

// Here select which subset of the trials the user should see
// These correspond to the id field in the TRIALS array
const TRIALIDS = [1, 2];
