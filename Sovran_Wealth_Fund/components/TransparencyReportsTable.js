// components/TransparencyReportsTable.js
import React,{useEffect,useState} from "react";
export default function TransparencyReportsTable({ fetchReportsUrl }) {
  const [reports,setReports]=useState([]); const [loading,setLoading]=useState(true); const [error,setError]=useState(null);
  useEffect(()=>{(async()=>{try{
    const r=await fetch(fetchReportsUrl);
    if(r.status===204){setReports([]);return setLoading(false);}
    if(!r.ok) throw new Error(String(r.status));
    const d=await r.json(); setReports(d.reports||[]);
  }catch(e){setError("Could not load reports.");}finally{setLoading(false);}})();},[fetchReportsUrl]);
  if(loading) return <p>Loading reports...</p>;
  if(error) return <p className="text-red-600">{error}</p>;
  if(reports.length===0) return <p>No reports available yet.</p>;
  return (<div className="overflow-x-auto"><table className="min-w-full bg-white border">
    <thead><tr className="bg-gray-100"><th className="px-4 py-2 text-left">Report Type</th><th className="px-4 py-2 text-left">Date</th><th className="px-4 py-2 text-left">Description</th><th className="px-4 py-2 text-left">Link</th></tr></thead>
    <tbody>{reports.map((r,i)=><tr key={i} className="border-t hover:bg-gray-50">
      <td className="px-4 py-2">{r.type}</td><td className="px-4 py-2">{r.date}</td><td className="px-4 py-2">{r.description}</td>
      <td className="px-4 py-2">{r.link?<a className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer" href={r.link}>View</a>:"—"}</td>
    </tr>)}</tbody></table></div>);
}