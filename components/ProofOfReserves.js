// components/ProofOfReserves.js
import React,{useEffect,useState} from "react";
export default function ProofOfReserves({ fetchUrl }) {
  const [reserves,setReserves]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(null);
  useEffect(()=>{(async()=>{try{
    const r=await fetch(fetchUrl);
    if(r.status===204){setReserves([]);return setLoading(false);}
    if(!r.ok) throw new Error("fetch");
    const d=await r.json(); setReserves(d.reserves||[]);
  }catch(e){setError("Could not load proof of reserves.");}finally{setLoading(false);}})();},[fetchUrl]);
  if(loading) return <p>Loading reserves...</p>;
  if(error) return <p className="text-red-600">{error}</p>;
  return (
    <div className="overflow-x-auto mt-8">
      <h2 className="text-2xl font-semibold mb-4">On-Chain Proof of Reserves</h2>
      {reserves.length===0 ? <p>No tracked reserves yet.</p> :
      <table className="min-w-full bg-white border">
        <thead><tr className="bg-gray-100"><th className="px-4 py-2 text-left">Chain</th><th className="px-4 py-2 text-left">Wallet</th><th className="px-4 py-2 text-left">Balance</th><th className="px-4 py-2 text-left">USD</th></tr></thead>
        <tbody>{reserves.map((r,i)=><tr key={i} className="border-t hover:bg-gray-50">
          <td className="px-4 py-2">{r.chain}</td>
          <td className="px-4 py-2 font-mono truncate max-w-xs">{r.address}</td>
          <td className="px-4 py-2">{r.balance} {r.symbol}</td>
          <td className="px-4 py-2">${(r.usdValue||0).toLocaleString()}</td>
        </tr>)}</tbody>
      </table>}
    </div>
  );
}