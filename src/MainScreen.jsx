import React, { useState, useEffect } from "react";

const GAS_URL = "https://script.google.com/macros/s/AKfycbzIYVVM_HzT0Rcbg-C-LseGN83csdUTUFgofF4VLXg8g05oV5hkwmrm_5PMGVHPqa8f/exec";

async function fetchPicks(draftId) {
    const res = await fetch(GAS_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            type: "getPicks",
            draftId: draftId,
        }),
    });

    return await res.json();
}

function convertToDraftResults(picks) {
    const results = {};

    picks.forEach((p) => {
        if (!results[p.member]) {
            results[p.member] = {};
        }
        results[p.member][p.round] = p.playerCode;
    });

    return results;
}

function Lottery({ round, playerCode, draftResults, members, players, onClose, onResult }) {
    const [winner, setWinner] = useState(null);

    const conflictingMembers = members.filter((m) => (draftResults[m] || {})[round] === playerCode);
    const player = players.find((p) => p["選手コード"] === playerCode);

    const doLottery = () => {
        const winnerIndex = Math.floor(Math.random() * conflictingMembers.length);
        setWinner(conflictingMembers[winnerIndex]);
    };

    const handleConfirm = () => {
        const losers = conflictingMembers.filter((m) => m !== winner);
        onResult(winner, playerCode, round, losers);
        onClose();
    };

    return (
        <div
            style={{
                position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
                backgroundColor: "rgba(0,0,0,0.8)", color: "white",
                display: "flex", justifyContent: "center", alignItems: "center",
                zIndex: 2000,
            }}
        >
            <div style={{ backgroundColor: "#222", padding: 20, borderRadius: 10, width: 400, textAlign: "center" }}>
                <h2>{round}巡目の抽選</h2>
                <p>選手: {player ? player["選手"] : "不明"}</p>
                <p>球団: {player ? player["チーム"] : "-"}</p>

                {!winner ? (
                    <>
                        <p>抽選対象者:</p>
                        <ul>
                            {conflictingMembers.map((m) => (
                                <li key={m}>{m}</li>
                            ))}
                        </ul>
                        <button onClick={doLottery} style={{ marginTop: 10, padding: "8px 12px" }}>抽選する</button>
                    </>
                ) : (
                    <>
                        <p>当選者: {winner}</p>
                        <button onClick={handleConfirm} style={{ marginTop: 10, padding: "8px 12px" }}>確定</button>
                    </>
                )}

                <button onClick={onClose} style={{ marginTop: 10, padding: "8px 12px", backgroundColor: "#555" }}>
                    キャンセル
                </button>
            </div>
        </div>
    );
}

function getMaxFullyDraftedRound(members, draftResults, maxRound) {
    for (let round = maxRound; round >= 1; round--) {
        const allDrafted = members.every((member) => {
            const memberResults = draftResults[member] || {};
            return memberResults[round] !== undefined && memberResults[round] !== null && memberResults[round] !== "";
        });
        if (allDrafted) {
            return round;
        }
    }
    return 0;
}

