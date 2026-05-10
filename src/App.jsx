import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  BedDouble,
  FilePlus,
  History,
  Printer,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  CheckCircle,
  Menu,
} from "lucide-react";

// --- IMPORT FIREBASE ---
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

// --- SETUP DATABASE FIREBASE ---
let app, auth, db;
const appId =
  typeof __app_id !== "undefined"
    ? __app_id
    : "hotel-lavender-app";

try {
  const configStr =
    typeof __firebase_config !== "undefined"
      ? __firebase_config
      : null;
  let firebaseConfig = null;

  if (configStr) {
    firebaseConfig = JSON.parse(configStr);
  } else if (
    import.meta.env &&
    import.meta.env.VITE_FIREBASE_API_KEY
  ) {
    firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env
        .VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env
        .VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
  }

  if (firebaseConfig) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (error) {
  console.warn(
    "Firebase belum dikonfigurasi. Berjalan dalam mode In-Memory.",
    error
  );
}

// --- KONFIGURASI HOTEL ---
const HOTEL_LOGO_URL = "/logo-hotel.png";

const HOTEL_INFO = {
  name: "HOTEL LAVENDER",
  address:
    "Jl. Raya Provinsi No. KM 163, Sungai Cuka, Sungai Danau, Kab. Tanah Bumbu, Kalimantan Selatan 72275",
  phone: "(0518) 123-4567",
  email: "info@hotelavender.com",
};

const DEFAULT_ROOMS = [
  { id: 1, number: "101", type: "VIP 2", price: 275000 },
  { id: 2, number: "102", type: "VIP 2", price: 275000 },
  { id: 3, number: "103", type: "VIP 2", price: 275000 },
  { id: 4, number: "201", type: "VIP 2", price: 275000 },
  { id: 5, number: "202", type: "VIP 2", price: 275000 },
  { id: 6, number: "203", type: "Family", price: 375000 },
  { id: 7, number: "205", type: "Family", price: 375000 },
  { id: 8, number: "206", type: "VIP 1", price: 325000 },
  { id: 9, number: "207", type: "VIP 1", price: 325000 },
  { id: 10, number: "208", type: "VIP 1", price: 325000 },
  { id: 11, number: "209", type: "VIP 1", price: 325000 },
  { id: 12, number: "210", type: "VIP 1", price: 325000 },
  { id: 13, number: "211", type: "Family", price: 375000 },
  { id: 14, number: "212", type: "Family", price: 375000 },
  { id: 15, number: "213", type: "Family", price: 375000 },
  { id: 16, number: "215", type: "VIP 1", price: 325000 },
  { id: 17, number: "216", type: "VIP 1", price: 325000 },
  { id: 18, number: "217", type: "VIP 1", price: 325000 },
  { id: 19, number: "218", type: "VIP 1", price: 325000 },
  { id: 20, number: "219", type: "VIP 1", price: 325000 },
  { id: 21, number: "220", type: "VIP 1", price: 325000 },
  { id: 22, number: "221", type: "VIP 1", price: 325000 },
  { id: 23, number: "222", type: "VIP 2", price: 275000 },
  { id: 24, number: "231", type: "Standart 1", price: 175000 },
  { id: 25, number: "232", type: "Standart 1", price: 175000 },
  { id: 26, number: "233", type: "Standart 1", price: 175000 },
  { id: 27, number: "235", type: "Standart 1", price: 175000 },
  { id: 28, number: "236", type: "Standart 1", price: 175000 },
  { id: 29, number: "237", type: "Standart 2", price: 150000 },
  { id: 30, number: "238", type: "Standart 2", price: 150000 },
];

const formatRupiah = (number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
};

const formatTanggal = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatTanggalWaktu = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const jam = d.getHours().toString().padStart(2, "0");
  const menit = d.getMinutes().toString().padStart(2, "0");
  return `${formatTanggal(dateStr)} ${jam}:${menit}`;
};

const calculateNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 1;
};

