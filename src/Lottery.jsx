import React from "react";

function Lottery({ round, duplicates, draftResults, members, players, onClose, onResult }) {
  const [winner, setWinner] = React.useState(null);

  if (!duplicates || Object.keys(duplicates).length === 0) {
    return (
      <div style={{ color: "red", padding: 20 }}>
        エラー: 抽選対象の選手コードがありません。
        <button onClick={onClose}>閉じる</button>
      </div>
    );
  }

  // duplicatesは { playerCode: [member, member, ...] } の形
  const playerCodes = Object.keys(duplicates);
  const playerCode = playerCodes[0]; // 今回は1件ずつ処理する想定

  const conflictingMembers = duplicates[playerCode] || [];

  const player = players.find((p) => p && p["選手コード"] === playerCode);

  if (!player) {
    return (
      <div style={{ color: "red", padding: 20 }}>
        エラー: 選手データが見つかりません（選手コード: {playerCode}）。
        <button onClick={onClose}>閉じる</button>
      </div>
    );
  }

  const doLottery = () => {
    if (conflictingMembers.length === 0) return;
    const winnerIndex = Math.floor(Math.random() * conflictingMembers.length);
    setWinner(conflictingMembers[winnerIndex]);
  };

  const handleConfirm = () => {
    if (!winner) return;
    onResult(round, playerCode, winner);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.8)",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
      }}
    >
      <div
        style={{
          backgroundColor: "#222",
          padding: 20,
          borderRadius: 10,
          width: 400,
          textAlign: "center",
        }}
      >
        <h2>{player["選手"]}選手の抽選を行います</h2>
        {!winner ? (
          <>
            <p>抽選対象者:</p>
            <ul>
              {conflictingMembers.length > 0 ? (
                conflictingMembers.map((m) => <li key={m}>{m}</li>)
              ) : (
                <li>抽選対象者がいません</li>
              )}
            </ul>
            <button
              onClick={doLottery}
              style={{ marginTop: 10, padding: "8px 12px" }}
              disabled={conflictingMembers.length === 0}
            >
              抽選する
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: "24px", color: "yellow", fontWeight: "bold" }}>{winner}</p>
            <p>が交渉権を獲得しました！</p>
            <button onClick={handleConfirm} style={{ marginTop: 10, padding: "8px 12px" }}>
              確定
            </button>
          </>
        )}
      </div>
    </div>
  );
}
export default Lottery;

