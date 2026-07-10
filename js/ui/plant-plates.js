// Moteur visuel du Grimoire.
// Toute plante ajoutée par l’utilisateur doit passer par plantPlateMarkup()
// pour conserver la direction artistique des planches botaniques.
function plantImageMarkup(entry){
  return plantPlateMarkup(entry);
}

function plantStaticImageMarkup(plant){
  if(!plant.illu){
    return plantPlateMarkup(plant);
  }
  return `<img src="${safeText(plant.illu)}" alt="${safeText(t("image.illustrationOf", {name:plant.name}))}" loading="lazy" decoding="async">`;
}

// Hachage FNV-1a : diffuse bien les petites variations de texte, contrairement
// à une simple somme de codes de caractères qui produit des graines proches
// pour des noms voisins (et donc des planches trop semblables).
function hashString(text){
  let hash = 0x811c9dc5;
  const value = String(text || "grimoire");
  for(let index = 0; index < value.length; index++){
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

// Les planches sont déterministes : on mémorise le markup par clé d'espèce pour
// éviter de régénérer le même SVG à chaque rendu de grille ou de carte.
const plateCache = new Map();
const PLATE_CACHE_MAX = 400;

function plantPlateMarkup(entry){
  const key = `${entry.name || ""}|${entry.latin || ""}|${entry.shortLatin || ""}|${entry.family || ""}`.toLowerCase();
  let markup = plateCache.get(key);
  if(markup === undefined){
    markup = buildPlantPlate(entry);
    plateCache.set(key, markup);
    if(plateCache.size > PLATE_CACHE_MAX){
      plateCache.delete(plateCache.keys().next().value);
    }
  }
  return markup;
}

function buildPlantPlate(entry){
  const name = safeText(entry.name || t("image.observation"));
  const haystack = `${entry.name || ""} ${entry.latin || ""} ${entry.shortLatin || ""}`.toLowerCase();
  const seedText = `${entry.name || ""}|${entry.latin || ""}|${entry.shortLatin || ""}|${entry.family || ""}`.toLowerCase();
  const hash = hashString(seedText);
  const flowerColors = ["#B38AC8", "#C77482", "#AEBBFF", "#D7A24A", "#E7D37A", "#DFA1B3"];
  const leafColors = ["#7C9473", "#78926A", "#6F965E", "#8CA681"];
  const flowerColor = flowerColors[(hash >>> 3) % flowerColors.length];
  const leafColor = leafColors[(hash >>> 7) % leafColors.length];

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
      </svg>
    `;
  }

  return generativePlate(entry, name, hash);
}

// Génère une planche florale paramétrique. Chaque caractéristique (couleur de
// fleur, teinte du cœur, feuillage, nombre et forme des pétales, taille,
// fond) est tirée d'un flux de bits distinct du haché, afin que deux espèces
// proches donnent des planches nettement différentes.
function petalRing(count, style, fill, tip, size, twoTone){
  const fmt = value => Number(value.toFixed(1));
  const parts = [];
  for(let index = 0; index < count; index++){
    const angle = (360 / count) * index;
    const rot = `rotate(${fmt(angle)})`;
    if(style === 0){
      parts.push(`<ellipse cx="0" cy="${fmt(-size * 0.62)}" rx="${fmt(size * 0.30)}" ry="${fmt(size * 0.55)}" fill="${fill}" transform="${rot}"/>`);
    } else if(style === 1){
      const w = size * 0.30, mid = size * 0.45, tipY = size * 1.05, hw = w * 0.5;
      parts.push(`<path d="M0 0 C ${fmt(w)} ${fmt(-mid)}, ${fmt(hw)} ${fmt(-tipY)}, 0 ${fmt(-tipY)} C ${fmt(-hw)} ${fmt(-tipY)}, ${fmt(-w)} ${fmt(-mid)}, 0 0Z" fill="${fill}" transform="${rot}"/>`);
    } else if(style === 2){
      parts.push(`<ellipse cx="0" cy="${fmt(-size * 0.66)}" rx="${fmt(size * 0.12)}" ry="${fmt(size * 0.62)}" fill="${fill}" transform="${rot}"/>`);
    } else {
      const radius = size * 0.64;
      const px = Math.cos((angle - 90) * Math.PI / 180) * radius;
      const py = Math.sin((angle - 90) * Math.PI / 180) * radius;
      parts.push(`<circle cx="${fmt(px)}" cy="${fmt(py)}" r="${fmt(size * 0.30)}" fill="${fill}"/>`);
    }
  }
  if(twoTone && style !== 3){
    for(let index = 0; index < count; index++){
      const angle = (360 / count) * index;
      parts.push(`<ellipse cx="0" cy="${fmt(-size * 0.5)}" rx="${fmt(size * 0.13)}" ry="${fmt(size * 0.3)}" fill="${tip}" opacity="0.5" transform="rotate(${fmt(angle)})"/>`);
    }
  }
  return parts.join("");
}

function generativePlate(entry, label, hash){
  const stream = shift => (hash >>> shift) & 0x3f;
  const flowerPalette = ["#C77482","#B38AC8","#8FA0E8","#E2A64A","#E7D06A","#DF8FB0","#D96B6B","#7FB08A","#C98AD8","#F0A65C","#9C86D6","#E8B7C6","#6FA3C4","#D4577E","#E0844B","#A9C36B"];
  const centerPalette = ["#B8924A","#D7A24A","#7A2E2E","#6C4D17","#C98A2E","#8A5A20","#5B3527"];
  const leafPalette = ["#7C9473","#6F965E","#78926A","#8CA681","#6C8E5A","#849A6E","#5F8452"];
  const bgPalette = ["#F7EED3","#F5EAD0","#F3EBD8","#F8EFD6","#F4ECCF","#F6EDD9"];

  const bg = bgPalette[stream(0) % bgPalette.length];
  const flowerColor = flowerPalette[stream(2) % flowerPalette.length];
  const petalTip = flowerPalette[(stream(4) + 6) % flowerPalette.length];
  const centerColor = centerPalette[stream(6) % centerPalette.length];
  const leafColor = leafPalette[stream(8) % leafPalette.length];
  const petalCount = 5 + (stream(10) % 5);        // 5..9 pétales
  const flowerStyle = stream(12) % 4;             // arrondi / pointu / marguerite / grappe
  const leafStyle = stream(14) % 3;
  const size = 42 + (stream(16) % 20);            // 42..61
  const lean = (stream(18) % 5) - 2;              // inclinaison de la tige
  const twoTone = stream(20) & 1;

  const cx = 210;
  const cy = 104;
  const stemTopX = cx + lean * 5;
  const stemTopY = cy + size * 0.4;
  const stem = `M210 282 C ${210 + lean * 9} 232, ${stemTopX - lean * 4} 176, ${stemTopX.toFixed(0)} ${stemTopY.toFixed(0)}`;

  const leafSets = [
    [
      "M208 214 C162 190 128 197 106 230 C146 246 182 240 208 214Z",
      "M214 180 C260 156 296 164 320 196 C282 212 246 206 214 180Z"
    ],
    [
      "M206 224 C158 200 124 208 104 240 C144 254 180 249 206 224Z",
      "M214 196 C258 174 292 182 316 212 C280 227 246 222 214 196Z",
      "M208 160 C170 140 140 146 116 172 C150 186 180 182 208 160Z"
    ],
    [
      "M208 200 C168 172 132 178 108 208 C146 226 182 222 208 200Z",
      "M214 168 C254 146 288 152 312 180 C278 198 246 192 214 168Z"
    ]
  ];
  const leaves = leafSets[leafStyle].map(path => `<path d="${path}"/>`).join("");

  const centerRadius = flowerStyle === 3 ? size * 0.22 : size * 0.24;

  return `
    <svg viewBox="0 0 420 315" role="img" aria-label="${label}">
      <rect width="420" height="315" fill="${bg}"/>
      <path d="${stem}" stroke="#38523B" stroke-width="5" fill="none"/>
      <g fill="${leafColor}" stroke="#38523B" stroke-width="2.4">${leaves}</g>
      <g transform="translate(${cx} ${cy})" stroke="#6C4D17" stroke-width="1.4">
        ${petalRing(petalCount, flowerStyle, flowerColor, petalTip, size, twoTone)}
        <circle cx="0" cy="0" r="${centerRadius.toFixed(1)}" fill="${centerColor}" stroke="none"/>
      </g>
    </svg>
  `;
}
