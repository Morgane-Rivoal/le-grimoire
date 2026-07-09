// Moteur visuel du Grimoire.
// Toute plante ajoutée par l’utilisateur doit passer par plantPlateMarkup()
// pour conserver la direction artistique des planches botaniques.
function plantImageMarkup(entry){
  if(entry.imageUrl){
    return `<img src="${safeText(entry.imageUrl)}" alt="${safeText(t("image.of", {name:entry.name}))}" loading="lazy" decoding="async">`;
  }
  return `<div style="font-size:4rem;text-align:center;padding-top:78px">🌿</div>`;
}

function plantStaticImageMarkup(plant){
  return `<img src="${safeText(plant.illu)}" alt="${safeText(t("image.illustrationOf", {name:plant.name}))}" loading="lazy" decoding="async">`;
}

function plantPlateMarkup(entry){
  const name = safeText(entry.name || t("image.observation"));
  const latin = safeText(entry.shortLatin || entry.latin || "");
  if(entry.imageUrl){
    return `
      <figure class="species-plate">
        <img src="${safeText(entry.imageUrl)}" alt="${safeText(t("photo.compareAlt", {name:entry.name}))}" loading="lazy" decoding="async">
        <figcaption><strong>${name}</strong><span>${latin}</span></figcaption>
      </figure>
    `;
  }
  const haystack = `${entry.name || ""} ${entry.latin || ""} ${entry.shortLatin || ""}`.toLowerCase();
  const seedText = `${entry.name || ""}${entry.latin || ""}${entry.family || ""}`;
  const seed = Array.from(seedText).reduce((total, char) => total + char.charCodeAt(0), 0);
  const flowerColors = ["#B38AC8", "#C77482", "#AEBBFF", "#D7A24A", "#E7D37A", "#DFA1B3"];
  const leafColors = ["#7C9473", "#78926A", "#6F965E", "#8CA681"];
  const flowerColor = flowerColors[seed % flowerColors.length];
  const leafColor = leafColors[seed % leafColors.length];
  const variant = seed % 4;

  if(haystack.includes("hydrangea") || haystack.includes("hortensia")){
    return `
      <svg viewBox="0 0 420 315" role="img" aria-label="${name}">
        <rect width="420" height="315" fill="#F7EED3"/>
        <path d="M210 282 C207 230 210 190 208 145" stroke="#38523B" stroke-width="5" fill="none"/>
        <g fill="#7C9473" stroke="#38523B" stroke-width="2.5">
          <path d="M205 205 C158 176 120 184 95 220 C139 238 178 235 205 205Z"/>
          <path d="M214 202 C262 172 300 180 326 216 C282 237 242 232 214 202Z"/>
          <path d="M207 245 C170 225 140 232 122 260 C156 274 184 269 207 245Z"/>
        </g>
        <g transform="translate(210 112)" stroke="#6E6EB8" stroke-width="2">
          <circle cx="0" cy="0" r="58" fill="#AEBBFF"/>
          <circle cx="-38" cy="-20" r="27" fill="#9BAAF2"/>
          <circle cx="34" cy="-26" r="28" fill="#B8C5FF"/>
          <circle cx="-20" cy="28" r="29" fill="#879BEA"/>
          <circle cx="28" cy="23" r="27" fill="#A6B8FF"/>
          <circle cx="0" cy="-42" r="24" fill="#BBC8FF"/>
          <g fill="#F7EED3" stroke="none">
            <circle cx="-38" cy="-20" r="5"/><circle cx="34" cy="-26" r="5"/><circle cx="-20" cy="28" r="5"/><circle cx="28" cy="23" r="5"/><circle cx="0" cy="-42" r="5"/>
          </g>
        </g>
        <text x="28" y="285" fill="#6C4D17" font-family="Georgia" font-size="20">${latin}</text>
      </svg>
    `;
  }

  if(haystack.includes("rosa") || haystack.includes("rose")){
    return `
      <svg viewBox="0 0 420 315" role="img" aria-label="${name}">
        <rect width="420" height="315" fill="#F7EED3"/>
        <path d="M210 280 C218 224 215 168 205 116" stroke="#38523B" stroke-width="5" fill="none"/>
        <g fill="${leafColor}" stroke="#38523B" stroke-width="2.5">
          <path d="M208 190 C165 165 130 172 110 205 C148 220 181 215 208 190Z"/>
          <path d="M214 218 C260 190 298 198 318 232 C276 246 240 241 214 218Z"/>
        </g>
        <g transform="translate(210 95)" stroke="#7A2E2E" stroke-width="3">
          <path d="M0 -48 C28 -58 52 -34 44 -8 C72 -2 78 35 48 48 C36 78 -2 72 -10 46 C-42 62 -74 38 -58 6 C-80 -22 -52 -58 -18 -44Z" fill="${flowerColor}"/>
          <circle cx="0" cy="5" r="10" fill="#B8924A" stroke="none"/>
        </g>
        <text x="28" y="285" fill="#6C4D17" font-family="Georgia" font-size="20">${latin}</text>
      </svg>
    `;
  }

  if(haystack.includes("lavandula") || haystack.includes("lavande")){
    return `
      <svg viewBox="0 0 420 315" role="img" aria-label="${name}">
        <rect width="420" height="315" fill="#F7EED3"/>
        <g stroke="#38523B" stroke-width="4" fill="none">
          <path d="M160 278 C164 214 170 148 150 74"/>
          <path d="M220 278 C220 208 225 138 235 60"/>
          <path d="M280 278 C270 208 275 148 300 84"/>
        </g>
        <g fill="#7B5AA6" stroke="#4D3875" stroke-width="2">
          <ellipse cx="148" cy="76" rx="15" ry="9"/><ellipse cx="154" cy="96" rx="14" ry="8"/>
          <ellipse cx="235" cy="63" rx="15" ry="9"/><ellipse cx="232" cy="83" rx="14" ry="8"/>
          <ellipse cx="298" cy="88" rx="15" ry="9"/>
        </g>
        <text x="28" y="285" fill="#6C4D17" font-family="Georgia" font-size="20">${latin}</text>
      </svg>
    `;
  }

  if(haystack.includes("lilium") || haystack.includes(" lis ") || haystack.startsWith("lis ")){
    return `
      <svg viewBox="0 0 420 315" role="img" aria-label="${name}">
        <rect width="420" height="315" fill="#F7EED3"/>
        <path d="M210 282 C212 230 208 184 212 126" stroke="#38523B" stroke-width="5" fill="none"/>
        <g fill="#78926A" stroke="#38523B" stroke-width="2.3">
          <path d="M210 232 C175 214 143 216 112 236 C145 251 178 249 210 232Z"/>
          <path d="M214 210 C252 190 286 194 318 216 C282 232 248 230 214 210Z"/>
          <path d="M210 176 C174 156 145 160 118 181 C152 194 180 192 210 176Z"/>
          <path d="M214 154 C250 132 280 136 306 158 C274 173 246 171 214 154Z"/>
        </g>
        <g transform="translate(214 94)" stroke="#B8924A" stroke-width="2">
          <path d="M0 -18 C-38 -70 -88 -52 -66 -6 C-100 12 -76 58 -28 38 C-18 82 34 82 28 34 C78 55 102 8 64 -8 C88 -54 38 -70 0 -18Z" fill="#FFFDF2"/>
          <path d="M0 -12 C-15 10 -10 28 0 42 C10 28 15 10 0 -12Z" fill="#F6EFD7"/>
          <g stroke="#5B3527" stroke-width="4" stroke-linecap="round">
            <path d="M-26 -2 L-35 30"/>
            <path d="M0 -6 L0 34"/>
            <path d="M26 -2 L35 30"/>
          </g>
          <circle cx="0" cy="-1" r="5" fill="#D7A24A" stroke="none"/>
        </g>
        <text x="28" y="285" fill="#6C4D17" font-family="Georgia" font-size="20">${latin}</text>
      </svg>
    `;
  }

  if(haystack.includes("tulipa") || haystack.includes("tulipe")){
    return `
      <svg viewBox="0 0 420 315" role="img" aria-label="${name}">
        <rect width="420" height="315" fill="#F7EED3"/>
        <path d="M210 282 C210 228 210 178 210 120" stroke="#38523B" stroke-width="5" fill="none"/>
        <g fill="#6F965E" stroke="#38523B" stroke-width="2.5">
          <path d="M208 220 C160 185 126 196 108 238 C150 248 184 242 208 220Z"/>
          <path d="M214 204 C260 166 296 178 316 220 C276 234 242 226 214 204Z"/>
        </g>
        <g transform="translate(210 90)" stroke="#7A2E2E" stroke-width="3">
          <path d="M0 62 C-48 42 -58 -16 -34 -58 C-12 -30 0 -18 0 6 C0 -18 14 -30 36 -58 C60 -14 48 44 0 62Z" fill="${flowerColor}"/>
          <path d="M0 58 C-18 25 -10 -10 0 -38 C12 -10 18 25 0 58Z" fill="#DFA1B3" opacity=".55"/>
        </g>
        <text x="28" y="285" fill="#6C4D17" font-family="Georgia" font-size="20">${latin}</text>
      </svg>
    `;
  }

  if(haystack.includes("orchid") || haystack.includes("orchis") || haystack.includes("orchidée")){
    return `
      <svg viewBox="0 0 420 315" role="img" aria-label="${name}">
        <rect width="420" height="315" fill="#F7EED3"/>
        <path d="M210 282 C210 226 218 180 208 118" stroke="#38523B" stroke-width="5" fill="none"/>
        <g fill="#7C9473" stroke="#38523B" stroke-width="2.5">
          <path d="M208 226 C160 190 124 199 98 238 C140 254 178 248 208 226Z"/>
          <path d="M214 226 C262 190 298 199 324 238 C282 254 244 248 214 226Z"/>
        </g>
        <g transform="translate(210 96)" stroke="#6E4C8A" stroke-width="2.5">
          <ellipse cx="-34" cy="-12" rx="31" ry="22" fill="#DFA1B3"/>
          <ellipse cx="34" cy="-12" rx="31" ry="22" fill="#DFA1B3"/>
          <ellipse cx="0" cy="-35" rx="23" ry="30" fill="#E7C1D0"/>
          <path d="M-28 20 C-10 -2 10 -2 28 20 C18 54 -18 54 -28 20Z" fill="#B38AC8"/>
          <circle cx="0" cy="10" r="8" fill="#D7A24A" stroke="none"/>
        </g>
        <text x="28" y="285" fill="#6C4D17" font-family="Georgia" font-size="20">${latin}</text>
      </svg>
    `;
  }

  if(haystack.includes("fern") || haystack.includes("fougère") || haystack.includes("pteridium") || haystack.includes("dryopteris")){
    return `
      <svg viewBox="0 0 420 315" role="img" aria-label="${name}">
        <rect width="420" height="315" fill="#F7EED3"/>
        <g stroke="#38523B" stroke-width="4" fill="none">
          <path d="M210 282 C205 220 212 160 210 82"/>
          <path d="M210 142 C172 122 142 112 105 112"/>
          <path d="M212 160 C250 138 280 130 318 132"/>
          <path d="M210 190 C170 172 138 166 100 174"/>
          <path d="M212 214 C250 194 282 188 322 196"/>
        </g>
        <g fill="#6F965E">
          <ellipse cx="128" cy="112" rx="22" ry="6"/><ellipse cx="158" cy="122" rx="20" ry="6"/>
          <ellipse cx="292" cy="132" rx="22" ry="6"/><ellipse cx="260" cy="140" rx="20" ry="6"/>
          <ellipse cx="126" cy="174" rx="22" ry="6"/><ellipse cx="158" cy="180" rx="20" ry="6"/>
          <ellipse cx="292" cy="196" rx="22" ry="6"/><ellipse cx="260" cy="202" rx="20" ry="6"/>
        </g>
        <text x="28" y="285" fill="#6C4D17" font-family="Georgia" font-size="20">${latin}</text>
      </svg>
    `;
  }

  if(haystack.includes("pinaceae") || haystack.includes("picea") || haystack.includes("pinus") || haystack.includes("abies") || haystack.includes("cedrus") || haystack.includes("larix") || haystack.includes("épicéa") || haystack.includes("epicea") || haystack.includes("sapin") || haystack.includes("cèdre") || haystack.includes("cedre") || haystack.includes("mélèze") || haystack.includes("meleze")){
    return `
      <svg viewBox="0 0 420 315" role="img" aria-label="${name}">
        <rect width="420" height="315" fill="#F7EED3"/>
        <g stroke="#6C4D17" stroke-width="5" stroke-linecap="round" fill="none">
          <path d="M120 242 C168 204 226 150 302 76"/>
          <path d="M174 190 C180 216 182 232 176 254"/>
        </g>
        <g stroke="#38523B" stroke-width="3.2" stroke-linecap="round">
          <path d="M148 218 L104 222"/><path d="M154 212 L112 200"/><path d="M164 202 L122 182"/>
          <path d="M182 184 L132 170"/><path d="M194 172 L148 152"/><path d="M210 156 L160 140"/>
          <path d="M226 140 L180 120"/><path d="M242 124 L198 104"/><path d="M260 106 L218 88"/>
          <path d="M148 218 L188 244"/><path d="M162 202 L204 222"/><path d="M182 184 L226 204"/>
          <path d="M202 164 L246 184"/><path d="M224 142 L268 162"/><path d="M246 120 L288 140"/>
        </g>
        <g fill="#6F965E">
          <circle cx="104" cy="222" r="5"/><circle cx="112" cy="200" r="5"/><circle cx="122" cy="182" r="5"/>
          <circle cx="132" cy="170" r="5"/><circle cx="148" cy="152" r="5"/><circle cx="160" cy="140" r="5"/>
          <circle cx="180" cy="120" r="5"/><circle cx="198" cy="104" r="5"/><circle cx="218" cy="88" r="5"/>
          <circle cx="188" cy="244" r="5"/><circle cx="204" cy="222" r="5"/><circle cx="226" cy="204" r="5"/>
          <circle cx="246" cy="184" r="5"/><circle cx="268" cy="162" r="5"/><circle cx="288" cy="140" r="5"/>
        </g>
        <g fill="#B8924A" stroke="#6C4D17" stroke-width="2">
          <ellipse cx="178" cy="250" rx="12" ry="25" transform="rotate(12 178 250)"/>
          <path d="M170 232 C180 240 188 250 184 268"/>
          <path d="M180 232 C174 246 172 258 176 274"/>
        </g>
        <text x="28" y="285" fill="#6C4D17" font-family="Georgia" font-size="20">${latin}</text>
      </svg>
    `;
  }

  if(haystack.includes("aster") || haystack.includes("bellis") || haystack.includes("daisy") || haystack.includes("marguerite")){
    return `
      <svg viewBox="0 0 420 315" role="img" aria-label="${name}">
        <rect width="420" height="315" fill="#F7EED3"/>
        <path d="M210 280 C207 220 214 162 210 103" stroke="#38523B" stroke-width="5" fill="none"/>
        <g fill="${leafColor}" stroke="#38523B" stroke-width="2.5">
          <path d="M207 190 C160 166 124 174 100 207 C140 222 178 218 207 190Z"/>
          <path d="M214 215 C258 190 292 198 318 228 C278 245 242 240 214 215Z"/>
        </g>
        <g transform="translate(210 86)">
          <g fill="#FFF8DF" stroke="${flowerColor}" stroke-width="2">
            <ellipse cx="0" cy="-32" rx="11" ry="28"/><ellipse cx="0" cy="32" rx="11" ry="28"/>
            <ellipse cx="-32" cy="0" rx="28" ry="11"/><ellipse cx="32" cy="0" rx="28" ry="11"/>
            <ellipse cx="-23" cy="-23" rx="11" ry="26" transform="rotate(-45 -23 -23)"/>
            <ellipse cx="23" cy="-23" rx="11" ry="26" transform="rotate(45 23 -23)"/>
          </g>
          <circle cx="0" cy="0" r="16" fill="#B8924A"/>
        </g>
        <text x="28" y="285" fill="#6C4D17" font-family="Georgia" font-size="20">${latin}</text>
      </svg>
    `;
  }

  return `
    <svg viewBox="0 0 420 315" role="img" aria-label="${name}">
      <rect width="420" height="315" fill="#F7EED3"/>
      <path d="M210 282 C${variant === 0 ? "210 226 204 173 212 92" : variant === 1 ? "198 225 216 170 205 92" : variant === 2 ? "224 226 190 172 214 92" : "210 230 210 165 210 88"}" stroke="#38523B" stroke-width="5" fill="none"/>
      <g fill="${leafColor}" stroke="#38523B" stroke-width="2.5">
        <path d="${variant === 2 ? "M208 152 C164 128 130 136 105 166 C142 182 178 178 208 152Z" : "M208 142 C160 112 122 118 98 152 C138 171 178 170 208 142Z"}"/>
        <path d="${variant === 1 ? "M214 178 C256 154 292 162 318 192 C282 207 246 204 214 178Z" : "M214 166 C264 132 302 140 328 176 C286 195 246 193 214 166Z"}"/>
        <path d="${variant === 3 ? "M206 224 C166 202 132 208 112 238 C148 252 180 248 206 224Z" : "M206 216 C158 188 122 195 96 230 C138 248 178 244 206 216Z"}"/>
      </g>
      <g fill="${flowerColor}" stroke="#6C4D17" stroke-width="1.5">
        ${variant === 0
          ? `<circle cx="213" cy="82" r="7"/><circle cx="228" cy="90" r="5"/><circle cx="198" cy="95" r="5"/>`
          : variant === 1
          ? `<ellipse cx="210" cy="82" rx="18" ry="11"/><ellipse cx="224" cy="98" rx="13" ry="8"/><ellipse cx="194" cy="101" rx="13" ry="8"/>`
          : variant === 2
          ? `<path d="M210 66 C230 72 235 95 217 105 C198 116 180 98 190 78 C194 70 201 66 210 66Z"/><circle cx="210" cy="88" r="7" fill="#B8924A" stroke="none"/>`
          : `<circle cx="210" cy="78" r="6"/><circle cx="222" cy="86" r="6"/><circle cx="198" cy="90" r="6"/><circle cx="214" cy="100" r="6"/>`}
      </g>
      <text x="28" y="285" fill="#6C4D17" font-family="Georgia" font-size="20">${latin}</text>
    </svg>
  `;
}
