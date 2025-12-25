import React, { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";

const draftId = localStorage.getItem("draftId");
const GAS_URL = "https://script.google.com/macros/s/AKfycbzyFokrUyLaxu3Oo1QP0Z8HBCgAX7X4Z_T0cynncKhofayP-4bHM1VE730HlVG5kJh9/exec";

/* =========================
   ポジションロゴ
========================= */
function PositionLogo({ position }) {
  const colorMap = {
    投手: "#ffcccc",
    捕手: "#ccccff",
    内野手: "#ffffcc",
    外野手: "#ccffcc",
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
   テーブル用スタイル
========================= */
const thStyle = {
  border: "1px solid #ccc",
  padding: "8px",
  backgroundColor: "#f0f0f0",
  textAlign: "center",
};

const tdStyle = {
  border: "1px solid #ccc",
  padding: "6px 8px",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};


/* =========================
   メイン画面
========================= */
function SelectScreen({ onSelectPlayer, currentPicker, onCancel }) {
  const [players, setPlayers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("全て");
  const [selectedPosition, setSelectedPosition] = useState("全て");
  const [confirmPlayer, setConfirmPlayer] = useState(null);

  // リロード確認
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

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

  /* 絞り込み候補 */
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
    const num = Number(String(salary).replace(/[^\d]/g, ""));
    if (isNaN(num)) return "";
    if (num >= 10000) {
      const oku = Math.floor(num / 10000);
      const man = num % 10000;
      return man === 0 ? `${oku}億円` : `${oku}億${man}万円`;
    }
    return `${num}万円`;
  };

const confirmSelection = async () => {
  await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "savePick",
      draftId,
      round: round,           // currentPicker からの round
      member: member,         // currentPicker からの member
      playerCode: confirmPlayer["選手コード"],  // confirmPlayerから取得
    }),
  });
  setConfirmPlayer(null);
};


  const viewMode = localStorage.getItem("viewMode") || "vertical";
  const isVertical = viewMode === "vertical";

  return (
    <div style={{ padding: 20 }}>
      <h1>みんなでドラフト会議</h1>
      <p>
        現在の指名者：{member} さん ／ {round}巡目
      </p>

      {/* 絞り込み */}
      <div
        style={{
          border: "2px solid #000",
          borderRadius: 8,
          padding: 16,
          marginBottom: 20,
          backgroundColor: "#f5faff",
        }}
      >
        <div
          style={{
            fontWeight: "bold",
            marginBottom: 12,
            fontSize: 16,
          }}
        >
          🔍 絞り込み条件
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontWeight: "bold" }}>球団</span>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              style={{
                padding: "6px 8px",
                borderRadius: 4,
                border: "1px solid #666",
              }}
            >
              {teams.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontWeight: "bold" }}>ポジション</span>
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              style={{
                padding: "6px 8px",
                borderRadius: 4,
                border: "1px solid #666",
              }}
            >
              {positions.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
        </div>
      </div>
      {isVertical && <div>
        <p >縦表示の場合は、球団、年齢、年俸が表示されません。</p>
        <p >これらを確認したい場合は、一度選択ボタンを押下してください。</p>
      </div>}
      <div style={{ marginTop: 20 }}>
        <button onClick={onCancel}>戻る</button>
      </div>
      {/* ===== 選手一覧（表形式） ===== */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}></th>
            <th style={thStyle}>選手名</th>
            <th style={thStyle}>守備</th>
            {!isVertical && <th style={thStyle}>球団</th>}
            {!isVertical && <th style={thStyle}>年齢</th>}
            {!isVertical && <th style={thStyle}>年俸</th>}
          </tr>
        </thead>
        <tbody>
          {players
            .filter(
              (p) =>
                (selectedTeam === "全て" || p["チーム"] === selectedTeam) &&
                (selectedPosition === "全て" ||
                  p["ポジション"] === selectedPosition)
            )
            .map((player) => (
              <tr key={player["選手コード"]}>
                <td style={tdStyle}>
                  <button onClick={() => setConfirmPlayer(player)}>
                    選択
                  </button>
                </td>
                <td style={tdStyle}>
                  <span className="player-name">
                    {player["選手"]}
                  </span>
                </td>
                <td style={tdStyle}>
                  <PositionLogo position={player["ポジション"]} />
                </td>
                {!isVertical && <td style={tdStyle}>{player["チーム"]}</td>}
                {!isVertical && <td style={tdStyle}>{player["年齢"]}歳</td>}
                {!isVertical && <td style={tdStyle}>
                  {formatSalary(player["年俸"])}
                </td>}
              </tr>
            ))}
        </tbody>
      </table>

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
              backgroundColor: "#bad47cff",
              color: "black",
              padding: 20,
              borderRadius: 8,
              minWidth: 300,
              border: "2px solid #000",
            }}

          >
            <h3>この選手を指名します</h3>
            <p>選手名：{confirmPlayer["選手"]}</p>
            <p>球団：{confirmPlayer["チーム"]}</p>
            <p>
              守備：
              <PositionLogo
                position={confirmPlayer["ポジション"]}
              />
            </p>
            <p>年齢：{confirmPlayer["年齢"]}歳</p>
            <p>年俸：{formatSalary(confirmPlayer["年俸"])}</p>

            <div style={{ textAlign: "right" }}>
              <button
                onClick={confirmSelection}
                style={{
                  border: "2px solid #000",
                  backgroundColor: "#fff",
                  color: "#000",
                  borderRadius: "6px",
                  padding: "8px 16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                指名確定
              </button>

              <button onClick={() => setConfirmPlayer(null)}>
                キャンセル
              </button>
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
