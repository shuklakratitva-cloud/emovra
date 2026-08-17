import { useState, useEffect } from "react";
import { saveMood, loadMoodHistory, deleteMoodById } from "../utils/storage";
import { generateId } from "../utils/helpers";
export default function useMood(){
 const [currentMood,setCurrentMood]=useState("");
 const [moodHistory,setMoodHistory]=useState([]);
 useEffect(()=>{ const h=loadMoodHistory(); setMoodHistory(h); if(h.length>0) setCurrentMood(h[0].mood); },[]);
 function addMood(mood){ if(!mood) return; const e={id:generateId(),mood,timestamp:Date.now()}; saveMood(e); const u=loadMoodHistory(); setMoodHistory(u); setCurrentMood(mood); }
 function removeMood(id){ deleteMoodById(id); const u=loadMoodHistory(); setMoodHistory(u); if(u.length>0) setCurrentMood(u[0].mood); else setCurrentMood(""); }
 function clearMoodHistory(){ localStorage.removeItem("mental_health_mood_history"); setMoodHistory([]); setCurrentMood(""); }
 const latestMood=moodHistory.length>0?moodHistory[0]:null;
 const moodStats=moodHistory.reduce((s,i)=>{s[i.mood]=(s[i.mood]||0)+1;return s;},{});
 return {currentMood,setCurrentMood,latestMood,moodHistory,moodStats,addMood,removeMood,clearMoodHistory};
}
