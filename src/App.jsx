import React, { useState, useEffect, useMemo } from 'react';
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
  Download,
  AlertCircle,
  LogOut,
  Lock,
  Search
} from 'lucide-react';

// --- IMPORT FIREBASE ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

// --- SETUP DATABASE FIREBASE ---
let app, auth, db;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'hotel-lavender-app';
let currentApiKey = '';

try {
  const configStr = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
  let firebaseConfig = null;
  
  if (configStr) {
    firebaseConfig = JSON.parse(configStr);
  } else if (import.meta.env && import.meta.env.VITE_FIREBASE_API_KEY) {
    firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };
  }

  if (firebaseConfig && firebaseConfig.apiKey) {
    currentApiKey = firebaseConfig.apiKey;
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (error) {
  console.warn("Firebase belum dikonfigurasi.", error);
}

// --- KONFIGURASI HOTEL ---
const HOTEL_LOGO_URL = "/logo-hotel.png";

const HOTEL_INFO = {
  name: "HOTEL LAVENDER",
  address: "Jl. Raya Provinsi No. KM 163, Sungai Cuka, Sungai Danau, Kab. Tanah Bumbu, Kalimantan Selatan 72275",
  phone: "+62 852-8425-3798",
  email: "info@hotelavender.com"
};

const DEFAULT_ROOMS = [
  { id: 1, number: '101', type: 'VIP 2', price: 275000 },
  { id: 2, number: '102', type: 'VIP 2', price: 275000 },
  { id: 3, number: '103', type: 'VIP 2', price: 275000 },
  { id: 4, number: '201', type: 'VIP 2', price: 275000 },
  { id: 5, number: '202', type: 'VIP 2', price: 275000 },
  { id: 6, number: '203', type: 'Family', price: 375000 },
  { id: 7, number: '205', type: 'Family', price: 375000 },
  { id: 8, number: '206', type: 'VIP 1', price: 325000 },
  { id: 9, number: '207', type: 'VIP 1', price: 325000 },
  { id: 10, number: '208', type: 'VIP 1', price: 325000 },
  { id: 11, number: '209', type: 'VIP 1', price: 325000 },
  { id: 12, number: '210', type: 'VIP 1', price: 325000 },
  { id: 13, number: '211', type: 'Family', price: 375000 },
  { id: 14, number: '212', type: 'Family', price: 375000 },
  { id: 15, number: '213', type: 'Family', price: 375000 },
  { id: 16, number: '215', type: 'VIP 1', price: 325000 },
  { id: 17, number: '216', type: 'VIP 1', price: 325000 },
  { id: 18, number: '217', type: 'VIP 1', price: 325000 },
  { id: 19, number: '218', type: 'VIP 1', price: 325000 },
  { id: 20, number: '219', type: 'VIP 1', price: 325000 },
  { id: 21, number: '220', type: 'VIP 1', price: 325000 },
  { id: 22, number: '221', type: 'VIP 1', price: 325000 },
  { id: 23, number: '222', type: 'VIP 2', price: 275000 },
  { id: 24, number: '231', type: 'Standart 1', price: 175000 },
  { id: 25, number: '232', type: 'Standart 1', price: 175000 },
  { id: 26, number: '233', type: 'Standart 1', price: 175000 },
  { id: 27, number: '235', type: 'Standart 1', price: 175000 },
  { id: 28, number: '236', type: 'Standart 1', price: 175000 },
  { id: 29, number: '237', type: 'Standart 2', price: 150000 },
  { id: 30, number: '238', type: 'Standart 2', price: 150000 }
];

const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number);
};

const formatTanggal = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatTanggalWaktu = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const jam = d.getHours().toString().padStart(2, '0');
  const menit = d.getMinutes().toString().padStart(2, '0');
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
  const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const romanMonth = romanMonths[date.getMonth()];
  const formattedSequence = sequenceCounter.toString().padStart(4, '0');
  return `INV/${year}/${romanMonth}/${formattedSequence}`;
};

