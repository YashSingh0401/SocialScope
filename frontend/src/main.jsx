import React, {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import './style.css';

const names={en:'English',hi:'Hindi',fr:'French',de:'German',ar:'Arabic',it:'Italian',es:'Spanish',pt:'Portuguese',und:'Undetermined',pending:'Pending'};
async function api(path,body){const r=await fetch(path,body===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});let d;try{d=await r.json()}catch{throw Error('The server did not return JSON. Check the backend connection.')}if(!r.ok)throw Error(typeof d.detail==='string'?d.detail:JSON.stringify(d.detail));return d;}
function Bars({items,total,language=false}){return <div className="bars">{items.map(x=><div className="barrow" key={x.label}><div><span>{language?(names[x.label]||x.label):x.label}</span><b>{x.count}</b></div><div className="track"><i className={x.label} style={{width:`${total?x.count/total*100:0}%`}}/></div></div>)}{!items.length&&<p className="muted">No data in this selection.</p>}</div>}
const demo=[{platform:'dataset',source_id:'nlp-demo-positive-en',actor_ref:'alpha_user',timestamp:'2026-01-01T10:00:00Z',text:'I absolutely love this excellent service and the wonderfully helpful team!',hashtags:['service','team'],interactions:[{kind:'mention',target_type:'actor',target_source_id:'beta_user',target_platform:'dataset'}]},{platform:'dataset',source_id:'nlp-demo-negative-en',actor_ref:'beta_user',timestamp:'2026-01-01T11:00:00Z',text:'This service is awful. I am very disappointed and angry about the terrible experience.',hashtags:['complaint'],interactions:[{kind:'reply',target_type:'actor',target_source_id:'alpha_user',target_platform:'dataset'}]},{platform:'dataset',source_id:'nlp-demo-neutral-en',actor_ref:'gamma_user',timestamp:'2026-01-01T12:00:00Z',text:'The meeting starts at ten o’clock tomorrow morning in the main office.',hashtags:['office'],interactions:[{kind:'mention',target_type:'actor',target_source_id:'alpha_user',target_platform:'dataset'}]},{platform:'dataset',source_id:'nlp-demo-positive-hi',actor_ref:'delta_user',timestamp:'2026-01-01T13:00:00Z',text:'यह सेवा बहुत अच्छी है और मुझे बहुत खुशी हुई।',hashtags:['service'],interactions:[{kind:'share',target_type:'actor',target_source_id:'beta_user',target_platform:'dataset'}]},{platform:'dataset',source_id:'nlp-demo-negative-hi',actor_ref:'epsilon_user',timestamp:'2026-01-01T14:00:00Z',text:'यह सेवा बहुत खराब है। मैं बहुत निराश और नाराज़ हूँ।',hashtags:['complaint'],interactions:[{kind:'reply',target_type:'actor',target_source_id:'delta_user',target_platform:'dataset'}]}];

