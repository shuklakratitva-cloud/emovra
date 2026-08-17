const TYPO_MAP = {
  "anxius":"anxious","anxous":"anxious","anxiouss":"anxious","anxity":"anxiety",
  "depresed":"depressed","depress":"depressed","lonley":"lonely","lonly":"lonely",
  "alon":"alone","overwelm":"overwhelmed","panick":"panic","nervus":"nervous",
  "worrid":"worried","hopeles":"hopeless","worthles":"worthless",
  "iam":"i am","im":"i am","i m":"i am","i'm":"i am","cant":"can't","dont":"don't"
};

export function cleanText(raw=''){
  if(!raw) return '';
  let t = raw.toLowerCase().trim();
  t = t.replace(/[!?.]{2,}/g,' ').replace(/[^a-z0-9\s'’]/g,' ');
  t = t.replace(/\s+/g,' ').trim();
  let words = t.split(' ').map(w=>TYPO_MAP[w]||w).join(' ');
  const EMOTIONS=["anxious","anxiety","sad","depressed","lonely","alone","overwhelmed","panic","nervous","hopeless","angry","happy"];
  return words.split(' ').map(w=>{
    if(EMOTIONS.includes(w)) return w;
    for(let e of EMOTIONS){
      if(Math.abs(w.length-e.length)>2) continue;
      let diff=0; for(let i=0;i<Math.min(w.length,e.length);i++) if(w[i]!==e[i]) diff++;
      diff+=Math.abs(w.length-e.length);
      if(diff<=2 && w.length>=4) return e;
    }
    return w;
  }).join(' ');
}