/**
 * Emission factors in kg CO2e per unit
 * Sources: EPA, IPCC, DEFRA 2024 Guidelines
 */

export const EMISSION_FACTORS = {
    
  transportation: {
    car: {
      petrol: 0.192,      // Average petrol car
      diesel: 0.171,      // Average diesel car
      hybrid: 0.108,      // Average hybrid car
      electric: 0.053,    // Average electric car (including grid emissions)
      unknown: 0.180      // Default average
    },
    publicTransport: {
      bus: 0.089,         // City bus
      train: 0.041,       // Regional train
      metro: 0.033,       // Metro/subway
      tram: 0.029         // Tram/light rail
    },
    motorcycle: 0.114,    // Average motorcycle
    bicycle: 0,           // Zero emissions
    walking: 0,           // Zero emissions
    flight: {
      domestic: 0.255,    // per km
      shortHaul: 0.156,   // < 3700 km
      longHaul: 0.150     // > 3700 km
    }
  },

  
  energy: {
    electricity: {
      grid: 0.309,        // Average grid mix (varies by country)
      renewable: 0.013,   // Solar/wind average
      coal: 0.820,        // Coal power
      naturalGas: 0.490,  // Natural gas power
      nuclear: 0.012      // Nuclear power
    },
    heating: {
      naturalGas: 0.185,  // per kWh
      oil: 0.246,         // per kWh
      electric: 0.309,    // per kWh (grid average)
      woodPellets: 0.039, // per kWh
      districtHeating: 0.147 // per kWh
    },
    appliances: {
      refrigerator: 0.408,    // kg CO2e per day
      washingMachine: 0.340,  // kg CO2e per cycle
      dishwasher: 0.270,      // kg CO2e per cycle
      dryer: 0.750,          // kg CO2e per cycle
      airConditioner: 0.500,  // kg CO2e per hour
      computer: 0.050,        // kg CO2e per hour
      television: 0.035       // kg CO2e per hour
    }
  },

  
  food: {
    meat: {
      beef: 27.0,         // Highest impact
      lamb: 24.0,
      pork: 7.2,
      chicken: 6.1,
      fish: 5.1
    },
    dairy: {
      cheese: 13.5,
      milk: 1.9,          // per liter
      yogurt: 2.2,
      butter: 11.9,
      eggs: 4.8           // per kg
    },
    vegetables: {
      local: 0.4,         // Average local vegetables
      imported: 2.0,      // Imported vegetables
      greenhouse: 3.0     // Greenhouse grown
    },
    grains: {
      rice: 2.7,
      wheat: 0.9,
      pasta: 1.2,
      bread: 1.1
    },
    other: {
      tofu: 2.0,
      beans: 0.9,
      nuts: 2.3,
      fruit_local: 0.4,
      fruit_imported: 1.8
    }
  },

  
  water: {
    supply: 0.344,        // Water supply treatment
    wastewater: 0.708,    // Wastewater treatment
    heating: {
      electric: 4.5,      // per cubic meter heated
      gas: 2.1,          // per cubic meter heated
      solar: 0.1         // per cubic meter heated
    }
  },

  
  shopping: {
    clothing: {
      cotton_tshirt: 8.0,     // per item
      jeans: 33.0,            // per item
      polyester_shirt: 5.5,   // per item
      shoes: 14.0,            // per pair
      jacket: 25.0            // per item
    },
    electronics: {
      smartphone: 70.0,       // per device
      laptop: 350.0,          // per device
      tablet: 130.0,          // per device
      television: 500.0,      // per device
      desktop: 430.0          // per device
    },
    paper: 1.84,              // kg CO2e per kg
    plastic: 6.0,             // kg CO2e per kg
    glass: 0.86,              // kg CO2e per kg
    aluminum: 11.89           // kg CO2e per kg
  },

  
  waste: {
    landfill: {
      organic: 0.467,
      paper: 0.984,
      plastic: 0.041,
      textile: 0.239
    },
    recycling: {
      paper: -0.843,    // Negative = savings
      plastic: -1.507,
      glass: -0.314,
      metal: -1.762
    },
    composting: -0.180  // Negative = savings
  }
};


export const REGIONAL_FACTORS = {
  electricity: {
    // Countries with different grid mixes
    norway: 0.05,      // Mostly hydro
    france: 0.19,      // Nuclear heavy
    germany: 1.45,     // Coal heavy
    india: 2.32,       // Coal heavy
    china: 2.10,       // Coal heavy
    usa: 1.0,          // Base reference
    uk: 0.74,          // Gas and renewables
    japan: 1.54,       // Mixed sources
    brazil: 0.24,      // Hydro heavy
    australia: 2.06    // Coal heavy
  }
};




export function getEmissionFactor(
  category: string,
  subcategory: string,
  activity: string,
  region: string
): number {
  try {
    let factor = 0;
    
    
    const categoryData = (EMISSION_FACTORS as any)[category];
    if (!categoryData) return 0;

    const subData = (categoryData as any)[subcategory];
    
    if (activity) {
      factor = subData?.[activity] ?? 0;
    } else {
      factor = subData ?? 0;
    }
    
    // Apply regional adjustments for electricity
    if (category === 'energy' && subcategory === 'electricity' && region) {
      const regionalMultiplier = REGIONAL_FACTORS.electricity[region.toLowerCase() as keyof typeof REGIONAL_FACTORS.electricity];
      if (regionalMultiplier) {
        factor *= regionalMultiplier;
      }
    }
    
    return factor;
  } catch (error) {
    console.error('Error getting emission factor:', error);
    return 0;
  }
}


export function calculateEmissions(
  amount: number,
  unit: string,
  category: string,
  subcategory: string,
  activity: string,
  region: string
): number {
  const factor = getEmissionFactor(category, subcategory, activity, region);
  
  // Convert units if necessary
  let multiplier = 1;
  switch (unit) {
    case 'miles':
      multiplier = 1.60934; // Convert to km
      break;
    case 'gallons':
      multiplier = 3.78541; // Convert to liters
      break;
    case 'pounds':
      multiplier = 0.453592; // Convert to kg
      break;
    default:
      multiplier = 1;
  }
  
  return amount * multiplier * factor;
}



export const QUICK_FACTORS = {
  dailyCommuteCar: 0.180,        // kg CO2e per km
  publicTransport: 0.050,         // kg CO2e per km
  electricity: 0.309,             // kg CO2e per kWh
  naturalGas: 0.185,              // kg CO2e per kWh
  meatMeal: 7.5,                  // kg CO2e per meal
  vegetarianMeal: 1.5,            // kg CO2e per meal
  veganMeal: 0.9,                 // kg CO2e per meal
  clothingItem: 15.0,             // kg CO2e per average item
  electronicsItem: 200.0,         // kg CO2e per average device
  waterLiter: 0.001,              // kg CO2e per liter
  wasteKg: 0.467                  // kg CO2e per kg to landfill
};