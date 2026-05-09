"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "../hooks/useSocket";
import { useGameStore } from "../store/gameStore";
import RobotAvatar from "./RobotAvatar";
import type { Stroke, Point } from "shared";

const COLOR_PALETTE = [
  "#FFFFFF", "#C1C1C1", "#EF130B", "#FF7100",
  "#FFE400", "#00CC00", "#00B2FF", "#231FD3",
  "#A300BA", "#D37CAA", "#A0522D",
  "#000000", "#4C4C4C", "#740B07", "#C23800",
  "#E8A200", "#005510", "#00569E", "#0E0865",
  "#550069", "#A75574", "#63300D",
];

export default function GameScreen() {
  const socket = useSocket();
  const {
    room, isDrawer, wordOptions, wordHint, timeLeft, totalTime,
    strokes, messages, scores, currentWord, guessedPlayers, showScoreboard,
  } = useGameStore();

  const [guess, setGuess] = useState("");
  const [color, setColor] = useState("#000000");
  const [thickness, setThickness] = useState(4);
  const [tool, setTool] = useState<"brush" | "eraser">("brush");
  const [showChat, setShowChat] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef<Point[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const stroke of strokes) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = stroke.tool === "eraser" ? "#FFFFFF" : stroke.color;
      ctx.lineWidth = stroke.thickness;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      ctx.stroke();
    }
  }, [strokes]);

  const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const [clientX, clientY] = "touches" in e ? [e.touches[0].clientX, e.touches[0].clientY] : [e.clientX, e.clientY];
    return { x: ((clientX - rect.left) / rect.width) * canvas.width, y: ((clientY - rect.top) / rect.height) * canvas.height };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    isDrawingRef.current = true;
    currentPointsRef.current = [getCanvasPoint(e)];
  }, [isDrawer, getCanvasPoint]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    e.preventDefault();
    isDrawingRef.current = true;
    currentPointsRef.current = [getCanvasPoint(e)];
  }, [isDrawer, getCanvasPoint]);

  const drawLive = useCallback((point: Point) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pts = currentPointsRef.current;
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = tool === "eraser" ? "#FFFFFF" : color;
    ctx.lineWidth = tool === "eraser" ? 24 : thickness;
    ctx.lineCap = "round";
    ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }, [color, thickness, tool]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawer || !isDrawingRef.current) return;
    const p = getCanvasPoint(e); currentPointsRef.current.push(p); drawLive(p);
  }, [isDrawer, getCanvasPoint, drawLive]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawer || !isDrawingRef.current) return;
    e.preventDefault();
    const p = getCanvasPoint(e); currentPointsRef.current.push(p); drawLive(p);
  }, [isDrawer, getCanvasPoint, drawLive]);

  const finishStroke = useCallback(() => {
    if (!isDrawer || !isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (currentPointsRef.current.length >= 2) {
      const stroke: Stroke = { points: currentPointsRef.current, color: tool === "eraser" ? "#FFFFFF" : color, thickness: tool === "eraser" ? 24 : thickness, tool };
      socket.emit("game:draw", stroke);
      useGameStore.getState().addStroke(stroke);
    }
    currentPointsRef.current = [];
  }, [isDrawer, color, thickness, tool, socket]);

  const handleUndo = () => { useGameStore.getState().undoStroke(); socket.emit("game:undo"); };
  const handleClear = () => { useGameStore.getState().clearStrokes(); socket.emit("game:clear-canvas"); };
  const handleGuess = (e: React.FormEvent) => { e.preventDefault(); if (!guess.trim()) return; socket.emit("game:guess", guess.trim()); setGuess(""); };
  const handleWordChoice = (word: string) => { socket.emit("game:word-choice", word); useGameStore.getState().setWordOptions([]); useGameStore.getState().setCurrentWord(word); };

  const hintChars = wordHint ? wordHint.split(" ") : [];
  const drawerName = room?.players.find((p) => p.id === room.currentDrawer)?.username || "...";
  const sortedPlayers = room?.players.slice().sort((a, b) => (scores[b.id] || b.score) - (scores[a.id] || a.score)) || [];
  const timerProgress = totalTime > 0 ? timeLeft / totalTime : 0;
  const timerColor = timeLeft <= 10 ? "#EF4444" : timeLeft <= 20 ? "#F59E0B" : "#22C55E";
  const timerPulse = timeLeft <= 5 && timeLeft > 0;
  const hasGuessed = guessedPlayers.includes(socket.id || "");

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 select-none overflow-hidden">
      {/* HEADER */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10 px-3 py-2 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2 min-w-[100px] lg:min-w-[140px]">
          <div className="bg-purple-500/20 text-purple-300 font-bold px-2.5 py-1 rounded-full text-xs lg:text-sm border border-purple-500/30 whitespace-nowrap">
            Round {room?.round || 0}/{room?.totalRounds || 0}
          </div>
        </div>

        <div className="flex flex-col items-center gap-0.5 min-w-0 mx-2">
          <div className="text-[10px] lg:text-xs text-purple-300 font-medium truncate">
            {isDrawer ? "Your turn to draw!" : `${drawerName} is drawing`}
          </div>
          <div className="flex items-center gap-0.5 lg:gap-1 flex-wrap justify-center">
            {isDrawer && currentWord ? (
              <span className="text-base lg:text-lg font-bold text-green-400 tracking-wider neon-text-subtle">{currentWord}</span>
            ) : (
              hintChars.map((char, i) => (
                <div key={i} className={`flex items-center justify-center font-bold text-sm lg:text-lg ${char === "" ? "w-2 lg:w-3" : "w-5 h-7 lg:w-6 lg:h-8 border-b-2 border-purple-400"} ${char !== "_" && char !== "" ? "text-cyan-400 neon-text-subtle" : "text-gray-400"}`}>
                  {char === "_" || char === "" ? "" : char}
                </div>
              ))
            )}
          </div>
        </div>

        <div className={`relative w-10 h-10 lg:w-12 lg:h-12 ${timerPulse ? "animate-pulse-glow" : ""}`}>
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.5" fill="none" stroke={timerColor} strokeWidth="3" strokeDasharray="97.4" strokeDashoffset={97.4 * (1 - timerProgress)} strokeLinecap="round" className="transition-all duration-1000 ease-linear" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-bold text-xs lg:text-sm" style={{ color: timerColor }}>{timeLeft}</span>
        </div>
      </div>

      {/* WORD CHOICE */}
      <AnimatePresence>
        {wordOptions.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card rounded-2xl p-6 lg:p-8 shadow-2xl max-w-lg mx-4">
              <h2 className="text-lg lg:text-xl font-bold mb-4 lg:mb-6 text-center text-white">Choose a word to draw</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                {wordOptions.map((word) => (
                  <motion.button key={word} onClick={() => handleWordChoice(word)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="btn-3d px-5 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-purple-500/30">
                    {word}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SCOREBOARD OVERLAY */}
      <AnimatePresence>
        {showScoreboard && currentWord && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 flex items-center justify-center z-40">
            <motion.div initial={{ scale: 0.5, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, opacity: 0 }}
              className="glass-card rounded-2xl p-6 shadow-2xl max-w-md w-full mx-4">
              <h2 className="text-center text-sm font-bold text-purple-300 mb-1">The word was</h2>
              <h3 className="text-center text-3xl font-black text-yellow-400 mb-5 neon-text-subtle">{currentWord}</h3>
              <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
                {sortedPlayers.map((player, index) => {
                  const origIdx = room?.players.findIndex((p) => p.id === player.id) || 0;
                  return (
                    <motion.div key={player.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-3 rounded-xl px-4 py-2.5 ${index === 0 ? "bg-yellow-500/10 border border-yellow-500/30" : "bg-white/5 border border-white/10"}`}>
                      <span className="text-sm font-bold text-gray-500 w-5 text-right">#{index + 1}</span>
                      <RobotAvatar index={origIdx} size={36} />
                      <span className="font-semibold text-white flex-1 truncate">{player.username}</span>
                      {guessedPlayers.includes(player.id) && player.id !== room?.currentDrawer && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">GUESSED</span>
                      )}
                      {player.id === room?.currentDrawer && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold">DREW</span>
                      )}
                      <span className="font-bold text-purple-300 text-lg">{scores[player.id] ?? player.score}</span>
                    </motion.div>
                  );
                })}
              </div>
              <motion.div className="text-center text-xs text-gray-500" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
                Next round starting soon...
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN AREA */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* LEFT: PLAYERS (desktop) */}
        <div className="hidden lg:flex w-56 bg-black/20 backdrop-blur-sm border-r border-white/10 flex-col shrink-0">
          <div className="px-3 py-2 border-b border-white/10">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Players ({room?.players.length || 0})</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sortedPlayers.map((player, index) => {
              const origIdx = room?.players.findIndex((p) => p.id === player.id) || 0;
              const isDrawing = player.id === room?.currentDrawer;
              const guessed = guessedPlayers.includes(player.id);
              return (
                <div key={player.id} className={`flex items-center gap-2 px-3 py-2 border-b border-white/5 transition-colors ${isDrawing ? "bg-yellow-500/10" : guessed ? "bg-green-500/10" : "hover:bg-white/5"}`}>
                  <span className="text-xs font-bold text-gray-600 w-4 text-right">#{index + 1}</span>
                  <RobotAvatar index={origIdx} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-semibold text-white truncate">{player.username}</p>
                      {isDrawing && <span className="text-yellow-400 text-xs">&#9998;</span>}
                      {guessed && !isDrawing && <span className="text-green-400 text-xs">&#10003;</span>}
                    </div>
                    <p className="text-xs text-purple-400 font-medium">{scores[player.id] ?? player.score} pts</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CENTER */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Mobile players */}
          <div className="lg:hidden flex gap-1 px-2 py-1.5 bg-black/20 border-b border-white/10 overflow-x-auto shrink-0">
            {sortedPlayers.map((player) => {
              const origIdx = room?.players.findIndex((p) => p.id === player.id) || 0;
              return (
                <div key={player.id} className={`flex items-center gap-1.5 px-2 py-1 rounded-full shrink-0 text-xs ${player.id === room?.currentDrawer ? "bg-yellow-500/20 border border-yellow-500/30" : guessedPlayers.includes(player.id) ? "bg-green-500/20 border border-green-500/30" : "bg-white/5 border border-white/10"}`}>
                  <RobotAvatar index={origIdx} size={20} />
                  <span className="font-semibold text-white max-w-[60px] truncate">{player.username}</span>
                  <span className="text-purple-300">{scores[player.id] ?? player.score}</span>
                </div>
              );
            })}
          </div>

          {/* Canvas */}
          <div className="flex-1 flex flex-col items-center justify-center p-2 lg:p-4 gap-2 lg:gap-3 min-h-0">
            <div className="relative w-full max-w-[800px] flex-1 max-h-[600px]" style={{ aspectRatio: "4/3" }}>
              <canvas ref={canvasRef} width={800} height={600}
                onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={finishStroke} onMouseLeave={finishStroke}
                onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={finishStroke}
                className={`w-full h-full bg-white rounded-lg shadow-xl shadow-purple-500/10 border-2 border-purple-500/20 ${isDrawer ? tool === "eraser" ? "cursor-cell" : "cursor-crosshair" : "cursor-default"}`}
              />
            </div>

            {/* Tools */}
            {isDrawer && (
              <div className="flex items-center gap-2 lg:gap-4 bg-black/30 backdrop-blur-sm rounded-xl border border-white/10 px-2 lg:px-4 py-1.5 lg:py-2 shrink-0 overflow-x-auto max-w-full">
                <div className="grid grid-cols-11 gap-0.5 lg:gap-1 shrink-0">
                  {COLOR_PALETTE.map((c, i) => (
                    <button key={i} onClick={() => { setColor(c); setTool("brush"); }}
                      className={`w-5 h-5 lg:w-6 lg:h-6 rounded-sm border transition-all ${color === c && tool === "brush" ? "border-white ring-2 ring-purple-400 scale-110" : "border-white/20 hover:scale-110"}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="w-px h-8 bg-white/10 shrink-0" />
                <div className="flex items-center gap-1.5 shrink-0">
                  {[2, 5, 10, 18].map((t) => (
                    <button key={t} onClick={() => { setThickness(t); setTool("brush"); }}
                      className={`rounded-full bg-white transition-all ${thickness === t && tool === "brush" ? "ring-2 ring-purple-400" : "hover:ring-2 hover:ring-white/30"}`}
                      style={{ width: Math.max(t * 1.5, 8), height: Math.max(t * 1.5, 8) }} />
                  ))}
                </div>
                <div className="w-px h-8 bg-white/10 shrink-0" />
                <div className="flex items-center gap-0.5 shrink-0">
                  <ToolBtn active={tool === "eraser"} onClick={() => setTool(tool === "eraser" ? "brush" : "eraser")} title="Eraser">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10M3.5 13.5l7-7a2.121 2.121 0 013 3l-7 7H3.5v-3z" />
                  </ToolBtn>
                  <ToolBtn onClick={handleUndo} title="Undo">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" />
                  </ToolBtn>
                  <ToolBtn onClick={handleClear} title="Clear" danger>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </ToolBtn>
                </div>
              </div>
            )}
            {!isDrawer && hasGuessed && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-green-500/20 text-green-400 font-semibold px-4 py-2 rounded-full text-sm border border-green-500/30 shrink-0">
                You guessed the word!
              </motion.div>
            )}
          </div>

          {/* Mobile chat */}
          <div className="lg:hidden shrink-0">
            <button onClick={() => setShowChat(!showChat)} className="w-full flex items-center justify-between px-3 py-2 bg-black/20 border-t border-white/10 text-sm font-medium text-purple-300">
              <span>Chat</span>
              {messages.length > 0 && <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">{messages.length}</span>}
              <svg className={`w-4 h-4 transition-transform ${showChat ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
            </button>
            {showChat && (
              <div className="h-48 bg-black/30 border-t border-white/10 flex flex-col">
                <div className="flex-1 overflow-y-auto">{messages.map((msg, i) => <ChatMsg key={msg.id} msg={msg} i={i} />)}<div ref={chatEndRef} /></div>
                {!isDrawer && !hasGuessed && <GuessInput guess={guess} setGuess={setGuess} onSubmit={handleGuess} />}
              </div>
            )}
            {!showChat && !isDrawer && !hasGuessed && <div className="bg-black/20 border-t border-white/10"><GuessInput guess={guess} setGuess={setGuess} onSubmit={handleGuess} /></div>}
          </div>
        </div>

        {/* RIGHT: CHAT (desktop) */}
        <div className="hidden lg:flex w-72 bg-black/20 backdrop-blur-sm border-l border-white/10 flex-col shrink-0">
          <div className="px-3 py-2 border-b border-white/10">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Chat</span>
          </div>
          <div className="flex-1 overflow-y-auto">{messages.map((msg, i) => <ChatMsg key={msg.id} msg={msg} i={i} />)}<div ref={chatEndRef} /></div>
          {!isDrawer && !hasGuessed && <GuessInput guess={guess} setGuess={setGuess} onSubmit={handleGuess} />}
        </div>
      </div>
    </div>
  );
}

function ChatMsg({ msg, i }: { msg: { id: string; text: string; username: string; isSystem?: boolean; isCorrect?: boolean }; i: number }) {
  return (
    <div className={`px-3 py-1.5 text-sm border-b border-white/5 ${msg.isCorrect ? "bg-green-500/10 text-green-400 font-semibold" : msg.isSystem ? "bg-white/5 text-gray-500 italic text-xs" : i % 2 === 0 ? "bg-transparent" : "bg-white/[0.02]"}`}>
      {!msg.isSystem && <span className="font-bold text-purple-300">{msg.username}: </span>}
      <span className={msg.isSystem ? "" : "text-gray-300"}>{msg.text}</span>
    </div>
  );
}

function GuessInput({ guess, setGuess, onSubmit }: { guess: string; setGuess: (v: string) => void; onSubmit: (e: React.FormEvent) => void }) {
  return (
    <form onSubmit={onSubmit} className="p-2 border-t border-white/10">
      <div className="flex gap-2">
        <input type="text" value={guess} onChange={(e) => setGuess(e.target.value)} placeholder="Type your guess..."
          maxLength={50} className="flex-1 px-3 py-2 bg-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm" autoFocus />
        <button type="submit" className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors text-sm font-medium active:scale-95">Send</button>
      </div>
    </form>
  );
}

function ToolBtn({ children, onClick, title, active, danger }: { children: React.ReactNode; onClick: () => void; title: string; active?: boolean; danger?: boolean }) {
  return (
    <button onClick={onClick} title={title}
      className={`p-1.5 lg:p-2 rounded-lg transition-all ${active ? "bg-purple-500/30 text-purple-300" : danger ? "hover:bg-red-500/20 text-gray-400 hover:text-red-400" : "hover:bg-white/10 text-gray-400 hover:text-white"}`}>
      <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">{children}</svg>
    </button>
  );
}