const generateInvoiceNumber = (sequenceCounter) => {
  const date = new Date();
  const year = date.getFullYear();
  const romanMonths = [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
  ];
  const romanMonth = romanMonths[date.getMonth()];
  const formattedSequence = sequenceCounter
    .toString()
    .padStart(4, "0");
  return `INV/${year}/${romanMonth}/${formattedSequence}`;
};

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(
      () => setCurrentTime(new Date()),
      1000
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-white rounded-xl shadow-sm p-4 sm:p-8 text-center">
      <img
        src={HOTEL_LOGO_URL}
        alt="Hotel Logo"
        className="w-24 h-24 mb-6 rounded-lg shadow-sm"
      />
      <h1 className="text-3xl sm:text-4xl font-bold text-purple-800 mb-2">
        {HOTEL_INFO.name}
      </h1>
      <p className="text-gray-500 mb-8 text-sm sm:text-base">
        Sistem Manajemen Invoice & Resepsionis
      </p>

      <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6 sm:p-8 w-full sm:min-w-[300px] max-w-sm">
        <p className="text-xs sm:text-sm text-purple-600 font-semibold mb-2">
          Waktu Saat Ini
        </p>
        <p className="text-4xl sm:text-5xl font-mono text-gray-800 font-bold tracking-wider">
          {currentTime.toLocaleTimeString("id-ID")}
        </p>
        <p className="text-sm sm:text-base text-gray-600 mt-2 font-medium">
          {currentTime.toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
    </div>
  );
};

