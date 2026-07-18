export default function Footer(){
  return (
    <footer style={{marginTop:40, padding:"24px 16px", borderTop:"1px solid var(--border)", textAlign:"center", fontSize:13, opacity:0.8}}>
      <p style={{margin:"0 0 8px", fontWeight:600}}>Disclaimer: Emovra is for wellness & self-reflection only, not a medical diagnosis.</p>
      <p style={{margin:0, lineHeight:1.6}}>
        If you feel unsafe, please reach out now — <b>Tele-MANAS: 14416</b> | <b>Kiran: 1800-599-0019</b> | <b>AASRA: 1800-233-3330</b>
        <br/> You are not alone. Talking to a trusted person or professional can help.
      </p>
      <p style={{margin:"12px 0 0", fontSize:11, opacity:0.6}}>© {new Date().getFullYear()} Emovra / MindGuard • Built for well-being</p>
    </footer>
  )
}