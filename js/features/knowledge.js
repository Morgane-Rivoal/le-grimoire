// Moteur de connaissance : construit une fiche fiable à partir d’une plante locale,
// d’un profil connu ou d’une fiche prudente générique.
function fallbackKnowledge(entry){
  return {
    edibility:t("knowledge.fallback.edibility"),
    status:"inconnu",
    summary:t("knowledge.fallback.summary", {name:entry.name || t("image.observation")}),
    benefits:t("knowledge.fallback.benefits"),
    care:t("knowledge.fallback.care"),
    precautions:t("knowledge.fallback.precautions"),
    source:t("knowledge.fallback.source")
  };
}

function knowledgeForSpecies(entry, localPlant){
  if(localPlant){
    const plant = localizedPlant(localPlant);
    return mergeEnrichment({
      edibility: plant.status === "comestible" ? t("status.edible") : t("status.caution"),
      status: plant.status,
      summary: plant.summary,
      benefits: plant.tradition,
      care: plant.culture,
      precautions: plant.precautions,
      note: plant.anecdote,
      source: plant.source
    }, entry);
  }

  const haystack = `${entry.name} ${entry.latin} ${entry.shortLatin} ${entry.family}`.toLowerCase();
  const plantProfile = plantKnowledgeProfiles.find(profile =>
    profile.match.some(value => haystack.includes(value))
  );
  if(plantProfile) return mergeEnrichment(localizedKnowledge(plantProfile), entry);

  const familyProfile = familyKnowledgeProfiles.find(profile =>
    profile.match.some(value => haystack.includes(value))
  );
  const profile = familyProfile ? localizedKnowledge(familyProfile) : fallbackKnowledge(entry);
  return mergeEnrichment(profile, entry);
}

function mergeEnrichment(profile, entry){
  const enrichment = entry?.enrichment;
  if(!enrichment) return profile;
  const mentionsToxicity = /tox|poison/i.test(enrichment.safetyNote || "");
  const mentionsFoodUse = /comest|edible|alimentaire|consum/i.test(enrichment.safetyNote || "");
  const genericStatus = profile.status === "inconnu";
  return {
    ...profile,
    edibility: genericStatus && mentionsToxicity
      ? t("status.toxicityReported")
      : genericStatus && mentionsFoodUse
      ? t("status.foodUseReported")
      : profile.edibility,
    status: genericStatus && (mentionsToxicity || mentionsFoodUse) ? "prudence" : profile.status,
    consumption: enrichment.safetyNote || profile.edibility,
    summary: enrichment.summary || profile.summary,
    source: enrichment.sourceLabel
      ? `${profile.source} ${enrichment.sourceLabel}.`
      : profile.source
  };
}

function botanicalNoteFor(entry, profile, localPlant){
  if(localPlant?.anecdote) return localPlant.anecdote;
  if(profile?.note) return profile.note;

  const haystack = `${entry.name || ""} ${entry.latin || ""} ${entry.shortLatin || ""} ${entry.family || ""}`.toLowerCase();

  if(haystack.includes("orchid") || haystack.includes("orchidée") || haystack.includes("orchidee")){
    return t("note.orchid");
  }
  if(haystack.includes("lilium") || haystack.includes(" lis ") || haystack.startsWith("lis ")){
    return t("note.lily");
  }
  if(haystack.includes("hydrangea") || haystack.includes("hortensia")){
    return t("note.hydrangea");
  }
  if(haystack.includes("araceae") || haystack.includes("aracée") || haystack.includes("aracées")){
    return t("note.araceae");
  }
  if(haystack.includes("lamiaceae") || haystack.includes("lamiacée") || haystack.includes("lamiacées")){
    return t("note.lamiaceae");
  }
  if(haystack.includes("apiaceae") || haystack.includes("apiacée") || haystack.includes("apiacées")){
    return t("note.apiaceae");
  }
  if(haystack.includes("asteraceae") || haystack.includes("astéracée") || haystack.includes("astéracées")){
    return t("note.asteraceae");
  }
  if(haystack.includes("rosaceae") || haystack.includes("rosacée") || haystack.includes("rosacées")){
    return t("note.rosaceae");
  }
  if(haystack.includes("poaceae") || haystack.includes("poacée") || haystack.includes("graminée")){
    return t("note.poaceae");
  }
  if(haystack.includes("brassicaceae") || haystack.includes("brassicacée")){
    return t("note.brassicaceae");
  }
  if(haystack.includes("solanaceae") || haystack.includes("solanacée")){
    return t("note.solanaceae");
  }

  if(haystack.includes("pinaceae") || haystack.includes("picea") || haystack.includes("pinus") || haystack.includes("abies") || haystack.includes("epicea") || haystack.includes("sapin") || haystack.includes("pin ")){
    return t("note.pinaceae");
  }

  const family = valueOrTodo(entry.family);
  return t("note.generic", {name:entry.name || t("image.observation"), family});
}

function recognitionTextFor(entry, localPlant, profile){
  if(localPlant?.recognition) return localPlant.recognition;
  if(profile?.recognition) return profile.recognition;
  if(entry?.enrichment?.recognition){
    return entry.enrichment.recognition;
  }
  const haystack = `${entry.name || ""} ${entry.latin || ""} ${entry.shortLatin || ""} ${entry.family || ""}`.toLowerCase();
  if(haystack.includes("pinaceae") || haystack.includes("picea") || haystack.includes("pinus") || haystack.includes("abies") || haystack.includes("epicea") || haystack.includes("sapin") || haystack.includes("pin ")){
    return t("recognition.conifer", {score:entry.score || "—"});
  }
  return t("recognition.generic", {score:entry.score || "—"});
}
