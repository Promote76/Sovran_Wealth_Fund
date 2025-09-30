// components/ReservesHistoryChart.js
import React,{useEffect,useState} from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
export default function ReservesHistoryChart({ fetchUrl }) {
  const [history,setHistory]=useState([]); const [loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{try{
    const r=await fetch(fetchUrl);
    if(r.status===204){setHistory([]);} else { const d=await r.json(); setHistory(d.history||[]); }
  }catch(e){}finally{setLoading(false);}})();},[fetchUrl]);
  if(loading) return <p>Loading reserve history...</p>;
  if(history.length===0) return <p>No reserve history available.</p>;
  return (<div className="w-full h-96 mt-10">
    <h2 className="text-2xl font-semibold mb-4">Reserves Over Time</h2>
    <ResponsiveContainer><LineChart data={history} margin={{top:20,right:30,left:0,bottom:0}}>
      <CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date"/><YAxis tickFormatter={v=>`$${(v/1000).toFixed(0)}k`}/>
      <Tooltip formatter={v=>[`$${Number(v).toLocaleString()}`,"Total USD"]}/><Line type="monotone" dataKey="totalUSD" stroke="#4F46E5" strokeWidth={3} dot={{r:3}}/>
    </LineChart></ResponsiveContainer></div>);
}