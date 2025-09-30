// components/ReservesSummary.js
import React,{useEffect,useState} from "react";
export default function ReservesSummary({ fetchUrl }) {
  const [totalUSD,setTotalUSD]=useState(null); const [loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{try{
    const r=await fetch(fetchUrl);
    if(!r.ok) throw new Error("fetch");
    const d=await r.json(); setTotalUSD(d.totalUSD ?? 0);
  }catch(e){setTotalUSD(null);}finally{setLoading(false);}})();},[fetchUrl]);
  if(loading) return <p>Loading total reserves...</p>;
  if(totalUSD===null) return <p>Unable to load total reserves.</p>;
  return (<div className="bg-indigo-600 text-white rounded-lg shadow-md p-6 mb-8">
    <h2 className="text-2xl font-semibold mb-2">Total On-Chain Reserves</h2>
    <p className="text-4xl font-bold">${totalUSD.toLocaleString(undefined,{minimumFractionDigits:2})}</p>
    <p className="text-sm mt-2 opacity-80">Aggregated across configured wallets</p>
  </div>);
}