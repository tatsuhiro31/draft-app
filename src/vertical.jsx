import React, { useState, useEffect } from "react";

function DraftList() {
  // 初期値をローカルストレージから取得。なければ "vertical"
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem("draftViewMode") || "vertical";
  });

  // viewModeが変わったらローカルストレージに保存
  useEffect(() => {
    localStorage.setItem("draftViewMode", viewMode);
  }, [viewMode]);

  return (
    <>
      <select
        value={viewMode}
        onChange={(e) => setViewMode(e.target.value)}
      >
        <option value="vertical">縦表示</option>
        <option value="horizontal">横表示</option>
      </select>

      {/* viewMode に応じた表示 */}
      {viewMode === "vertical" ? (
        // 縦表示のUI
        <VerticalView />
      ) : (
        // 横表示のUI
        <HorizontalView />
      )}
    </>
  );
}
