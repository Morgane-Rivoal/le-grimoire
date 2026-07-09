// Traductions éditoriales du contenu botanique. Les noms scientifiques et sources restent inchangés.
const englishPlantContent = {
  menthe: {
    name:"Peppermint", family:"Lamiaceae", flowering:"Summer", height:"30 to 80 cm",
    summary:"A perennial aromatic plant with opposite leaves and a strong fragrance when crushed.",
    recognition:"Look for toothed opposite leaves, a distinctly fresh scent and often square stems, a common feature of the mint family.",
    culture:"Moist soil, gentle light to partial shade and regular watering. Growing it in a pot helps contain its spread.",
    cuisine:"Leaves can be used in infusions, lemonade, desserts and fresh dishes.",
    tradition:"Traditionally used as an infusion after meals.",
    precautions:"The essential oil is highly concentrated and requires great caution. It is not a substitute for professional advice.",
    anecdote:"Peppermint is a natural hybrid originating from a cross between several mint species."
  },
  lavande: {
    name:"English lavender", family:"Lamiaceae", flowering:"Summer", height:"40 to 80 cm",
    summary:"An aromatic subshrub with narrow grey-green leaves and fragrant spikes of purple flowers.",
    recognition:"Look for narrow grey-green leaves, upright flower spikes and the characteristic scent released by the flowers and foliage.",
    culture:"Full sun, well-drained soil and little water. It tolerates dryness better than excess moisture.",
    cuisine:"Some lavender varieties can flavour desserts, sugar or infusions in very small quantities.",
    tradition:"Associated with scented linen, dry gardens and traditional calming uses.",
    precautions:"Do not ingest essential oil without professional advice. For cooking, use only a suitable, clearly identified lavender.",
    anecdote:"Its fragrance has long been used in homes, wardrobes and gardens."
  },
  romarin: {
    name:"Rosemary", family:"Lamiaceae", flowering:"Winter to spring", height:"50 cm to 1.5 m",
    summary:"An evergreen Mediterranean shrub with narrow, leathery and strongly aromatic leaves.",
    recognition:"Look for narrow, rigid leaves with a paler underside and a distinctive resinous scent.",
    culture:"Full sun, well-drained soil and moderate watering. It tolerates dryness better than wet roots.",
    cuisine:"Used to flavour potatoes, roasted vegetables, bread, infused oils and slow-cooked dishes.",
    tradition:"Traditionally associated with memory and Mediterranean gardens.",
    precautions:"Commonly used as a culinary herb. Concentrated preparations require caution.",
    anecdote:"Its former genus name, Rosmarinus, evokes the dew of the sea."
  },
  rose: {
    name:"Rose", family:"Rosaceae", flowering:"Spring to summer", height:"Variable",
    summary:"An often thorny shrub with compound leaves and flowers that vary widely between species and cultivars.",
    recognition:"Look for often thorny stems, compound leaves with serrated leaflets and the characteristic floral structure.",
    culture:"A bright position, fertile soil and regular watering during dry periods.",
    cuisine:"Untreated rose petals can be used in syrups, jellies, desserts and infusions.",
    tradition:"A long-standing symbol of fragrance, beauty and cultivated gardens.",
    precautions:"Only use untreated, clearly identified roses in food. Avoid florist flowers.",
    anecdote:"Roses have accompanied the history of gardens for centuries."
  },
  thym: {
    name:"Common thyme", family:"Lamiaceae", flowering:"Spring to summer", height:"10 to 30 cm",
    summary:"A small aromatic subshrub with tiny opposite leaves and an intense fragrance.",
    recognition:"Look for small opposite leaves, woody stems and a warm aromatic scent when the foliage is crushed.",
    culture:"Full sun and light, well-drained soil. It tolerates dryness better than excess water.",
    cuisine:"Used to flavour roasted vegetables, sauces, soups and bouquet garni.",
    tradition:"Widely used in Mediterranean cooking.",
    precautions:"Commonly used as a culinary herb. Essential oils require caution.",
    anecdote:"Thyme often evokes the dry, sunlit landscapes of southern Europe."
  },
  persil: {
    name:"Parsley", family:"Apiaceae", flowering:"Second year", height:"20 to 40 cm",
    summary:"A biennial herb with aromatic green leaves, flat or curled depending on the cultivar.",
    recognition:"Examine the leaf shape and fresh scent. Wild specimens require great caution because hazardous Apiaceae can look similar.",
    culture:"Moist soil, gentle light and regular harvesting of the stems.",
    cuisine:"Fresh leaves are used in salads, sauces, warm dishes and tabbouleh.",
    tradition:"A very common culinary herb used to add freshness and colour.",
    precautions:"Use as a cultivated culinary herb. Exercise caution with similar-looking wild plants.",
    anecdote:"Parsley may seem discreet, yet it can change the balance of an entire dish."
  }
};

