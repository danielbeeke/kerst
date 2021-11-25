function STAMPS2021 (numberOfCards) {
    // 20-50 gram = 2 postzegels (1,82)
    // 50-100 gram = 3 postzegels (2,73)
    // 100-350 gram = 4 postzegels (3,64)
      
      let cardEnvelope = 5.5
      let cardWeight = 6
    
      let totalWeight = 0;
      totalWeight += 14; // envelope.
      totalWeight += numberOfCards * (cardEnvelope + cardWeight);
      
      if (totalWeight < 48) return 2;
      if (totalWeight < 98) return 3;
      if (totalWeight < 358) return 4;
      return 5;
}

for (let i = 1; i < 25; i++) {
    const price = STAMPS2021(i) * .96
    console.log(price)
} 