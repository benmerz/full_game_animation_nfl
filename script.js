// script.js — draw a 120-yard NFL field (including 10-yd endzones) and standard markings
(function(){
  const svg = document.getElementById('field-svg');

  // Real-world dimensions
  const yardsTotal = 120; // 100 + 10 + 10
  const feetWide = 160; // 160 feet = 53.333... yards
  const yardsWide = feetWide / 3; // convert feet to yards for consistent ratio

  // Choose svg viewBox in 'yards' units so 1 unit = 1 yard
  const vbWidth = yardsTotal; // x axis = yards along the length
  const vbHeight = yardsWide; // y axis = yards across width

  svg.setAttribute('viewBox', `0 0 ${vbWidth} ${vbHeight}`);
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');

  // Add background field
  const field = make('rect',{x:0,y:0,width:vbWidth,height:vbHeight,fill:'var(--field-green)'});
  svg.appendChild(field);

  // Endzones depth (yards)
  const endzoneDepth = 10;

  // Draw yard lines every 1 yard lightly and every 5 yards bold
  // Skip lines that fall inside the endzones (we'll draw endzones on top so they remain unmarked)
  for(let y=0;y<=yardsTotal;y++){
    if (y < endzoneDepth || y > vbWidth - endzoneDepth) continue; // skip inside endzones
    const isBold = (y % 5 === 0);
    const line = make('line',{x1:y,y1:0,x2:y,y2:vbHeight,stroke:isBold? 'var(--line-white)':'rgba(255,255,255,0.16)', 'stroke-width': isBold? 0.08:0.02});
    svg.appendChild(line);
  }

  // Hash marks: NFL distance from sidelines
  // NFL hash marks are 70'9" (70.75 ft) from each sideline -> convert to yards
  const hashFromSidelineFeet = 70 + 9/12; // 70.75
  const hashFromSidelineYards = hashFromSidelineFeet / 3; // yards

  // Hash marks are placed at each yard line between the endzones (only on the playing field)
  for(let yard=Math.max(1,endzoneDepth+1); yard<=Math.min(yardsTotal-1, vbWidth-endzoneDepth-1); yard++){
    // short hash marks (about 2 feet long) — convert to yards
    const hashLengthYards = 2/3; // 2 ft = 0.666... yd
  const x = yard;
    // left-side hash
  svg.appendChild(make('line',{x1:x,y1:hashFromSidelineYards,x2:x,y2:hashFromSidelineYards+hashLengthYards,stroke:'var(--line-white)','stroke-width':0.06}));
    // right-side hash
    svg.appendChild(make('line',{x1:x,y1:vbHeight-hashFromSidelineYards,x2:x,y2:vbHeight-hashFromSidelineYards-hashLengthYards,stroke:'var(--line-white)','stroke-width':0.06}));
  }

  // Draw yard numbers every 10 yards between the endzones (10..50 mirrored)
  const numberYOffset = vbHeight*0.1; // place numbers slightly in from the sideline
  const numberFontSize = 6; // in viewBox units (yards)
  for(let n=10;n<=50;n+=10){
    const leftX = endzoneDepth + (n);
    const rightX = vbWidth - endzoneDepth - (n);

    // top number (facing one end)
    svg.appendChild(make('text',{x:leftX,y:numberFontSize/2+1,fill:'white','font-size':numberFontSize,'font-family':'Arial, Helvetica, sans-serif','text-anchor':'middle','dominant-baseline':'hanging','opacity':0.95}, formatYardNumber(n)));
    svg.appendChild(make('text',{x:rightX,y:numberFontSize/2+1,fill:'white','font-size':numberFontSize,'font-family':'Arial, Helvetica, sans-serif','text-anchor':'middle','dominant-baseline':'hanging','opacity':0.95}, formatYardNumber(n)));

    // bottom numbers (rotated 180deg)
    const t1 = make('text',{x:leftX,y:vbHeight-1-(numberFontSize/2),fill:'white','font-size':numberFontSize,'font-family':'Arial, Helvetica, sans-serif','text-anchor':'middle','transform':`rotate(180 ${leftX} ${vbHeight-1-(numberFontSize/2)})`,'opacity':0.95}, formatYardNumber(n));
    svg.appendChild(t1);
    const t2 = make('text',{x:rightX,y:vbHeight-1-(numberFontSize/2),fill:'white','font-size':numberFontSize,'font-family':'Arial, Helvetica, sans-serif','text-anchor':'middle','transform':`rotate(180 ${rightX} ${vbHeight-1-(numberFontSize/2)})`,'opacity':0.95}, formatYardNumber(n));
    svg.appendChild(t2);
  }

  // Center mark at 60-yard line (midfield) with small circle
  svg.appendChild(make('circle',{cx:vbWidth/2,cy:vbHeight/2,r:1.2,fill:'rgba(255,255,255,0.06)',stroke:'rgba(255,255,255,0.12)','stroke-width':0.05}));

  // Optional: midfield 50 yard line thicker
  svg.appendChild(make('line',{x1:vbWidth/2,y1:0,x2:vbWidth/2,y2:vbHeight,stroke:'var(--line-white)','stroke-width':0.12}));

  // Draw endzones on top of markings so they appear solid (no markings inside)
  svg.appendChild(make('rect',{x:0,y:0,width:endzoneDepth,height:vbHeight,fill:'var(--endzone-green)'}));
  svg.appendChild(make('rect',{x:vbWidth-endzoneDepth,y:0,width:endzoneDepth,height:vbHeight,fill:'var(--endzone-green)'}));

  // Helper to create SVG elements
  function make(tag,attrs,txt){
    const el = document.createElementNS('http://www.w3.org/2000/svg',tag);
    for(const k in attrs) el.setAttribute(k, attrs[k]);
    if(txt!=null) el.textContent = txt;
    return el;
  }

  function formatYardNumber(n){
    // For NFL the numbers show 10..50 then 40..10 mirrored; we only position 10..50
    return String(n);
  }

  // -----------------------
  // Data loading + animation
  // -----------------------

  // UI elements
  const weekSelect = document.getElementById('week-select');
  const playBtn = document.getElementById('play-btn');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const speedInput = document.getElementById('speed');

  // Elements drawn on top of the field for animation
  const animLayer = make('g', {id: 'anim-layer'});
  svg.appendChild(animLayer);

  // marker line and logo image
  const markerLine = make('line', {x1:0,y1:0,x2:0,y2:vbHeight,stroke:'#ffeb3b','stroke-width':0.2,'opacity':0.95});
  markerLine.style.display = 'none';
  animLayer.appendChild(markerLine);

  const logoSize = 8; // yards (viewBox units) height
  const logoImg = make('image', {class:'team-logo', width:logoSize, height:logoSize, preserveAspectRatio:'xMidYMid meet'});
  logoImg.setAttribute('x', vbWidth/2 - logoSize/2);
  logoImg.setAttribute('y', vbHeight/2 - logoSize/2);
  logoImg.style.display = 'none';
  animLayer.appendChild(logoImg);

  // load CSVs (bills.csv contains header and yardline_100)
  Promise.all([fetch('bills.csv').then(r=>r.text()), fetch('teams.csv').then(r=>r.text())])
    .then(([billsText, teamsText])=>{
      const bills = parseCSV(billsText);
      const teams = parseCSV(teamsText);
      const teamMap = {};
      teams.forEach(t=>{ if(t.team_abbr) teamMap[t.team_abbr]=t; });

      // collect weeks
      const weeks = Array.from(new Set(bills.map(r=>r.week))).filter(Boolean).sort((a,b)=>Number(a)-Number(b));
      weekSelect.innerHTML = '';
      weeks.forEach(w=>{ const opt = document.createElement('option'); opt.value=w; opt.textContent = 'Week '+w; weekSelect.appendChild(opt); });

      // Animation state
      let playIndex = 0;
      let playing = false;
      let frames = [];
      let timer = null;

      function buildFramesForWeek(week){
        const rows = bills.filter(r=>r.week==week);
        // Keep original order in file; include play_type and defteam so we can treat kickoffs specially
        const f = rows.map(r=>({posteam:r.posteam, defteam: r.defteam, play_type: r.play_type, yardline: parseFloat(r.yardline_100), desc: r.desc || ''})).filter(s => (s.posteam || s.defteam) && !isNaN(s.yardline));
        return f;
      }

      function updateLogoForFrame(frame, idx){
        // remove any existing arc
    // remove any existing visual overlays we might have added previously
  ['kick-arc','kick-punt-arc','pass-arc','run-line','fg-arc','td-line','event-text'].forEach(id=>{ const e = document.getElementById(id); if(e) e.remove(); });
        if(!frame){ markerLine.style.display='none'; logoImg.style.display='none'; return; }
        const yard = frame.yardline;
        // helper: map yardline_100 to viewBox x coordinates according to posteam direction
        const yardToX = (yd, teamAbbr) => {
          const team = (teamAbbr || '').toUpperCase();
          // BUF plays left-to-right (increasing yard -> increasing x); others right-to-left
          return team === 'BUF' ? (endzoneDepth + yd) : (vbWidth - endzoneDepth - yd);
        };
        // map yardline_100 to x using the current frame's posteam
        const x = yardToX(yard, frame.posteam);
        // place marker
        markerLine.setAttribute('x1', x);
        markerLine.setAttribute('x2', x);
        markerLine.style.display = '';
        // set logo image src from teamMap (fallback to using posteam.png from teams.csv or posteam url in data if available)
  // If this is a kickoff or punt, show the opposite team's logo (defteam) per request
  const ptLowerForDisplay = (frame.play_type || '').toLowerCase();
  const isKickOrPuntDisplay = ptLowerForDisplay.includes('kick') || ptLowerForDisplay.includes('punt');
  const displayTeam = isKickOrPuntDisplay ? (frame.defteam || frame.posteam) : frame.posteam;
  const t = teamMap[displayTeam];
  const logoUrl = (t && (t.team_logo_wikipedia || t.team_logo_espn)) || '';
        if(logoUrl){
          // set href
          try{ logoImg.setAttribute('href', logoUrl); }catch(e){ logoImg.setAttributeNS('http://www.w3.org/1999/xlink','href', logoUrl); }
        }
        // position logo centered at x and vertical middle
        const lx = x - (logoSize/2);
        const ly = vbHeight/2 - (logoSize/2);
        logoImg.setAttribute('x', lx);
        logoImg.setAttribute('y', ly);
        logoImg.style.display = '';

        // If previous play exists, draw play-type specific visuals from previous position -> current
        if(typeof idx === 'number' && idx > 0){
          const prev = frames[idx-1];
          if(prev){
            const x1 = yardToX(prev.yardline, prev.posteam);
            const x2 = x;
            const cy = vbHeight/2;
            const dx = Math.abs(x2 - x1);

            const pt = (frame.play_type || '').toLowerCase();

            // If the previous play was a kickoff or punt, draw the dotted return arc from prev -> current
            const prevPt = (prev.play_type || '').toLowerCase();
            const prevIsKickOrPunt = prevPt.includes('kick') || prevPt.includes('punt');
            if(prevIsKickOrPunt){
              const arcHeightPrev = Math.min(20, Math.max(4, dx * 0.25));
              const mxPrev = (x1 + x2) / 2;
              const myPrev = cy - arcHeightPrev;
              const pathDPrev = `M ${x1} ${cy} Q ${mxPrev} ${myPrev} ${x2} ${cy}`;
              const arcPrev = make('path',{id:'kick-arc',d:pathDPrev,fill:'none',stroke:'white','stroke-width':0.18,'stroke-dasharray':'0.6 0.6','opacity':0.95});
              animLayer.insertBefore(arcPrev, logoImg);
            }

            // If previous play was a touchdown and current is an extra point, show a simple text label
            const prevIsTD = prev.play_type && String(prev.play_type).toLowerCase().includes('touch');
            const isExtraPt = pt.includes('extra') || pt.includes('xp') || pt.includes('pat') || pt==='extra_point';
            if(prevIsTD && isExtraPt){
              // keep logo/marker at previous position
              const prevX = x1;
              markerLine.setAttribute('x1', prevX);
              markerLine.setAttribute('x2', prevX);
              const lxPrev = prevX - (logoSize/2);
              logoImg.setAttribute('x', lxPrev);

              // show text describing the extra point
              const txt = make('text',{id:'event-text',x:vbWidth/2,y:vbHeight*0.12,fill:'white','font-size':3,'font-family':'Arial, Helvetica, sans-serif','text-anchor':'middle'}, (frame.desc && String(frame.desc).slice(0,80)) || 'Extra Point');
              animLayer.appendChild(txt);
              return; // done for extra-point frame
            }

            // If current play is a kickoff or punt, just display logo (don't draw a trajectory arc)
            if(pt.includes('kick') || pt.includes('punt')){
              // nothing more to draw for kickoff/play; we've already shown marker and logo
              return;
            }

            // 1) Passing play: solid blue arc from previous start to current ball position
            if(pt.includes('pass')){
              const arcHeight = Math.min(24, Math.max(4, dx * 0.35));
              const mx = (x1 + x2) / 2;
              const my = cy - arcHeight;
              const pathD = `M ${x1} ${cy} Q ${mx} ${my} ${x2} ${cy}`;
              const passArc = make('path',{id:'pass-arc',d:pathD,fill:'none',stroke:'#1e88e5','stroke-width':0.2,'opacity':0.98});
              animLayer.insertBefore(passArc, logoImg);
            }

            // Show scoring text for touchdowns, field goals, extra points
            const isTD = pt.includes('touch') || pt==='td';
            const isFG = (pt.includes('field') && pt.includes('goal')) || pt.includes('fg') || pt==='field_goal';
            const isXP = pt.includes('extra') || pt.includes('xp') || pt.includes('pat') || pt==='extra_point';
            if(isTD || isFG || isXP){
              const teamLabel = frame.posteam || frame.defteam || '';
              let label = '';
              if(isTD) label = `TOUCHDOWN${teamLabel? ' — '+teamLabel : ''}`;
              else if(isFG) label = `FIELD GOAL${frame.desc? ' — '+String(frame.desc).slice(0,60): ''}`;
              else if(isXP) label = `EXTRA POINT${frame.desc? ' — '+String(frame.desc).slice(0,60): ''}`;
              const ev = make('text',{id:'event-text',x:vbWidth/2,y:vbHeight*0.12,fill:'white','font-size':3.2,'font-family':'Arial, Helvetica, sans-serif','text-anchor':'middle','font-weight':'bold'}, label);
              animLayer.appendChild(ev);
            }

            // (kick/punt handled above — current kickoff/punt frames only show logo)

            // 2) Running play: solid red horizontal line from previous start to current position
            else if(pt.includes('run') || pt.includes('rush')){
              const runLine = make('line',{id:'run-line',x1:x1,y1:cy,x2:x2,y2:cy,stroke:'#e53935','stroke-width':0.28,'opacity':0.98});
              animLayer.insertBefore(runLine, logoImg);
            }

            // 3) Field goal: half arc from previous position to the back of the target endzone
            else if(pt.includes('field') && pt.includes('goal') || pt === 'field_goal' || pt.includes('fg')){
              // choose which end (left or right) is the target based on current x
              const targetX = (x2 > vbWidth/2) ? vbWidth : 0;
              const arcSpan = Math.abs(targetX - x1);
              const arcHeight = Math.min(40, Math.max(8, arcSpan * 0.25));
              const mx = (x1 + targetX) / 2;
              const my = cy - arcHeight;
              const pathD = `M ${x1} ${cy} Q ${mx} ${my} ${targetX} ${cy}`;
              const fgArc = make('path',{id:'fg-arc',d:pathD,fill:'none',stroke:'white','stroke-width':0.22,'opacity':0.95});
              animLayer.insertBefore(fgArc, logoImg);
            }

            // 4) Touchdown: solid line from previous play to center of the endzone
            else if(pt.includes('touchdown') || pt==='td'){
              const endCenterX = (x2 > vbWidth/2) ? (vbWidth - endzoneDepth/2) : (endzoneDepth/2);
              const tdLine = make('line',{id:'td-line',x1:x1,y1:cy,x2:endCenterX,y2:cy,stroke:'#ffeb3b','stroke-width':0.36,'opacity':0.98});
              animLayer.insertBefore(tdLine, logoImg);
            }
          }
        }
      }

      function playFrames(){
        if(timer) clearInterval(timer);
        const speed = Number(speedInput.value) || 400;
        timer = setInterval(()=>{
          if(playIndex >= frames.length){ clearInterval(timer); playing=false; playBtn.textContent='Play'; return; }
          updateLogoForFrame(frames[playIndex], playIndex);
          playIndex++;
        }, speed);
      }

      // UI events
      weekSelect.addEventListener('change', ()=>{
        frames = buildFramesForWeek(weekSelect.value);
        playIndex = 0;
        updateLogoForFrame(null);
      });

      playBtn.addEventListener('click', ()=>{
        if(playing){ playing=false; playBtn.textContent='Play'; if(timer) clearInterval(timer); }
        else{ playing=true; playBtn.textContent='Pause'; playFrames(); }
      });

      // Step controls
      function pausePlayback(){ if(playing){ playing=false; playBtn.textContent='Play'; if(timer) clearInterval(timer); } }
      prevBtn.addEventListener('click', ()=>{
        pausePlayback();
        if(frames.length===0) return;
        playIndex = Math.max(0, playIndex-1);
        updateLogoForFrame(frames[playIndex], playIndex);
      });
      nextBtn.addEventListener('click', ()=>{
        pausePlayback();
        if(frames.length===0) return;
        playIndex = Math.min(frames.length-1, playIndex+1);
        updateLogoForFrame(frames[playIndex], playIndex);
      });

      // init with first week
      if(weekSelect.options.length>0){ weekSelect.selectedIndex = 0; weekSelect.dispatchEvent(new Event('change')); }
    })
    .catch(err=>{
      console.error('Failed to load CSVs', err);
      weekSelect.innerHTML = '<option>Error loading data</option>';
    });

  // Minimal CSV parser that handles quoted fields
  function parseCSV(text){
    const rows = [];
    let cur = [];
    let field = '';
    let inQuotes = false;
    let i=0;
    while(i<text.length){
      const ch = text[i];
      if(inQuotes){
        if(ch==='"'){
          if(text[i+1]==='"'){ field += '"'; i+=2; continue; }
          inQuotes = false; i++; continue;
        } else { field += ch; i++; continue; }
      } else {
        if(ch==='"'){ inQuotes = true; i++; continue; }
        if(ch===','){ cur.push(field); field=''; i++; continue; }
        if(ch==='\r'){ i++; continue; }
        if(ch==='\n'){ cur.push(field); field=''; rows.push(cur); cur=[]; i++; continue; }
        field += ch; i++; continue;
      }
    }
    // last field
    if(field!=='' || cur.length>0){ cur.push(field); rows.push(cur); }

    // convert to objects using header if present
    if(rows.length===0) return [];
    const header = rows[0].map(h=>String(h).trim());
    const data = rows.slice(1).map(r=>{
      const obj = {};
      for(let j=0;j<header.length;j++){ obj[header[j]] = r[j]!==undefined? r[j] : ''; }
      return obj;
    });
    return data;
  }

})();