const RoomManager = ({
  rooms,
  setRooms,
  saveToDb,
  deleteFromDb,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentRoom, setCurrentRoom] = useState({
    id: null,
    number: "",
    type: "VIP 1",
    price: "",
  });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentRoom.number || !currentRoom.price) return;

    const roomData = {
      ...currentRoom,
      price: Number(currentRoom.price),
    };
    if (!roomData.id) roomData.id = Date.now();

    await saveToDb("rooms", roomData);

    setIsEditing(false);
    setCurrentRoom({
      id: null,
      number: "",
      type: "VIP 1",
      price: "",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl shadow-sm gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Data Kamar
          </h2>
          <p className="text-gray-500 text-sm">
            Kelola daftar kamar, tipe, dan harga per malam.
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors w-full sm:w-auto justify-center">
            <Plus className="w-4 h-4 mr-2" /> Tambah Kamar
          </button>
        )}
      </div>

      {isEditing && (
        <form
          onSubmit={handleSave}
          className="bg-white p-6 rounded-xl shadow-sm border border-purple-100">
          <h3 className="text-lg font-semibold mb-4">
            {currentRoom.id ? "Edit Kamar" : "Kamar Baru"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nomor Kamar
              </label>
              <input
                type="text"
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                value={currentRoom.number}
                onChange={(e) =>
                  setCurrentRoom({
                    ...currentRoom,
                    number: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipe Kamar
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                value={currentRoom.type}
                onChange={(e) =>
                  setCurrentRoom({
                    ...currentRoom,
                    type: e.target.value,
                  })
                }>
                <option value="VIP 1">VIP 1</option>
                <option value="VIP 2">VIP 2</option>
                <option value="Family">Family</option>
                <option value="Standart 1">Standart 1</option>
                <option value="Standart 2">Standart 2</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Harga per Malam (Rp)
              </label>
              <input
                type="number"
                required
                min="0"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                value={currentRoom.price}
                onChange={(e) =>
                  setCurrentRoom({
                    ...currentRoom,
                    price: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="mt-4 flex space-x-3">
            <button
              type="submit"
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex-1 sm:flex-none justify-center">
              <Save className="w-4 h-4 mr-2" /> Simpan
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex-1 sm:flex-none justify-center">
              <X className="w-4 h-4 mr-2" /> Batal
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No. Kamar
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipe
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Harga
                </th>
                <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rooms.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-4 text-center text-gray-500">
                    Belum ada data kamar.
                  </td>
                </tr>
              ) : (
                rooms.map((room) => (
                  <tr key={room.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {room.number}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-600">
                      {room.type}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-600">
                      {formatRupiah(room.price)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setCurrentRoom(room);
                          setIsEditing(true);
                        }}
                        className="text-purple-600 hover:text-purple-900 mr-2 sm:mr-4 inline-flex items-center">
                        <Edit className="w-4 h-4 sm:mr-1" />{" "}
                        <span className="hidden sm:inline">
                          Edit
                        </span>
                      </button>
                      <button
                        onClick={() =>
                          deleteFromDb("rooms", room.id)
                        }
                        className="text-red-600 hover:text-red-900 inline-flex items-center">
                        <Trash2 className="w-4 h-4 sm:mr-1" />{" "}
                        <span className="hidden sm:inline">
                          Hapus
                        </span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const CreateInvoice = ({ rooms, invoiceCount, saveToDb }) => {
  const [successMsg, setSuccessMsg] = useState("");
  const [formData, setFormData] = useState({
    guestName: "",
    guestPhone: "",
    guestAddress: "",
    checkIn: "",
    checkOut: "",
    roomId: "",
    discount: 0,
    extraBed: 0,
  });

  const selectedRoom = useMemo(
    () =>
      rooms.find((r) => r.id.toString() === formData.roomId) ||
      null,
    [rooms, formData.roomId]
  );

  const nights = useMemo(
    () => calculateNights(formData.checkIn, formData.checkOut),
    [formData.checkIn, formData.checkOut]
  );

  const subTotal = selectedRoom
    ? selectedRoom.price * nights
    : 0;
  const total =
    subTotal +
    Number(formData.extraBed) -
    Number(formData.discount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoom) return;

    const newInvoice = {
      id: Date.now(),
      invoiceNumber: generateInvoiceNumber(invoiceCount + 1),
      printDate: new Date().toISOString(),
      ...formData,
      nights: nights,
      roomNumber: selectedRoom.number,
      roomType: selectedRoom.type,
      roomPrice: selectedRoom.price,
      discount: Number(formData.discount),
      extraBed: Number(formData.extraBed),
      total: total,
    };

    await saveToDb("invoices", newInvoice);

    setSuccessMsg(
      `Invoice ${newInvoice.invoiceNumber} berhasil dibuat dan disimpan!`
    );
    setTimeout(() => {
      setSuccessMsg("");
    }, 5000);

    setFormData({
      guestName: "",
      guestPhone: "",
      guestAddress: "",
      checkIn: "",
      checkOut: "",
      roomId: "",
      discount: 0,
      extraBed: 0,
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden relative">
      {successMsg && (
        <div className="absolute top-0 left-0 right-0 bg-green-500 text-white p-4 flex items-center justify-center font-medium z-10 animate-fade-in-down text-center text-sm sm:text-base">
          <CheckCircle className="w-5 h-5 mr-2 shrink-0" />
          {successMsg}
        </div>
      )}

      <div className="p-4 sm:p-6 border-b border-gray-100">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
          Buat Invoice Baru
        </h2>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">
          Lengkapi data tamu dan penyewaan untuk menerbitkan
          invoice.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700 border-b pb-2 text-sm sm:text-base">
              Informasi Tamu
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Tamu
              </label>
              <input
                type="text"
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 text-sm"
                value={formData.guestName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    guestName: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                No. HP Tamu
              </label>
              <input
                type="tel"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 text-sm"
                value={formData.guestPhone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    guestPhone: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alamat Tamu
              </label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 text-sm"
                rows="2"
                value={formData.guestAddress}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    guestAddress: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check-in
                </label>
                <input
                  type="date"
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 text-sm"
                  value={formData.checkIn}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      checkIn: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check-out
                </label>
                <input
                  type="date"
                  required
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 text-sm"
                  value={formData.checkOut}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      checkOut: e.target.value,
                    })
                  }
                  min={formData.checkIn}
                />
              </div>
            </div>
            {nights > 0 &&
              formData.checkIn &&
              formData.checkOut && (
                <p className="text-sm text-purple-600 bg-purple-50 p-2 rounded">
                  Lama Menginap: <b>{nights} Malam</b>
                </p>
              )}
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700 border-b pb-2 text-sm sm:text-base">
              Detail Kamar & Biaya
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pilih Kamar
              </label>
              <select
                required
                className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-purple-500 focus:border-purple-500 text-sm"
                value={formData.roomId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    roomId: e.target.value,
                  })
                }>
                <option value="">-- Pilih Nomor Kamar --</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    Kamar {room.number} - {room.type}
                  </option>
                ))}
              </select>
            </div>

            {selectedRoom && (
              <div className="grid grid-cols-2 gap-4 p-3 border border-gray-200 rounded-lg bg-gray-50 text-sm">
                <div>
                  <p className="text-gray-500">Tipe Kamar</p>
                  <p className="font-semibold text-gray-800">
                    {selectedRoom.type}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">
                    Harga per Malam
                  </p>
                  <p className="font-semibold text-gray-800">
                    {formatRupiah(selectedRoom.price)}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Biaya Extra Bed (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 text-sm"
                  value={formData.extraBed}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      extraBed: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diskon (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 text-sm"
                  value={formData.discount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-6">
          <div className="flex justify-end items-center">
            <div className="w-full md:w-1/2 lg:w-1/3 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-gray-600">
                  Subtotal ({nights} Malam)
                </span>
                <span>{formatRupiah(subTotal)}</span>
              </div>
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-gray-600">Extra Bed</span>
                <span>
                  {formatRupiah(formData.extraBed || 0)}
                </span>
              </div>
              <div className="flex justify-between mb-2 text-sm text-red-600">
                <span>Diskon</span>
                <span>
                  -{formatRupiah(formData.discount || 0)}
                </span>
              </div>
              <div className="flex justify-between mt-4 pt-4 border-t border-gray-300 font-bold text-lg sm:text-xl">
                <span>Total Bayar</span>
                <span className="text-purple-700">
                  {formatRupiah(total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={!selectedRoom || !formData.checkIn}
            className="w-full sm:w-auto flex justify-center items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
            <Save className="w-5 h-5 mr-2" /> Simpan & Buat
            Invoice
          </button>
        </div>
      </form>
    </div>
  );
};

const InvoiceHistory = ({ invoices, onPrint, deleteFromDb }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <div className="p-4 sm:p-6 border-b border-gray-100">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
          Riwayat Invoice
        </h2>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">
          Daftar semua invoice yang pernah diterbitkan.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                No. Invoice
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tanggal Cetak
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tamu / Kamar
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-8 text-center text-gray-500">
                  Belum ada invoice yang diterbitkan.
                </td>
              </tr>
            ) : (
              [...invoices]
                .sort((a, b) => b.id - a.id)
                .map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap font-medium text-purple-600 text-sm">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                      {formatTanggalWaktu(inv.printDate)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-bold text-gray-900 uppercase">
                        {inv.guestName}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500">
                        Kamar {inv.roomNumber} ({inv.roomType})
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-gray-800">
                      {formatRupiah(inv.total)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-1 sm:gap-2">
                      <button
                        onClick={() => onPrint(inv)}
                        className="text-gray-600 hover:text-purple-600 bg-gray-100 hover:bg-purple-50 p-1.5 sm:px-3 sm:py-1.5 rounded-md inline-flex items-center transition-colors"
                        title="Cetak">
                        <Printer className="w-4 h-4 sm:mr-1.5" />{" "}
                        <span className="hidden sm:inline">
                          Cetak
                        </span>
                      </button>
                      <button
                        onClick={() =>
                          deleteFromDb("invoices", inv.id)
                        }
                        className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 sm:px-2 sm:py-1.5 rounded-md inline-flex items-center transition-colors"
                        title="Hapus">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PrintLayout = ({ invoice, onCancel }) => {
  if (!invoice) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 print:static print:bg-white print:block overflow-y-auto">
      <style>
        {`
          @media print {
            @page { margin: 0; }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background-color: white;
            }
          }
        `}
      </style>

      <div className="absolute top-4 right-4 flex space-x-2 print:hidden z-50">
        <button
          onClick={() => window.print()}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg font-semibold flex items-center hover:bg-purple-700 transition-colors">
          <Printer className="w-5 h-5 mr-2" />{" "}
          <span className="hidden sm:inline">Print</span>
        </button>
        <button
          onClick={onCancel}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-lg font-semibold flex items-center hover:bg-gray-300 transition-colors">
          <X className="w-5 h-5 sm:mr-2" />{" "}
          <span className="hidden sm:inline">Tutup</span>
        </button>
      </div>

      <div
        id="invoice-print-area"
        className="bg-white w-full max-w-2xl shadow-2xl print:shadow-none p-6 sm:p-10 flex flex-col relative text-sm mx-auto">
        <div className="border-b-4 border-purple-600 pb-4 mb-6 flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <img
              src={HOTEL_LOGO_URL}
              alt="Hotel Logo"
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-purple-600 tracking-tight">
                {HOTEL_INFO.name}
              </h1>
              <p className="text-gray-600 text-[10px] sm:text-xs mt-1 w-full sm:w-3/4">
                {HOTEL_INFO.address}
              </p>
              <p className="text-gray-600 text-[10px] sm:text-xs mt-0.5">
                Telp: {HOTEL_INFO.phone}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-purple-600 font-bold mt-1 text-xs sm:text-sm">
              {invoice.invoiceNumber}
            </p>
            <p className="text-gray-500 text-[10px] sm:text-xs mt-1">
              Dicetak: {formatTanggalWaktu(invoice.printDate)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 text-sm">
          <div>
            <h3 className="font-bold text-gray-800 border-b border-gray-200 mb-2 pb-1 uppercase text-xs tracking-wider">
              Ditagihkan Kepada:
            </h3>
            <p className="font-bold text-base uppercase text-purple-600">
              {invoice.guestName}
            </p>
            {invoice.guestPhone && (
              <p className="text-gray-600 mt-1">
                Telp: {invoice.guestPhone}
              </p>
            )}
            {invoice.guestAddress && (
              <p className="text-gray-600 mt-1 whitespace-pre-wrap">
                {invoice.guestAddress}
              </p>
            )}
          </div>
          <div>
            <h3 className="font-bold text-gray-800 border-b border-gray-200 mb-2 pb-1 uppercase text-xs tracking-wider">
              Detail Menginap:
            </h3>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="text-gray-600 py-0.5">
                    Check-in
                  </td>
                  <td className="font-medium text-right">
                    {formatTanggal(invoice.checkIn)}
                  </td>
                </tr>
                <tr>
                  <td className="text-gray-600 py-0.5">
                    Check-out
                  </td>
                  <td className="font-medium text-right">
                    {formatTanggal(invoice.checkOut)}
                  </td>
                </tr>
                <tr>
                  <td className="text-gray-600 py-0.5">
                    Durasi
                  </td>
                  <td className="font-medium text-right">
                    {invoice.nights} Malam
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full mb-6 text-xs sm:text-sm min-w-[500px]">
            <thead className="bg-purple-50 border-t-2 border-b-2 border-purple-200">
              <tr>
                <th className="py-2 px-2 text-left font-bold text-gray-800 uppercase text-[10px]">
                  Deskripsi
                </th>
                <th className="py-2 px-2 text-center font-bold text-gray-800 uppercase text-[10px]">
                  Malam
                </th>
                <th className="py-2 px-2 text-right font-bold text-gray-800 uppercase text-[10px]">
                  Harga
                </th>
                <th className="py-2 px-2 text-right font-bold text-gray-800 uppercase text-[10px]">
                  Extra Bed
                </th>
                <th className="py-2 px-2 text-right font-bold text-gray-800 uppercase text-[10px]">
                  Diskon
                </th>
                <th className="py-2 px-2 text-right font-bold text-gray-800 uppercase text-[10px]">
                  Jumlah
                </th>
              </tr>
            </thead>
            <tbody className="border-b border-gray-200">
              <tr>
                <td className="py-3 px-2 text-gray-800">
                  <span className="font-bold text-purple-900 block">
                    Kamar {invoice.roomNumber}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {invoice.roomType}
                  </span>
                </td>
                <td className="py-3 px-2 text-center text-gray-800 align-top">
                  {invoice.nights}
                </td>
                <td className="py-3 px-2 text-right text-gray-800 align-top">
                  {formatRupiah(invoice.roomPrice)}
                </td>
                <td className="py-3 px-2 text-right text-gray-800 align-top">
                  {invoice.extraBed > 0
                    ? formatRupiah(invoice.extraBed)
                    : "-"}
                </td>
                <td className="py-3 px-2 text-right text-red-600 align-top">
                  {invoice.discount > 0
                    ? `-${formatRupiah(invoice.discount)}`
                    : "-"}
                </td>
                <td className="py-3 px-2 text-right text-gray-800 font-bold align-top">
                  {formatRupiah(invoice.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mb-4">
          <div className="w-full sm:w-1/2">
            <div className="flex justify-between py-2 border-t-2 border-purple-600 font-bold text-[15px] bg-purple-50 px-4">
              <span className="text-purple-800">
                TOTAL KESELURUHAN
              </span>
              <span className="text-purple-900">
                {formatRupiah(invoice.total)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4 pt-2 pb-4">
          <div className="text-center w-48 sm:w-64 pr-0 sm:pr-4">
            <p className="text-gray-800 mb-20 text-xs sm:text-sm">
              Sungai Danau, ........................{" "}
              {new Date(invoice.printDate).getFullYear()}
            </p>
            <p className="mt-2 text-sm font-bold text-gray-800 whitespace-nowrap">
              ( ........................................ )
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Resepsionis
            </p>
          </div>
        </div>

        <div className="mt-2 text-center text-[10px] sm:text-xs text-gray-400 border-t pt-2 print:hidden">
          Terima kasih telah menginap di {HOTEL_INFO.name}.
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);

  const [rooms, setRooms] = useState(DEFAULT_ROOMS);
  const [invoices, setInvoices] = useState([]);

  const [printInvoiceData, setPrintInvoiceData] = useState(null);

  const [user, setUser] = useState(null);
  const [dbConnected, setDbConnected] = useState(false);

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    { id: "create", label: "Buat Invoice", icon: FilePlus },
    { id: "history", label: "Riwayat Invoice", icon: History },
    { id: "rooms", label: "Data Kamar", icon: BedDouble },
  ];

  useEffect(() => {
    const currentMenu = menuItems.find(
      (m) => m.id === activeTab
    );
    document.title = `${
      currentMenu ? currentMenu.label : "App"
    } | ${HOTEL_INFO.name}`;

    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = HOTEL_LOGO_URL;
  }, [activeTab]);

  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (
          typeof __initial_auth_token !== "undefined" &&
          __initial_auth_token
        ) {
          await signInWithCustomToken(
            auth,
            __initial_auth_token
          );
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    setDbConnected(true);

    const invoicesRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "invoices"
    );
    const unsubInvoices = onSnapshot(
      invoicesRef,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setInvoices(data);
      },
      (err) => console.error("Gagal baca invoices:", err)
    );

    const roomsRef = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "rooms"
    );
    const unsubRooms = onSnapshot(
      roomsRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setRooms(data);
        } else {
          DEFAULT_ROOMS.forEach((r) => {
            setDoc(doc(roomsRef, r.id.toString()), r);
          });
        }
      },
      (err) => console.error("Gagal baca kamar:", err)
    );

    return () => {
      unsubInvoices();
      unsubRooms();
    };
  }, [user]);

  const saveToDb = async (collectionName, data) => {
    if (db && user) {
      const docRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        collectionName,
        data.id.toString()
      );
      await setDoc(docRef, data);
    } else {
      if (collectionName === "invoices")
        setInvoices((prev) => [...prev, data]);
      if (collectionName === "rooms")
        setRooms((prev) => [
          ...prev.filter((r) => r.id !== data.id),
          data,
        ]);
    }
  };

  const deleteFromDb = async (collectionName, id) => {
    if (db && user) {
      const docRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        collectionName,
        id.toString()
      );
      await deleteDoc(docRef);
    } else {
      if (collectionName === "invoices")
        setInvoices((prev) => prev.filter((i) => i.id !== id));
      if (collectionName === "rooms")
        setRooms((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans overflow-hidden">
      {printInvoiceData && (
        <PrintLayout
          invoice={printInvoiceData}
          onCancel={() => setPrintInvoiceData(null)}
        />
      )}

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-20 backdrop-blur-sm z-20 md:hidden print:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      <div
        className={`fixed inset-y-0 left-0 transform ${
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full"
        } md:relative md:translate-x-0 transition duration-200 ease-in-out z-30 w-64 bg-gray-800 text-white flex flex-col print:hidden shadow-xl md:shadow-none`}>
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute top-4 right-4 md:hidden text-gray-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-2 text-purple-300">
            <img
              src={HOTEL_LOGO_URL}
              alt="Logo"
              className="w-8 h-8 rounded"
            />
            <h1 className="text-xl font-bold tracking-wider">
              LAVENDER
            </h1>
          </div>
          <p className="text-xs text-gray-400">
            Hotel Management System
          </p>
        </div>

        <nav className="flex-1 mt-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center px-6 py-4 text-sm transition-colors ${
                  isActive
                    ? "bg-purple-600 text-white font-medium border-l-4 border-purple-400"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white border-l-4 border-transparent"
                }`}>
                <Icon
                  className={`w-5 h-5 mr-3 ${
                    isActive ? "text-white" : "text-gray-400"
                  }`}
                />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 bg-gray-900 text-xs text-center text-gray-500 flex flex-col items-center">
          Versi Cloud DB (Lavender)
          <span
            className={`mt-1 inline-block w-2 h-2 rounded-full ${
              dbConnected ? "bg-green-500" : "bg-yellow-500"
            }`}
            title={
              dbConnected
                ? "Database Terhubung"
                : "Mode Memori Lokal"
            }></span>
        </div>
      </div>

      <div className="flex-1 h-screen overflow-y-auto print:hidden">
        <header className="bg-white shadow-sm px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden mr-3 text-gray-600 hover:text-purple-600 focus:outline-none">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">
              {menuItems.find((m) => m.id === activeTab)?.label}
            </h2>
          </div>
          <div
            className={`text-xs md:text-sm font-medium px-3 py-1.5 md:px-4 md:py-2 rounded-full flex items-center ${
              dbConnected
                ? "text-green-700 bg-green-50"
                : "text-purple-600 bg-purple-50"
            }`}>
            <span className="hidden sm:inline">Status: </span>{" "}
            {dbConnected ? "Online" : "Aktif"}
          </div>
        </header>

        <main className="p-4 md:p-8">
          {activeTab === "dashboard" && <Dashboard />}

          {activeTab === "rooms" && (
            <RoomManager
              rooms={rooms}
              setRooms={setRooms}
              saveToDb={saveToDb}
              deleteFromDb={deleteFromDb}
            />
          )}

          {activeTab === "create" && (
            <CreateInvoice
              rooms={rooms}
              invoiceCount={invoices.length}
              saveToDb={saveToDb}
            />
          )}

          {activeTab === "history" && (
            <InvoiceHistory
              invoices={invoices}
              onPrint={(inv) => setPrintInvoiceData(inv)}
              deleteFromDb={deleteFromDb}
            />
          )}
        </main>
      </div>
    </div>
  );
}
