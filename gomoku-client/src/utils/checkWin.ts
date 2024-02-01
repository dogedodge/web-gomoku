import { GoState } from "../constant";

export function checkWin(goStateMap: GoState[][]) {
  const verticalStr = goStateMap.map((column) => column.join("")).join("x");
  const horizontalStr = transposeMatrix(goStateMap)
    .map((column) => column.join(""))
    .join("x");
  const boardStr = [verticalStr, horizontalStr].join("x");

  if (/1{5}/.test(boardStr)) {
    console.log("black win");
    return GoState.BLACK;
  }

  if (/2{5}/.test(boardStr)) {
    console.log("white win");
    return GoState.WHITE;
  }

  return GoState.NONE;
}

function transposeMatrix<T>(matrix: T[][]): T[][] {
  const numRows = matrix.length;
  const numCols = matrix[0].length;

  // Initialize a new empty matrix with switched dimensions
  const transposedMatrix = new Array(numCols)
    .fill(null)
    .map(() => new Array(numRows));

  // Fill the transposed matrix by swapping rows and columns
  for (let i = 0; i < numRows; i++) {
    for (let j = 0; j < numCols; j++) {
      transposedMatrix[j][i] = matrix[i][j];
    }
  }

  return transposedMatrix;
}
