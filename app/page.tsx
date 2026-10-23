 "use client";
import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, setDoc, serverTimestamp } from "firebase/firestore";
import { db, firebaseReady } from "../lib/firebase";

type Die = { id:number; sides:number; value:number };
type UserRule = { id:string; rules:string; index:number; nowpola:number; nextpola:number; expiry:string };
const SIDES = [4,6,8,10,12,20];

export default function Home() {
  const [dice,setDice] = useState<Die[]>([]);
  const [history,setHistory] = useState<number[][]>([]);
  const [tab,setTab] = useState<"game"|"dashboard">("game");
  const [users,setUsers] = useState<UserRule[]>([]);
  const [notice,setNotice] = useState("");
  const [busy,setBusy] = useState(false);

  const total = useMemo(()=>dice.reduce((sum,d)=>sum+d.value,0),[dice]);
  function addDie(sides:number) {
    setDice(old=>[...old,{id:Date.now()+Math.random(),sides,value:1}]);
  }
  function roll() {
    if (!dice.length) { setNotice("Tambahkan dadu terlebih dahulu."); return; }
    const rolled = dice.map(d=>({...d,value:Math.floor(Math.random()*d.sides)+1}));
    setDice(rolled);
    setHistory(h=>[rolled.map(d=>d.value),...h].slice(0,8));
    setNotice("Dadu berhasil dilempar.");
  }
  function clearDice() { setDice([]); setNotice("Dadu telah dihapus."); }
  async function loadUsers() {
    if (!db) { setNotice("Hubungkan Firebase melalui .env.local terlebih dahulu."); return; }
    setBusy(true);
    try {
      const snap=await getDocs(collection(db,"users"));
      setUsers(snap.docs.map(s=>({id:s.id,rules:String(s.data().rules??"20-25-30"),index:Number(s.data().index??0),nowpola:Number(s.data().nowpola??20),nextpola:Number(s.data().nextpola??25),expiry:String(s.data().expiry??"")})));
      setNotice("Data users berhasil dimuat.");
    } catch(e) { setNotice("Gagal memuat data. Periksa login dan Firestore Rules."); }
    finally { setBusy(false); }
  }
  async function saveUser(u:UserRule) {
    if (!db) { setNotice("Firebase belum dikonfigurasi."); return; }
    setBusy(true);
    try {
      await setDoc(doc(db,"users",u.id),{rules:u.rules,index:u.index,nowpola:u.nowpola,nextpola:u.nextpola,expiry:u.expiry,updatedAt:serverTimestamp()},{merge:true});
      setNotice("Data "+u.id+" berhasil disimpan.");
    } catch(e) { setNotice("Gagal menyimpan. Pastikan aturan keamanan Firestore mengizinkan admin."); }
    finally { setBusy(false); }
  }
  useEffect(()=>{ if(tab==="dashboard") void loadUsers(); },[tab]);

  return <main className="shell">
    <header className="topbar">
      <div className="brand"><span className="brandIcon">✦</span><div><b>DADU<span>LAB</span></b><small>GAME & CONTROL CENTER</small></div></div>
      <div className="status"><i className={firebaseReady?"on":""}/>{firebaseReady?"Firebase siap":"Mode demo"}</div>
    </header>
    <nav className="tabs">
      <button className={tab==="game"?"active":""} onClick={()=>setTab("game")}>◈ <span>Permainan</span></button>
      <button className={tab==="dashboard"?"active":""} onClick={()=>setTab("dashboard")}>▦ <span>Dashboard</span></button>
    </nav>

    {tab==="game" ? <section className="content">
      <div className="hero"><div className="eyebrow">DICE ROLLER / 01</div><h1>Lempar <em>dadu.</em></h1><p>Pilih jenis dadu, lempar, dan lihat hasilnya secara instan.</p></div>
      <div className="panel">
        <div className="panelHead"><div><h2>Area permainan</h2><p>{dice.length} dadu dipilih</p></div><span className="live">● LIVE</span></div>
        <div className="diceBoard">
          {dice.length===0 ? <div className="empty"><div className="emptyDice">⚄</div><b>Belum ada dadu</b><span>Pilih salah satu jenis dadu di bawah.</span></div> :
            dice.map(d=><button className="die" key={d.id} title={`Hapus d${d.sides}`} onClick={()=>setDice(old=>old.filter(x=>x.id!==d.id))}><small>D{d.sides}</small><strong>{d.value}</strong><span>× hapus</span></button>)}
        </div>
        <div className="totalRow"><span>TOTAL NILAI</span><strong>{total}</strong></div>
        <div className="choose"><label>PILIH JENIS DADU</label><div className="dieTypes">{SIDES.map(s=><button key={s} onClick={()=>addDie(s)}><span className="poly">◆</span><b>{s}</b><small>D{s}</small></button>)}</div></div>
        <div className="actions"><button className="roll" onClick={roll}>↻ &nbsp; Lempar dadu</button><button className="clear" onClick={clearDice}>Hapus semua</button></div>
        {notice&&<p className="notice" role="status">{notice}</p>}
      </div>
      <div className="panel history"><div className="panelHead"><div><h2>Riwayat lemparan</h2><p>8 hasil terakhir di sesi ini</p></div><span className="historyIcon">◷</span></div>
        {history.length===0?<div className="historyEmpty">Hasil lemparan akan muncul di sini.</div>:history.map((h,i)=><div className="historyItem" key={i}><span>#{history.length-i}</span><div>{h.map((n,j)=><b key={j}>{n}</b>)}</div><strong>{h.reduce((a,b)=>a+b,0)}</strong></div>)}
      </div>
      <footer> DADULAB <span>•</span> Aplikasi dadu online</footer>
    </section> : <section className="content">
      <div className="hero"><div className="eyebrow">FIREBASE / ADMIN</div><h1>Data <em>pengguna.</em></h1><p>Kelola field rules, index, nowpola, nextpola, dan expiry pada koleksi users.</p></div>
      <div className="panel"><div className="panelHead"><div><h2>Struktur Firestore</h2><p>Collection: users</p></div><button className="smallButton" onClick={loadUsers} disabled={busy}>{busy?"Memuat…":"↻ Muat ulang"}</button></div>
        {!firebaseReady&&<div className="setup"><b>Firebase belum terhubung</b><p>Salin <code>.env.example</code> menjadi <code>.env.local</code>, lalu isi konfigurasi Firebase dari Firebase Console. Restart server setelah mengubah env.</p></div>}
        {users.length===0?<div className="historyEmpty">Belum ada data ditampilkan. Tekan “Muat ulang” setelah Firebase dikonfigurasi.</div>:<div className="userList">{users.map(u=><div className="userCard" key={u.id}><div className="userTitle"><b>/{u.id}</b><span>DOCUMENT</span></div><label>Rules<input value={u.rules} onChange={e=>setUsers(a=>a.map(x=>x.id===u.id?{...x,rules:e.target.value}:x))}/></label><div className="fieldGrid"><label>Index<input type="number" value={u.index} onChange={e=>setUsers(a=>a.map(x=>x.id===u.id?{...x,index:Number(e.target.value)}:x))}/></label><label>Nowpola<input type="number" value={u.nowpola} onChange={e=>setUsers(a=>a.map(x=>x.id===u.id?{...x,nowpola:Number(e.target.value)}:x))}/></label><label>Nextpola<input type="number" value={u.nextpola} onChange={e=>setUsers(a=>a.map(x=>x.id===u.id?{...x,nextpola:Number(e.target.value)}:x))}/></label><label>Expiry<input value={u.expiry} placeholder="ISO / tanggal" onChange={e=>setUsers(a=>a.map(x=>x.id===u.id?{...x,expiry:e.target.value}:x))}/></label></div><button className="roll save" onClick={()=>saveUser(u)} disabled={busy}>Simpan perubahan</button></div>)}</div>}
        {notice&&<p className="notice" role="status">{notice}</p>}
      </div>
      <div className="panel"><h2>Catatan keamanan</h2><p className="muted">Dashboard ini memakai Firebase Web SDK. Aktifkan Firebase Authentication dan batasi akses tulis melalui Firestore Security Rules untuk akun admin sebelum dipakai produksi.</p></div>
      <footer>DADULAB <span>•</span> Admin dashboard</footer>
    </section>}
  </main>;
}
