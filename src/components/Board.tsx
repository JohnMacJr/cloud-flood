import { COLORS, GRID_SIZE } from '../lib/constants';

interface BoardProps {
  board: number[][];
}

export default function Board({ board }: BoardProps) {
  return (
    <div
      className="grid gap-[2px] w-full max-w-[400px] aspect-square mx-auto"
      style={{
        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
        gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
      }}
    >
      {board.map((row, r) =>
        row.map((colorId, c) => {
          const color = COLORS[colorId];
          return (
            <div
              key={`${r}-${c}`}
              className="rounded-[4px] transition-colors duration-200 ease-out shadow-[inset_0_-1px_2px_rgba(0,0,0,0.1)]"
              style={{ backgroundColor: color.hex }}
              aria-label={`Row ${r + 1}, Column ${c + 1}: ${color.name}`}
            />
          );
        })
      )}
    </div>
  );
}
