import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  Printer, 
  Calendar, 
  User, 
  Home, 
  DollarSign, 
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

const InvoiceHistory = ({ invoices, onPrint, deleteFromDb, role }) => {
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [limit, setLimit] = useState(15);
  const [printData, setPrintData] = useState(null);

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteFromDb(deleteConfirm, 'invoices');
      setToastMsg('Invoice berhasil dihapus!');
      setTimeout(() => setToastMsg(''), 3000);
    } catch (error) {
      setErrorMsg(error.message);
    }
    setDeleteConfirm(null);
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

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          inv.guestName.toLowerCase().includes(searchTerm.toLowerCase());
      let matchDate = true;
      if (dateFilter) {
        const invDate = new Date(inv.printDate);
        const localDateStr = `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, '0')}-${String(invDate.getDate()).padStart(2, '0')}`;
        matchDate = localDateStr === dateFilter;
      }
      return matchSearch && matchDate;
    }).sort((a, b) => b.id - a.id);
  }, [invoices, searchTerm, dateFilter]);

  const displayedInvoices = limit === 'all' ? filteredInvoices : filteredInvoices.slice(0, Number(limit));

  const handleLocalPrint = (inv) => {
    setPrintData(inv);
    setTimeout(() => {
      window.print();
      setPrintData(null);
    }, 500);
  };

  const handleVoid = (id) => {
    alert("Fitur Void / Batal Invoice membutuhkan integrasi fungsi Update Database (Backend). Secara UI, struktur tabel sudah disiapkan untuk status Void.");
  };

  const renderKamar = (inv) => {
    if (inv.rooms && inv.rooms.length > 0) {
      const roomNumbers = inv.rooms.map(r => r.roomNumber || r.roomId).join(', ');
      return (
        <div>
          <div className="font-semibold text-gray-800">{inv.guestName}</div>
          <div className="text-xs text-gray-500 mt-0.5">Kamar {roomNumbers} <span className="font-medium">({inv.rooms.length} Kamar)</span></div>
          {inv.companyName && <div className="text-[10px] font-bold text-blue-600 uppercase mt-1">{inv.companyName}</div>}
        </div>
      );
    } else {
      return (
        <div>
          <div className="font-semibold text-gray-800">{inv.guestName}</div>
          <div className="text-xs text-gray-500 mt-0.5">Kamar {inv.roomNumber} ({inv.roomType || inv.type})</div>
        </div>
      );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 relative">
      {printData && (
        <div className="fixed inset-0 z-[9999] bg-white overflow-y-auto print-modal-overlay">
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .print-modal-overlay, .print-modal-overlay * { visibility: visible; }
              .print-modal-overlay { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background: white; }
            }
          `}</style>
          <div className="p-8 max-w-4xl mx-auto bg-white text-black font-sans">
            <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight">INVOICE</h1>
                <h2 className="text-xl font-semibold text-gray-700 mt-2">HOTEL LAVENDER</h2>
                <p className="text-sm text-gray-500 mt-1 max-w-xs">Jl. Anggrek No. 123, Kota Kembang<br/>Telp: (021) 555-0198 | Web: lavender.com</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Nomor Invoice</p>
                <p className="text-xl font-bold text-gray-900">{printData.invoiceNumber}</p>
                <p className="text-sm text-gray-500 uppercase tracking-wider mt-4 mb-1">Tanggal Cetak</p>
                <p className="text-base font-semibold text-gray-900">{new Date(printData.printDate).toLocaleDateString('id-ID', {day:'2-digit', month:'long', year:'numeric'})}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wider mb-2 border-b pb-1 border-gray-200">Ditagihkan Kepada</p>
                <p className="font-bold text-gray-900 text-lg">{printData.guestName}</p>
                {printData.companyName && <p className="font-semibold text-blue-800">{printData.companyName}</p>}
                <p className="text-sm text-gray-700 mt-1">HP: {printData.guestPhone || '-'}</p>
                <p className="text-sm text-gray-700 mt-1">{printData.guestAddress || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wider mb-2 border-b pb-1 border-gray-200">Rincian & Pembayaran</p>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-gray-600">Check-in</span>
                  <span className="font-medium text-gray-900 text-right">{new Date(printData.checkIn).toLocaleDateString('id-ID')}</span>
                  <span className="text-gray-600">Check-out</span>
                  <span className="font-medium text-gray-900 text-right">{new Date(printData.checkOut).toLocaleDateString('id-ID')}</span>
                  <span className="text-gray-600">Durasi</span>
                  <span className="font-medium text-gray-900 text-right">{printData.nights} Malam</span>
                  <span className="text-gray-600">Metode Bayar</span>
                  <span className="font-medium text-gray-900 text-right">{printData.paymentMethod || 'Cash'}</span>
                  <span className="text-gray-600">Status</span>
                  <span className={`font-bold text-right ${printData.paymentStatus === 'Belum Lunas' ? 'text-red-600' : 'text-green-600'}`}>{printData.paymentStatus || 'Lunas'}</span>
                </div>
              </div>
            </div>

            <table className="w-full mb-8 border-collapse">
              <thead>
                <tr className="bg-gray-100 border-y-2 border-gray-300">
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Deskripsi Kamar</th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700">Malam</th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">Harga/Malam</th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">Extra Bed</th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">Diskon</th>
                  <th className="py-3 px-4 text-right text-sm font-semibold text-gray-700">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(printData.rooms || [printData]).map((r, idx) => (
                  <tr key={idx}>
                    <td className="py-4 px-4 text-sm text-gray-900 font-medium">
                      Kamar {r.roomNumber || r.roomId} <span className="text-gray-500 font-normal">({r.roomType || r.type || 'Standard'})</span>
                    </td>
                    <td className="py-4 px-4 text-sm text-center text-gray-700">{printData.nights}</td>
                    <td className="py-4 px-4 text-sm text-right text-gray-700">Rp {(r.pricePerNight || r.price || 0).toLocaleString('id-ID')}</td>
                    <td className="py-4 px-4 text-sm text-right text-gray-700">Rp {(Number(r.extraBed) || 0).toLocaleString('id-ID')}</td>
                    <td className="py-4 px-4 text-sm text-right text-gray-700">Rp {(Number(r.discount) || 0).toLocaleString('id-ID')}</td>
                    <td className="py-4 px-4 text-sm text-right font-semibold text-gray-900">Rp {(r.subtotal || printData.totalAmount || 0).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-800 bg-gray-50">
                  <td colSpan="5" className="py-4 px-4 text-right font-bold text-sm text-gray-700 uppercase">Total Keseluruhan</td>
                  <td className="py-4 px-4 text-right font-bold text-xl text-purple-700">Rp {Number(printData.totalAmount).toLocaleString('id-ID')}</td>
                </tr>
              </tfoot>
            </table>

            <div className="flex justify-end mt-16">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-16">Kota Kembang, {new Date(printData.printDate).toLocaleDateString('id-ID')}</p>
                <p className="font-bold text-gray-900 uppercase underline">{printData.operator || 'Resepsionis'}</p>
                <p className="text-xs text-gray-500 mt-1">Front Office Dept.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 shadow-xl rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Invoice?</h3>
            <p className="text-sm text-gray-500 mb-6">Data yang dihapus tidak bisa dikembalikan.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors">Batal</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-fade-in-up">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <p className="font-medium">{toastMsg}</p>
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

      <div className="p-4 bg-gray-50 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input type="text" placeholder="Cari Nama / No. Invoice..." className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="relative">
          <input type="date" title="Filter berdasarkan tanggal" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all text-gray-600" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="absolute right-2 top-2.5 text-gray-400 hover:text-red-500 bg-white" title="Hapus Filter Tanggal"><X className="w-4 h-4" /></button>
          )}
        </div>
        <div>
          <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all text-gray-700 font-medium" value={limit} onChange={(e) => setLimit(e.target.value)}>
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
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tamu / Kamar</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status & Metode</th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayedInvoices.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Data invoice tidak ditemukan.</td></tr>
            ) : displayedInvoices.map((inv) => (
              <tr key={inv.id} className={`hover:bg-gray-50 transition-colors ${inv.status === 'Void' ? 'opacity-50 bg-gray-50' : ''}`}>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-purple-600 text-sm">{inv.invoiceNumber}</div>
                  <div className="text-[10px] text-gray-400 mt-1">{new Date(inv.printDate).toLocaleDateString('id-ID')}</div>
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  {renderKamar(inv)}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  {inv.status === 'Void' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">DIBATALKAN</span>
                  ) : (
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${inv.paymentStatus === 'Lunas' || !inv.paymentStatus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {inv.paymentStatus || 'Lunas'}
                      </span>
                      <span className="text-[10px] text-gray-500 font-semibold uppercase">{inv.paymentMethod || 'Cash'}</span>
                    </div>
                  )}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                  Rp {Number(inv.totalAmount).toLocaleString('id-ID')}
                </td>
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-3">
                    <button onClick={() => handleLocalPrint(inv)} className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-1.5 rounded-lg transition-colors" title="Cetak / Download PDF">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    </button>
                    {inv.status !== 'Void' && role === 'admin' && (
                      <button onClick={() => handleVoid(inv.id)} className="text-orange-500 hover:text-orange-700 hover:bg-orange-50 p-1.5 rounded-lg transition-colors" title="Batalkan Invoice">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                      </button>
                    )}
                    {role === 'admin' && (
                      <button onClick={() => setDeleteConfirm(inv.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Hapus Permanen">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CreateInvoice = ({ rooms, invoiceCount, saveToDb, currentUser }) => {
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [formData, setFormData] = useState({
    guestName: '', guestPhone: '', guestAddress: '', companyName: '',
    checkIn: '', checkOut: '', paymentMethod: 'Cash', paymentStatus: 'Lunas',
    rooms: [{ id: Date.now(), roomId: '', discount: 0, extraBed: 0 }]
  });

  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => String(a.number).localeCompare(String(b.number), undefined, { numeric: true }));
  }, [rooms]);

  const nights = useMemo(() => {
    if (!formData.checkIn || !formData.checkOut) return 0;
    const start = new Date(formData.checkIn);
    const end = new Date(formData.checkOut);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  }, [formData.checkIn, formData.checkOut]);

  const calculateRoomSubtotal = useCallback((roomItem) => {
    const roomData = rooms.find(r => r.id.toString() === roomItem.roomId);
    if (!roomData) return 0;
    return (Number(roomData.price) * nights) + Number(roomItem.extraBed || 0) - Number(roomItem.discount || 0);
  }, [rooms, nights]);

  const totalAmount = useMemo(() => {
    return formData.rooms.reduce((total, room) => total + calculateRoomSubtotal(room), 0);
  }, [formData.rooms, calculateRoomSubtotal]);

  const handleAddRoom = () => {
    setFormData(prev => ({
      ...prev,
      rooms: [...prev.rooms, { id: Date.now(), roomId: '', discount: 0, extraBed: 0 }]
    }));
  };

  const handleRemoveRoom = (id) => {
    setFormData(prev => ({
      ...prev,
      rooms: prev.rooms.filter(r => r.id !== id)
    }));
  };

  const handleRoomChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      rooms: prev.rooms.map(r => r.id === id ? { ...r, [field]: value } : r)
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    const unselectedRooms = formData.rooms.filter(r => !r.roomId);
    if (unselectedRooms.length > 0) {
      setErrorMsg("Mohon pilih nomor kamar untuk semua baris yang telah ditambahkan.");
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(invoiceCount).padStart(4, '0')}`;
    
    const roomsToSave = formData.rooms.map(roomItem => {
      const roomData = rooms.find(r => r.id.toString() === roomItem.roomId);
      return {
        roomId: roomData.id,
        roomNumber: roomData.number,
        roomType: roomData.type,
        pricePerNight: roomData.price,
        extraBed: Number(roomItem.extraBed || 0),
        discount: Number(roomItem.discount || 0),
        subtotal: calculateRoomSubtotal(roomItem)
      };
    });

    const newInvoice = {
      id: Date.now(),
      invoiceNumber,
      guestName: formData.guestName,
      guestPhone: formData.guestPhone,
      guestAddress: formData.guestAddress,
      companyName: formData.companyName,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      paymentMethod: formData.paymentMethod,
      paymentStatus: formData.paymentStatus,
      rooms: roomsToSave,
      totalAmount,
      nights,
      printDate: new Date().toISOString(),
      operator: currentUser,
      status: 'Valid'
    };

    newInvoice.roomId = roomsToSave[0].roomId;
    newInvoice.roomNumber = roomsToSave[0].roomNumber;
    newInvoice.roomType = roomsToSave[0].roomType;
    
    try {
      await saveToDb(newInvoice);
      setSuccessMsg(`Invoice ${invoiceNumber} berhasil diterbitkan!`);
      setFormData({
        guestName: '', guestPhone: '', guestAddress: '', companyName: '',
        checkIn: '', checkOut: '', paymentMethod: 'Cash', paymentStatus: 'Lunas',
        rooms: [{ id: Date.now(), roomId: '', discount: 0, extraBed: 0 }]
      });
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg("Gagal menyimpan: " + err.message);
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative max-w-4xl mx-auto">
      {successMsg && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-900 text-white px-6 py-2 rounded-full shadow-xl flex items-center gap-2 z-10 animate-fade-in-down">
          <CheckCircle className="w-4 h-4 text-green-400" /> <span className="text-sm font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-2 rounded-full shadow-xl flex items-center gap-2 z-10 animate-fade-in-down">
          <AlertCircle className="w-4 h-4" /> <span className="text-sm font-medium">{errorMsg}</span>
        </div>
      )}

      <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center bg-gray-50/50">
        <div className="bg-purple-100 p-2.5 rounded-xl mr-4"><Save className="w-5 h-5 text-purple-700" /></div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Buat Invoice Baru</h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Lengkapi form reservasi, mendukung multi-room dalam satu tagihan.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="p-4 sm:p-6">
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-200 pb-2 mb-4">1. Informasi Tamu & Penagihan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Tamu / Penanggung Jawab *</label>
              <input required type="text" className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm"
                value={formData.guestName} onChange={e => setFormData({...formData, guestName: e.target.value})} placeholder="Cth: Budi Santoso" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Perusahaan / Instansi (Opsional)</label>
              <input type="text" className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm"
                value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="Cth: PT. Maju Bersama" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. HP / WhatsApp (Opsional)</label>
              <input type="tel" className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm"
                value={formData.guestPhone} onChange={e => setFormData({...formData, guestPhone: e.target.value})} placeholder="Cth: 08123456789" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat (Opsional)</label>
              <input type="text" className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm"
                value={formData.guestAddress} onChange={e => setFormData({...formData, guestAddress: e.target.value})} placeholder="Alamat asal tamu" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-in *</label>
              <input required type="date" className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm"
                value={formData.checkIn} onChange={e => setFormData({...formData, checkIn: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Check-out *</label>
              <input required type="date" className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm"
                min={formData.checkIn} value={formData.checkOut} onChange={e => setFormData({...formData, checkOut: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Metode Pembayaran *</label>
              <select required className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm"
                value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                <option value="Cash">Cash (Tunai)</option>
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="EDC / Kartu Kredit">EDC / Kartu Kredit</option>
                <option value="QRIS">QRIS</option>
                <option value="Billing Corporate">Billing Corporate</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status Pembayaran *</label>
              <select required className="w-full p-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm font-semibold"
                value={formData.paymentStatus} onChange={e => setFormData({...formData, paymentStatus: e.target.value})}>
                <option value="Lunas" className="text-green-600">LUNAS (Paid)</option>
                <option value="Belum Lunas" className="text-red-600">BELUM LUNAS (Unpaid)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-4">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">2. Rincian Kamar & Biaya ({nights} Malam)</h3>
            <button type="button" onClick={handleAddRoom} className="text-xs bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200 font-bold flex items-center gap-1 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              Tambah Kamar
            </button>
          </div>

          <div className="space-y-3">
            {formData.rooms.map((room, index) => (
              <div key={room.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-end relative group transition-all hover:border-purple-300">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Kamar {index + 1} *</label>
                  <select required className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                    value={room.roomId} onChange={e => handleRoomChange(room.id, 'roomId', e.target.value)}>
                    <option value="">-- Pilih Kamar --</option>
                    {sortedRooms.map(r => {
                      const isSelected = formData.rooms.some(fr => fr.roomId === r.id.toString() && fr.id !== room.id);
                      return (
                        <option key={r.id} value={r.id} disabled={isSelected}>
                          Kamar {r.number} - {r.type} (Rp {Number(r.price).toLocaleString('id-ID')}/malam)
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                <div className="w-full md:w-32">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Extra Bed (Rp)</label>
                  <input type="number" min="0" className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                    value={room.extraBed} onChange={e => handleRoomChange(room.id, 'extraBed', e.target.value)} />
                </div>
                
                <div className="w-full md:w-32">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Diskon (Rp)</label>
                  <input type="number" min="0" className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                    value={room.discount} onChange={e => handleRoomChange(room.id, 'discount', e.target.value)} />
                </div>

                <div className="w-full md:w-44 bg-white p-2.5 border border-gray-200 rounded-md shadow-sm text-right">
                  <span className="block text-[10px] text-gray-400 uppercase font-bold tracking-wider">Subtotal Kamar</span>
                  <span className="text-sm font-bold text-purple-700">Rp {calculateRoomSubtotal(room).toLocaleString('id-ID')}</span>
                </div>

                {formData.rooms.length > 1 && (
                  <button type="button" onClick={() => handleRemoveRoom(room.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-md transition-colors" title="Hapus Kamar">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="bg-purple-50 border border-purple-100 px-6 py-4 rounded-xl w-full sm:w-auto">
            <span className="block text-xs text-purple-600 font-bold uppercase tracking-wider mb-1">Total Keseluruhan</span>
            <span className="text-2xl sm:text-3xl font-black text-purple-800">Rp {totalAmount.toLocaleString('id-ID')}</span>
          </div>
          <button type="submit" className="w-full sm:w-auto px-8 py-4 bg-purple-600 text-white font-bold text-base rounded-xl hover:bg-purple-700 shadow-lg hover:shadow-purple-200 transition-all flex items-center justify-center gap-2">
            <Save className="w-5 h-5" /> Terbitkan Invoice
          </button>
        </div>
      </form>
    </div>
  );
};

const RoomManager = ({ rooms, setRooms, saveToDb, deleteFromDb }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentRoom, setCurrentRoom] = useState({ id: null, number: '', type: 'Standard', price: '' });
  const [errorMsg, setErrorMsg] = useState('');

  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => String(a.number).localeCompare(String(b.number), undefined, { numeric: true }));
  }, [rooms]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentRoom.number || !currentRoom.price) {
      setErrorMsg('Nomor kamar dan harga harus diisi.');
      return;
    }

    try {
      const roomData = {
        ...currentRoom,
        id: currentRoom.id || Date.now(),
        price: Number(currentRoom.price)
      };
      
      await saveToDb(roomData, 'rooms');
      
      if (!currentRoom.id) {
        setRooms(prev => [...prev, roomData]);
      } else {
         setRooms(prev => prev.map(r => r.id === roomData.id ? roomData : r));
      }
      
      setIsEditing(false);
      setCurrentRoom({ id: null, number: '', type: 'Standard', price: '' });
      setErrorMsg('');
    } catch (error) {
      setErrorMsg(error.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteFromDb(id, 'rooms');
      setRooms(prev => prev.filter(r => r.id !== id));
    } catch (error) {
       setErrorMsg(error.message);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Manajemen Kamar</h2>
          <p className="text-gray-500 text-sm mt-0.5">Kelola data kamar hotel.</p>
        </div>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-purple-600 text-white font-semibold text-sm rounded-xl hover:bg-purple-700 transition-colors shadow-sm">
            + Tambah Kamar
          </button>
        )}
      </div>

      <div className="p-4 sm:p-6">
        {errorMsg && (
          <div className="mb-4 bg-red-100 text-red-700 px-4 py-3 rounded-lg text-sm">
            {errorMsg}
          </div>
        )}

        {isEditing && (
          <form onSubmit={handleSave} className="mb-8 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Kamar</label>
                <input type="text" required className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" value={currentRoom.number} onChange={e => setCurrentRoom({...currentRoom, number: e.target.value})} placeholder="Cth: 101" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Kamar</label>
                <select className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" value={currentRoom.type} onChange={e => setCurrentRoom({...currentRoom, type: e.target.value})}>
                  <option value="Standard">Standard</option>
                  <option value="Superior">Superior</option>
                  <option value="Deluxe">Deluxe</option>
                  <option value="Suite">Suite</option>
                  <option value="VIP">VIP</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga per Malam (Rp)</label>
                <input type="number" required min="0" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" value={currentRoom.price} onChange={e => setCurrentRoom({...currentRoom, price: e.target.value})} placeholder="Cth: 500000" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => { setIsEditing(false); setCurrentRoom({ id: null, number: '', type: 'Standard', price: '' }); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors">Batal</button>
              <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors">Simpan Kamar</button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto border border-gray-200 rounded-xl">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No. Kamar</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedRooms.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">Belum ada data kamar.</td></tr>
              ) : sortedRooms.map((room) => (
                <tr key={room.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap font-medium text-gray-900">{room.number}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-gray-600">{room.type}</td>
                  <td className="px-4 py-4 whitespace-nowrap font-medium text-green-600">Rp {Number(room.price).toLocaleString('id-ID')}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => { setCurrentRoom(room); setIsEditing(true); }} className="text-blue-600 hover:text-blue-900 mr-4 font-semibold">Edit</button>
                    <button onClick={() => handleDelete(room.id)} className="text-red-600 hover:text-red-900 font-semibold">Hapus</button>
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

export default function App() {
  const [activeTab, setActiveTab] = useState('history');
  const [invoices, setInvoices] = useState([]);
  const [rooms, setRooms] = useState([
    { id: 1, number: '101', type: 'Standard', price: 350000 },
    { id: 2, number: '102', type: 'Standard', price: 350000 },
    { id: 3, number: '201', type: 'Superior', price: 500000 },
    { id: 4, number: '301', type: 'Deluxe', price: 750000 }
  ]);
  const [currentUser, setCurrentUser] = useState('Resepsionis 1');
  const [role, setRole] = useState('admin');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const saveToDb = async (data, type = 'invoices') => {
    if (type === 'invoices') {
      setInvoices(prev => [data, ...prev]);
    } else {
      setRooms(prev => {
        const index = prev.findIndex(r => r.id === data.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = data;
          return updated;
        }
        return [...prev, data];
      });
    }
  };

  const deleteFromDb = async (id, type = 'invoices') => {
    if (type === 'invoices') {
      setInvoices(prev => prev.filter(i => i.id !== id));
    } else {
      setRooms(prev => prev.filter(r => r.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-purple-900 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-purple-800 md:hidden">
              <Menu className="w-5 h-5" />
            </button>
            <div className="bg-white/10 p-2 rounded-xl"><Home className="w-6 h-6 text-purple-200" /></div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-wide">Hotel Lavender</h1>
              <p className="text-xs text-purple-300">Front Office & Multi-Room Billing System</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 bg-purple-800/60 px-3 py-1.5 rounded-full border border-purple-700">
              <User className="w-4 h-4 text-purple-300" />
              <span className="text-sm font-medium">{currentUser} ({role})</span>
            </div>
            <button onClick={() => setRole(role === 'admin' ? 'staff' : 'admin')} className="text-xs bg-purple-700 hover:bg-purple-600 px-3 py-1.5 rounded-lg font-medium transition-colors">
              Switch ke {role === 'admin' ? 'Staff' : 'Admin'}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className={`md:block ${sidebarOpen ? 'block' : 'hidden'} md:col-span-1 space-y-2`}>
          <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 space-y-1">
            <button onClick={() => { setActiveTab('history'); setSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${activeTab === 'history' ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'}`}>
              <Download className="w-5 h-5" />
              <span>Riwayat Invoice</span>
            </button>
            <button onClick={() => { setActiveTab('create'); setSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${activeTab === 'create' ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'}`}>
              <Plus className="w-5 h-5" />
              <span>Buat Invoice Baru</span>
            </button>
            {role === 'admin' && (
              <button onClick={() => { setActiveTab('rooms'); setSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${activeTab === 'rooms' ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : 'text-gray-600 hover:bg-purple-50 hover:text-purple-700'}`}>
                <Home className="w-5 h-5" />
                <span>Manajemen Kamar</span>
              </button>
            )}
          </div>
        </aside>

        <main className="md:col-span-3">
          {activeTab === 'history' && (
            <InvoiceHistory invoices={invoices} deleteFromDb={deleteFromDb} role={role} />
          )}
          {activeTab === 'create' && (
            <CreateInvoice rooms={rooms} invoiceCount={invoices.length + 1} saveToDb={saveToDb} currentUser={currentUser} />
          )}
          {activeTab === 'rooms' && role === 'admin' && (
            <RoomManager rooms={rooms} setRooms={setRooms} saveToDb={saveToDb} deleteFromDb={deleteFromDb} />
          )}
        </main>
      </div>
    </div>
  );
}
