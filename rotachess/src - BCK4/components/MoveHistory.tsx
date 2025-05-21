import React from "react";
import "../styles/App.css";

interface MoveHistoryProps {
  moveHistory: string[];
  visibleIndex: number;
}

const MoveHistory: React.FC<MoveHistoryProps> = ({ moveHistory, visibleIndex }) => {
  return (
    <div className="move-history">
      <h3>Move History</h3>
      <ol>
        {moveHistory.map((move, index) => {
          const isActive = index === visibleIndex;
          const isEven = index % 2 === 0;
          const bgClass = isEven ? "white-bg" : "black-bg";
          return (
            <li key={index}>
              <span className={`move-span ${bgClass} ${isActive ? "highlight" : ""}`}>
                {move}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default MoveHistory;
