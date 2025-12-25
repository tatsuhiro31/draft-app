// TopScreen.jsx
import React, { useState, useEffect } from "react";

const GAS_URL =
  "https://script.google.com/macros/s/AKfycbzIYVVM_HzT0Rcbg-C-LseGN83csdUTUFgofF4VLXg8g05oV5hkwmrm_5PMGVHPqa8f/exec";

function TopScreen({ onStart }) {
  const [memberCount, setMemberCount] = useState(2);
  const [memberNames, setMemberNames] = useState(["ユーザー1"]);

  useEffect(() => {
    setMemberNames((prev) => {
      const newNames = [...prev];
      while (newNames.length < memberCount) {
        newNames.push(`ユーザー${newNames.length + 1}`);
      }
      return newNames.slice(0, memberCount);
    });
  }, [memberCount]);

  const handleMemberCountChange = (e) => {
    let count = Number(e.target.value);
    if (isNaN(count)) count = 2;
    count = Math.max(1, Math.min(12, count));
    setMemberCount(count);
  };

  const handleNameChange = (index, e) => {
    const newNames = [...memberNames];
    newNames[index] = e.target.value;
    setMemberNames(newNames);
  };

  // ★ ここが正しい handleStart
  const handleStart = async () => {
    if (memberNames.some((n) => n.trim() === "")) {
      alert("すべての参加ユーザー名を入力してください");
      return;
    }

    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        type: "startDraft",
        members: memberNames,
      }),
    });


    const data = await res.json();
    console.log("draftId:", data.draftId);

    // localStorage に保存
    localStorage.setItem("draftId", data.draftId);

    // MainScreenへ
    onStart(memberNames);
  };

  // ★ JSX は必ずここで return
  return (
    <div style={{ maxWidth: 800, margin: "20px auto", textAlign: "center" }}>
      <h1>みんなでドラフト会議</h1>

      <div style={{ marginBottom: 20 }}>
        <label>
          参加人数：
          <input
            type="number"
            min="2"
            max="12"
            value={memberCount}
            onChange={handleMemberCountChange}
            style={{ width: 60, marginLeft: 8 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 20 }}>
        {Array.from({ length: memberCount }).map((_, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <label>
              参加ユーザー名{i + 1}：
              <input
                type="text"
                value={memberNames[i]}
                onChange={(e) => handleNameChange(i, e)}
                style={{ marginLeft: 8 }}
              />
            </label>
          </div>
        ))}
      </div>

      <button onClick={handleStart}>ドラフト開始</button>
    </div>
  );
}

export default TopScreen;