function DraftSummary({ member, draftResults, players, maxRound }) {
    // このユーザーの指名結果
    const memberResults = draftResults[member] || {};

    // ★ 全員の指名が完了している maxRound までの選手だけ集計
    const selectedPlayers = Object.entries(memberResults)
        .filter(([round, code]) =>
            Number(round) <= maxRound &&
            code !== undefined &&
            code !== null &&
            code !== ""
        )
        .map(([_, code]) =>
            players.find((p) => p["選手コード"] === code)
        )
        .filter(Boolean);

    const totalCount = selectedPlayers.length;
    const pitcherCount = selectedPlayers.filter((p) => p["ポジション"] === "投手").length;
    const catcherCount = selectedPlayers.filter((p) => p["ポジション"] === "捕手").length;
    const infielderCount = selectedPlayers.filter((p) => p["ポジション"] === "内野手").length;
    const outfielderCount = selectedPlayers.filter((p) => p["ポジション"] === "外野手").length;
    const fielderCount = totalCount - pitcherCount;

    const teamCount = new Set(selectedPlayers.map((p) => p["チーム"])).size;

    const totalSalary = selectedPlayers.reduce(
        (sum, p) => sum + Number(p["年俸"] || 0),
        0
    );

    const averageSalary = totalCount > 0 ? Math.round(totalSalary / totalCount) : 0;

    const averageAge =
        totalCount > 0
            ? Math.round(
                selectedPlayers.reduce((sum, p) => sum + Number(p["年齢"] || 0), 0) /
                totalCount
            )
            : 0;

    return (
        <table
            border="1"
            style={{
                width: "100%",
                marginBottom: 10,
                textAlign: "center",
                borderCollapse: "collapse",
            }}
        >
            <thead>
                <tr style={{ backgroundColor: "#f0f0f0", color: "black" }}>
                    <th>選択数</th>
                    <th style={{ backgroundColor: "#ffcccc" }}>投手</th>
                    <th style={{ backgroundColor: "#d2b48c" }}>野手</th>
                    <th style={{ backgroundColor: "#479ff2ff" }}>捕手</th>
                    <th style={{ backgroundColor: "#ffff99" }}>内野手</th>
                    <th style={{ backgroundColor: "#9acd32" }}>外野手</th>
                    <th>球団数</th>
                    <th>年俸合計</th>
                    <th>年俸平均</th>
                    <th>平均年齢</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{totalCount}</td>
                    <td>{pitcherCount}</td>
                    <td>{fielderCount}</td>
                    <td>{catcherCount}</td>
                    <td>{infielderCount}</td>
                    <td>{outfielderCount}</td>
                    <td>{teamCount}</td>
                    <td>{totalSalary}</td>
                    <td>{averageSalary}</td>
                    <td>{averageAge}</td>
                </tr>
            </tbody>
        </table>
    );
}


