import React from "react";
import "../styles/App.css";

interface ControlButtonsProps {
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
}

const ControlButtons: React.FC<ControlButtonsProps> = ({ onUndo, onRedo, onReset, }) => {
  return (
	<div className="buttons">
      <button onClick={onUndo}>↩</button>
      <button onClick={onRedo}>↪</button>
      <button onClick={onReset}>⟳</button>
    </div>
  );
};

export default ControlButtons;
