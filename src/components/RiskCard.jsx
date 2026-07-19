export default function RiskCard({ result }) {
  if (!result) return null;

  const colorMap = {
    GREEN: { bg: '#dcfce7', border: '#22c55e', text: '#166534', label: 'Doing Okay' },
    YELLOW: { bg: '#fef9c3', border: '#eab308', text: '#854d0e', label: 'Moderate Stress' },
    ORANGE: { bg: '#ffedd5', border: '#f97316', text: '#9a3412', label: 'Elevated Concern' },
    RED: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', label: 'High Risk' },
  };

  const style = colorMap[result.color] || colorMap.GREEN;

  return (
    <div style={{
      padding: 20,
      borderRadius: 16,
      background: style.bg,
      border: `2px solid ${style.border}`,
      color: style.text
    }}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <strong>{style.label}</strong>
        <span style={{fontSize:12, padding:'4px 8px', background:'white', borderRadius:999, border:`1px solid ${style.border}`}}>
          {result.color} • Score {result.score}
        </span>
      </div>
      <p style={{marginTop:10, fontSize:13}}>{result.message}</p>
      {result.reasons && <small style={{opacity:0.7}}>Reason: {result.reasons.join(', ')}</small>}
      {result.text && <p style={{marginTop:12, fontSize:12, opacity:0.8, fontStyle:'italic'}}>“{result.text.slice(0,200)}...”</p>}
    </div>
  );
}