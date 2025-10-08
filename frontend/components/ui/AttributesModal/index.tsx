import React from "react";

interface Attribute {
  key: string;
  value: string;
}

interface AttributesModalProps {
  attributes: Attribute[];
  setAttributes: React.Dispatch<React.SetStateAction<Attribute[]>>;
  isOpen: boolean;
  onClose: () => void;
}

const AttributesModal: React.FC<AttributesModalProps> = ({
  attributes,
  setAttributes,
  isOpen,
  onClose,
}) => {
  const handleAddAttribute = () => {
    if (attributes.length < 6) {
      setAttributes([...attributes, { key: "", value: "" }]);
    }
  };

  const handleDeleteAttribute = (index: number) => {
    const updatedAttributes = [...attributes];
    updatedAttributes.splice(index, 1);
    setAttributes(updatedAttributes);
  };

  const handleAttributeChange = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const updatedAttributes = [...attributes];
    updatedAttributes[index][field] = value;
    setAttributes(updatedAttributes);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-start justify-center bg-black/80 backdrop-blur-sm z-50 p-4 pt-20 overflow-y-auto">
      <div className="bg-[#1A1A1A] rounded-3xl w-full max-w-xl border border-white/10 mb-8">
        {/* Header */}
        <div className="p-6 pb-5">
          <h3 className="text-2xl font-light text-white tracking-tight mb-2">
            Add Properties
          </h3>
          <p className="text-xs text-gray-400 font-light leading-relaxed">
            Properties are key-value pairs that you can use for your NFT
            utilities. You can set multiple properties for your NFT.
          </p>
        </div>

        {/* Content */}
        <div className="px-6">
          {/* Column Headers */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-400 font-light">Type</label>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-light">Name</label>
            </div>
          </div>

          {/* Attribute Rows */}
          <div className="space-y-2.5">
            {attributes.map((attribute, index) => (
              <div key={index} className="grid grid-cols-2 gap-3 items-center">
                <input
                  className="px-3 py-2 bg-transparent border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FF10F0] transition-colors font-light"
                  type="text"
                  placeholder="Key"
                  value={attribute.key}
                  onChange={(e) =>
                    handleAttributeChange(index, "key", e.target.value)
                  }
                  maxLength={9}
                />
                <div className="flex gap-2 items-center">
                  <input
                    className="flex-1 px-3 py-2 bg-transparent border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FF10F0] transition-colors font-light"
                    type="text"
                    placeholder="Value"
                    value={attribute.value}
                    onChange={(e) =>
                      handleAttributeChange(index, "value", e.target.value)
                    }
                    maxLength={9}
                  />
                  <button
                    className="hover:bg-white/5 rounded-full transition-colors flex-shrink-0 w-8 h-8 flex items-center justify-center"
                    onClick={() => handleDeleteAttribute(index)}
                  >
                    <svg
                      className="w-4 h-4 text-gray-400 hover:text-white transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            className={`mt-4 py-2 px-5 border border-white/10 rounded-full text-xs transition-colors font-light ${
              attributes.length >= 6
                ? "text-gray-600 cursor-not-allowed"
                : "text-[#FF10F0] hover:bg-[#FF10F0]/10"
            }`}
            onClick={handleAddAttribute}
            disabled={attributes.length >= 6}
          >
            Add More {attributes.length >= 6 && "(Max 6)"}
          </button>
        </div>

        {/* Footer */}
        <div className="p-6 pt-5 grid grid-cols-2 gap-3">
          <button
            className="py-2.5 px-6 border border-white/10 rounded-full text-sm text-white hover:bg-white/5 transition-colors font-light"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="py-2.5 px-6 bg-[#FF10F0] hover:bg-[#E935C1] text-white text-sm rounded-full transition-colors font-light"
            onClick={onClose}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttributesModal;
