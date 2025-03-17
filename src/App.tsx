import React, { useState } from "react";

const categories = ["Beauty", "Clothing", "Electronics", "Groceries", "Medicine", "Meat"];

const App: React.FC = () => {
  const [option, setOption] = useState("categorical");
  const [items, setItems] = useState([{ category: categories[0], name: "" }]);
  const [manualInput, setManualInput] = useState("");
  const [selectionType, setSelectionType] = useState<"time" | "price">("time");
  const [result, setResult] = useState<string | null>(null);

  const addItem = () => setItems([...items, { category: categories[0], name: "" }]);
  const removeItem = (index: number) =>
    items.length > 1 && setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, key: "category" | "name", value: string) => {
    const updatedItems = [...items];
    updatedItems[index][key] = value;
    setItems(updatedItems);
  };

  const handleOptionChange = (newOption: "categorical" | "manual") => {
    setOption(newOption);
    setResult(null);
  };

  const evaluate = async () => {
    // Create payload based on the selected option
    const payload = {
      option, // "categorical" or "manual"
      data: option === "categorical" ? items : manualInput, // object or string
      selectionType, // "time" or "price"
    };

    try {
      // Send the payload to the backend endpoint
      const response = await fetch("http://127.0.0.1:5000/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const resultData = await response.json();
      
      // Use regex to extract the JSON portion (starts with "{" and ends with "}")
      const regex = /{[\s\S]*?}/;
      const match = resultData.message.match(regex);
      const jsonText = match ? match[0] : resultData.message;

      // Set the result to display evaluationType and the parsed JSON
      setResult(`Evaluation Type: ${resultData.evaluationType}\n NLP Result: ${jsonText}`);
    } catch (error) {
      console.error("Error sending data to backend:", error);
      setResult("There was an error processing your request.");
    }
  };

  return (
    <div className="relative flex flex-col items-center min-h-screen bg-white text-gray-800 p-5 overflow-hidden">
      {/* Professional Minimal Vector Background */}
      <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-gradient-to-br from-blue-100 to-transparent rounded-full blur-2xl opacity-40"></div>
      <div className="absolute top-1/4 right-0 w-1/4 h-1/4 bg-gradient-to-br from-yellow-100 to-transparent rounded-full blur-2xl opacity-40"></div>
      <div className="absolute bottom-0 left-1/4 w-1/3 h-1/3 bg-gradient-to-br from-green-100 to-transparent rounded-full blur-2xl opacity-40"></div>
      <div className="absolute bottom-10 right-1/3 w-20 h-1 bg-gray-300 opacity-30 rotate-12"></div>
      <div className="absolute top-20 right-1/4 w-12 h-12 border-2 border-blue-300 rounded-full opacity-30"></div>

      {/* UI Content */}
      <h1 className="text-3xl font-bold mb-5">Welcome</h1>

      {/* Selection Options */}
      <div className="flex gap-5 mb-5">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            checked={option === "categorical"}
            onChange={() => handleOptionChange("categorical")}
            className="hidden"
          />
          <div
            className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${
              option === "categorical" ? "border-blue-500" : "border-gray-400"
            }`}
          >
            {option === "categorical" && (
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            )}
          </div>
          <span>Categorical</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            checked={option === "manual"}
            onChange={() => handleOptionChange("manual")}
            className="hidden"
          />
          <div
            className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${
              option === "manual" ? "border-blue-500" : "border-gray-400"
            }`}
          >
            {option === "manual" && (
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            )}
          </div>
          <span>Manual</span>
        </label>
      </div>

      {/* Categorical Selection */}
      {option === "categorical" ? (
        <div className="flex flex-col gap-3 w-64">
          {items.map((item, index) => (
            <div key={index} className="flex gap-2 items-center">
              <select
                className="p-2 border rounded flex-1"
                value={item.category}
                onChange={(e) => updateItem(index, "category", e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Item name"
                value={item.name}
                onChange={(e) => updateItem(index, "name", e.target.value)}
                className="p-2 border rounded flex-1"
              />
              <button
                onClick={() => removeItem(index)}
                className="text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded"
              >
                −
              </button>
            </div>
          ))}
          <button
            onClick={addItem}
            className="mt-2 px-3 py-1 text-white bg-green-500 rounded hover:bg-green-600"
          >
            +
          </button>
        </div>
      ) : (
        <textarea
          placeholder="Enter items manually"
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          className="w-64 h-24 p-2 border rounded"
        />
      )}

      {/* Time or Price Selection */}
      <div className="flex gap-5 mt-5">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            checked={selectionType === "time"}
            onChange={() => setSelectionType("time")}
            className="hidden"
          />
          <div
            className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${
              selectionType === "time" ? "border-blue-500" : "border-gray-400"
            }`}
          >
            {selectionType === "time" && (
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            )}
          </div>
          <span>Time</span>
        </label>

        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="radio"
            checked={selectionType === "price"}
            onChange={() => setSelectionType("price")}
            className="hidden"
          />
          <div
            className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${
              selectionType === "price" ? "border-blue-500" : "border-gray-400"
            }`}
          >
            {selectionType === "price" && (
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            )}
          </div>
          <span>Price</span>
        </label>
      </div>

      {/* Evaluate Button */}
      <button
        onClick={evaluate}
        className="mt-5 px-5 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Evaluate
      </button>

      {/* Result Display */}
      {result && (
        <div className="mt-5 p-3 border rounded bg-gray-100 w-64 text-center whitespace-pre-wrap">
          <p>{result}</p>
        </div>
      )}
    </div>
  );
};

export default App;
