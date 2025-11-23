export type DiceResult = 1 | 2 | 3 | 4 | 5 | 6;

export interface Rotation {
  x: number;
  y: number;
  z: number;
}

export interface Position {
  x: number; // percentage or px on table
  y: number;
}

export interface DieState {
  id: number;
  value: DiceResult | null;
  rotation: Rotation;
  position: Position;
}

export interface RollHistoryItem {
  values: DiceResult[];
  total: number;
  timestamp: number;
  interpretation?: string;
}