const englishKnowledgeContent = {
  lilium:{edibility:"Toxic to cats / do not consume",summary:"True lilies are ornamental bulbous plants with large, often fragrant flowers. They are mainly grown for their elegant display in beds, pots and bouquets.",benefits:"Primarily ornamental. The Grimoire does not recommend food or medicinal uses based on image identification.",care:"Plant in fertile, well-drained soil in a bright position. Water moderately, remove faded flowers and allow foliage to yellow naturally so the bulb can replenish its reserves.",precautions:"Do not consume. True Lilium species are especially dangerous to cats: leaves, flowers, pollen and vase water can all pose a risk. Contact a veterinarian urgently after suspected exposure.",source:"Starting references: RHS horticultural guidance and ASPCA / Pet Poison Helpline veterinary information."},
  hydrangea:{edibility:"Toxic / not edible",summary:"Hydrangeas are ornamental shrubs valued for their large round or flat flower heads in shades of blue, pink, purple or white.",benefits:"Primarily ornamental, appreciated for their decorative flowers. No food use is recommended.",care:"Partial shade or gentle morning sun, rich moist but well-drained soil, and regular watering without waterlogging.",precautions:"Do not consume. Hydrangeas may be toxic to people and pets if ingested. Keep away from children, dogs, cats and horses.",source:"Starting references: ASPCA toxicity information and RHS horticultural guidance."},
  mentha:{edibility:"Edible as a culinary herb when confidently identified",summary:"Mint is a fragrant perennial commonly grown in pots and gardens. Its strong scent when the leaves are crushed is an important identification feature.",benefits:"Traditionally used in after-meal infusions and cooking for its fresh aroma.",care:"Moist soil, gentle light to partial shade and regular watering. It is easier to contain in a pot.",precautions:"Avoid concentrated preparations such as essential oils without professional advice.",source:"Grimoire editorial profile."},
  lavandula:{edibility:"Some lavenders are edible in very small amounts when correctly identified",summary:"Lavender is a Mediterranean subshrub with narrow leaves and fragrant purple flower spikes, valued for fragrance, decoration and drought tolerance.",benefits:"Traditionally associated with fragrance, linen and calming uses.",care:"Full sun, very well-drained soil and little water. Excess moisture is its main enemy.",precautions:"Do not ingest essential oil without professional advice. Use only clearly identified culinary lavender.",source:"Grimoire editorial profile."},
  rosemary:{edibility:"Edible as a culinary herb when confidently identified",summary:"Rosemary is an evergreen Mediterranean shrub with narrow leathery leaves and a characteristic resinous scent.",benefits:"A traditional Mediterranean herb used in cooking and light infusions.",care:"Full sun, well-drained soil and moderate watering. It tolerates dryness better than stagnant moisture.",precautions:"Commonly used as a culinary herb. Concentrated preparations require caution.",source:"Grimoire editorial profile."},
  thymus:{edibility:"Edible as a culinary herb when confidently identified",summary:"Thyme is a small aromatic subshrub of dry sunny habitats. Its fragrant leaves are widely used in cooking.",benefits:"Widely used in Mediterranean cuisine, traditionally as an infusion and culinary herb.",care:"Full sun and light, well-drained soil. Little watering once established.",precautions:"Common culinary use is generally expected; essential oils require caution.",source:"Grimoire editorial profile."},
  petroselinum:{edibility:"Edible when cultivated or confidently identified",summary:"Parsley is a biennial culinary herb with flat or curled leaves. Wild specimens require caution because dangerous Apiaceae may look similar.",benefits:"A common culinary herb adding freshness and colour to dishes.",care:"Moist soil, gentle light and regular harvesting.",precautions:"Beware of similar wild plants: some Apiaceae are highly dangerous.",source:"Grimoire editorial profile."},
  rosa:{edibility:"Petals may be edible if untreated and confidently identified",summary:"Roses are often thorny shrubs cultivated for varied, fragrant flowers. Untreated petals are sometimes used in cooking.",benefits:"An ornamental and fragrant plant, traditionally used in syrups, jellies and infusions.",care:"A bright position, fertile soil and regular watering in dry periods.",precautions:"Do not use florist or treated flowers. Confirm identification before any use.",source:"Grimoire editorial profile."},
  liliaceae:{edibility:"Requires verification — caution",summary:"This family includes many bulbous plants grown for decorative flowers. Closely related species may be harmful or toxic depending on the animal and use.",benefits:"Treat as ornamental until the exact species is confirmed.",care:"Well-drained soil, generous light and moderate watering. Avoid stagnant water around bulbs.",precautions:"Do not consume without reliable confirmation. Take particular care around pets.",source:"Grimoire family profile."},
  lamiaceae:{edibility:"Often aromatic, but must be confirmed",summary:"The mint family includes many aromatic plants such as mint, thyme, sage and rosemary. Square stems, opposite leaves and strong scents are common features.",benefits:"Many species are used as culinary herbs or traditional infusions, but use depends on the exact species.",care:"Bright light, well-drained soil and watering suited to the species.",precautions:"Do not use as essential oil or concentrated infusion without reliable guidance. Confirm the species before consumption.",source:"Grimoire family profile."},
  rosaceae:{edibility:"Varies by species",summary:"The rose family includes many garden and orchard plants, including roses, strawberries, apples, plums and brambles.",benefits:"Uses vary widely between fruit, ornamental flowers, fragrance and cooking.",care:"Many favour a bright position, fertile soil and regular watering in dry periods.",precautions:"Only consume plant parts clearly known to be edible and untreated.",source:"Grimoire family profile."},
  asteraceae:{edibility:"Variable — verification required",summary:"The daisy family is a vast group with composite flower heads, including daisies, dandelions, asters, sunflowers and thistles.",benefits:"Some species have culinary or traditional uses, but many look alike and require solid identification.",care:"Many grow well in bright positions and well-drained soil, with species-dependent watering.",precautions:"Confusion risk is high in this large family. Do not consume without confirmed identification.",source:"Grimoire family profile."},
  apiaceae:{edibility:"High caution — hazardous family",summary:"The carrot family includes familiar herbs and vegetables as well as highly toxic wild plants. Umbels and divided leaves are common features.",benefits:"Some cultivated species are edible or aromatic, but confusion can be dangerous.",care:"Often grown in moist soil with gentle to bright light depending on species.",precautions:"Never consume a wild Apiaceae identified only from a photograph.",source:"Grimoire family profile."},
  araceae:{edibility:"Often irritating / not edible",summary:"The arum family includes many decorative houseplants valued for their graphic foliage.",benefits:"Primarily ornamental.",care:"Indirect light, free-draining substrate, moderate watering and adequate humidity suit many indoor species.",precautions:"Many Araceae contain substances that irritate the mouth and digestive system. Keep away from children and pets.",source:"Grimoire family profile."},
  orchidaceae:{edibility:"Ornamental — do not consume",summary:"Orchids are primarily ornamental plants known for long-lasting, highly structured flowers. Many indoor orchids require air around their roots rather than compact soil.",benefits:"Primarily decorative and collectible. No food or medicinal use is recommended.",care:"Bright indirect light, specialist free-draining orchid substrate and moderate watering once roots turn silvery or the substrate dries.",precautions:"Do not consume. Ingestion may cause stomach irritation and plant treatments may be toxic to pets.",source:"Grimoire family profile based on common horticultural guidance and ASPCA pet-safety information."},
  amaryllidaceae:{edibility:"Toxic / not edible",summary:"This family contains ornamental bulbs such as daffodils, narcissi and amaryllis, prized for their prominent flowers.",benefits:"Primarily ornamental.",care:"Free-draining soil, good light and moderate watering during growth. Allow foliage to replenish the bulb after flowering.",precautions:"Do not consume: bulbs and other parts may be toxic. Keep away from children and pets.",source:"Grimoire family profile."},
  solanaceae:{edibility:"Variable — high caution",summary:"The nightshade family contains familiar foods such as tomatoes, potatoes and peppers alongside toxic plants. Edible parts depend greatly on species.",benefits:"Uses range from food crops and spices to ornamentals and poisonous plants.",care:"Cultivated food species often require warmth, light and rich soil.",precautions:"Never consume an unknown or wild nightshade based on a photograph. Some species and green parts are toxic.",source:"Grimoire family profile."},
  brassicaceae:{edibility:"Often edible, but must be confirmed",summary:"The mustard family includes cabbages, rocket, mustard, radishes and many wild plants with four-petalled cross-shaped flowers.",benefits:"Leaves, seeds, roots and condiments are used in cooking depending on species.",care:"Often grown in moist soil with gentle to bright light and regular watering.",precautions:"Confirm the species and avoid polluted or treated areas before food use.",source:"Grimoire family profile."},
  poaceae:{edibility:"Varies by species",summary:"The grass family includes lawns, cereals, bamboo and many meadow plants, often recognised by narrow leaves and jointed stems.",benefits:"A major family for cereals and grasslands, although not every species is intended for consumption.",care:"Needs vary widely; many favour light and well-drained soil.",precautions:"Do not consume seeds or young shoots without clear identification. Beware of lawn treatments.",source:"Grimoire family profile."},
  pinaceae:{edibility:"Not intended as food / do not consume without expertise",summary:"The pine family includes conifers such as spruces, pines, firs, cedars and larches. They are mainly ornamental, forestry or landscape trees, recognised by needles and cones rather than showy flowers.",benefits:"Main uses include ornament, shade, timber, hedging and landscaping depending on species.",care:"Provide ample space, good light and reasonably well-drained soil. Many conifers dislike stagnant water and severe pruning into old wood.",precautions:"Do not consume without expert identification. Confusion with other conifers can be dangerous, particularly yew, which is not a Pinaceae and is toxic.",source:"Grimoire family profile for Pinaceae and conifers."}
};

function localizedPlant(plant){
  if(currentLocale !== "en") return plant;
  return {...plant, ...(englishPlantContent[plant.id] || {})};
}

function localizedKnowledge(profile){
  if(currentLocale !== "en" || !profile?.id) return profile;
  return {...profile, ...(englishKnowledgeContent[profile.id] || {})};
}