// 指名完了ポップアップ
function DraftCompletionPopup({ round, draftResults, members, players, onClose, onProceedLottery }) {
    const playerToMembersMap = {};
    members.forEach((member) => {
        const code = (draftResults[member] || {})[round];
        if (code) {
            if (!playerToMembersMap[code]) playerToMembersMap[code] = [];
            playerToMembersMap[code].push(member);
        }
    });

    return (
        <div
            style={{
                position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
                backgroundColor: "rgba(0,0,0,0.7)", color: "white",
                display: "flex", justifyContent: "center", alignItems: "center",
                zIndex: 3000,
            }}
        >
            <div style={{ backgroundColor: "#444", padding: 20, borderRadius: 10, width: 400, textAlign: "center" }}>
                <h2>{round}巡目の指名が完了しました！</h2>
                <div style={{ maxHeight: 200, overflowY: "auto", textAlign: "left" }}>
                    {Object.entries(playerToMembersMap).map(([playerCode, memberList]) => {
                        const player = players.find((p) => p["選手コード"] === playerCode);
                        if (!player) return null;
                        return (
                            <div key={playerCode} style={{ marginBottom: 8 }}>
                                <b>指名者:</b> {memberList.join(", ")} <br />
                                <b>選手:</b> {player["選手"]} <br />
                            </div>
                        );
                    })}
                </div>
                <div style={{ marginTop: 20 }}>
                    <button onClick={onClose} style={{ padding: "8px 12px" }}>
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function MainScreen({ draftResults, members, onBackToTop, onSelectPlayer, onRestoreDraft }) {
    const [players, setPlayers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState(members[0] || "");
    const [selectedRound, setSelectedRound] = useState(1);
    const [currentRound, setCurrentRound] = React.useState(1);
    const [viewMode, setViewMode] = useState(() => {
        return localStorage.getItem("draftViewMode") || "vertical";
    });
    useEffect(() => {
        localStorage.setItem("draftViewMode", viewMode);
    }, [viewMode]);

    useEffect(() => {
        if (!draftId) return;

        const load = async () => {
            const picks = await fetchPicks(draftId);
            const converted = convertToDraftResults(picks);
            setDraftResults(converted);
        };

        load(); // 初回読み込み

        const timer = setInterval(load, 5000); // 5秒ごと
        return () => clearInterval(timer);
    }, [draftId]);


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

    // 抽選状態管理
    const [lotteryRound, setLotteryRound] = useState(null);
    const [lotteryDuplicates, setLotteryDuplicates] = useState([]); // 重複選手コードリスト
    const [showLottery, setShowLottery] = useState(false);
    const [currentLotteryIndex, setCurrentLotteryIndex] = useState(0);
    const [lotteryLosers, setLotteryLosers] = useState([]); // 外れたユーザーまとめ

    // 指名完了ポップアップ管理
    const [completedRoundPopup, setCompletedRoundPopup] = useState(null);

    // 抽選済み巡目管理（配列で）
    const [completedLotteryRounds, setCompletedLotteryRounds] = useState([]);

    useEffect(() => {
        fetch(import.meta.env.BASE_URL + "playerdata.csv")
            .then(res => res.text())
            .then(csvText => {
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
            });
    }, []);

    const isRoundFullyDrafted = (round) => {
        return members.every((member) => {
            const memberResults = draftResults[member] || {};
            return memberResults[round] !== undefined && memberResults[round] !== null;
        });
    };

    const getDuplicatePlayerCodesForRound = (round) => {
        const codes = members
            .map((member) => (draftResults[member] || {})[round])
            .filter(Boolean);
        const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index);
        return [...new Set(duplicates)];
    };

    // 巡目の最大値取得
    const allPickedRoundsSet = new Set();
    members.forEach((member) => {
        const memberResults = draftResults[member] || {};
        Object.keys(memberResults).forEach((r) => allPickedRoundsSet.add(Number(r)));
    });
    const maxRound = Math.max(...Array.from(allPickedRoundsSet), 1);

    // 指名完了判定とポップアップ表示
    useEffect(() => {
        if (allPickedRoundsSet.size === 0) return;

        const maxRoundLocal = Math.max(...Array.from(allPickedRoundsSet));
        if (isRoundFullyDrafted(maxRoundLocal)) {
            setCompletedRoundPopup(maxRoundLocal);
        }
    }, [draftResults]);

    // ポップアップの閉じる
    const handleClosePopup = () => {
        setCompletedRoundPopup(null);
    };

    // ポップアップの抽選に進むボタン押下
    const handleProceedLottery = () => {
        const duplicates = getDuplicatePlayerCodesForRound(completedRoundPopup);
        if (duplicates.length > 0) {
            setLotteryRound(completedRoundPopup);
            setLotteryDuplicates(duplicates);
            setCurrentLotteryIndex(0);
            setLotteryLosers([]);
            setShowLottery(true);
        }
        setCompletedRoundPopup(null);
    };

    // 指名開始ボタン押下
    const handleStartDraft = () => {
        const memberResults = draftResults[selectedMember] || {};
        if (memberResults[selectedRound] !== undefined) {
            const proceed = window.confirm(
                "すでにその巡目で指名しています。このまま進むと、その巡目の指名が上書きされます。指名を続けますか？"
            );
            if (!proceed) {
                return; // 処理中断
            }
        }
        onSelectPlayer(selectedMember, selectedRound);
        setShowModal(false);
        setSelectedRound(1);
    };

    // 抽選結果を受け取る
    const handleLotteryResult = (winnerMember, winnerPlayerCode, round, losers) => {
        setLotteryLosers((prev) => [...prev, ...losers]);

        setCompletedLotteryRounds((prev) => {
            if (!prev.includes(round)) {
                return [...prev, round];
            }
            return prev;
        });

        if (currentLotteryIndex + 1 < lotteryDuplicates.length) {
            setCurrentLotteryIndex(currentLotteryIndex + 1);
        } else {
            setShowLottery(false);
            setLotteryRound(null);
            setLotteryDuplicates([]);
            setCurrentLotteryIndex(0);

            // lotteryLosersは非同期のため、最新のlosersも含めてまとめてキャンセル
            const newDraftResults = { ...draftResults };
            [...lotteryLosers, ...losers].forEach((loser) => {
                if (newDraftResults[loser]) {
                    newDraftResults[loser] = { ...newDraftResults[loser] };
                    delete newDraftResults[loser][round];
                }
            });
            setLotteryLosers([]);
            onSelectPlayer(null, null, newDraftResults);
        }
    };

    // 指名一覧をCSV形式で作成
    const createCSV = () => {
        const header = [
            "ユーザー名",
            "巡目",
            "選手コード",
            "選手名",
            "球団",
            "守備位置",
            "投打",
            "年俸",
            "年齢",
        ];

        const rows = [];

        members.forEach((member) => {
            const memberResults = draftResults[member] || {};
            Object.entries(memberResults).forEach(([round, playerCode]) => {
                const player = players.find((p) => p["選手コード"] === playerCode);
                rows.push([
                    member,
                    round,
                    playerCode,
                    player ? player["選手"] : "",
                    player ? player["チーム"] : "",
                    player ? player["ポジション"] : "",
                    player ? player["投打"] : "",
                    player ? player["年俸"] : "",
                    player ? player["年齢"] : "",
                ]);
            });
        });

        const csvContent =
            header.join(",") +
            "\n" +
            rows
                .map((row) =>
                    row
                        .map((field) => {
                            if (typeof field === "string" && (field.includes(",") || field.includes('"'))) {
                                return `"${field.replace(/"/g, '""')}"`;
                            }
                            return field;
                        })
                        .join(",")
                )
                .join("\n");

        return csvContent;
    };

    const downloadCSV = () => {
        const csv = createCSV();
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, "-");
        link.download = `draft_results_${timestamp}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const fileInputRef = React.useRef(null);

    const handleRestoreClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const lines = text.trim().split("\n");
            const newDraftResults = {};

            lines.slice(1).forEach((line) => {
                const cols = line.split(",");
                const user = cols[0]?.trim();
                const roundStr = cols[1]?.trim();
                const playerCode = cols[2]?.trim();

                if (!user || !roundStr || !playerCode) return;

                if (!newDraftResults[user]) newDraftResults[user] = {};
                newDraftResults[user][Number(roundStr)] = playerCode;
            });

            if (onRestoreDraft) {
                onRestoreDraft(newDraftResults);
            }
        };
        reader.readAsText(file);
        e.target.value = "";
    };

    // ↓【ここから追加】重複選手コードセットを作成
    const allSelectedCodes = [];
    members.forEach((member) => {
        const memberResults = draftResults[member] || {};
        Object.values(memberResults).forEach((code) => {
            if (code) allSelectedCodes.push(code);
        });
    });
    const duplicateCodes = allSelectedCodes.filter((code, idx, arr) => arr.indexOf(code) !== idx);
    const duplicateCodesSet = new Set(duplicateCodes);
    // ↑【ここまで追加】

    return (
        <div style={{ maxWidth: 1800, margin: "20px auto" }}>
            <h1>ドラフト指名一覧</h1>

            {/* 表示切替セレクト */}
            <div style={{ marginBottom: 15 }}>
                <label>表示形式: </label>
                <select
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value)}
                    style={{ padding: 6 }}
                >
                    <option value="vertical">縦表示</option>
                    <option value="horizontal">横表示</option>
                </select>
            </div>

            <button
                onClick={onBackToTop}
                style={{
                    marginBottom: 15,
                    padding: "8px 16px",
                    cursor: "pointer",
                    borderRadius: 4,
                    border: "1px solid #999",
                    backgroundColor: "#eee",
                    color: "black",
                    marginRight: 10,
                }}
            >
                トップに戻る
            </button>

            <button
                onClick={() => setShowModal(true)}
                style={{
                    marginBottom: 15,
                    padding: "8px 16px",
                    cursor: "pointer",
                    borderRadius: 4,
                    border: "1px solid #999",
                    backgroundColor: "#c0ffc0",
                    color: "black"
                }}
            >
                選手を指名する
            </button>

            <button
                onClick={downloadCSV}
                style={{
                    marginLeft: 10,
                    padding: "8px 16px",
                    backgroundColor: "#4caf50",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                }}
            >
                ここまでの指名を保存する
            </button>

            <button
                onClick={handleRestoreClick}
                style={{
                    marginLeft: 10,
                    padding: "8px 16px",
                    cursor: "pointer",
                    borderRadius: 4,
                    border: "1px solid #999",
                    backgroundColor: "#c0c0ff",
                    color: "black"
                }}
            >
                （未実装）指名を復元する
            </button>

            <input
                type="file"
                accept=".csv,text/csv"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
            />

            <p>※指名を間違えた場合は、その巡目の指名を上書きしてください</p>

            {viewMode === "vertical" &&
                members.map((member) => {
                    const memberResults = draftResults[member] || {};
                    const maxValidRound = getMaxFullyDraftedRound(members, draftResults, maxRound);
                    return (
                        <div
                            key={member}
                            style={{ marginBottom: 20, border: "1px solid #ccc", padding: 10 }}
                        >
                            <h2>{member} さんの指名選手</h2>

                            <DraftSummary
                                member={member}
                                draftResults={draftResults}
                                players={players}
                                maxRound={maxValidRound}
                            />

                            <table
                                border="1"
                                style={{
                                    width: "100%",
                                    textAlign: "center",
                                    borderCollapse: "collapse",
                                    backgroundColor: "#ffffffff"
                                }}
                            >
                                <thead>
                                    <tr style={{ backgroundColor: "#fdff91ff" }}>
                                        <th>指名順</th>
                                        <th>選手名</th>
                                        <th>球団</th>
                                        <th>守備位置</th>
                                        <th>投打</th>
                                        <th>年俸</th>
                                        <th>年齢</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...Array(maxRound)].map((_, i) => {
                                        const round = i + 1;
                                        const fullyDrafted = isRoundFullyDrafted(round);
                                        const playerCode = memberResults[round];

                                        const isDuplicate =
                                            playerCode &&
                                            duplicateCodesSet.has(playerCode) &&
                                            playerCode !== "" &&
                                            playerCode !== null &&
                                            playerCode !== undefined;

                                        const bgColor = isDuplicate ? "#f88" : "transparent";


                                        if (completedLotteryRounds.includes(round)) {
                                            if (!playerCode) {
                                                return (
                                                    <tr key={round} style={isDuplicate ? {} : {}}>
                                                        <td>{round}</td>
                                                        <td colSpan={6}>まだ指名選手はありません</td>
                                                    </tr>
                                                );
                                            }
                                            const player = players.find((p) => p["選手コード"] === playerCode);
                                            if (!player) {
                                                return (
                                                    <tr key={round} style={isDuplicate ? {} : {}}>
                                                        <td>{round}</td>
                                                        <td colSpan={6}>選手データが見つかりません</td>
                                                    </tr>
                                                );
                                            }
                                            return (
                                                <tr key={round} style={isDuplicate ? { backgroundColor: "pink" } : {}}>
                                                    <td>{round}</td>
                                                    <td>{player["選手"]}</td>
                                                    <td>{player["チーム"]}</td>
                                                    <td>{player["ポジション"]}</td>
                                                    <td>{player["投打"]}</td>
                                                    <td>{player["年俸"]}</td>
                                                    <td>{player["年齢"]}</td>
                                                </tr>
                                            );
                                        }

                                        if (!fullyDrafted) {
                                            if (playerCode === undefined) {
                                                return (
                                                    <tr key={round} style={isDuplicate ? { backgroundColor: "pink" } : {}}>
                                                        <td>{round}</td>
                                                        <td colSpan={6} style={{ color: "#b00", fontWeight: "bold" }}>
                                                            まだ指名していません。選手を指名してください
                                                        </td>
                                                    </tr>
                                                );
                                            } else {
                                                return (
                                                    <tr key={round} style={isDuplicate ? {} : {}}>
                                                        <td>{round}</td>
                                                        <td colSpan={6}>全員の指名を待っています</td>
                                                    </tr>
                                                );
                                            }
                                        }

                                        if (playerCode) {
                                            const player = players.find((p) => p["選手コード"] === playerCode);
                                            if (!player) {
                                                return (
                                                    <tr key={round} style={isDuplicate ? {} : {}}>
                                                        <td>{round}</td>
                                                        <td colSpan={6}>選手データが見つかりません</td>
                                                    </tr>
                                                );
                                            }
                                            return (
                                                <tr key={round} style={isDuplicate ? { backgroundColor: "pink" } : {}}>
                                                    <td>{round}</td>
                                                    <td>{player["選手"]}</td>
                                                    <td>{player["チーム"]}</td>
                                                    <td>{player["ポジション"]}</td>
                                                    <td>{player["投打"]}</td>
                                                    <td>{player["年俸"]}</td>
                                                    <td>{player["年齢"]}</td>
                                                </tr>
                                            );
                                        }

                                        return (
                                            <tr key={round} style={isDuplicate ? {} : {}}>
                                                <td>{round}</td>
                                                <td colSpan={6}>まだ指名していません。選手を指名してください</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    );
                })}


            {viewMode === "horizontal" && (
                < div
                    style={{
                        display: "flex",
                        gap: 20,
                        overflowX: "auto",
                        padding: 20,
                    }}
                >

                    {members.map((member) => {
                        const memberResults = draftResults[member] || {};
                        // 全員が指名完了の最大巡目を取得（縦表示と共通のロジックが望ましい）
                        const maxValidRound = getMaxFullyDraftedRound(members, draftResults, maxRound);

                        return (
                            <div
                                key={member}
                                style={{
                                    minWidth: 400,
                                    border: "1px solid #ccc",
                                    padding: 10,
                                    flexShrink: 0,
                                }}
                            >
                                <h2>{member} さんの指名選手</h2>

                                <DraftSummary
                                    member={member}
                                    draftResults={draftResults}
                                    players={players}
                                    maxRound={maxValidRound}
                                />

                                <table
                                    border="1"
                                    style={{
                                        width: "100%",
                                        textAlign: "center",
                                        borderCollapse: "collapse",
                                    }}
                                >
                                    <thead>
                                        <tr style={{ backgroundColor: "#fdff91ff" }}>
                                            <th>指名順</th>
                                            <th>選手名</th>
                                            <th>球団</th>
                                            <th>守備位置</th>
                                            <th>投打</th>
                                            <th>年俸</th>
                                            <th>年齢</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...Array(maxRound)].map((_, i) => {
                                            const round = i + 1;
                                            const fullyDrafted = isRoundFullyDrafted(round);
                                            const playerCode = memberResults[round];

                                            const isDuplicate =
                                                playerCode &&
                                                duplicateCodesSet.has(playerCode) &&
                                                playerCode !== "" &&
                                                playerCode !== null &&
                                                playerCode !== undefined;

                                            const bgColor = isDuplicate ? "#f88" : "transparent";


                                            if (completedLotteryRounds.includes(round)) {
                                                if (!playerCode) {
                                                    return (
                                                        <tr key={round} style={isDuplicate ? {} : {}}>
                                                            <td>{round}</td>
                                                            <td colSpan={6}>まだ指名選手はありません</td>
                                                        </tr>
                                                    );
                                                }
                                                const player = players.find((p) => p["選手コード"] === playerCode);
                                                if (!player) {
                                                    return (
                                                        <tr key={round} style={isDuplicate ? {} : {}}>
                                                            <td>{round}</td>
                                                            <td colSpan={6}>選手データが見つかりません</td>
                                                        </tr>
                                                    );
                                                }
                                                return (
                                                    <tr key={round} style={isDuplicate ? { backgroundColor: "pink" } : {}}>
                                                        <td>{round}</td>
                                                        <td>{player["選手"]}</td>
                                                        <td>{player["チーム"]}</td>
                                                        <td>{player["ポジション"]}</td>
                                                        <td>{player["投打"]}</td>
                                                        <td>{player["年俸"]}</td>
                                                        <td>{player["年齢"]}</td>
                                                    </tr>
                                                );
                                            }

                                            if (!fullyDrafted) {
                                                if (playerCode === undefined) {
                                                    return (
                                                        <tr key={round} style={isDuplicate ? { backgroundColor: "pink" } : {}}>
                                                            <td>{round}</td>
                                                            <td colSpan={6} style={{ color: "#b00", fontWeight: "bold" }}>
                                                                まだ指名していません。選手を指名してください
                                                            </td>
                                                        </tr>
                                                    );
                                                } else {
                                                    return (
                                                        <tr key={round} style={isDuplicate ? {} : {}}>
                                                            <td>{round}</td>
                                                            <td colSpan={6}>全員の指名を待っています</td>
                                                        </tr>
                                                    );
                                                }
                                            }

                                            if (playerCode) {
                                                const player = players.find((p) => p["選手コード"] === playerCode);
                                                if (!player) {
                                                    return (
                                                        <tr key={round} style={isDuplicate ? {} : {}}>
                                                            <td>{round}</td>
                                                            <td colSpan={6}>選手データが見つかりません</td>
                                                        </tr>
                                                    );
                                                }
                                                return (
                                                    <tr key={round} style={isDuplicate ? { backgroundColor: "pink" } : {}}>
                                                        <td>{round}</td>
                                                        <td>{player["選手"]}</td>
                                                        <td>{player["チーム"]}</td>
                                                        <td>{player["ポジション"]}</td>
                                                        <td>{player["投打"]}</td>
                                                        <td>{player["年俸"]}</td>
                                                        <td>{player["年齢"]}</td>
                                                    </tr>
                                                );
                                            }

                                            return (
                                                <tr key={round} style={isDuplicate ? {} : {}}>
                                                    <td>{round}</td>
                                                    <td colSpan={6}>まだ指名していません。選手を指名してください</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}
                </div>
            )
            }


            {
                showModal && (
                    <div
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: "100vw",
                            height: "100vh",
                            backgroundColor: "rgba(0,0,0,0.7)",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            zIndex: 1000,
                        }}
                    >
                        <div
                            style={{
                                backgroundColor: "#bad47cff",
                                padding: 20,
                                borderRadius: 10,
                                width: 400,
                                border: "2px solid #000",
                            }}
                        >
                            <h2>選手を指名する</h2>
                            <div
                                style={{
                                    border: "2px solid #4a90e2",
                                    backgroundColor: "#f0f6ff",
                                    padding: 12,
                                    borderRadius: 8,
                                    marginBottom: 16,
                                }}
                            >
                                <label
                                    style={{
                                        fontWeight: "bold",
                                        fontSize: 14,
                                        display: "block",
                                        marginBottom: 6,
                                    }}
                                >
                                    指名するユーザー
                                </label>

                                <select
                                    value={selectedMember}
                                    onChange={(e) => setSelectedMember(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: 8,
                                        fontSize: 16,
                                        borderRadius: 4,
                                        border: "1px solid #999",
                                        backgroundColor: "#fff",
                                    }}
                                >
                                    {members.map((m) => (
                                        <option key={m} value={m}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div
                                style={{
                                    border: "2px solid #4a90e2",
                                    backgroundColor: "#f0f6ff",
                                    padding: 12,
                                    borderRadius: 8,
                                    marginBottom: 16,
                                }}
                            >
                                <label
                                    style={{
                                        fontWeight: "bold",
                                        fontSize: 14,
                                        display: "block",
                                        marginBottom: 6,
                                    }}
                                >
                                    指名する巡目
                                </label>

                                <select
                                    value={selectedRound}
                                    onChange={(e) => setSelectedRound(Number(e.target.value))}
                                    style={{
                                        width: "100%",
                                        padding: 8,
                                        fontSize: 16,
                                        borderRadius: 4,
                                        border: "1px solid #999",
                                        backgroundColor: "#fff",
                                    }}
                                >
                                    {Array.from({ length: maxRound + 1 }, (_, i) => i + 1).map((round) => (
                                        <option key={round} value={round}>
                                            {round}
                                        </option>
                                    ))}
                                </select>
                            </div>


                            <button
                                onClick={handleStartDraft}
                                style={{
                                    padding: "8px 16px",
                                    backgroundColor: "#4caf50",
                                    color: "white",
                                    borderRadius: 4,
                                    cursor: "pointer",
                                    marginRight: 10,
                                    border: "2px solid #000",
                                }}
                            >
                                指名開始
                            </button>

                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    padding: "8px 16px",
                                    backgroundColor: "#ccc",
                                    borderRadius: 4,
                                    cursor: "pointer",
                                    border: "2px solid #000",
                                }}
                            >
                                キャンセル
                            </button>
                        </div>
                    </div>
                )
            }

            {
                showLottery && lotteryRound && (
                    <Lottery
                        round={lotteryRound}
                        playerCode={lotteryDuplicates[currentLotteryIndex]}
                        draftResults={draftResults}
                        members={members}
                        players={players}
                        onClose={() => {
                            setShowLottery(false);
                            setLotteryRound(null);
                            setLotteryDuplicates([]);
                            setCurrentLotteryIndex(0);
                        }}
                        onResult={handleLotteryResult}
                    />
                )
            }

            {
                completedRoundPopup && (
                    <DraftCompletionPopup
                        round={completedRoundPopup}
                        draftResults={draftResults}
                        members={members}
                        players={players}
                        onClose={handleClosePopup}
                        onProceedLottery={handleProceedLottery}
                    />
                )
            }
        </div >
    );
}
