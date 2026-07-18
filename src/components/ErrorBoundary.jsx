import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding:40, textAlign:"center", fontFamily:"system-ui"}}>
          <h2>😢 Something went wrong</h2>
          <p style={{color:"#666"}}>{this.state.error?.message}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{padding:"10px 20px", borderRadius:8, border:"none", background:"#7c3aed", color:"white", cursor:"pointer", marginTop:16}}
          >
            Reload App
          </button>
          <p style={{marginTop:20, fontSize:12, opacity:0.6}}>
            Check console (F12) for details. This prevents full white screen.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}