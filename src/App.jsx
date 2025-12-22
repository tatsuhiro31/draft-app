import React, { useState, useEffect } from "react";
import TopScreen from "./TopScreen";
import MainScreen from "./MainScreen";
import SelectScreen from "./SelectScreen";
import Lottery from "./Lottery";

function DraftCompletePopup({ round, duplicates, draftResults, members, players, onProceedLottery, onClose }) {
  const duplicatePlayerCodes = Object.keys(duplicates || {});

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.7)",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 3000,
      }}
    >
      <div
        style={{
          backgroundColor: "#444",
          padding: 20,
          borderRadius: 10,
          width: 420,
          maxHeight: "80vh",
          overflowY: "auto",
          textAlign: "center",
        }}
      >
        <h2>{round}巡目の指名が完了しました！</h2>
        <p>以下の選手が競合しています</p>

        <ul style={{ textAlign: "left", maxHeight: "200px", overflowY: "auto", marginBottom: 15 }}>
          {duplicatePlayerCodes.map((playerCode) => {
            const player = players.find((p) => p["選手コード"] === playerCode);
            const playerName = player ? player["選手"] : "不明な選手";
            const membersList = duplicates[playerCode].join(", ");
            return (
              <li key={playerCode}>
                <p><strong>{playerName}</strong></p>
                <p>指名者: {membersList}</p>
              </li>
            );
          })}
        </ul>

        <button
          onClick={onProceedLottery}
          style={{ marginRight: 12, padding: "8px 16px", cursor: "pointer" }}
        >
          抽選に進む
        </button>
      </div>
    </div>
  );
}

