// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { databases, Query, account, ID } from "../lib/appwrite.js";
import SensorChart from "../components/SensorChart.jsx";

const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;

// Match exactly the attribute names in your Appwrite collection
const VEHICLE_FIELD = "VehicleID";
const NH3_FIELD = "nh3";
const CH4_FIELD = "ch3";        // your column name is ch3
const TIME_FIELD = "$createdAt"; // using Appwrite system field

// Admin emails – ONLY these users will see the settings icon
const ADMIN_EMAILS = ["ch.sairam2003@gmail.com"]; // <- change/add as you like

function Dashboard({ onLogout, user }) {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [sensorData, setSensorData] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");

  // Admin state
  const isAdmin = user && ADMIN_EMAILS.includes(user.email);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);
  const [adminMessage, setAdminMessage] = useState("");

  // 1) Load VehicleID list for dropdown
  useEffect(() => {
    const fetchVehicles = async () => {
      setLoadingVehicles(true);
      setError("");
      try {
        const res = await databases.listDocuments(DB_ID, COLLECTION_ID, [
          Query.limit(200),
          Query.orderDesc(TIME_FIELD),
        ]);

        const ids = Array.from(
          new Set(res.documents.map((doc) => doc[VEHICLE_FIELD]))
        ).filter(Boolean);

        setVehicles(ids);

        if (ids.length > 0) {
          setSelectedVehicle((prev) => prev || ids[0]);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load vehicles: " + err.message);
      } finally {
        setLoadingVehicles(false);
      }
    };

    fetchVehicles();
  }, []);

  // 2) Fetch data whenever selectedVehicle changes
  useEffect(() => {
    if (!selectedVehicle) return;

    const fetchData = async () => {
      setLoadingData(true);
      setError("");
      try {
        const res = await databases.listDocuments(DB_ID, COLLECTION_ID, [
          Query.equal(VEHICLE_FIELD, selectedVehicle),
          Query.orderDesc(TIME_FIELD),
          Query.limit(500),
        ]);

        // Docs are most recent first; reverse so chart is chronological
        const docs = res.documents.slice().reverse();

        const formatted = docs.map((doc) => ({
          timestamp: doc[TIME_FIELD] || doc.$createdAt,
          nh3: Number(doc[NH3_FIELD]),
          ch3: Number(doc[CH4_FIELD]),
        }));

        setSensorData(formatted);
      } catch (err) {
        console.error(err);
        setError("Failed to load sensor data: " + err.message);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [selectedVehicle]);

  // 3) Admin: create new user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setAdminMessage("");
    if (!newUserEmail || !newUserPassword) {
      setAdminMessage("Please fill email and password.");
      return;
    }

    try {
      setCreatingUser(true);

    // Create a new user account in Appwrite (no auto-login)
      await account.create({
        userId: ID.unique(),
        email: newUserEmail,
        password: newUserPassword,
      // name: "Optional name here"
      });

      setAdminMessage(`User created: ${newUserEmail}`);
      setNewUserEmail("");
      setNewUserPassword("");
    } catch (err) {
        console.error(err);
        setAdminMessage("Failed to create user: " + err.message);
    } finally {
        setCreatingUser(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Water Quality Dashboard
          </h1>
          {user && (
            <p className="text-xs text-slate-500">
              Logged in as {user.email}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Admin settings icon – only visible for admin */}
          {isAdmin && (
            <button
              onClick={() => setShowAdminPanel((prev) => !prev)}
              className="px-4 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              {showAdminPanel ? "Close" : "Create User"}
            </button>
          )}


          <button
            onClick={onLogout}
            className="px-3 py-1 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 p-6 space-y-4">
        {/* Admin panel – only for admins & when toggled */}
        {isAdmin && showAdminPanel && (
          <section className="bg-white rounded-2xl shadow p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              Admin Panel
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase tracking-wide">
                Create users
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Only admins can access this section. Use it to create new
              accounts for other users.
            </p>

            <form
              onSubmit={handleCreateUser}
              className="flex flex-wrap items-end gap-3"
            >
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  New user email
                </label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm 
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  New user password
                </label>
                <input
                  type="password"
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm 
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="At least 8 characters"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={creatingUser}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium
                           hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {creatingUser ? "Creating..." : "Create user"}
              </button>
            </form>

            {adminMessage && (
              <p className="text-xs text-slate-600">{adminMessage}</p>
            )}
          </section>
        )}

        {/* Vehicle selector */}
        <section className="bg-white rounded-2xl shadow p-4 flex flex-wrap items-center gap-4">
          <div>
            <p className="text-sm font-medium text-slate-700">Vehicle</p>
            <p className="text-xs text-slate-500">
              Select a floating vehicle to view its NH₃ and CH₄ history.
            </p>
          </div>

          <select
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedVehicle}
            onChange={(e) => setSelectedVehicle(e.target.value)}
            disabled={loadingVehicles || vehicles.length === 0}
          >
            {loadingVehicles && <option>Loading vehicles...</option>}
            {!loadingVehicles && vehicles.length === 0 && (
              <option>No vehicles found</option>
            )}
            {!loadingVehicles &&
              vehicles.length > 0 &&
              vehicles.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
          </select>
        </section>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Current summary cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow p-4">
            <p className="text-xs font-medium text-slate-500">
              Current NH₃
            </p>
            <p className="text-2xl font-semibold text-slate-900">
              {sensorData.length
                ? sensorData[sensorData.length - 1].nh3
                : "--"}
            </p>
            <p className="text-xs text-slate-400 mt-1">mg/L</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4">
            <p className="text-xs font-medium text-slate-500">
              Current CH₄
            </p>
            <p className="text-2xl font-semibold text-slate-900">
              {sensorData.length
                ? sensorData[sensorData.length - 1].ch3
                : "--"}
            </p>
            <p className="text-xs text-slate-400 mt-1">ppm</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-4">
            <p className="text-xs font-medium text-slate-500">
              Last updated
            </p>
            <p className="text-sm text-slate-800">
              {sensorData.length
                ? new Date(
                    sensorData[sensorData.length - 1].timestamp
                  ).toLocaleString()
                : "--"}
            </p>
          </div>
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {loadingData ? (
            <div className="bg-white rounded-2xl shadow p-6 col-span-1 lg:col-span-2">
              <p className="text-sm text-slate-600">
                Loading sensor data...
              </p>
            </div>
          ) : sensorData.length === 0 ? (
            <div className="bg-white rounded-2xl shadow p-6 col-span-1 lg:col-span-2">
              <p className="text-sm text-slate-600">
                No sensor data found for this vehicle.
              </p>
            </div>
          ) : (
            <>
              <SensorChart
                data={sensorData}
                dataKey="nh3"
                title="NH₃ over time"
                yLabel="NH₃ concentration (mg/L)"
              />
              <SensorChart
                data={sensorData}
                dataKey="ch3"
                title="CH₄ (ch3) over time"
                yLabel="CH₄ concentration (ppm)"
              />
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
