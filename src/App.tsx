import React, { useState, useEffect, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MapRoute from "./components/MapRoute"; // Import the MapRoute component
import "leaflet/dist/leaflet.css";

const categories = ["Grooming", "Clothing", "Electronics", "Groceries", "Medicine", "Meat"];

const App: React.FC = () => {
  const [option, setOption] = useState<"categorical" | "manual" | null>(null);
  const [items, setItems] = useState([{ category: categories[0], name: "" }]);
  const [manualInput, setManualInput] = useState("");
  const [selectionType, setSelectionType] = useState<"time" | "price" | null>(null);
  const [result, setResult] = useState<any>(null); // Store the result object from the backend
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [permissionChecked, setPermissionChecked] = useState<boolean>(false);
  const [showLargeMap, setShowLargeMap] = useState<boolean>(false);

  const categoryRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<HTMLDivElement>(null);
  const evaluateRef = useRef<HTMLDivElement>(null);

  // Function to request geolocation
  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (_) => {
          toast.error("Unable to retrieve location. Using default location.");
          setUserLocation([20.3488, 85.8162]);
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser. Using default location.");
      setUserLocation([20.3488, 85.8162]);
    }
  };

  // Check geolocation permission on mount
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((permissionStatus) => {
          if (permissionStatus.state === "granted") {
            setShowModal(false);
            requestLocation();
          } else {
            setShowModal(true);
          }
          setPermissionChecked(true);
        })
        .catch((err) => {
          console.error("Permissions API error:", err);
          setShowModal(true);
          setPermissionChecked(true);
        });
    } else {
      setShowModal(true);
      setPermissionChecked(true);
    }
  }, []);

  const handleModalOk = () => {
    setShowModal(false);
    requestLocation();
  };

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const addItem = () => {
    if (items.some((item) => !item.name.trim())) {
      toast.error("Please fill in all item names before adding a new item.");
      return;
    }
    setItems([...items, { category: categories[0], name: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, key: "category" | "name", value: string) => {
    const updatedItems = [...items];
    updatedItems[index][key] = value;
    setItems(updatedItems);
  };

  const handleOptionChange = (newOption: "categorical" | "manual") => {
    setOption(newOption);
    setResult(null);
    setTimeout(() => scrollToSection(categoryRef), 300);
  };

  const evaluate = async () => {
    if (!option) {
      toast.error("Please select an input method (Categorical or Manual).");
      return;
    }
    if (option === "categorical" && items.some((item) => !item.name.trim())) {
      toast.error("Please fill in all item names before evaluating.");
      return;
    }
    if (option === "manual" && !manualInput.trim()) {
      toast.error("Please enter manual input before evaluating.");
      return;
    }
    if (!selectionType) {
      toast.error("Please select an evaluation basis (Time or Price).");
      return;
    }
    if (!userLocation) {
      toast.error("User location is not available.");
      return;
    }
    const payload = {
      option,
      data: option === "categorical" ? items : manualInput,
      selectionType,
      user_location: userLocation,
    };
    try {
      const response = await fetch("http://127.0.0.1:5000/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const resultData = await response.json();
      setResult(resultData);
    } catch (error) {
      console.error("Error sending data to backend:", error);
      setResult("There was an error processing your request.");
    }
    setTimeout(() => scrollToSection(evaluateRef), 300);
  };

  return (
    <div className="relative flex flex-col items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-900 p-5 overflow-hidden">
      <ToastContainer />

      {/* Modal for Location Permission */}
      {permissionChecked && showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.3)", zIndex: 10000 }}
        >
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Location Access Required</h2>
            <p className="mb-6">Please give us location access to continue.</p>
            <button
              onClick={handleModalOk}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {/* Welcome Section */}
      <div className="bg-white/50 backdrop-blur-lg shadow-lg p-8 rounded-3xl w-[90%] max-w-lg border border-white/20">
        <h1 className="text-4xl font-bold text-center mb-6 text-indigo-700">Welcome</h1>
        <div className="flex justify-center gap-5">
          {["categorical", "manual"].map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer text-lg">
              <input
                type="radio"
                checked={option === opt}
                onChange={() => handleOptionChange(opt as "categorical" | "manual")}
                className="hidden"
              />
              <span className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${option === opt ? "border-indigo-600" : "border-gray-400"}`}>
                {option === opt && <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>}
              </span>
              <span className="capitalize">{opt}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Category/Manual Input Section */}
      {option && (
        <div ref={categoryRef} className="mt-10 bg-white/50 backdrop-blur-lg shadow-lg p-8 rounded-3xl w-[90%] max-w-lg border border-white/20">
          {option === "categorical" ? (
            <div className="flex flex-col gap-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <select
                    className="p-2 border rounded-lg flex-1 bg-white/50"
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
                    className="p-2 border rounded-lg flex-1 bg-white/50"
                  />
                  <button
                    onClick={() => removeItem(index)}
                    className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg"
                  >
                    −
                  </button>
                </div>
              ))}
              <button
                onClick={addItem}
                className="mt-2 px-4 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600"
              >
                + Add Item
              </button>
            </div>
          ) : (
            <textarea
              placeholder="Enter items manually"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="w-full h-24 p-2 border rounded-lg bg-white/50"
            />
          )}
        </div>
      )}

      {/* Time/Price Selection */}
      {option && (
        <div ref={selectionRef} className="mt-10 bg-white/50 backdrop-blur-lg shadow-lg p-8 rounded-3xl w-[90%] max-w-lg border border-white/20">
          <h2 className="text-xl font-semibold text-center mb-4">Choose Evaluation Basis</h2>
          <div className="flex justify-center gap-5">
            {["time", "price"].map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer text-lg">
                <input
                  type="radio"
                  checked={selectionType === type}
                  onChange={() => setSelectionType(type as "time" | "price")}
                  className="hidden"
                />
                <span className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${selectionType === type ? "border-indigo-600" : "border-gray-400"}`}>
                  {selectionType === type && <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>}
                </span>
                <span className="capitalize">{type}</span>
              </label>
            ))}
          </div>
          <button
            onClick={evaluate}
            className="mt-5 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 w-full transition-all"
          >
            Evaluate
          </button>
        </div>
      )}

  {/* Result Section */}
{result && (
  <div ref={evaluateRef} className="mt-10 p-3 border rounded-lg bg-white/50 text-center shadow-lg w-[90%] max-w-lg">
    <p>
      Evaluation Type: {result.evaluationType}
      <br />
      Your Path: <ol style={{ listStylePosition: "inside", paddingLeft: 0, marginLeft: 0, listStyleType: "decimal" }}>
  {result.possible_paths[0].map((shop: any, index: number) => (
    <li key={index}>Go to {shop.store}</li>
  ))}
  <li>Return</li>
</ol>
    </p>
    {userLocation && result.possible_paths && result.possible_paths[0] && (
      <div className="mt-5 relative group">
        {/* Map container with hover effect */}
        <div className="relative z-0 transition-all duration-300 group-hover:brightness-75">
          <MapRoute userLocation={userLocation} shops={result.possible_paths[0]} />
        </div>

        {/* Hover overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center z-10 
                     opacity-0 group-hover:opacity-100 transition-opacity duration-300 
                     cursor-pointer pointer-events-none group-hover:pointer-events-auto"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          onClick={() => setShowLargeMap(true)}
        >
          <span className="text-white text-xl font-bold animate-pulse">
            Click for large view
          </span>
        </div>
      </div>
    )}
  </div>
)}

      {/* Modal for Large Map View */}
      {showLargeMap && userLocation && result && result.possible_paths && result.possible_paths[0] && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.3)", zIndex: 9999 }}
        >
          <div className="relative bg-white rounded-lg shadow-lg p-4 w-[90%] max-w-4xl">
            <button
              onClick={() => setShowLargeMap(false)}
              className="absolute top-2 right-2 text-2xl font-bold text-gray-700 hover:text-gray-900"
            >
              &times;
            </button>
            <h2 className="text-center text-xl font-semibold mb-4">Large Map View</h2>
            <MapRoute userLocation={userLocation} shops={result.possible_paths[0]} />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
