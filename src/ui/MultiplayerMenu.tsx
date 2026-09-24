import React, { useState, useEffect } from 'react';
import { translations, Language } from '../localization/strings';
import { networkManager, LobbyInfo } from '../network/NetworkManager';
import { Difficulty, EscapeRule, PlayerData } from '../types/game';

interface MultiplayerMenuProps {
  lang: Language;
  onBack: () => void;
  onStartMatch: (isHost: boolean, difficulty: Difficulty, escapeRule: EscapeRule) => void;
}

export const MultiplayerMenu: React.FC<MultiplayerMenuProps> = ({ lang, onBack, onStartMatch }) => {
  const t = translations[lang];

  const [subView, setSubView] = useState<'SELECT' | 'HOST_CONFIG' | 'JOIN_SCAN' | 'LOBBY'>('SELECT');
  const [playerName, setPlayerName] = useState<string>('Survivor_' + Math.floor(Math.random() * 900 + 100));
  const [roomId, setRoomId] = useState<string>('DARK');
  const [maxPlayers, setMaxPlayers] = useState<number>(4);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [escapeRule, setEscapeRule] = useState<EscapeRule>('all');

  const [discoveredLobbies, setDiscoveredLobbies] = useState<LobbyInfo[]>([]);
  const [lobbyPlayers, setLobbyPlayers] = useState<PlayerData[]>([]);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    networkManager.onLobbyUpdate = (players) => {
      setLobbyPlayers(players);
    };

    networkManager.onGameStart = () => {
      // Client starts game on host trigger
      onStartMatch(false, difficulty, escapeRule);
    };
  }, [difficulty, escapeRule, onStartMatch]);

  // Host creates game
  const handleHostCreate = () => {
    networkManager.startHosting(playerName, roomId, maxPlayers, difficulty, escapeRule);
    setSubView('LOBBY');
  };

  // Join by direct code or discovered lobby
  const handleJoinLobby = (targetRoomId: string) => {
    networkManager.joinGame(playerName, targetRoomId);
    setSubView('LOBBY');
  };

  // Start Discovery scan
  const handleStartScan = () => {
    setSubView('JOIN_SCAN');
    networkManager.startDiscovery((lobbies) => {
      setDiscoveredLobbies([...lobbies]);
    });
  };

  // Host starts the escape match
  const handleHostStart = () => {
    onStartMatch(true, difficulty, escapeRule);
  };

  return (
    <div className="relative w-full h-full flex flex-col p-6 bg-zinc-950 text-white select-none overflow-y-auto">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-zinc-950 to-black pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between z-10 mb-6">
        <button
          onClick={() => {
            if (subView === 'LOBBY' || subView === 'HOST_CONFIG' || subView === 'JOIN_SCAN') {
              networkManager.leave();
              setSubView('SELECT');
            } else {
              onBack();
            }
          }}
          className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 font-bold text-xs hover:border-zinc-500 active:scale-95 transition-all"
        >
          ← {subView === 'SELECT' ? t.exit : 'BACK'}
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-mono text-zinc-400">LAN P2P ENGINE READY</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full z-10">
        {/* VIEW 1: SELECT (Host or Join) */}
        {subView === 'SELECT' && (
          <div className="w-full flex flex-col gap-5 bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-2xl font-black tracking-wider text-center text-red-500 uppercase font-serif">
              {t.localMultiplayer}
            </h2>

            {/* Player Name Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t.playerName}</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                maxLength={16}
                className="px-4 py-2.5 bg-black/60 border border-zinc-700 rounded-xl text-white font-semibold text-sm focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <button
                onClick={() => setSubView('HOST_CONFIG')}
                className="py-5 px-6 rounded-xl bg-gradient-to-br from-red-950 via-zinc-900 to-black border-2 border-red-600/70 hover:border-red-500 text-white font-bold text-sm tracking-wider uppercase shadow-xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <span className="text-2xl">👑</span>
                <span>{t.hostGame}</span>
                <span className="text-[10px] text-zinc-400 font-normal">Authorize AI & Map</span>
              </button>

              <button
                onClick={handleStartScan}
                className="py-5 px-6 rounded-xl bg-zinc-900/90 border-2 border-zinc-700 hover:border-blue-500 text-white font-bold text-sm tracking-wider uppercase shadow-xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <span className="text-2xl">📡</span>
                <span>{t.joinGame}</span>
                <span className="text-[10px] text-zinc-400 font-normal">Connect via Wi-Fi</span>
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: HOST CONFIGURATION */}
        {subView === 'HOST_CONFIG' && (
          <div className="w-full flex flex-col gap-4 bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold tracking-wider text-red-500 uppercase font-serif">
              {t.hostGame}
            </h2>

            {/* Room Code */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-zinc-400">{t.roomCode}</label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                maxLength={8}
                className="px-4 py-2 bg-black/60 border border-zinc-700 rounded-xl text-amber-400 font-mono font-bold text-base focus:outline-none focus:border-red-500"
              />
            </div>

            {/* Max Players */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-zinc-400">{t.maxPlayers}: {maxPlayers}</label>
              <div className="flex gap-2">
                {[2, 3, 4].map(num => (
                  <button
                    key={num}
                    onClick={() => setMaxPlayers(num)}
                    className={`flex-1 py-2 rounded-lg font-bold text-xs border ${
                      maxPlayers === num ? 'bg-red-900/80 border-red-500 text-white' : 'bg-black/40 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {num} PLAYERS
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-zinc-400">{t.difficulty}</label>
              <div className="grid grid-cols-2 gap-2">
                {(['easy', 'normal', 'hard', 'nightmare'] as Difficulty[]).map(diff => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`py-2 px-3 rounded-lg font-bold text-xs border ${
                      difficulty === diff ? 'bg-red-950 border-red-500 text-white' : 'bg-black/40 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {t[diff]}
                  </button>
                ))}
              </div>
            </div>

            {/* Escape Rule */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-zinc-400">{t.escapeRule}</label>
              <div className="flex flex-col gap-1.5">
                {[
                  { rule: 'all', text: t.ruleAll },
                  { rule: 'any', text: t.ruleAny },
                  { rule: 'majority', text: t.ruleMajority },
                ].map(item => (
                  <button
                    key={item.rule}
                    onClick={() => setEscapeRule(item.rule as EscapeRule)}
                    className={`py-2 px-3 rounded-lg text-left text-xs font-medium border ${
                      escapeRule === item.rule ? 'bg-red-950/60 border-red-500 text-red-200' : 'bg-black/30 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {item.text}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleHostCreate}
              className="mt-3 w-full py-3.5 rounded-xl bg-gradient-to-r from-red-800 to-red-950 border border-red-500 text-white font-bold text-sm tracking-wider uppercase shadow-xl active:scale-95 transition-all"
            >
              CREATE LAN LOBBY
            </button>
          </div>
        )}

        {/* VIEW 3: JOIN SCANNER */}
        {subView === 'JOIN_SCAN' && (
          <div className="w-full flex flex-col gap-4 bg-zinc-900/70 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold tracking-wider text-blue-400 uppercase font-serif flex items-center justify-between">
              <span>{t.joinGame}</span>
              <span className="text-xs font-mono text-zinc-400 animate-pulse">SCANNING...</span>
            </h2>

            {/* Direct Connect Box */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t.enterCodeOrIp}
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-2 bg-black/60 border border-zinc-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => handleJoinLobby(roomId)}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase active:scale-95 shadow-md"
              >
                {t.connect}
              </button>
            </div>

            {/* Discovered Lobbies List */}
            <div className="flex flex-col gap-2 mt-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t.availableLobbies}</span>
              {discoveredLobbies.length === 0 ? (
                <div className="p-4 bg-black/40 border border-dashed border-zinc-800 rounded-xl text-center text-xs text-zinc-500">
                  {t.noHostsFound}
                </div>
              ) : (
                discoveredLobbies.map(lobby => (
                  <div
                    key={lobby.roomId}
                    className="p-3.5 bg-black/60 border border-zinc-800 rounded-xl flex items-center justify-between hover:border-zinc-600"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-zinc-200">{lobby.hostName}&apos;s Manor</span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        ROOM: {lobby.roomId} • {lobby.playerCount}/{lobby.maxPlayers} PLAYERS • {lobby.difficulty.toUpperCase()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleJoinLobby(lobby.roomId)}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase active:scale-95"
                    >
                      JOIN
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* VIEW 4: ACTIVE LOBBY ROOM */}
        {subView === 'LOBBY' && (
          <div className="w-full flex flex-col gap-5 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            {/* Lobby Banner */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{t.lobbyTitle}</span>
                <h3 className="text-2xl font-black text-amber-400 font-mono">CODE: {roomId}</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-zinc-400">
                  {lobbyPlayers.length}/{maxPlayers} {t.playersConnected}
                </span>
              </div>
            </div>

            {/* Players List */}
            <div className="flex flex-col gap-2">
              {lobbyPlayers.map((player) => (
                <div
                  key={player.id}
                  className="px-4 py-3 bg-black/50 border border-zinc-800 rounded-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: player.color || '#457b9d' }}
                    />
                    <span className="font-bold text-sm text-zinc-200">
                      {player.name} {player.isHost ? '👑 (Host)' : ''}
                    </span>
                  </div>

                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      player.isReady
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    {player.isReady ? t.ready : t.notReady}
                  </span>
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-3 mt-3">
              {networkManager.isHost ? (
                <button
                  onClick={handleHostStart}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-red-700 to-red-950 border border-red-500 text-white font-bold text-sm tracking-wider uppercase shadow-xl active:scale-95 transition-all"
                >
                  {t.startGame}
                </button>
              ) : (
                <button
                  onClick={() => {
                    const nextReady = !isReady;
                    setIsReady(nextReady);
                    networkManager.sendPacket({
                      type: 'LOBBY_UPDATE',
                      senderId: networkManager.localPlayerId,
                      timestamp: Date.now(),
                      payload: {
                        action: 'TOGGLE_READY',
                        player: { ...networkManager.players.get(networkManager.localPlayerId), isReady: nextReady }
                      }
                    });
                  }}
                  className={`flex-1 py-3.5 rounded-xl font-bold text-sm tracking-wider uppercase shadow-xl active:scale-95 transition-all border ${
                    isReady
                      ? 'bg-emerald-800 border-emerald-500 text-white'
                      : 'bg-zinc-800 border-zinc-600 text-zinc-300'
                  }`}
                >
                  {isReady ? t.ready : t.notReady}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
