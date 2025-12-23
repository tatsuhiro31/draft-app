import React, { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";

/* =========================
   ポジションロゴ表示
========================= */
function PositionLogo({ position }) {
  const colorMap = {
    投手: "#ffcccc",
    捕手: "#ccffcc",
    内野手: "#ccccff",
    外野手: "#ffffcc",
  };

  const shortMap = {
    投手: "投",
    捕手: "捕",
    内野手: "内",
    外野手: "外",
  };

  return (
    <span
      style={{
        display: "inline-block",
        backgroundColor: colorMap[position] || "#eee",
        border: "1px solid #999",
        borderRadius: 4,
        padding: "2px 6px",
        fontWeight: "bold",
        minWidth: 24,
        textAlign: "center",
      }}
      title={position}
    >
      {shortMap[position] || position}
    </span>
  );
}

/* =========================
   メインコンポーネント
========================= */
function SelectScreen({ onSelectPlayer, currentPicker, onCancel }) {
  const [players, setPlayers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("全て");
  const [selectedPosition, setSelectedPosition] = useState("全て");
  const [confirmPlayer, setConfirmPlayer] = useState(null);

  /* CSV読み込み */
  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "playerdata.csv")
      .then((res) => res.text())
      .then((csvText) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h) => h.replace(/\uFEFF/g, "").trim(),
          complete: (result) => setPlayers(result.data),
        });
      });
  }, []);

  /* 絞り込み用 */
  const teams = useMemo(
    () => ["全て", ...new Set(players.map((p) => p["チーム"]))],
    [players]
  );
  const positions = useMemo(
    () => ["全て", ...new Set(players.map((p) => p["ポジション"]))],
    [players]
  );

  const { member, round } = currentPicker;

  const formatSalary = (salary) => {
    const amount = Number(salary);
    if (isNaN(amount)) return "";
    if (amount >= 10000) {
      const oku = Math.floor(amount / 10000);
      const man = amount % 10000;
      return man === 0 ? `${oku}億円` : `${oku}億${man}万円`;
    }
    return `${amount}万円`;
  };

  const confirmSelection = () => {
    if (!confirmPlayer) return;
    onSelectPlayer(member, confirmPlayer["選手コード"], round);
    setConfirmPlayer(null);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>みんなでドラフト会議</h1>
      <p>
        現在の指名者：{member} さん ／ {round}巡目
      </p>

      {/* 絞り込み */}
      <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
        <label>
          球団：
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            {teams.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>

        <label>
          ポジション：
          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
          >
            {positions.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
      </div>

      {/* ===== 格子状表示 ===== */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 12,
        }}
      >
        {players
          .filter(
            (p) =>
              (selectedTeam === "全て" || p["チーム"] === selectedTeam) &&
              (selectedPosition === "全て" ||
                p["ポジション"] === selectedPosition)
          )
          .map((player) => (
            <div
              key={player["選手コード"]}
              style={{
                border: "1px solid #ccc",
                borderRadius: 8,
                padding: 12,
                backgroundColor: "#fff",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ fontWeight: "bold", fontSize: "1.1em" }}>
                {player["選手"]}
              </div>

              <div>チーム：{player["チーム"]}</div>
              <div>
                ポジション：{" "}
                <PositionLogo position={player["ポジション"]} />
              </div>
              <div>年齢：{player["年齢"]}歳</div>
              <div>年俸：{formatSalary(player["年俸"])}</div>

              <button
                style={{ marginTop: "auto" }}
                onClick={() => setConfirmPlayer(player)}
              >
                選択
              </button>
            </div>
          ))}
      </div>

      {/* ===== 確認モーダル ===== */}
      {confirmPlayer && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "#c71515",
              color: "white",
              padding: 20,
              borderRadius: 8,
              minWidth: 300,
            }}
          >
            <h3>この選手を指名します</h3>
            <p>選手名：{confirmPlayer["選手"]}</p>
            <p>チーム：{confirmPlayer["チーム"]}</p>
            <p>
              ポジション：{" "}
              <PositionLogo position={confirmPlayer["ポジション"]} />
            </p>
            <p>年齢：{confirmPlayer["年齢"]}歳</p>
            <p>年俸：{formatSalary(confirmPlayer["年俸"])}</p>

            <div style={{ textAlign: "right" }}>
              <button onClick={confirmSelection}>指名確定</button>
              <button onClick={() => setConfirmPlayer(null)}>キャンセル</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <button onClick={onCancel}>戻る</button>
      </div>
    </div>
  );
}

export default SelectScreen;
