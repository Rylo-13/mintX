import React from "react";

interface TabButtonProps {
  text: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabButton: React.FC<TabButtonProps> = ({
  activeTab,
  setActiveTab,
  text,
}) => {
  return (
    <button
      className={`px-4 py-2 ${
        activeTab === text.toLowerCase()
          ? "bg-blue-500 text-white"
          : "bg-gray-300"
      }`}
      onClick={() => setActiveTab(text.toLowerCase())}
    >
      {text}
    </button>
  );
};

export default TabButton;