function App() {
  const [screen, setScreen] = useState("top");
  const [members, setMembers] = useState([]);
  const [draftResults, setDraftResults] = useState({});
  const [currentPicker, setCurrentPicker] = useState({ member: "", round: 1 });
  const [duplicates, setDuplicates] = useState({});
  const [lotteryRound, setLotteryRound] = useState(null);
  const [showDraftCompletePopup, setShowDraftCompletePopup] = useState(false);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "playerdata.csv")
      .then(res => res.text())
      .then(text => {
        const rows = csvText.trim().split("\n");
        const headers = rows[0].split(",");
        const data = rows.slice(1).map((row) => {
          const values = row.split(",");
          const obj = {};
          headers.forEach((h, i) => {
            obj[h.trim()] = values[i].trim();
          });
          return obj;
        });
        setPlayers(data);
      })
      .catch((e) => {
        console.error("選手データ読み込み失敗:", e);
      });
  }, []);


  const handleRestoreDraft = (restoredDraftResults) => {
    setDraftResults(restoredDraftResults);
    setScreen("main");
  };

  const isAllDrafted = () => {
    if (members.length === 0) return false;

    const roundsSet = new Set();
    Object.values(draftResults).forEach((memberRounds) => {
      Object.keys(memberRounds).forEach((r) => roundsSet.add(r));
    });
    const rounds = Array.from(roundsSet);

    if (rounds.length === 0) return false;

    return rounds.every((round) =>
      members.every((member) => draftResults[member]?.[round] !== undefined)
    );
  };

  const findDuplicates = () => {
    const dup = {};
    const roundsSet = new Set();
    Object.values(draftResults).forEach((memberRounds) => {
      Object.keys(memberRounds).forEach((r) => roundsSet.add(r));
    });
    const rounds = Array.from(roundsSet);

    rounds.forEach((round) => {
      const playerToMembers = {};
      members.forEach((member) => {
        const playerCode = draftResults[member]?.[round];
        if (!playerCode) return;
        if (!playerToMembers[playerCode]) playerToMembers[playerCode] = [];
        playerToMembers[playerCode].push(member);
      });

      const dupPlayers = Object.entries(playerToMembers)
        .filter(([_, ms]) => ms.length > 1)
        .reduce((acc, [pc, ms]) => {
          acc[pc] = ms;
          return acc;
        }, {});

      if (Object.keys(dupPlayers).length > 0) {
        dup[round] = dupPlayers;
      }
    });

    return dup;
  };

  function DuplicateConfirmPopup({ playerName, onConfirm, onCancel }) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0, left: 0,
          width: "100vw", height: "100vh",
          backgroundColor: "rgba(0,0,0,0.7)",
          color: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 4000,
        }}
      >
        <div
          style={{
            backgroundColor: "#444",
            padding: 20,
            borderRadius: 10,
            width: 360,
            textAlign: "center",
          }}
        >
          <p>{playerName} は既に前の巡目で指名されています。<br />指名を続けますか？</p>
          <button onClick={onConfirm} style={{ marginRight: 12, padding: "8px 16px" }}>重複して指名する</button>
          <button onClick={onCancel} style={{ padding: "8px 16px" }}>キャンセル</button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (isAllDrafted()) {
      const dup = findDuplicates();
      setDuplicates(dup);
      const dupRounds = Object.keys(dup);
      if (dupRounds.length > 0) {
        setLotteryRound(Number(dupRounds[0]));
        setShowDraftCompletePopup(true);
      } else {
        setShowDraftCompletePopup(false);
        setLotteryRound(null);
      }
    } else {
      setShowDraftCompletePopup(false);
      setLotteryRound(null);
    }
  }, [draftResults, members]);

  const onProceedLottery = () => {
    setShowDraftCompletePopup(false);
    setScreen("lottery");
  };

  const onClosePopup = () => {
    setShowDraftCompletePopup(false);
    setLotteryRound(null);
  };

  const startDraft = (enteredMembers) => {
    setMembers(enteredMembers);
    setDraftResults({});
    setDuplicates({});
    setLotteryRound(null);
    setShowDraftCompletePopup(false);
    setScreen("main");
  };

  const backToTop = () => {
    if (window.confirm("トップに戻ると指名データが破棄されます。トップに戻りますか？")) {
      setDuplicates({});
      setLotteryRound(null);
      setDraftResults({});
      setMembers([]);
      setScreen("top");
    }
  };

  const goToSelect = (member = "", round = 1) => {
    setCurrentPicker({ member, round });
    setScreen("select");
  };

  const handleSelectPlayer = (member, playerCode, round) => {
    setDraftResults((prev) => {
      const memberRounds = prev[member] || {};
      return {
        ...prev,
        [member]: {
          ...memberRounds,
          [round]: playerCode,
        },
      };
    });
    setScreen("main");
  };

  const handleLotteryComplete = (round, playerCode, winner) => {
    setDraftResults((prev) => {
      const newResults = { ...prev };
      const dupMembers = duplicates[round][playerCode];

      dupMembers.forEach((member) => {
        if (member === winner) return;
        if (newResults[member]) {
          const { [round]: removed, ...restRounds } = newResults[member];
          newResults[member] = restRounds;
        }
      });

      return newResults;
    });

    setDuplicates({});
    setLotteryRound(null);
    setScreen("main");
  };

  return (
    <>
      {screen === "top" && <TopScreen onStart={startDraft} />}

      {screen === "main" && (
        <MainScreen
          members={members}
          draftResults={draftResults}
          onBackToTop={backToTop}
          onSelectPlayer={goToSelect}
          currentPicker={currentPicker}
          players={players}
          onRestoreDraft={handleRestoreDraft}  // ← ここで渡す
        />
      )}

      {screen === "select" && (
        <SelectScreen
          members={members}
          onSelectPlayer={handleSelectPlayer}
          currentPicker={currentPicker}
          players={players}
          onCancel={() => setScreen("main")}
        />
      )}

      {screen === "lottery" && lotteryRound !== null && duplicates[lotteryRound] && (
        <Lottery
          round={lotteryRound}
          duplicates={duplicates[lotteryRound]}
          draftResults={draftResults}
          members={members}
          players={players}
          onClose={() => setScreen("main")}
          onResult={handleLotteryComplete}
        />
      )}

      {showDraftCompletePopup && lotteryRound !== null && duplicates[lotteryRound] && (
        <DraftCompletePopup
          round={lotteryRound}
          duplicates={duplicates[lotteryRound]}
          draftResults={draftResults}
          members={members}
          players={players}
          onProceedLottery={onProceedLottery}
          onClose={onClosePopup}
        />
      )}
    </>
  );
}

export default App;
