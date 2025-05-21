// src/App.tsx
import React, { useState, useEffect } from "react";
import { Chess, Square, Move } from "chess.js";
import { Chessboard } from "react-chessboard";
import MoveHistory from "./components/MoveHistory";
import ControlButtons from "./components/ControlButtons";
import "./styles/App.css";

const initialGame = new Chess();

function App() {
	const [game, setGame] = useState<Chess>(initialGame);
	const [turn, setTurn] = useState<"w" | "b">(game.turn());
	const [activeSquare, setActiveSquare] = useState<Square | null>(null);
	const [legalMoves, setLegalMoves] = useState<Square[]>([]);
	const [moveHistory, setMoveHistory] = useState<string[]>([]);
	const [historyStack, setHistoryStack] = useState<string[]>([]);
	const [redoStack, setRedoStack] = useState<string[]>([]);
	const [visibleIndex, setVisibleIndex] = useState<number>(-1);
	const [orientation, setOrientation] = useState<"white" | "black">("white");
	const [rotationDegree, setRotationDegree] = useState(0);
	const [isTransitionEnabled, setIsTransitionEnabled] = useState(false);
	const [isTransitionAtHalf, setIsTransitionAtHalf] = useState(true);

	useEffect(() => {
		if (game.isGameOver()) {
			if (game.isCheckmate()) {
				alert("Schachmatt! " + (game.turn() === "w" ? "Schwarz" : "Weiß") + " gewinnt.");
			} else if (game.isDraw()) {
				alert("Unentschieden!");
			}
		}
		setTurn(game.turn());
	}, [game]);
	
	const rotateBoard = () => {
		setIsTransitionEnabled(true);
		setIsTransitionAtHalf(false);
		setRotationDegree(1800);
		setTimeout(() => {
			setOrientation(prev => (prev === "white" ? "black" : "white"));
			setIsTransitionAtHalf(true);
		}, 750/2);
		setTimeout(() => {
			setIsTransitionEnabled(false);
		}, 750);
	};

	const resetRotationInstantly = () => {
	  setIsTransitionEnabled(false);
	  setRotationDegree(0);
	};

	function safeGameMutate(modify: (game: Chess) => void) {
		const updatedGame = new Chess(game.fen());
		try {
			modify(updatedGame);
			setGame(updatedGame);
		} catch (e) {
			console.error("Ungültiger Zug:", e);
			alert("Ungültiger Zug!");
		}
	}

	function onDrop(sourceSquare: Square, targetSquare: Square): boolean {
		let moveMade = false;
		const prevFen = game.fen();

		safeGameMutate((g) => {
			const move = g.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
			if (move) {
				moveMade = true;
				const newHistory = moveHistory.slice(0, visibleIndex + 1);
				const updatedHistory = [...newHistory, move.san];
				setMoveHistory(updatedHistory);
				setVisibleIndex(updatedHistory.length - 1);
				setHistoryStack([...historyStack, prevFen]);
				setRedoStack([]);
				setActiveSquare(null);
				setLegalMoves([]);
			}
		});

		return moveMade;
	}

	function onSquareClick(square: Square) {
		const piece = game.get(square);
		if (square === activeSquare) {
			setActiveSquare(null);
			setLegalMoves([]);
		} else if (piece && piece.color === game.turn()) {
			const moves = game.moves({ square, verbose: true }) as Move[];
			setActiveSquare(square);
			setLegalMoves(moves.map(m => m.to));
		} else if (legalMoves.includes(square) && activeSquare) {
			onDrop(activeSquare, square);
		} else {
			setActiveSquare(null);
			setLegalMoves([]);
		}
	}

	function getSquareStyles() {
		const styles: { [square in Square]?: React.CSSProperties } = {};
		legalMoves.forEach(sq => {
			styles[sq] = { backgroundColor: "rgba(255, 255, 0, 0.4)" };
		});
		if (activeSquare) {
			styles[activeSquare] = { backgroundColor: "rgba(0, 255, 0, 0.4)" };
		}
		return styles;
	}

	function handleUndo() {
		if (historyStack.length > 0 && visibleIndex >= 0) {
			const previousFen = historyStack[historyStack.length - 1];
			setRedoStack([game.fen(), ...redoStack]);
			setHistoryStack(historyStack.slice(0, -1));
			setGame(new Chess(previousFen));
			setMoveHistory(moveHistory.slice(0, -1));
			setVisibleIndex(visibleIndex - 1);
			setActiveSquare(null);
			setLegalMoves([]);
		}
	}

	function handleRedo() {
		if (redoStack.length > 0) {
			const nextFen = redoStack[0];
			setHistoryStack([...historyStack, game.fen()]);
			setRedoStack(redoStack.slice(1));
			const newGame = new Chess(nextFen);
			setGame(newGame);

			const newMove = newGame.history().at(-1);
			if (newMove) {
				setMoveHistory([...moveHistory, newMove]);
				setVisibleIndex(visibleIndex + 1);
			}

			setActiveSquare(null);
			setLegalMoves([]);
		}
	}

	function handleReset() {
		const newGame = new Chess();
		setGame(newGame);
		setHistoryStack([]);
		setRedoStack([]);
		setMoveHistory([]);
		setVisibleIndex(-1);
		setActiveSquare(null);
		setLegalMoves([]);
		setOrientation("white");
		setTurn("w");
	}

	return (
		<div className="App">
			<h1>RotaChess</h1>
			<h5>Chess. But with rotations ¯\_(ツ)_/¯</h5>
			<p>Waiting for: {turn === "w" ? "⚪" : "⚫"}</p>
			
			<div className="rotate-overlay"
				style={{
					/*
					// Always in middle (even when scrolling!)
					
					opacity: isTransitionEnabled ? 1 : 0,
					pointerEvents: isTransitionEnabled ? 'auto' : 'none',
					transition: 'opacity 0.2s ease-in-out',
					
					margin: '0',
					padding: '0',
					position: 'fixed',
					top: '50%',
					left: '50%',
					transform: 'translateX(-50%) translateY(-67%)',
					color: 'var(--fg-overlay)',
					zIndex: '9999',
					fontWeight: 'bold',
					fontSize: '12rem',
					*/
					
					// Just in middle of the game field
					
					opacity: isTransitionEnabled ? 1 : 0,
					pointerEvents: isTransitionEnabled ? 'auto' : 'none',
					position: 'absolute',
					top: '19.15rem',
					left: '50%',
					transform: 'translateX(-50%)',
					transition: 'opacity 0.75s ease-in',
					color: 'var(--fg-overlay)',
					zIndex: '9999',
					fontWeight: 'bold',
					fontSize: '12rem',
				}}
			>ROTATE!</div>
			<div className="chessboard-wrapper"
				style={{
					// transform: !isTransitionAtHalf ? 'scale(0.005)' : 'scale(1)',
					transform: isTransitionEnabled ? `rotate(${rotationDegree}deg)` : 'none',
					// transform: `${!isTransitionAtHalf ? 'scale(0.0001)' : 'scale(1)'} ${isTransitionEnabled ? `rotate(${rotationDegree}deg)` : ''}`.trim(),
					transformOrigin: 'center',
					transition: isTransitionEnabled ? 'transform 0.75s ease-in-out' : 'none',
				}}
			>
				<Chessboard
					position={game.fen()}
					onPieceDrop={onDrop}
					onSquareClick={onSquareClick}
					customSquareStyles={getSquareStyles()}
					boardOrientation={orientation}
				/>
			</div>
			<div className="move-history">
				<MoveHistory moveHistory={moveHistory} visibleIndex={visibleIndex} />
				<ControlButtons
					onUndo={handleUndo}
					onRedo={handleRedo}
					onReset={handleReset}
				/>
			</div>
			
			<div className="dev-tools">
				<h3>Dev Tools</h3>
				<button className="dev-button1" onClick={rotateBoard}>
					↻ Rotate Board + Switch Sides
				</button>
			</div>
		</div>
	);
}

export default App;
