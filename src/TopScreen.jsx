// TopScreen.jsx
import React, { useState, useEffect } from "react";

const GAS_URL =
  "https://script.google.com/macros/s/AKfycbxVrtw6wL0k-m6Z_6raOw-WuIctg_TZzV4ln43HV5DCd5sAA2eE4U8pW-SfXSSvj5Ad/exec";

// JSONP fetch helper
function fetchJSONP(url, callbackName = "callback") {
  return new Promise((resolve, reject) => {
    const callbackFuncName = `jsonp_callback_${Date.now()}`;

    window[callbackFuncName] = (data) => {
      resolve(data);
      delete window[callbackFuncName];
      script.remove();
    };

    const script = document.createElement("script");
    script.src = `${url}&${callbackName}=${callbackFuncName}`;
    script.onerror = () => {
      reject(new Error(`JSONP script load error for ${script.src}`));
      delete window[callbackFuncName];
      script.remove();
    };
    document.body.appendChild(script);
  });
}

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

  // ★ GAS にドラフト開始をJSONPで送信
  const handleStart = async () => {
    if (memberNames.some((n) => n.trim() === "")) {
      alert("すべての参加ユーザー名を入力してください");
      return;
    }

    const params = new URLSearchParams({
      type: "startDraft",
      members: JSON.stringify(memberNames),
    });

    try {
      const data = await fetchJSONP(`${GAS_URL}?${params.toString()}`);
      localStorage.setItem("draftId", data.draftId);
      onStart(memberNames);
    } catch (error) {
      alert("通信エラーが発生しました。");
      console.error(error);
    }
  };

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