function App(){
 const [page,setPage]=useState('Overview'),[overview,setOverview]=useState(null),[rows,setRows]=useState([]),[jobs,setJobs]=useState([]),[topicsData,setTopicsData]=useState({topics:[],total_events:0,noise_count:0}),[trendsData,setTrendsData]=useState({timeline:[],spike_alerts:[]}),[networkData,setNetworkData]=useState({elements:{nodes:[],edges:[]},metrics:{total_nodes:0,total_edges:0,communities_count:0,top_influencers:[],bridge_nodes:[]}}),[alertsData,setAlertsData]=useState({alerts:[],total_alerts:0}),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[connected,setConnected]=useState(false),[refresh,setRefresh]=useState(0),[offset,setOffset]=useState(0),[language,setLanguage]=useState(''),[sentiment,setSentiment]=useState(''),[platform,setPlatform]=useState(''),[showImport,setShowImport]=useState(false),[data,setData]=useState(''),[dataset,setDataset]=useState('my-dataset'),[mode,setMode]=useState('import'),[speed,setSpeed]=useState(60);
 const query=new URLSearchParams({...(language?{language}:{}),...(sentiment?{sentiment}:{}),...(platform?{platform}: {})}).toString();

 useEffect(()=>{let active=true;async function load(){try{const [o,e,j,top,tr,net,alt]=await Promise.all([api('/analytics/overview?'+query),api('/analytics/events?'+query+'&limit=20&offset='+offset),api('/replays'),api('/analytics/topics').catch(()=>({topics:[],total_events:0,noise_count:0})),api('/analytics/trends').catch(()=>({timeline:[],spike_alerts:[]})),api('/analytics/network').catch(()=>({elements:{nodes:[],edges:[]},metrics:{}})),api('/analytics/alerts').catch(()=>({alerts:[],total_alerts:0}))]);if(active){setOverview(o);setRows(e.items);setJobs(j.items);setTopicsData(top);setTrendsData(tr);setNetworkData(net);setAlertsData(alt);setConnected(true);setError('')}}catch(e){if(active){setError(e.message);setConnected(false)}}}load();const timer=setInterval(load,5000);return()=>{active=false;clearInterval(timer)}},[query,offset,refresh]);

 async function action(fn){setBusy(true);setNotice('');try{const message=await fn();setNotice(message||'Updated successfully.');setRefresh(v=>v+1)}catch(e){setError(e.message)}finally{setBusy(false)}}
 async function submit(){await action(async()=>{const events=JSON.parse(data);if(!Array.isArray(events))throw Error('Supply a JSON array of events.');const result=await api(mode==='import'?'/events/import':'/replays',{dataset_name:dataset,events,...(mode==='replay'?{speed:Number(speed)}:{})});setShowImport(false);return mode==='import'?`${result.inserted} inserted · ${result.duplicates} duplicates · ${result.conflicts} conflicts`:'Replay queued. The worker will process it in timestamp order.'})}
 function filter(setter,value){setter(value);setOffset(0)}

 return <div className="shell"><aside><a className="brand" href="#" onClick={e=>{e.preventDefault();setPage('Overview')}}><span className="brandmark">S</span>SocialScope<span className="beta">LAB</span></a><p className="navlabel">INTELLIGENCE WORKSPACE</p><nav>{['Overview','Trend radar','Network map','Alerts & Intel','Event explorer','Replay studio'].map((name,i)=><button key={name} className={page===name?'selected':''} onClick={()=>setPage(name)}><span>{['◈','⚡','🕸','⚠','≡','▷'][i]}</span>{name}</button>)}</nav><div className="asidefoot"><span className="pulse"/>Development workspace<p>v0.7 · Attention & CIB</p><small>Local processing. Evidence first.</small></div></aside>
 <main><header><span className="breadcrumb">Workspace <span>/</span> {page}</span><div className={'connection '+(connected?'good':'')}><i/>{connected?'Backend connected':'Backend unavailable'}</div></header><section className="body"><div className="titleline"><div><p className="eyebrow">SOCIAL INTELLIGENCE, IN CONTEXT</p><h1>{page}</h1><p className="subtitle">{page==='Overview'?'Understand the conversation. See what the evidence says.':page==='Trend radar'?'Detect emerging narratives and velocity spikes before they peak.':page==='Network map'?'Examine community structures, influencer PageRank, and bridge nodes.':page==='Alerts & Intel'?'Prioritize emerging situations with multi-signal Attention Scores and CIB detection.':page==='Event explorer'?'Read the posts behind every signal.':'Turn historical events into a repeatable data stream.'}</p></div><button className="primary" onClick={()=>setShowImport(true)}>＋ Import dataset</button></div>
 {error&&<div role="alert" className="error">{error}</div>}{notice&&<div role="status" className="notice">{notice}</div>}
 {['Overview','Event explorer'].includes(page)&&<div className="filters"><span>FILTER BY</span><label>Language<select value={language} onChange={e=>filter(setLanguage,e.target.value)}><option value="">All languages</option>{Object.entries(names).filter(([v])=>v!=='pending').map(([v,n])=><option key={v} value={v}>{n}</option>)}</select></label><label>Sentiment<select value={sentiment} onChange={e=>filter(setSentiment,e.target.value)}><option value="">All sentiments</option>{['positive','neutral','negative'].map(x=><option key={x}>{x}</option>)}</select></label><label>Platform<input placeholder="All platforms" value={platform} onChange={e=>filter(setPlatform,e.target.value)}/></label><button onClick={()=>{setLanguage('');setSentiment('');setPlatform('');setOffset(0)}}>Reset</button><span className="refresh">↻ Updates every 5s</span></div>}

 {page==='Overview'&&<><div className="metrics">{[['Total events',overview?.total,'In the selected scope'],['Analyzed',overview?.analyzed,'Language processing complete'],['Sentiment coverage',overview?`${overview.total?Math.round(overview.sentiment_available/overview.total*100):0}%`:null,'Supported predictions / events'],['Awaiting analysis',overview?overview.total-overview.analyzed:null,'Processed by the NLP worker']].map(([title,value,detail])=><article className="metric" key={title}><p>{title}</p><strong>{value??'—'}</strong><small>{detail}</small></article>)}</div><div className="grid"><article className="panel"><div className="panelhead"><h2>Conversation sentiment</h2><span className="tag">MODEL OUTPUT</span></div><p className="muted">Distribution of stored predictions</p><Bars items={overview?.sentiment||[]} total={overview?.total||0}/><div className="footnote">Unavailable includes pending, uncertain language, or unsupported text. It is not neutral sentiment.</div></article><article className="panel"><div className="panelhead"><h2>Language landscape</h2><span className="tag">DETECTED</span></div><p className="muted">Language inferred from content, not profile data</p><Bars items={overview?.languages||[]} total={overview?.total||0} language/></article></div><article className="panel timeline"><div className="panelhead"><h2>Conversation activity</h2><span className="tag">EVENT TIME · UTC</span></div><div className="activity">{(overview?.timeline||[]).map(x=><div className="day" key={x.day}><b>{x.count}</b><div style={{height:`${Math.max(4,100*x.count/Math.max(...overview.timeline.map(y=>y.count)))}px`}}/><small>{x.day.slice(0,10)}</small></div>)}{!overview?.timeline?.length&&<div className="empty"><h3>Your workspace is ready.</h3><p>Import your data or load five clearly labelled synthetic examples.</p><button disabled={busy} onClick={()=>action(async()=>{const r=await api('/events/import',{dataset_name:'synthetic NLP demo',events:demo});return `Synthetic demo: ${r.inserted} added, ${r.duplicates} already present.`})}>Load synthetic demo</button></div>}</div></article></>}

 {page==='Trend radar'&&<>
  {trendsData?.has_active_spike&&<div role="alert" className="notice" style={{background:'#fef3c7',borderColor:'#f59e0b',color:'#92400e'}}>
    <strong>⚡ Active Trend Spike Detected:</strong> Recent activity has surged beyond baseline volume.
  </div>}
  <div className="metrics">
    <article className="metric"><p>Discovered Topics</p><strong>{topicsData?.topics?.length??0}</strong><small>Semantic clusters formed</small></article>
    <article className="metric"><p>Cluster Coverage</p><strong>{topicsData?.total_events?Math.round((topicsData.total_events-topicsData.noise_count)/topicsData.total_events*100):0}%</strong><small>{topicsData?.noise_count??0} unclustered posts</small></article>
    <article className="metric"><p>Active Spikes</p><strong>{trendsData?.spike_alerts?.length??0}</strong><small>High velocity periods</small></article>
  </div>
  <div className="grid">
    <article className="panel">
      <div className="panelhead"><h2>Emerging topic clusters</h2><span className="tag">SEMANTIC CLUSTERS</span></div>
      <p className="muted">Grouped by semantic embeddings and representative keywords</p>
      <div className="topics-list" style={{display:'flex',flexDirection:'column',gap:'1rem',marginTop:'1rem'}}>
        {topicsData?.topics?.map(t=><div key={t.topic_id} style={{padding:'0.8rem',border:'1px solid #e2e8f0',borderRadius:'8px',background:'#f8fafc'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <strong style={{fontSize:'1rem'}}>{t.label}</strong>
            <span className="pill" style={{background:'#e0f2fe',color:'#0369a1'}}>{t.size} posts</span>
          </div>
          <div style={{marginTop:'0.4rem',display:'flex',gap:'0.3rem',flexWrap:'wrap'}}>
            {t.keywords?.map(k=><span key={k} style={{fontSize:'0.75rem',background:'#e2e8f0',padding:'2px 6px',borderRadius:'4px'}}>#{k}</span>)}
          </div>
          <p style={{fontSize:'0.85rem',color:'#475569',marginTop:'0.5rem',fontStyle:'italic'}}>"{t.exemplar_text}"</p>
        </div>)}
        {!topicsData?.topics?.length&&<p className="muted">No topic clusters formed yet. Import more conversation events.</p>}
      </div>
    </article>
    <article className="panel">
      <div className="panelhead"><h2>Velocity & Trend Detection</h2><span className="tag">BASELINE & SPIKES</span></div>
      <p className="muted">Rate of change and statistical baseline deviation</p>
      <div className="tablewrap" style={{marginTop:'1rem'}}>
        <table>
          <thead><tr><th>Period</th><th>Volume</th><th>Baseline</th><th>Growth</th><th>Status</th></tr></thead>
          <tbody>
            {(trendsData?.timeline||[]).slice(-7).reverse().map(b=><tr key={b.day}>
              <td><small>{b.day.slice(0,10)}</small></td>
              <td><b>{b.volume_now??b.count}</b></td>
              <td>{b.volume_baseline??'—'}</td>
              <td>{b.growth_rate!=null?`${(b.growth_rate*100).toFixed(0)}%`:'—'}</td>
              <td>{b.is_spike?<span className="pill" style={{background:'#fee2e2',color:'#991b1b'}}>⚡ SPIKE</span>:<span className="pill" style={{background:'#f1f5f9',color:'#64748b'}}>Normal</span>}</td>
            </tr>)}
            {!(trendsData?.timeline||[]).length&&<tr><td colSpan="5" className="muted" style={{textAlign:'center'}}>No timeline activity recorded yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </article>
  </div>
 </>}

 {page==='Network map'&&<>
  <div className="metrics">
    <article className="metric"><p>Network Nodes</p><strong>{networkData?.metrics?.total_nodes??0}</strong><small>Active actors & entities</small></article>
    <article className="metric"><p>Interactions</p><strong>{networkData?.metrics?.total_edges??0}</strong><small>Replies, shares, mentions</small></article>
    <article className="metric"><p>Communities</p><strong>{networkData?.metrics?.communities_count??0}</strong><small>Louvain clusters detected</small></article>
    <article className="metric"><p>Bridge Nodes</p><strong>{networkData?.metrics?.bridge_nodes?.length??0}</strong><small>High betweenness brokers</small></article>
  </div>
  <div className="grid">
    <article className="panel">
      <div className="panelhead"><h2>Top Key Opinion Leaders</h2><span className="tag">PAGERANK INFLUENCE</span></div>
      <p className="muted">Highest authority nodes driving information diffusion</p>
      <div className="tablewrap" style={{marginTop:'1rem'}}>
        <table>
          <thead><tr><th>Actor Node</th><th>PageRank Score</th><th>Role</th></tr></thead>
          <tbody>
            {(networkData?.metrics?.top_influencers||[]).map(inf=><tr key={inf.node}>
              <td><b>{inf.node}</b></td>
              <td><span className="pill" style={{background:'#dbeafe',color:'#1d4ed8'}}>{(inf.score*100).toFixed(2)}%</span></td>
              <td><small>Key Influencer</small></td>
            </tr>)}
            {!(networkData?.metrics?.top_influencers||[]).length&&<tr><td colSpan="3" className="muted" style={{textAlign:'center'}}>No interaction graph data yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </article>
    <article className="panel">
      <div className="panelhead"><h2>Information Bridge Brokers</h2><span className="tag">BETWEENNESS CENTRALITY</span></div>
      <p className="muted">Nodes connecting separate echo chambers & communities</p>
      <div className="tablewrap" style={{marginTop:'1rem'}}>
        <table>
          <thead><tr><th>Bridge Node</th><th>Betweenness</th><th>Role</th></tr></thead>
          <tbody>
            {(networkData?.metrics?.bridge_nodes||[]).map(br=><tr key={br.node}>
              <td><b style={{color:'#b45309'}}>{br.node}</b></td>
              <td><span className="pill" style={{background:'#fef3c7',color:'#b45309'}}>{br.betweenness}</span></td>
              <td><span className="tag" style={{background:'#fffbeb',color:'#b45309',border:'1px solid #fde68a'}}>Bridge Spreader</span></td>
            </tr>)}
            {!(networkData?.metrics?.bridge_nodes||[]).length&&<tr><td colSpan="3" className="muted" style={{textAlign:'center'}}>No bridge nodes detected in current graph.</td></tr>}
          </tbody>
        </table>
      </div>
    </article>
  </div>
  <article className="panel" style={{marginTop:'1.5rem'}}>
    <div className="panelhead"><h2>Network Interaction Edges</h2><span className="tag">{networkData?.elements?.edges?.length??0} EDGES</span></div>
    <div className="tablewrap" style={{maxHeight:'280px',overflowY:'auto'}}>
      <table>
        <thead><tr><th>Source</th><th>Interaction</th><th>Target</th><th>Weight</th></tr></thead>
        <tbody>
          {(networkData?.elements?.edges||[]).slice(0,50).map(e=><tr key={e.data.id}>
            <td><small>{e.data.source}</small></td>
            <td><span className="pill" style={{background:'#f3e8ff',color:'#7e22ce'}}>{e.data.kinds?.join(', ')}</span></td>
            <td><small>{e.data.target}</small></td>
            <td><b>{e.data.weight}</b></td>
          </tr>)}
          {!(networkData?.elements?.edges||[]).length&&<tr><td colSpan="4" className="muted" style={{textAlign:'center'}}>No interaction edges available.</td></tr>}
        </tbody>
      </table>
    </div>
  </article>
 </>}

 {page==='Alerts & Intel'&&<>
  <div className="metrics">
    <article className="metric"><p>Active Intelligence Alerts</p><strong>{alertsData?.total_alerts??0}</strong><small>Prioritized for review</small></article>
    <article className="metric"><p>Critical Severity</p><strong>{alertsData?.alerts?.filter(a=>a.severity==='CRITICAL').length??0}</strong><small>Attention score ≥ 75</small></article>
    <article className="metric"><p>Coordinated Campaigns</p><strong>{alertsData?.alerts?.filter(a=>a.cib_evidence?.is_coordinated).length??0}</strong><small>Astroturfing / bot swarms</small></article>
  </div>
  <div className="alerts-feed" style={{display:'flex',flexDirection:'column',gap:'1.2rem',marginTop:'1rem'}}>
    {alertsData?.alerts?.map(alertItem=><article className="panel" key={alertItem.alert_id} style={{borderLeft:`5px solid ${alertItem.severity==='CRITICAL'?'#ef4444':alertItem.severity==='HIGH'?'#f97316':alertItem.severity==='MEDIUM'?'#eab308':'#64748b'}`}}>
      <div className="panelhead" style={{alignItems:'flex-start'}}>
        <div>
          <div style={{display:'flex',gap:'0.5rem',alignItems:'center',marginBottom:'0.3rem'}}>
            <span className="pill" style={{fontWeight:'bold',background:alertItem.severity==='CRITICAL'?'#fee2e2':alertItem.severity==='HIGH'?'#ffedd5':alertItem.severity==='MEDIUM'?'#fef9c3':'#f1f5f9',color:alertItem.severity==='CRITICAL'?'#991b1b':alertItem.severity==='HIGH'?'#9a3412':alertItem.severity==='MEDIUM'?'#854d0e':'#334155'}}>{alertItem.severity}</span>
            <span className="tag">ATTENTION SCORE: <strong>{alertItem.attention_score}/100</strong></span>
            {alertItem.cib_evidence?.is_coordinated&&<span className="pill" style={{background:'#fce7f3',color:'#9d174d'}}>🤖 CIB BOT SWARM</span>}
          </div>
          <h2 style={{fontSize:'1.15rem',marginTop:'0.2rem'}}>{alertItem.topic}</h2>
        </div>
        <div className="actions">
          <button className="primary" onClick={()=>alert(`Intelligence brief generated for ${alertItem.topic}`)}>Export Brief</button>
        </div>
      </div>
      
      <div style={{marginTop:'0.8rem',background:'#f8fafc',padding:'0.8rem',borderRadius:'6px',border:'1px solid #e2e8f0'}}>
        <strong style={{fontSize:'0.85rem',color:'#334155'}}>EXPLAINABLE SIGNALS & REASONS:</strong>
        <ul style={{margin:'0.4rem 0 0 1.2rem',padding:0,fontSize:'0.85rem',color:'#475569'}}>
          {alertItem.reasons?.map((r,i)=><li key={i} style={{marginBottom:'3px'}}>{r}</li>)}
        </ul>
      </div>

      <div className="grid" style={{marginTop:'0.8rem',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.8rem'}}>
        {alertItem.patient_zero&&<div style={{background:'#f1f5f9',padding:'0.7rem',borderRadius:'6px'}}>
          <span style={{fontSize:'0.75rem',fontWeight:'bold',color:'#475569'}}>📍 PATIENT ZERO (ORIGIN):</span>
          <p style={{fontSize:'0.85rem',margin:'0.3rem 0 0 0'}}>
            <strong>{alertItem.patient_zero.actor_ref}</strong> on <em>{alertItem.patient_zero.platform}</em> ({new Date(alertItem.patient_zero.timestamp).toLocaleTimeString()})
          </p>
          <p style={{fontSize:'0.8rem',color:'#64748b',marginTop:'0.2rem',fontStyle:'italic'}}>"{alertItem.patient_zero.text}"</p>
        </div>}
        <div style={{background:'#f1f5f9',padding:'0.7rem',borderRadius:'6px'}}>
          <span style={{fontSize:'0.75rem',fontWeight:'bold',color:'#475569'}}>🤖 CIB COORDINATION EVIDENCE:</span>
          <p style={{fontSize:'0.85rem',margin:'0.3rem 0 0 0'}}>
            Coordination Score: <strong>{(alertItem.cib_evidence?.coordination_score*100).toFixed(0)}%</strong>
          </p>
          {alertItem.cib_evidence?.flagged_accounts?.length>0&&<p style={{fontSize:'0.8rem',color:'#9d174d',marginTop:'0.2rem'}}>
            Flagged accounts: {alertItem.cib_evidence.flagged_accounts.join(', ')}
          </p>}
          {!alertItem.cib_evidence?.flagged_accounts?.length&&<p style={{fontSize:'0.8rem',color:'#64748b',marginTop:'0.2rem'}}>No coordinated bot patterns detected.</p>}
        </div>
      </div>
    </article>)}
    {!alertsData?.alerts?.length&&<div className="panel empty">No alerts triggered. System operating normally.</div>}
  </div>
 </>}

 {page==='Event explorer'&&<article className="panel"><div className="panelhead"><h2>Event evidence</h2><span className="tag">{rows.length} SHOWN</span></div><div className="tablewrap"><table><thead><tr><th>Event / original content</th><th>Detected language</th><th>Sentiment</th><th>Model score</th></tr></thead><tbody>{rows.map(r=><tr key={r.event_id}><td><small>{r.platform} · {new Date(r.timestamp).toLocaleString()} · {r.event_id.slice(0,8)}</small><p>{r.text}</p>{r.analysis?.truncated&&<small>Text truncated to 256 tokens for sentiment.</small>}</td><td>{r.analysis?(names[r.analysis.language]||r.analysis.language):'Pending'}<small>{r.analysis?.language_status}</small></td><td><span className={'pill '+(r.analysis?.sentiment||'')}>{r.analysis?.sentiment||r.analysis?.sentiment_status||'Pending'}</span></td><td>{r.analysis?.sentiment_score!=null?`${(r.analysis.sentiment_score*100).toFixed(1)}%`:'—'}</td></tr>)}</tbody></table></div>{!rows.length&&<p className="empty">No events match these filters.</p>}<div className="pagination"><button disabled={!offset} onClick={()=>setOffset(Math.max(0,offset-20))}>← Previous</button><span>Page {offset/20+1}</span><button disabled={rows.length<20} onClick={()=>setOffset(offset+20)}>Next →</button></div></article>}

 {page==='Replay studio'&&<><div className="banner"><div><h2>Replay, inspect, repeat.</h2><p>Original timestamps stay intact. Saved progress survives worker restarts.</p></div><button onClick={()=>{setMode('replay');setShowImport(true)}}>Create replay →</button></div><div className="jobs">{jobs.map(j=><article className="panel job" key={j.replay_id}><div className="panelhead"><h2>{j.dataset_name}</h2><span className="pill">{j.status}</span></div><p className="muted">{j.immediate?'Immediate':`${j.speed}× speed`} · {j.replay_id.slice(0,8)}</p><progress max={j.total} value={j.processed}/><div className="jobnumbers"><b>{j.processed} / {j.total} processed</b><span>{j.inserted} new · {j.duplicates} duplicate · {j.conflicts} conflict</span></div><p className="muted">Virtual time: {j.virtual_time?new Date(j.virtual_time).toISOString():'Not started'}</p><div className="actions">{['queued','running','paused'].includes(j.status)&&<><button disabled={busy} onClick={()=>action(()=>api(`/replays/${j.replay_id}/${j.status==='paused'?'resume':'pause'}`,{}).then(()=> 'Replay updated.'))}>{j.status==='paused'?'Resume':'Pause'}</button><button disabled={busy} onClick={()=>action(()=>api(`/replays/${j.replay_id}/cancel`,{}).then(()=> 'Replay cancelled; processed data retained.'))}>Cancel</button></>}</div></article>)}{!jobs.length&&<div className="panel empty">No replays yet. Create one from a JSON dataset.</div>}</div></>}

 <footer><b>Interpretation matters.</b> Scores describe model output, not verified accuracy. Short, mixed-language and sarcastic posts may be misclassified. Prototype models require independent evaluation.</footer></section></main>

 {showImport&&<div className="overlay"><section role="dialog" aria-modal="true" aria-labelledby="import-title" className="modal"><div className="panelhead"><h2 id="import-title">Bring in a conversation</h2><button aria-label="Close import" onClick={()=>setShowImport(false)}>×</button></div><p className="muted">Paste a canonical JSON array. Up to 1,000 events per batch.</p><label>Dataset name<input value={dataset} onChange={e=>setDataset(e.target.value)}/></label><label>Processing mode<select value={mode} onChange={e=>setMode(e.target.value)}><option value="import">Import now</option><option value="replay">Historical replay</option></select></label>{mode==='replay'&&<label>Playback speed<input type="number" min="0.01" max="1000000" value={speed} onChange={e=>setSpeed(e.target.value)}/></label>}<label>Events<textarea rows="10" value={data} onChange={e=>setData(e.target.value)} placeholder='[{"platform":"dataset","source_id":"my-data-001","timestamp":"2026-01-01T10:00:00Z","text":"Your post"}]'/></label><div className="actions"><button onClick={()=>{setData(JSON.stringify(demo,null,2));setDataset('synthetic NLP demo')}}>Use synthetic examples</button><button className="primary" disabled={busy||!data.trim()||!dataset.trim()} onClick={submit}>{busy?'Submitting…':'Submit dataset'}</button></div>{error&&<p role="alert" className="error">{error}</p>}</section></div>}
 </div>
}
createRoot(document.getElementById('root')).render(<App/>);