const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Database Akun
    const credentials = {
      lavender: { pass: 'lavender2026', role: 'admin', name: 'Admin Lavender' },
      billa: { pass: 'billa123', role: 'resepsionis', name: 'Billa' },
      alit: { pass: 'alit123', role: 'resepsionis', name: 'Alit' },
      tabhita: { pass: 'tabhita123', role: 'resepsionis', name: 'Tabhita' }
    };

    const inputUser = username.toLowerCase().trim();
    const validUser = credentials[inputUser];

    if (validUser && validUser.pass === password) {
      onLogin({ username: inputUser, role: validUser.role, name: validUser.name });
    } else {
      setError('Username atau password salah!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-900 to-purple-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-pink-500 to-purple-600"></div>
        <div className="text-center mb-8">
          <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Login Sistem</h1>
          <p className="text-gray-500 text-sm mt-1">Hotel Lavender Management</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input 
              type="text" 
              required 
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              required 
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
            />
          </div>
          <button 
            type="submit" 
            className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-md mt-2"
          >
            Masuk
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-gray-400 text-center">
          <p className="font-semibold text-gray-500 mb-1">Daftar Akun Terdaftar:</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="text-left bg-purple-50 p-2 rounded">
              <span className="block font-bold text-purple-700">Admin</span>
              lavender
            </div>
            <div className="text-left bg-gray-50 p-2 rounded">
              <span className="block font-bold text-gray-600">Resepsionis</span>
              billa / alit / tabhita
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-white rounded-xl shadow-sm p-4 sm:p-8 text-center">
      <img src={HOTEL_LOGO_URL} alt="Hotel Logo" className="w-24 h-24 mb-6 rounded-lg shadow-sm" />
      <h1 className="text-3xl sm:text-4xl font-bold text-purple-800 mb-2">{HOTEL_INFO.name}</h1>
      <p className="text-gray-500 mb-8 text-sm sm:text-base">Sistem Manajemen Invoice & Resepsionis</p>
      
      <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6 sm:p-8 w-full sm:min-w-[300px] max-w-sm">
        <p className="text-xs sm:text-sm text-purple-600 font-semibold mb-2">Waktu Saat Ini</p>
        <p className="text-4xl sm:text-5xl font-mono text-gray-800 font-bold tracking-wider">
          {currentTime.toLocaleTimeString('id-ID')}
        </p>
        <p className="text-sm sm:text-base text-gray-600 mt-2 font-medium">
          {currentTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
    </div>
  );
};

const RoomManager = ({ rooms, setRooms, saveToDb, deleteFromDb }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentRoom, setCurrentRoom] = useState({ id: null, number: '', type: 'VIP 1', price: '' });
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentRoom.number || !currentRoom.price) return;

    const roomData = { ...currentRoom, price: Number(currentRoom.price) };
    if (!roomData.id) roomData.id = Date.now();

    try {
      await saveToDb('rooms', roomData);
      setIsEditing(false);
      setCurrentRoom({ id: null, number: '', type: 'VIP 1', price: '' });
    } catch (err) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(''), 6000);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteFromDb('rooms', id);
    } catch (err) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(''), 6000);
    }
  };

  return (
    <div className="space-y-6 relative">
      
      {errorMsg && (
        <div className="fixed bottom-6 right-6 bg-white shadow-2xl rounded-2xl border border-red-100 p-4 flex items-center z-50 animate-fade-in-up">
          <div className="bg-red-100 p-2.5 rounded-full mr-4">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          </div>
          <div className="mr-6">
            <p className="font-bold text-gray-800 text-sm mb-0.5">Aksi Gagal</p>
            <p className="text-gray-500 text-xs">{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl shadow-sm gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Data Kamar</h2>
          <p className="text-gray-500 text-sm">Kelola daftar kamar, tipe, dan harga per malam.</p>
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4 mr-2" /> Tambah Kamar
          </button>
        )}
      </div>

      {isEditing && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-sm border border-purple-100">
          <h3 className="text-lg font-semibold mb-4">{currentRoom.id ? 'Edit Kamar' : 'Kamar Baru'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Kamar</label>
              <input 
                type="text" required
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                value={currentRoom.number}
                onChange={(e) => setCurrentRoom({...currentRoom, number: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Kamar</label>
              <select 
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                value={currentRoom.type}
                onChange={(e) => setCurrentRoom({...currentRoom, type: e.target.value})}
              >
                <option value="VIP 1">VIP 1</option>
                <option value="VIP 2">VIP 2</option>
                <option value="Family">Family</option>
                <option value="Standart 1">Standart 1</option>
                <option value="Standart 2">Standart 2</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga per Malam (Rp)</label>
              <input 
                type="number" required min="0"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                value={currentRoom.price}
                onChange={(e) => setCurrentRoom({...currentRoom, price: e.target.value})}
              />
            </div>
          </div>
          <div className="mt-4 flex space-x-3">
            <button type="submit" className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex-1 sm:flex-none justify-center">
              <Save className="w-4 h-4 mr-2" /> Simpan
            </button>
            <button type="button" onClick={() => setIsEditing(false)} className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex-1 sm:flex-none justify-center">
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
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Kamar</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
                <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rooms.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">Belum ada data kamar.</td></tr>
              ) : rooms.map((room) => (
                <tr key={room.id} className="hover:bg-gray-50">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap font-medium text-gray-900">{room.number}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-600">{room.type}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-600">{formatRupiah(room.price)}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => { setCurrentRoom(room); setIsEditing(true); }} className="text-purple-600 hover:text-purple-900 mr-2 sm:mr-4 inline-flex items-center">
                      <Edit className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Edit</span>
                    </button>
                    <button onClick={() => handleDelete(room.id)} className="text-red-600 hover:text-red-900 inline-flex items-center">
                      <Trash2 className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Hapus</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const CreateInvoice = ({ rooms, invoiceCount, saveToDb, currentUser }) => {
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    guestName: '', guestPhone: '', guestAddress: '', checkIn: '', checkOut: '', roomId: '',
    discount: 0, extraBed: 0
  });

  const selectedRoom = useMemo(() => 
    rooms.find(r => r.id.toString() === formData.roomId) || null
  , [rooms, formData.roomId]);

  const nights = useMemo(() => 
    calculateNights(formData.checkIn, formData.checkOut)
  , [formData.checkIn, formData.checkOut]);

  const subTotal = selectedRoom ? selectedRoom.price * nights : 0;
  const total = subTotal + Number(formData.extraBed) - Number(formData.discount);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoom) return;

    const newInvoice = {
      id: Date.now(),
      invoiceNumber: generateInvoiceNumber(invoiceCount + 1),
      printDate: new Date().toISOString(),
      createdBy: currentUser?.name || 'Resepsionis', // Menyimpan nama pembuat
      ...formData,
      nights: nights,
      roomNumber: selectedRoom.number,
      roomType: selectedRoom.type,
      roomPrice: selectedRoom.price,
      discount: Number(formData.discount),
      extraBed: Number(formData.extraBed),
      total: total
    };

    try {
      await saveToDb('invoices', newInvoice);
      setSuccessMsg(`Invoice ${newInvoice.invoiceNumber} berhasil dibuat dan disimpan!`);
      setTimeout(() => setSuccessMsg(''), 5000);
      setFormData({
        guestName: '', guestPhone: '', guestAddress: '', checkIn: '', checkOut: '', roomId: '',
        discount: 0, extraBed: 0
      });
    } catch (err) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(''), 7000);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden relative">
      
      {/* Notifikasi Sukses */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 bg-white shadow-2xl rounded-2xl border border-green-100 p-4 flex items-center z-50 animate-fade-in-up">
          <div className="bg-green-100 p-2.5 rounded-full mr-4">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          </div>
          <div className="mr-6">
            <p className="font-bold text-gray-800 text-sm mb-0.5">Berhasil Disimpan!</p>
            <p className="text-gray-500 text-xs">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Notifikasi Gagal (Merah) */}
      {errorMsg && (
        <div className="fixed bottom-6 right-6 bg-white shadow-2xl rounded-2xl border border-red-100 p-4 flex items-center z-50 animate-fade-in-up">
          <div className="bg-red-100 p-2.5 rounded-full mr-4">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          </div>
          <div className="mr-6">
            <p className="font-bold text-gray-800 text-sm mb-0.5">Gagal Menyimpan Invoice</p>
            <p className="text-gray-500 text-xs">{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="p-4 sm:p-6 border-b border-gray-100">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Buat Invoice Baru</h2>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">Lengkapi data tamu dan penyewaan untuk menerbitkan invoice.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700 border-b pb-2 text-sm sm:text-base">Informasi Tamu</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Tamu</label>
              <input type="text" required className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 text-sm"
                value={formData.guestName} onChange={e => setFormData({...formData, guestName: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. HP Tamu</label>
              <input type="tel" className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 text-sm"
                value={formData.guestPhone} onChange={e => setFormData({...formData, guestPhone: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Tamu</label>
              <textarea className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 text-sm" rows="2"
                value={formData.guestAddress} onChange={e => setFormData({...formData, guestAddress: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
                <input type="date" required className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 text-sm"
                  value={formData.checkIn} onChange={e => setFormData({...formData, checkIn: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
                <input type="date" required className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 text-sm"
                  value={formData.checkOut} onChange={e => setFormData({...formData, checkOut: e.target.value})}
                  min={formData.checkIn}
                />
              </div>
            </div>
            {nights > 0 && formData.checkIn && formData.checkOut && (
              <p className="text-sm text-purple-600 bg-purple-50 p-2 rounded">Lama Menginap: <b>{nights} Malam</b></p>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700 border-b pb-2 text-sm sm:text-base">Detail Kamar & Biaya</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kamar</label>
              <select required className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-purple-500 focus:border-purple-500 text-sm"
                value={formData.roomId} onChange={e => setFormData({...formData, roomId: e.target.value})}
              >
                <option value="">-- Pilih Nomor Kamar --</option>
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>Kamar {room.number} - {room.type}</option>
                ))}
              </select>
            </div>

            {selectedRoom && (
              <div className="grid grid-cols-2 gap-4 p-3 border border-gray-200 rounded-lg bg-gray-50 text-sm">
                <div>
                  <p className="text-gray-500">Tipe Kamar</p>
                  <p className="font-semibold text-gray-800">{selectedRoom.type}</p>
                </div>
                <div>
                  <p className="text-gray-500">Harga per Malam</p>
                  <p className="font-semibold text-gray-800">{formatRupiah(selectedRoom.price)}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Biaya Extra Bed (Rp)</label>
                <input type="number" min="0" className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 text-sm"
                  value={formData.extraBed} onChange={e => setFormData({...formData, extraBed: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diskon (Rp)</label>
                <input type="number" min="0" className="w-full p-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 text-sm"
                  value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-6">
          <div className="flex justify-end items-center">
            <div className="w-full md:w-1/2 lg:w-1/3 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-gray-600">Subtotal ({nights} Malam)</span>
                <span>{formatRupiah(subTotal)}</span>
              </div>
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-gray-600">Extra Bed</span>
                <span>{formatRupiah(formData.extraBed || 0)}</span>
              </div>
              <div className="flex justify-between mb-2 text-sm text-red-600">
                <span>Diskon</span>
                <span>-{formatRupiah(formData.discount || 0)}</span>
              </div>
              <div className="flex justify-between mt-4 pt-4 border-t border-gray-300 font-bold text-lg sm:text-xl">
                <span>Total Bayar</span>
                <span className="text-purple-700">{formatRupiah(total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button type="submit" disabled={!selectedRoom || !formData.checkIn} 
            className="w-full sm:w-auto flex justify-center items-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm">
            <Save className="w-5 h-5 mr-2" /> Simpan & Buat Invoice
          </button>
        </div>
      </form>
    </div>
  );
};

const InvoiceHistory = ({ invoices, onPrint, deleteFromDb, role }) => {
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // --- STATE UNTUK FILTER DAN PENCARIAN ---
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [limit, setLimit] = useState(15);

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteFromDb('invoices', deleteConfirm.id);
      setToastMsg(`Invoice ${deleteConfirm.invoiceNumber} berhasil dihapus.`);
      setDeleteConfirm(null);
      setTimeout(() => setToastMsg(''), 5000);
    } catch (err) {
      setErrorMsg(err.message);
      setDeleteConfirm(null);
      setTimeout(() => setErrorMsg(''), 7000);
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(invoices, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `backup_invoice_hotel_${new Date().getTime()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // --- LOGIKA PENYARINGAN DATA (FILTERING) ---
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // 1. Filter Pencarian Teks (Nama atau No Invoice)
      const matchSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          inv.guestName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Filter Tanggal Cetak
      let matchDate = true;
      if (dateFilter) {
        const invDate = new Date(inv.printDate);
        // Mengubah ke format YYYY-MM-DD sesuai dengan input type date
        const localDateStr = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, '0')}-${String(invDate.getDate()).padStart(2, '0')}`;
        matchDate = localDateStr === dateFilter;
      }

      return matchSearch && matchDate;
    }).sort((a, b) => b.id - a.id); // Urutkan dari yang terbaru
  }, [invoices, searchTerm, dateFilter]);

  // --- LOGIKA PEMBATASAN DATA (LIMIT) ---
  const displayedInvoices = limit === 'all' ? filteredInvoices : filteredInvoices.slice(0, Number(limit));

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 relative">
      
      {/* Modal Konfirmasi Hapus */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-4 mx-auto">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Hapus Invoice?</h3>
            <p className="text-sm text-center text-gray-500 mb-6">
              Anda yakin ingin menghapus invoice <span className="font-bold text-gray-700">{deleteConfirm.invoiceNumber}</span>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors">Batal</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold text-sm rounded-xl hover:bg-red-700 transition-colors">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifikasi Berhasil Hapus */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-white shadow-2xl rounded-2xl border border-green-100 p-4 flex items-center z-50 animate-fade-in-up">
          <div className="bg-green-100 p-2.5 rounded-full mr-4">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          </div>
          <div className="mr-6">
            <p className="font-bold text-gray-800 text-sm mb-0.5">Berhasil Dihapus!</p>
            <p className="text-gray-500 text-xs">{toastMsg}</p>
          </div>
          <button onClick={() => setToastMsg('')} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Toast Notifikasi Gagal Hapus */}
      {errorMsg && (
        <div className="fixed bottom-6 right-6 bg-white shadow-2xl rounded-2xl border border-red-100 p-4 flex items-center z-50 animate-fade-in-up">
          <div className="bg-red-100 p-2.5 rounded-full mr-4">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          </div>
          <div className="mr-6">
            <p className="font-bold text-gray-800 text-sm mb-0.5">Gagal Menghapus</p>
            <p className="text-gray-500 text-xs">{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Riwayat Invoice</h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">Daftar semua invoice yang pernah diterbitkan.</p>
        </div>
        <button onClick={handleExport} className="w-full sm:w-auto justify-center flex items-center px-4 py-2 bg-green-600 text-white font-semibold text-sm rounded-xl hover:bg-green-700 transition-colors shadow-sm">
          <Download className="w-4 h-4 mr-2" /> <span className="inline">Backup Data</span>
        </button>
      </div>

      {/* --- PANEL FILTER & PENCARIAN --- */}
      <div className="p-4 bg-gray-50 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Kolom Pencarian */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input 
            type="text" 
            placeholder="Cari Nama / No. Invoice..." 
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Kolom Filter Tanggal */}
        <div className="relative">
          <input 
            type="date" 
            title="Filter berdasarkan tanggal"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all text-gray-600"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="absolute right-2 top-2.5 text-gray-400 hover:text-red-500 bg-white" title="Hapus Filter Tanggal">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Kolom Limit Data */}
        <div>
          <select 
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all text-gray-700 font-medium"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          >
            <option value={15}>Tampilkan 15 Teratas</option>
            <option value={20}>Tampilkan 20 Teratas</option>
            <option value={50}>Tampilkan 50 Teratas</option>
            <option value="all">Tampilkan Semua Data</option>
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Invoice</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Cetak</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tamu / Kamar</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayedInvoices.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Data invoice tidak ditemukan.</td></tr>
            ) : displayedInvoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap font-medium text-purple-600 text-sm">{inv.invoiceNumber}</td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                  {formatTanggalWaktu(inv.printDate)}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <div className="text-xs sm:text-sm font-bold text-gray-900 uppercase">{inv.guestName}</div>
                  <div className="text-[10px] sm:text-xs text-gray-500">Kamar {inv.roomNumber} ({inv.roomType})</div>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-bold text-gray-800">
                  {formatRupiah(inv.total)}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-1 sm:gap-2">
              <button onClick={() => onPrint(inv)} className="text-gray-600 hover:text-purple-600 bg-gray-100 hover:bg-purple-50 p-1.5 sm:px-3 sm:py-1.5 rounded-md inline-flex items-center transition-colors" title="Cetak">
                <Printer className="w-4 h-4 sm:mr-1.5" /> <span className="hidden sm:inline">Cetak</span>
              </button>
              {role === 'admin' && (
                <button onClick={() => setDeleteConfirm(inv)} className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 sm:px-2 sm:py-1.5 rounded-md inline-flex items-center transition-colors" title="Hapus">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
        </table>
      </div>
    </div>
  );
};

const PrintLayout = ({ invoice, onCancel, currentUser }) => {
  if (!invoice) return null;

  // Nama pembuat invoice diprioritaskan dari riwayat database, jika tidak ada baru ambil user yg sedang login
  const receptionistName = invoice.createdBy || currentUser?.name || 'Resepsionis';

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 print:static print:bg-white print:block overflow-y-auto">
      
      <style>
        {`
          @media print {
            @page { 
              size: A4; 
              margin: 0; 
            }
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background-color: white;
            }
            #invoice-print-area {
              width: 100% !important;
              max-width: 100% !important;
              padding: 15mm !important; 
              margin: 0 !important;
              box-shadow: none !important;
            }
          }
        `}
      </style>

      <div className="absolute top-4 right-4 flex space-x-2 print:hidden z-50">
        <button onClick={() => window.print()} className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg font-semibold flex items-center hover:bg-purple-700 transition-colors">
          <Printer className="w-5 h-5 mr-2" /> <span className="hidden sm:inline">Print</span>
        </button>
        <button onClick={onCancel} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-lg font-semibold flex items-center hover:bg-gray-300 transition-colors">
          <X className="w-5 h-5 sm:mr-2" /> <span className="hidden sm:inline">Tutup</span>
        </button>
      </div>

      <div id="invoice-print-area" className="bg-white w-full max-w-2xl shadow-2xl print:shadow-none p-6 sm:p-10 flex flex-col relative text-sm mx-auto">
        
        <div className="border-b-4 border-purple-600 pb-4 mb-6 flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <img src={HOTEL_LOGO_URL} alt="Hotel Logo" className="w-12 h-12 sm:w-16 sm:h-16 object-contain" />
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-purple-600 tracking-tight">{HOTEL_INFO.name}</h1>
              <p className="text-gray-600 text-[10px] sm:text-xs mt-1 w-full sm:w-3/4">{HOTEL_INFO.address}</p>
              <p className="text-gray-600 text-[10px] sm:text-xs mt-0.5">Telp: {HOTEL_INFO.phone}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl sm:text-3xl font-normal text-gray-500 tracking-widest uppercase">INVOICE</h2>
            <p className="text-purple-600 font-bold mt-1 text-xs sm:text-sm">{invoice.invoiceNumber}</p>
            <p className="text-gray-500 text-[10px] sm:text-xs mt-1">Dicetak: {formatTanggalWaktu(invoice.printDate)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 text-sm">
          <div>
            <h3 className="font-bold text-gray-800 border-b border-gray-200 mb-2 pb-1 uppercase text-xs tracking-wider">Ditagihkan Kepada:</h3>
            <p className="font-bold text-base uppercase text-purple-600">{invoice.guestName}</p>
            {invoice.guestPhone && <p className="text-gray-600 mt-1">Telp: {invoice.guestPhone}</p>}
            {invoice.guestAddress && <p className="text-gray-600 mt-1 whitespace-pre-wrap">{invoice.guestAddress}</p>}
          </div>
          <div>
            <h3 className="font-bold text-gray-800 border-b border-gray-200 mb-2 pb-1 uppercase text-xs tracking-wider">Detail Menginap:</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr><td className="text-gray-600 py-0.5">Check-in</td><td className="font-medium text-right">{formatTanggal(invoice.checkIn)}</td></tr>
                <tr><td className="text-gray-600 py-0.5">Check-out</td><td className="font-medium text-right">{formatTanggal(invoice.checkOut)}</td></tr>
                <tr><td className="text-gray-600 py-0.5">Durasi</td><td className="font-medium text-right">{invoice.nights} Malam</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full mb-6 text-xs sm:text-sm table-auto">
            <thead className="bg-purple-50 border-t-2 border-b-2 border-purple-200">
              <tr>
                <th className="py-2 px-2 text-left font-bold text-gray-800 uppercase text-[10px]">Deskripsi</th>
                <th className="py-2 px-2 text-center font-bold text-gray-800 uppercase text-[10px]">Malam</th>
                <th className="py-2 px-2 text-right font-bold text-gray-800 uppercase text-[10px]">Harga</th>
                <th className="py-2 px-2 text-right font-bold text-gray-800 uppercase text-[10px]">Extra Bed</th>
                <th className="py-2 px-2 text-right font-bold text-gray-800 uppercase text-[10px]">Diskon</th>
                <th className="py-2 px-2 text-right font-bold text-gray-800 uppercase text-[10px]">Jumlah</th>
              </tr>
            </thead>
            <tbody className="border-b border-gray-200">
              <tr>
                <td className="py-3 px-2 text-gray-800">
                  <span className="font-bold text-purple-900 block">Kamar {invoice.roomNumber}</span>
                  <span className="text-gray-500 text-xs">{invoice.roomType}</span>
                </td>
                <td className="py-3 px-2 text-center text-gray-800 align-top">{invoice.nights}</td>
                <td className="py-3 px-2 text-right text-gray-800 align-top">{formatRupiah(invoice.roomPrice)}</td>
                <td className="py-3 px-2 text-right text-gray-800 align-top">
                  {invoice.extraBed > 0 ? formatRupiah(invoice.extraBed) : '-'}
                </td>
                <td className="py-3 px-2 text-right text-red-600 align-top">
                  {invoice.discount > 0 ? `-${formatRupiah(invoice.discount)}` : '-'}
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
              <span className="text-purple-800">TOTAL KESELURUHAN</span>
              <span className="text-purple-900">{formatRupiah(invoice.total)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4 pt-2 pb-4">
          <div className="text-center w-48 sm:w-64 pr-0 sm:pr-4">
            <p className="text-gray-800 mb-20 text-xs sm:text-sm">
              Sungai Danau, ........................ {new Date(invoice.printDate).getFullYear()}
            </p>
            <p className="mt-2 text-sm font-bold text-gray-800 whitespace-nowrap uppercase">
              ( {receptionistName} )
            </p>
            <p className="text-gray-500 text-xs mt-1">Resepsionis</p>
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
  const [authUser, setAuthUser] = useState(() => {
    const saved = localStorage.getItem('lavender_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  
  const [rooms, setRooms] = useState(DEFAULT_ROOMS);
  const [invoices, setInvoices] = useState([]);
  
  const [printInvoiceData, setPrintInvoiceData] = useState(null);

  const [user, setUser] = useState(null);
  const [dbConnected, setDbConnected] = useState(false);
  const [debugMsg, setDebugMsg] = useState('Memeriksa koneksi ke Cloud Database...');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'resepsionis'] },
    { id: 'create', label: 'Buat Invoice', icon: FilePlus, roles: ['admin', 'resepsionis'] },
    { id: 'history', label: 'Riwayat Invoice', icon: History, roles: ['admin', 'resepsionis'] },
    { id: 'rooms', label: 'Data Kamar', icon: BedDouble, roles: ['admin'] },
  ];

  const visibleMenuItems = menuItems.filter(m => m.roles.includes(authUser?.role));

  useEffect(() => {
    const currentMenu = visibleMenuItems.find(m => m.id === activeTab) || visibleMenuItems[0];
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = HOTEL_LOGO_URL;
  }, [activeTab]);

  useEffect(() => {
    if (!db) {
      setDebugMsg("🔴 Kunci API (Environment Variables) tidak terbaca. Pastikan sudah di-Redeploy di Vercel tanpa cache.");
      return;
    }
    
    if (!auth) return;

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
        const keyHint = currentApiKey ? currentApiKey.substring(0, 7) + "..." : "Kosong";
        
        if (err.code === 'auth/configuration-not-found') {
           setDebugMsg(`🔴 Cek Kunci API Vercel! Kunci yg terpasang berawalan: "${keyHint}". Jika beda dengan "lavender-data-baru", ganti di Vercel dan Redeploy!`);
        } else if (err.code === 'auth/unauthorized-domain') {
          setDebugMsg(`🔴 Akses Ditolak: Tambahkan domain "${window.location.hostname}" ke menu Authorized Domains di Firebase.`);
        } else {
          setDebugMsg(`🔴 Error Login Database: ${err.message}`);
        }
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setDebugMsg("🟢 Terhubung ke Cloud Database!");
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    
    setDbConnected(true);

    const invoicesRef = collection(db, 'artifacts', appId, 'public', 'data', 'invoices');
    const unsubInvoices = onSnapshot(invoicesRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInvoices(data);
    }, (err) => console.error("Gagal baca invoices:", err));

    const roomsRef = collection(db, 'artifacts', appId, 'public', 'data', 'rooms');
    const unsubRooms = onSnapshot(roomsRef, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRooms(data);
      } else {
        DEFAULT_ROOMS.forEach(r => {
          setDoc(doc(roomsRef, r.id.toString()), r);
        });
      }
    }, (err) => console.error("Gagal baca kamar:", err));

    return () => { unsubInvoices(); unsubRooms(); };
  }, [user]);

  const saveToDb = async (collectionName, data) => {
    if (db) {
      if (!user) {
        throw new Error("Akses ditolak Firebase: Pastikan Kunci API Vercel sudah benar dan Domain sudah didaftarkan.");
      }
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', collectionName, data.id.toString());
      await setDoc(docRef, data);
    } else {
      if (collectionName === 'invoices') setInvoices(prev => [...prev.filter(i => i.id !== data.id), data]);
      if (collectionName === 'rooms') setRooms(prev => [...prev.filter(r => r.id !== data.id), data]);
    }
  };

  const deleteFromDb = async (collectionName, id) => {
    if (db) {
      if (!user) {
        throw new Error("Akses ditolak Firebase: Pastikan Kunci API Vercel sudah benar dan Domain sudah didaftarkan.");
      }
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', collectionName, id.toString());
      await deleteDoc(docRef);
    } else {
      if (collectionName === 'invoices') setInvoices(prev => prev.filter(i => i.id !== id));
      if (collectionName === 'rooms') setRooms(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleLogin = (userData) => {
    localStorage.setItem('lavender_user', JSON.stringify(userData));
    setAuthUser(userData);
    setActiveTab('dashboard');
  };

  const confirmLogout = () => {
    localStorage.removeItem('lavender_user');
    setAuthUser(null);
    setIsLogoutModalOpen(false);
  };

  if (!authUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans overflow-hidden">
      
      {printInvoiceData && (
        <PrintLayout 
          invoice={printInvoiceData} 
          onCancel={() => setPrintInvoiceData(null)} 
          currentUser={authUser}
        />
      )}

      {/* Modal Konfirmasi Logout */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-4 mx-auto">
              <LogOut className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Keluar Sistem?</h3>
            <p className="text-sm text-center text-gray-500 mb-6">
              Sesi Anda akan diakhiri dan Anda harus login kembali untuk masuk ke sistem.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setIsLogoutModalOpen(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors">Batal</button>
              <button onClick={confirmLogout} className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold text-sm rounded-xl hover:bg-red-700 transition-colors">Ya, Keluar</button>
            </div>
          </div>
        </div>
      )}

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-20 backdrop-blur-sm z-20 md:hidden print:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      <div className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out z-30 w-64 bg-gradient-to-b from-fuchsia-900 to-purple-900 text-white flex flex-col print:hidden shadow-2xl md:shadow-none`}>
        
        <button 
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute top-4 right-4 md:hidden text-fuchsia-200 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-2 text-pink-200">
            <img src={HOTEL_LOGO_URL} alt="Logo" className="w-8 h-8 rounded bg-white p-0.5" />
            <h1 className="text-xl font-bold tracking-wider">LAVENDER</h1>
          </div>
          <p className="text-xs text-fuchsia-300">Hotel Management System</p>
          <div className="mt-3 inline-block px-2 py-1 bg-white/10 rounded border border-white/20 text-[10px] uppercase tracking-widest text-pink-100 font-bold">
            Akses: {authUser.role}
          </div>
        </div>

        <nav className="flex-1 mt-4 space-y-1 px-3">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false); 
                }}
                className={`w-full flex items-center px-4 py-3 text-sm rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-white/20 text-white font-medium shadow-inner' 
                    : 'text-fuchsia-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-pink-300' : 'text-fuchsia-300'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-4 text-center">
            <p className="text-xs text-fuchsia-200 mb-1">Masuk Sebagai:</p>
            <p className="text-sm font-bold text-white">{authUser.name}</p>
          </div>
          <button 
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-full flex items-center justify-center px-4 py-2.5 bg-black/20 hover:bg-black/40 text-fuchsia-100 text-sm rounded-xl transition-colors duration-200"
          >
            <LogOut className="w-4 h-4 mr-2" /> Keluar
          </button>
        </div>

        <div className="p-4 bg-black/30 text-xs text-center text-fuchsia-200 flex flex-col items-center">
          Versi Cloud DB (Lavender)
          <span className={`mt-1.5 inline-block w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)] ${dbConnected ? 'bg-green-400 shadow-green-400/50' : 'bg-yellow-400 shadow-yellow-400/50'}`} title={dbConnected ? "Database Terhubung" : "Menunggu Koneksi"}></span>
        </div>
      </div>

      <div className="flex-1 h-screen overflow-y-auto print:hidden">
        <header className="bg-white shadow-sm px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden mr-3 text-purple-900 hover:text-pink-600 focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">
              {visibleMenuItems.find(m => m.id === activeTab)?.label}
            </h2>
          </div>
          <div className={`text-xs md:text-sm font-medium px-3 py-1.5 md:px-4 md:py-2 rounded-full flex items-center ${dbConnected ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
             <span className="hidden sm:inline">Status: </span> {dbConnected ? 'Online' : 'Offline'}
          </div>
        </header>

        {/* --- BANNER DIAGNOSIS ERROR --- */}
        {!dbConnected && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-3 text-center text-xs md:text-sm text-red-700 font-medium">
            {debugMsg}
          </div>
        )}

        <main className="p-4 md:p-8">
          {activeTab === 'dashboard' && <Dashboard />}
          
          {activeTab === 'rooms' && (
            <RoomManager rooms={rooms} setRooms={setRooms} saveToDb={saveToDb} deleteFromDb={deleteFromDb} />
          )}
          
          {activeTab === 'create' && (
            <CreateInvoice 
              rooms={rooms} 
              invoiceCount={invoices.length}
              saveToDb={saveToDb} 
              currentUser={authUser}
            />
          )}
          
          {activeTab === 'history' && (
            <InvoiceHistory 
              invoices={invoices} 
              onPrint={(inv) => setPrintInvoiceData(inv)}
              deleteFromDb={deleteFromDb}
              role={authUser.role}
            />
          )}
        </main>
      </div>
    </div>
  );
}
