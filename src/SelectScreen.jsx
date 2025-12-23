// SelectScreen.jsx
import React, { useState, useEffect } from "react";
import Papa from "papaparse";

function SelectScreen({ onSelectPlayer, currentPicker, onCancel }) {
  const [players, setPlayers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("全て");
  const [selectedPosition, setSelectedPosition] = useState("全て");
  const [confirmPlayer, setConfirmPlayer] = useState(null);

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "playerdata.csv")
      .then(res => res.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.replace(/\uFEFF/g, "").trim(),
          complete: (result) => {
            setPlayers(result.data);
          },
        });
      });
  }, []);

  const teams = ["全て", ...new Set(players.map((p) => p["チーム"]))];
  const positions = ["全て", ...new Set(players.map((p) => p["ポジション"]))];

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
    if (confirmPlayer) {
      onSelectPlayer(currentPicker.member, confirmPlayer["選手コード"], currentPicker.round);
    }
  };

  return (
    <div>
      <h1>みんなでドラフト会議</h1>

      <p>
        現在の指名者: {member} さん / {round}巡目
      </p>

      <div style={{ marginBottom: 20 }}>
        <label>
          球団で絞り込み：
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>
          ポジション：
          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            {positions.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </select>
        </label>
        <div style={{ marginTop: 10 }}>
          <button
            onClick={onCancel}
            style={{
              padding: "6px 12px",
              backgroundColor: "#aaa",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            選手選択をキャンセルして戻る
          </button>
        </div>
      </div>

      <ul>
        {players
          .filter(
            (player) =>
              (selectedTeam === "全て" || player["チーム"] === selectedTeam) &&
              (selectedPosition === "全て" || player["ポジション"] === selectedPosition)
          )
          .map((player) => (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "12px",
                marginTop: 20,
              }}
            >
              {players
                .filter(
                  (player) =>
                    (selectedTeam === "全て" || player["チーム"] === selectedTeam) &&
                    (selectedPosition === "全て" || player["ポジション"] === selectedPosition)
                )
                .map((player) => (
                  <div
                    key={player["選手コード"]}
                    style={{
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                      padding: "12px",
                      backgroundColor: "#fff",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      height: "140px",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "bold", fontSize: "1.1em", marginBottom: 6 }}>
                        {player["選手"]}
                      </div>
                      <div style={{ marginBottom: 4 }}>
                        チーム: {player["チーム"]}
                      </div>
                      <div style={{ marginBottom: 4 }}>
                        ポジション: <PositionLogo position={player["ポジション"]} />
                      </div>
                      <div style={{ marginBottom: 4 }}>
                        年齢: {player["年齢"]}歳
                      </div>
                      <div>
                        年俸: {formatSalary(player["年俸"])}
                      </div>
                    </div>

                    <button
                      onClick={() => setConfirmPlayer(player)}
                      style={{
                        marginTop: "auto",
                        padding: "6px 12px",
                        backgroundColor: "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      選択
                    </button>
                  </div>
                ))}
            </div>

          ))}
      </ul>

      {confirmPlayer && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#c71515ff",
              padding: "20px",
              borderRadius: "8px",
              minWidth: "300px",
              color: "white",
            }}
          >
            <h3>以下の選手を指名します</h3>
            <p>選手名：{confirmPlayer["選手"]}</p>
            <p>チーム：{confirmPlayer["チーム"]}</p>
            <p>ポジション：{confirmPlayer["ポジション"]}</p>
            <p>年齢：{confirmPlayer["年齢"]}歳</p>
            <p>年俸：{formatSalary(confirmPlayer["年俸"])}</p>

            <div style={{ marginTop: "15px", textAlign: "right" }}>
              <button onClick={confirmSelection} style={{ padding: "6px 12px" }}>
                指名確定
              </button>
              <button
                style={{ marginLeft: "10px", padding: "6px 12px" }}
                onClick={() => setConfirmPlayer(null)}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* キャンセルボタン */}
      <div style={{ marginTop: 20, textAlign: "center" }}>
        <button
          onClick={onCancel}
          style={{
            padding: "8px 16px",
            backgroundColor: "#aaa",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          選手選択をキャンセルして戻る
        </button>
      </div>
    </div>
  );
}

export default SelectScreen;
