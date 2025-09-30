// components/GrowthMetric.js
import React,{useEffect,useState} from "react";
export default function GrowthMetric({ fetchUrl }) {
  const [g,setG]=useState(null); const [loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{try{
    const r=await fetch(fetchUrl); if(!r.ok) throw new Error();
    const d=await r.json(); const h=d.history||[];
    if(h.length>=2){ const first=h[0].totalUSD, last=h[h.length-1].totalUSD; const pct=((last-first)/first)*100;
      setG({percentage:pct.toFixed(1), start:first, end:last}); }
  }catch(e){}finally{setLoading(false);}})();},[fetchUrl]);
  if(loading) return <p>Loading growth data...</p>;
  if(!g) return <p>No growth data available.</p>;
  return (<div className="bg-green-600 text-white rounded-lg shadow-md p-6 mb-8">
    <h2 className="text-2xl font-semibold mb-2">Cumulative Growth</h2>
    <p className="text-4xl font-bold">{g.percentage}%</p>
    <p className="text-sm mt-2 opacity-80">Since launch (${g.start.toLocaleString()} → ${g.end.toLocaleString()})</p>
  </div>);
}