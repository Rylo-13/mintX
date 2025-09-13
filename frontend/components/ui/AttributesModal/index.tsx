import React from "react";
import XIcon from "../Icons/XIcon";
import AddIcon from "../Icons/AddIcon";

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
    setAttributes([...attributes, { key: "", value: "" }]);
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
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-black p-6 rounded shadow-lg w-full max-w-md relative border flex flex-col">
        <XIcon
          className="h-6 w-6 absolute top-2 right-2 cursor-pointer"
          onClick={onClose}
        />
        <h3 className="text-lg font-medium mb-4">Attributes</h3>

        <div className="flex-grow">
          {" "}
          {/* Allows content to push the bottom of the modal */}
          {attributes.map((attribute, index) => (
            <div key={index} className="flex mb-3">
              <div className="flex w-full gap-x-3 relative">
                <input
                  className="w-1/2 px-3 py-1.5 border"
                  type="text"
                  placeholder="Key"
                  value={attribute.key}
                  onChange={(e) =>
                    handleAttributeChange(index, "key", e.target.value)
                  }
                />
                <input
                  className="w-1/2 px-3 py-1.5 border"
                  type="text"
                  placeholder="Value"
                  value={attribute.value}
                  onChange={(e) =>
                    handleAttributeChange(index, "value", e.target.value)
                  }
                />
                {index > 0 && (
                  <XIcon
                    className="h-8 w-8 cursor-pointer absolute top-0 right-0.5 mt-0.5 lg:mt-1 text-white hover:text-[#a81010]"
                    onClick={() => handleDeleteAttribute(index)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-4">
          <AddIcon
            className="h-8 w-8 cursor-pointer hover:text-[#D600C4]"
            onClick={handleAddAttribute}
          />
        </div>

        {/* Confirm Button */}
        <div className="flex justify-center mt-4">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={onClose}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttributesModal;
