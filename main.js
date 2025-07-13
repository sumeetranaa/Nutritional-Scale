const { jsPDF } = window.jspdf;
const userData = {
  age: null,
  gender: null,
  weight: null,
  height: null,
  goal: null,
  activityStyle: null,
  activityFrequency: null,
  activityDays: [],
  activityIntensity: null,
  workoutTiming: null,
  diet: null,
};
const calculationResults = {
  bmr: 0,
  tdeeMultiplier: "",
  calorieAdjustment: 0,
  macroRatio: {},
  dailyPlan: [],
  mealPlan: [],
};
// Added 'landing' to the cardSequence
const cardSequence = [
  "landing",
  "age",
  "gender",
  "weight",
  "height",
  "goal",
  "activityStyle",
  "activityFrequency",
  "activityIntensity",
  "workoutTiming",
  "diet",
  "summary",
  "loading",
  "meal-plan",
];
let currentScreenId = "landing-card"; // Initial screen is now the landing page
let isEditing = false;
let mealNamesLoaded = new Array(14).fill(false); // Track loading state for each day
let isLoadingMeals = false; // Global flag for meal loading
let abortController = null; // To allow cancellation of fetch requests

// Premium Indian Meals Data (Expanded with typical ingredients for AI reference)
const premiumIndianMeals = {
  Breakfast: {
    Vegetarian: [
      {
        name: "Protein-Packed Oatmeal Bowl",
        ingredients: [
          "Rolled Oats",
          "Almond Milk",
          "Whey Protein Isolate",
          "Berries",
          "Chia Seeds",
          "Almond Butter",
        ],
      },
      {
        name: "Tofu Scramble with Avocado",
        ingredients: [
          "Tofu",
          "Mixed Veggies",
          "Avocado",
          "Turmeric",
          "Black Pepper",
        ],
      },
      {
        name: "Greek Yogurt Parfait",
        ingredients: ["Greek Yogurt", "Granola", "Mixed Fruit", "Flax Seeds"],
      },
      {
        name: "Multigrain Protein Pancakes",
        ingredients: [
          "Multigrain Flour",
          "Egg",
          "Protein Powder",
          "Almond Milk",
          "Fruit",
        ],
      },
    ],
    "Non-Vegetarian": [
      {
        name: "Egg White & Veggie Scramble",
        ingredients: [
          "Egg Whites",
          "Spinach",
          "Bell Pepper",
          "Onion",
          "Turkey Breast",
        ],
      },
      {
        name: "Smoked Salmon & Rye Toast",
        ingredients: ["Smoked Salmon", "Rye Toast", "Avocado", "Lemon", "Dill"],
      },
      {
        name: "Protein-Packed Oatmeal Bowl",
        ingredients: [
          "Rolled Oats",
          "Almond Milk",
          "Whey Protein Isolate",
          "Berries",
          "Chia Seeds",
          "Almond Butter",
        ],
      }, // Can be non-veg too
      {
        name: "Multigrain Protein Pancakes",
        ingredients: [
          "Multigrain Flour",
          "Egg",
          "Protein Powder",
          "Almond Milk",
          "Fruit",
        ],
      }, // Can be non-veg too
    ],
  },
  "Pre-Workout": {
    Vegetarian: [
      {
        name: "Whole Wheat Toast with Banana",
        ingredients: [
          "Whole wheat bread slice",
          "Banana",
          "Peanut Butter",
          "Honey",
        ],
      },
      {
        name: "Whole Wheat Toast with Scrambled Eggs & Avocado",
        ingredients: ["Whole wheat bread slice", "Eggs", "Avocado"],
      }, // Eggs are ovo-vegetarian
      {
        name: "Scrambled Egg on Whole Wheat English Muffin",
        ingredients: ["Whole wheat English muffin", "Eggs", "Avocado"],
      }, // Eggs are ovo-vegetarian
    ],
    "Non-Vegetarian": [
      {
        name: "Whole Wheat Toast with Banana",
        ingredients: [
          "Whole wheat bread slice",
          "Banana",
          "Peanut Butter",
          "Honey",
        ],
      },
      {
        name: "Whole Wheat Toast with Scrambled Eggs & Avocado",
        ingredients: ["Whole wheat bread slice", "Eggs", "Avocado"],
      },
      {
        name: "Scrambled Egg on Whole Wheat English Muffin",
        ingredients: ["Whole wheat English muffin", "Eggs", "Avocado"],
      },
    ],
  },
  "Post-Workout": {
    Vegetarian: [
      {
        name: "Chocolate Banana Protein Shake",
        ingredients: [
          "Protein powder",
          "Banana",
          "Almond milk",
          "Cocoa powder",
        ],
      },
      {
        name: "Vanilla Berry Protein Shake",
        ingredients: [
          "Protein powder",
          "Mixed berries (strawberries, blueberries, raspberries)",
          "Water/Milk",
        ],
      },
      {
        name: "Tropical Mango Coconut Protein Shake",
        ingredients: [
          "Protein powder",
          "Mango chunks",
          "Coconut milk (light)",
          "Lime juice",
        ],
      },
    ],
    "Non-Vegetarian": [
      {
        name: "Chocolate Banana Protein Shake",
        ingredients: [
          "Protein powder",
          "Banana",
          "Almond milk",
          "Cocoa powder",
        ],
      },
      {
        name: "Vanilla Berry Protein Shake",
        ingredients: [
          "Protein powder",
          "Mixed berries (strawberries, blueberries, raspberries)",
          "Water/Milk",
        ],
      },
      {
        name: "Tropical Mango Coconut Protein Shake",
        ingredients: [
          "Protein powder",
          "Mango chunks",
          "Coconut milk (light)",
          "Lime juice",
        ],
      },
    ],
  },
  "Morning Snack": {
    Vegetarian: [
      {
        name: "Trail Mix with Greek Yogurt",
        ingredients: [
          "Mixed Nuts",
          "Dried Fruit",
          "Pumpkin Seeds",
          "Greek Yogurt",
        ],
      },
      {
        name: "Protein Balls",
        ingredients: ["Protein Powder", "Oats", "Nut Butter", "Dates", "Seeds"],
      },
      {
        name: "Cottage Cheese with Fruit & Seeds",
        ingredients: ["Cottage Cheese", "Mixed Berries", "Chia Seeds"],
      },
      {
        name: "Hard-Boiled Eggs with Avocado & Crackers",
        ingredients: ["Hard-Boiled Eggs", "Avocado", "Whole Grain Crackers"],
      }, // Eggs are ovo-vegetarian
      {
        name: "Edamame with Sea Salt",
        ingredients: ["Steamed Edamame", "Sea Salt"],
      },
      {
        name: "Roasted Chickpeas with Spices",
        ingredients: ["Chickpeas", "Olive Oil", "Spices (cumin, paprika)"],
      },
    ],
    "Non-Vegetarian": [
      {
        name: "Trail Mix with Greek Yogurt",
        ingredients: [
          "Mixed Nuts",
          "Dried Fruit",
          "Pumpkin Seeds",
          "Greek Yogurt",
        ],
      },
      {
        name: "Protein Balls",
        ingredients: ["Protein Powder", "Oats", "Nut Butter", "Dates", "Seeds"],
      },
      {
        name: "Cottage Cheese with Fruit & Seeds",
        ingredients: ["Cottage Cheese", "Mixed Berries", "Chia Seeds"],
      },
      {
        name: "Hard-Boiled Eggs with Avocado & Crackers",
        ingredients: ["Hard-Boiled Eggs", "Avocado", "Whole Grain Crackers"],
      },
      {
        name: "Edamame with Sea Salt",
        ingredients: ["Steamed Edamame", "Sea Salt"],
      },
      {
        name: "Roasted Chickpeas with Spices",
        ingredients: ["Chickpeas", "Olive Oil", "Spices (cumin, paprika)"],
      },
    ],
  },
  "Evening Snack": {
    // Reusing Morning Snack for Evening Snack as per user's list
    Vegetarian: [
      {
        name: "Trail Mix with Greek Yogurt",
        ingredients: [
          "Mixed Nuts",
          "Dried Fruit",
          "Pumpkin Seeds",
          "Greek Yogurt",
        ],
      },
      {
        name: "Protein Balls",
        ingredients: ["Protein Powder", "Oats", "Nut Butter", "Dates", "Seeds"],
      },
      {
        name: "Cottage Cheese with Fruit & Seeds",
        ingredients: ["Cottage Cheese", "Mixed Berries", "Chia Seeds"],
      },
      {
        name: "Hard-Boiled Eggs with Avocado & Crackers",
        ingredients: ["Hard-Boiled Eggs", "Avocado", "Whole Grain Crackers"],
      },
      {
        name: "Edamame with Sea Salt",
        ingredients: ["Steamed Edamame", "Sea Salt"],
      },
      {
        name: "Roasted Chickpeas with Spices",
        ingredients: ["Chickpeas", "Olive Oil", "Spices (cumin, paprika)"],
      },
    ],
    "Non-Vegetarian": [
      {
        name: "Trail Mix with Greek Yogurt",
        ingredients: [
          "Mixed Nuts",
          "Dried Fruit",
          "Pumpkin Seeds",
          "Greek Yogurt",
        ],
      },
      {
        name: "Protein Balls",
        ingredients: ["Protein Powder", "Oats", "Nut Butter", "Dates", "Seeds"],
      },
      {
        name: "Cottage Cheese with Fruit & Seeds",
        ingredients: ["Cottage Cheese", "Mixed Berries", "Chia Seeds"],
      },
      {
        name: "Hard-Boiled Eggs with Avocado & Crackers",
        ingredients: ["Hard-Boiled Eggs", "Avocado", "Whole Grain Crackers"],
      },
      {
        name: "Edamame with Sea Salt",
        ingredients: ["Steamed Edamame", "Sea Salt"],
      },
      {
        name: "Roasted Chickpeas with Spices",
        ingredients: ["Chickpeas", "Olive Oil", "Spices (cumin, paprika)"],
      },
    ],
  },
  "Snack 1": {
    // Generic snack slot, reusing Morning Snack
    Vegetarian: [
      {
        name: "Trail Mix with Greek Yogurt",
        ingredients: [
          "Mixed Nuts",
          "Dried Fruit",
          "Pumpkin Seeds",
          "Greek Yogurt",
        ],
      },
      {
        name: "Protein Balls",
        ingredients: ["Protein Powder", "Oats", "Nut Butter", "Dates", "Seeds"],
      },
      {
        name: "Cottage Cheese with Fruit & Seeds",
        ingredients: ["Cottage Cheese", "Mixed Berries", "Chia Seeds"],
      },
      {
        name: "Hard-Boiled Eggs with Avocado & Crackers",
        ingredients: ["Hard-Boiled Eggs", "Avocado", "Whole Grain Crackers"],
      },
      {
        name: "Edamame with Sea Salt",
        ingredients: ["Steamed Edamame", "Sea Salt"],
      },
      {
        name: "Roasted Chickpeas with Spices",
        ingredients: ["Chickpeas", "Olive Oil", "Spices (cumin, paprika)"],
      },
    ],
    "Non-Vegetarian": [
      {
        name: "Trail Mix with Greek Yogurt",
        ingredients: [
          "Mixed Nuts",
          "Dried Fruit",
          "Pumpkin Seeds",
          "Greek Yogurt",
        ],
      },
      {
        name: "Protein Balls",
        ingredients: ["Protein Powder", "Oats", "Nut Butter", "Dates", "Seeds"],
      },
      {
        name: "Cottage Cheese with Fruit & Seeds",
        ingredients: ["Cottage Cheese", "Mixed Berries", "Chia Seeds"],
      },
      {
        name: "Hard-Boiled Eggs with Avocado & Crackers",
        ingredients: ["Hard-Boiled Eggs", "Avocado", "Whole Grain Crackers"],
      },
      {
        name: "Edamame with Sea Salt",
        ingredients: ["Steamed Edamame", "Sea Salt"],
      },
      {
        name: "Roasted Chickpeas with Spices",
        ingredients: ["Chickpeas", "Olive Oil", "Spices (cumin, paprika)"],
      },
    ],
  },
  "Snack 2": {
    // Generic snack slot, reusing Morning Snack
    Vegetarian: [
      {
        name: "Trail Mix with Greek Yogurt",
        ingredients: [
          "Mixed Nuts",
          "Dried Fruit",
          "Pumpkin Seeds",
          "Greek Yogurt",
        ],
      },
      {
        name: "Protein Balls",
        ingredients: ["Protein Powder", "Oats", "Nut Butter", "Dates", "Seeds"],
      },
      {
        name: "Cottage Cheese with Fruit & Seeds",
        ingredients: ["Cottage Cheese", "Mixed Berries", "Chia Seeds"],
      },
      {
        name: "Hard-Boiled Eggs with Avocado & Crackers",
        ingredients: ["Hard-Boiled Eggs", "Avocado", "Whole Grain Crackers"],
      },
      {
        name: "Edamame with Sea Salt",
        ingredients: ["Steamed Edamame", "Sea Salt"],
      },
      {
        name: "Roasted Chickpeas with Spices",
        ingredients: ["Chickpeas", "Olive Oil", "Spices (cumin, paprika)"],
      },
    ],
    "Non-Vegetarian": [
      {
        name: "Trail Mix with Greek Yogurt",
        ingredients: [
          "Mixed Nuts",
          "Dried Fruit",
          "Pumpkin Seeds",
          "Greek Yogurt",
        ],
      },
      {
        name: "Protein Balls",
        ingredients: ["Protein Powder", "Oats", "Nut Butter", "Dates", "Seeds"],
      },
      {
        name: "Cottage Cheese with Fruit & Seeds",
        ingredients: ["Cottage Cheese", "Mixed Berries", "Chia Seeds"],
      },
      {
        name: "Hard-Boiled Eggs with Avocado & Crackers",
        ingredients: ["Hard-Boiled Eggs", "Avocado", "Whole Grain Crackers"],
      },
      {
        name: "Edamame with Sea Salt",
        ingredients: ["Steamed Edamame", "Sea Salt"],
      },
      {
        name: "Roasted Chickpeas with Spices",
        ingredients: ["Chickpeas", "Olive Oil", "Spices (cumin, paprika)"],
      },
    ],
  },
  Lunch: {
    Vegetarian: [
      {
        name: "Lentil & Vegetable Curry with Brown Rice",
        ingredients: ["Lentil Curry", "Brown Rice", "Mixed Veggies"],
      },
      {
        name: "Tofu Stir-fry with Brown Rice Noodles",
        ingredients: [
          "Tofu",
          "Mixed Veggies",
          "Brown Rice Noodles",
          "Soy Sauce (low sodium)",
        ],
      },
      {
        name: "Vegetable Paella",
        ingredients: [
          "Brown Rice",
          "Mixed Veggies",
          "Saffron",
          "Paprika",
          "Peas",
        ],
      },
      {
        name: "Chickpea and Vegetable Curry with Quinoa",
        ingredients: ["Chickpea Curry", "Quinoa", "Mixed Veggies"],
      },
      {
        name: "Lentil Shepherd's Pie",
        ingredients: [
          "Lentils",
          "Mixed Veggies",
          "Mashed Sweet Potato Topping",
        ],
      },
      {
        name: "Tofu and Vegetable Skewers with Brown Rice",
        ingredients: ["Tofu", "Mixed Veggies", "Brown Rice", "Teriyaki Sauce"],
      },
      {
        name: "Mediterranean Quinoa Bowl",
        ingredients: [
          "Quinoa",
          "Cucumber",
          "Tomatoes",
          "Olives",
          "Feta Cheese",
          "Lemon Vinaigrette",
        ],
      },
    ],
    "Non-Vegetarian": [
      {
        name: "Grilled Chicken with Quinoa & Veggies",
        ingredients: ["Chicken Breast", "Quinoa", "Broccoli", "Bell Pepper"],
      },
      {
        name: "Baked Salmon with Sweet Potato & Asparagus",
        ingredients: ["Salmon", "Sweet Potato", "Asparagus"],
      },
      {
        name: "Chicken Tikka Masala with Basmati Rice",
        ingredients: ["Chicken Tikka", "Tikka Masala Sauce", "Basmati Rice"],
      },
      {
        name: "Shrimp Scampi with Zucchini Noodles",
        ingredients: [
          "Shrimp",
          "Zucchini Noodles",
          "Garlic",
          "White Wine",
          "Lemon",
          "Herbs",
        ],
      },
      {
        name: "Baked Fish with Roasted Root Vegetables",
        ingredients: ["White Fish Fillet", "Root Veggies", "Herbs", "Lemon"],
      },
      {
        name: "Chicken Fajita Bowl",
        ingredients: [
          "Chicken",
          "Bell Peppers",
          "Onions",
          "Black Beans",
          "Salsa",
          "Avocado",
        ],
      },
      {
        name: "Thai Green Curry with Chicken & Brown Rice",
        ingredients: [
          "Chicken",
          "Thai Green Curry",
          "Brown Rice",
          "Mixed Veggies",
        ],
      },
    ],
  },
  Dinner: {
    // Reusing Lunch meals for Dinner as per user's list
    Vegetarian: [
      {
        name: "Lentil & Vegetable Curry with Brown Rice",
        ingredients: ["Lentil Curry", "Brown Rice", "Mixed Veggies"],
      },
      {
        name: "Tofu Stir-fry with Brown Rice Noodles",
        ingredients: [
          "Tofu",
          "Mixed Veggies",
          "Brown Rice Noodles",
          "Soy Sauce (low sodium)",
        ],
      },
      {
        name: "Vegetable Paella",
        ingredients: [
          "Brown Rice",
          "Mixed Veggies",
          "Saffron",
          "Paprika",
          "Peas",
        ],
      },
      {
        name: "Chickpea and Vegetable Curry with Quinoa",
        ingredients: ["Chickpea Curry", "Quinoa", "Mixed Veggies"],
      },
      {
        name: "Lentil Shepherd's Pie",
        ingredients: [
          "Lentils",
          "Mixed Veggies",
          "Mashed Sweet Potato Topping",
        ],
      },
      {
        name: "Tofu and Vegetable Skewers with Brown Rice",
        ingredients: ["Tofu", "Mixed Veggies", "Brown Rice", "Teriyaki Sauce"],
      },
      {
        name: "Mediterranean Quinoa Bowl",
        ingredients: [
          "Quinoa",
          "Cucumber",
          "Tomatoes",
          "Olives",
          "Feta Cheese",
          "Lemon Vinaigrette",
        ],
      },
    ],
    "Non-Vegetarian": [
      {
        name: "Grilled Chicken with Quinoa & Veggies",
        ingredients: ["Chicken Breast", "Quinoa", "Broccoli", "Bell Pepper"],
      },
      {
        name: "Baked Salmon with Sweet Potato & Asparagus",
        ingredients: ["Salmon", "Sweet Potato", "Asparagus"],
      },
      {
        name: "Chicken Tikka Masala with Basmati Rice",
        ingredients: ["Chicken Tikka", "Tikka Masala Sauce", "Basmati Rice"],
      },
      {
        name: "Shrimp Scampi with Zucchini Noodles",
        ingredients: [
          "Shrimp",
          "Zucchini Noodles",
          "Garlic",
          "White Wine",
          "Lemon",
          "Herbs",
        ],
      },
      {
        name: "Baked Fish with Roasted Root Vegetables",
        ingredients: ["White Fish Fillet", "Root Veggies", "Herbs", "Lemon"],
      },
      {
        name: "Chicken Fajita Bowl",
        ingredients: [
          "Chicken",
          "Bell Peppers",
          "Onions",
          "Black Beans",
          "Salsa",
          "Avocado",
        ],
      },
      {
        name: "Thai Green Curry with Chicken & Brown Rice",
        ingredients: [
          "Chicken",
          "Thai Green Curry",
          "Brown Rice",
          "Mixed Veggies",
        ],
      },
    ],
  },
};

const options = {
  gender: ["Male", "Female"],
  goal: [
    {
      title: "Weight Loss",
      description: "Reduce body fat and achieve a healthier, leaner physique.",
      focus:
        "Calorie deficit through a balanced meals - covering all valuable nutrition.",
    },
    {
      title: "Weight Gain",
      description: "Increase muscle mass and build greater strength.",
      focus:
        "Calorie surplus with protein-rich meals - covering all valuable nutrition.",
    },
    {
      title: "Maintenance",
      description: "Build some muscle and loose some fat at current weight.",
      focus:
        "Balanced intake to meet your energy needs - covering all valuable nutrition.",
    },
  ],
  activityStyle: [
    {
      title: "Dedicated Routine",
      description:
        "Have a proper timing for gym or specific training with pre & post workout meals.",
      goodFor: [
        "Improving Overall Health",
        "Effectively achieving fitness goals like building muscle mass, strength, endurance, and lose more fat in best way.",
      ],
    },
    {
      title: "Casual Activity",
      description:
        "Engage in gym or sports (cricket, badminton, etc.) or yoga / cardio / running etc when time allows.",
      goodFor: [
        "Improving Overall Health",
        "Gradually growing in your fitness journey while managing a stressful busy lifestyle.",
      ],
    },
    {
      title: "Light Activity",
      description:
        "Involves in light physical activities like walking, gentle yoga, or light stretching for 20-30 minutes a day.",
      goodFor: [
        "Gradually Improving Overall Health",
        "Staying Active, Improving Mobility while managing a stressful busy lifestyle.",
      ],
    },
  ],
  activityIntensity: [
    {
      title: "High Intensity",
      weightTraining:
        "Lifting heavy weights / Using machines at high settings (feel challenging for 6-8 repetitions).",
      cardio:
        "Very intense activities like sprinting, fast running, or high-intensity interval training (HIIT).",
      sports:
        "Playing competitive sports (like a serious game of football or Boxing Training).",
      rest: "Very short rest periods between sets.",
      speakingAbility:
        "Breathing is very heavy. You can likely only manage a few words at a time.",
    },
    {
      title: "Moderate Intensity",
      weightTraining:
        "Lifting moderate weights / Using machines at medium settings (feel challenging for 10-12 repetitions).",
      cardio:
        "Activities like brisk walking, jogging at a conversational pace, or moderately paced cycling.",
      sports:
        "Playing friendly sports with consistent movement (like a casual game of badminton, table tennis, or volleyball).",
      rest: "Moderate rest periods between sets.",
      speakingAbility:
        "You can speak in short sentences comfortably, but will need to pause to catch your breath.",
    },
    {
      title: "Low Intensity",
      weightTraining:
        "Lifting light weights / Using machines at low settings (can go for 15+ repetitions).",
      cardio: "Relaxed walking, leisurely cycling, or very light activity.",
      sports:
        "Leisurely activities like a slow walk, gentle stretching, gentle yoga or Pilates.",
      rest: "Longer rest periods between sets.",
      speakingAbility:
        "You can easily hold a full conversation without feeling winded.",
    },
  ],
  workoutTiming: ["Morning", "Evening"],
  // MODIFIED: Simplified diet options
  diet: ["Vegetarian", "Non-Vegetarian"],
};

function createCustomSelect(key, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  if (
    key === "goal" ||
    key === "activityStyle" ||
    key === "activityIntensity"
  ) {
    const grid = document.createElement("div");
    grid.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4";
    options[key].forEach((option) => {
      const card = document.createElement("div");
      card.className =
        "selection-card border-2 border-gray-200 rounded-lg p-4 text-left h-full flex flex-col";
      card.dataset.value = option.title;
      card.onclick = () => {
        container
          .querySelectorAll(".selection-card")
          .forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
        userData[key] = option.title;
      };

      let contentHTML = `
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="font-bold text-lg">${option.title}</h3>
                            <div class="radio-circle-outer w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                                <div class="radio-circle-inner w-3 h-3 rounded-full bg-primary"></div>
                            </div>
                        </div>`;

      if (key === "goal") {
        contentHTML += `<p class="text-sm text-gray-500 mb-4 flex-grow">${option.description}</p>
                        <div class="text-sm p-3 bg-gray-50 rounded-md mt-auto">
                            <p class="font-semibold flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1 inline-block text-primary" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd" /></svg>
                                Plan Focus on
                            </p>
                            <p class="text-gray-600 mt-1">${option.focus}</p>
                        </div>`;
      } else if (key === "activityStyle") {
        contentHTML += `<p class="text-sm text-gray-500 mb-4 flex-grow">${
          option.description
        }</p>
                         <div class="text-sm p-3 bg-gray-50 rounded-md mt-auto">
                            <p class="font-semibold flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1 inline-block text-primary" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.562 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.865.802V10.5z" /></svg>
                                Good For
                            </p>
                            <ul class="text-gray-600 mt-1 list-disc list-inside pl-2 space-y-1">${option.goodFor
                              .map((item) => `<li>${item}</li>`)
                              .join("")}</ul>
                        </div>`;
      } else if (key === "activityIntensity") {
        contentHTML += `
                        <div class="text-sm text-gray-600 space-y-3 flex-grow">
                            <p><strong class="font-semibold text-gray-700">Weight Training:</strong> ${option.weightTraining}</p>
                            <p><strong class="font-semibold text-gray-700">Cardio:</strong> ${option.cardio}</p>
                            <p><strong class="font-semibold text-gray-700">Sports/Activities:</strong> ${option.sports}</p>
                            <p><strong class="font-semibold text-gray-700">Rest:</strong> ${option.rest}</p>
                        </div>
                        <div class="text-sm p-3 bg-gray-50 rounded-md mt-4">
                            <p class="font-semibold flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1 inline-block text-primary" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clip-rule="evenodd" /></svg>
                                Speaking Ability at End
                            </p>
                            <p class="text-gray-600 mt-1">${option.speakingAbility}</p>
                        </div>`;
      }
      card.innerHTML = contentHTML;
      grid.appendChild(card);
    });
    container.appendChild(grid);
  } else {
    options[key].forEach((optionValue) => {
      const button = document.createElement("button");
      button.textContent = optionValue;
      button.dataset.value = optionValue;
      button.className =
        "custom-select-option w-full text-center text-lg p-3 border-2 border-gray-200 rounded-lg";
      button.onclick = () => {
        userData[key] = optionValue;
        container
          .querySelectorAll("button")
          .forEach((btn) => btn.classList.remove("selected"));
        button.classList.add("selected");
      };
      container.appendChild(button);
    });
  }
}

function handleActivityStyleChange() {
  userData.activityStyle = document.querySelector(
    "#activityStyle-options .selected"
  )?.dataset.value;
  const frequencyContent = document.getElementById("activityFrequency-content");
  let content = "";

  if (userData.activityStyle === "Dedicated Routine") {
    if (userData.activityDays.length === 0) {
      const today = new Date();
      for (let i = 0; i < 14; i++) {
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + i);
        const dayOfWeek = futureDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          userData.activityDays.push(i + 1);
        }
      }
    }
    content = `<label class="block text-lg font-medium text-gray-700 mb-4 text-center flex-shrink-0">Toggle your active/rest days.</label><div class="max-w-lg mx-auto w-full space-y-3">`;
    const today = new Date();
    const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
    const dayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });
    for (let i = 0; i < 14; i++) {
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + i);
      const dateString = `${monthFormatter.format(
        futureDate
      )} ${futureDate.getDate()}`;
      const dayString = dayFormatter.format(futureDate);
      const dayNumber = i + 1;
      const isActive = userData.activityDays.includes(dayNumber);
      content += `<div class="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"><div><span class="font-semibold">${dateString}</span><span class="text-gray-500 ml-2">${dayString}</span></div><label for="day-toggle-${dayNumber}" class="flex items-center cursor-pointer"><span class="rest-text mr-3 text-sm font-medium ${
        !isActive ? "text-primary" : "text-muted"
      }">Rest</span><div class="relative"><input type="checkbox" id="day-toggle-${dayNumber}" class="sr-only peer" ${
        isActive ? "checked" : ""
      } onchange="toggleDayState(${dayNumber}, this.checked)"><div class="w-14 h-8 rounded-full bg-gray-300 peer-checked:bg-[var(--primary-color)] transition-colors"></div><div class="absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform peer-checked:translate-x-6"></div></div><span class="active-text ml-3 text-sm font-medium ${
        isActive ? "text-primary" : "text-muted"
      }">Active</span></label></div>`;
    }
    content += `</div>`;
  } else if (userData.activityStyle === "Casual Activity") {
    const sessionValue = userData.activityFrequency || "";
    content = `<div class="flex-grow flex flex-col justify-center"><label for="casual-sessions" class="block text-lg font-medium text-gray-700 mb-2 text-center">How many sessions in 14 days?</label><input type="number" id="casual-sessions" min="1" value="${sessionValue}" class="w-full max-w-xs mx-auto text-center text-4xl font-bold border-x-0 border-t-0 border-b-2 border-gray-300 focus:border-[var(--primary-color)] focus:ring-0 bg-transparent" placeholder="4"></div>`;
  }
  frequencyContent.innerHTML = content;
}

function toggleDayState(dayNumber, isActive) {
  const dayIndex = userData.activityDays.indexOf(dayNumber);
  if (isActive) {
    if (dayIndex === -1) userData.activityDays.push(dayNumber);
  } else {
    if (dayIndex > -1) userData.activityDays.splice(dayIndex, 1);
  }
  userData.activityDays.sort((a, b) => a - b);
  const label = document
    .getElementById(`day-toggle-${dayNumber}`)
    .closest("label");
  const restText = label.querySelector(".rest-text");
  const activeText = label.querySelector(".active-text");
  restText.classList.toggle("text-primary", !isActive);
  restText.classList.toggle("text-muted", isActive);
  activeText.classList.toggle("text-primary", isActive);
  activeText.classList.toggle("text-muted", !isActive);
}

function navigateTo(screenId) {
  const oldScreenId = currentScreenId;
  currentScreenId = screenId;

  // Apply hide class to the old screen
  document
    .getElementById(oldScreenId)
    .classList.add(
      cardSequence.indexOf(oldScreenId.replace("-card", "")) <
        cardSequence.indexOf(screenId.replace("-card", ""))
        ? "hidden-left"
        : "hidden-right"
    );
  // Remove hide classes from the new screen
  document
    .getElementById(screenId)
    .classList.remove("hidden-left", "hidden-right");

  updateStepIndicators();

  const floatingButtons = document.getElementById("floating-buttons");
  const floatingLoadingBar = document.getElementById("floating-loading-bar");

  // Control visibility based on current screen and loading state
  if (screenId === "meal-plan-card") {
    if (isLoadingMeals) {
      floatingButtons.classList.add("hidden");
      // Ensure loading bar is visible if we are on meal-plan-card and still loading
      floatingLoadingBar.classList.remove("hidden");
      floatingLoadingBar.classList.add("visible");
    } else {
      floatingButtons.classList.add("hidden"); // Ensure hidden initially
      floatingLoadingBar.classList.add("hidden");
    }
  } else {
    floatingButtons.classList.add("hidden");
    floatingLoadingBar.classList.add("hidden");
  }
}

function saveStep(stepName) {
  const errorElement = document.getElementById(`${stepName}-error`);
  let value;
  let isValid = true;

  if (
    [
      "gender",
      "activityStyle",
      "activityIntensity",
      "workoutTiming",
      "diet",
      "goal",
    ].includes(stepName)
  ) {
    value = userData[stepName];
    if (!value) isValid = false;
  } else if (stepName === "activityFrequency") {
    const style = userData.activityStyle;
    if (style === "Dedicated Routine") {
      if (userData.activityDays.length === 0) isValid = false;
    } else if (style === "Casual Activity") {
      const input = document.getElementById("casual-sessions");
      value = input.value;
      if (!value || value <= 0 || value > 14) {
        isValid = false;
        errorElement.textContent = "Please enter a number between 1 and 14.";
      } else {
        userData.activityFrequency = value;
      }
    }
  } else {
    const inputElement = document.getElementById(stepName);
    value = inputElement.value;
    if (!value || (inputElement.type === "number" && value <= 0)) {
      isValid = false;
    } else {
      userData[stepName] = value;
    }
  }

  if (!isValid) {
    if (errorElement) errorElement.classList.remove("hidden");
    return;
  } else if (errorElement) {
    errorElement.classList.add("hidden");
  }

  if (isEditing) {
    isEditing = false;
    showSummary();
    return;
  }

  if (stepName === "diet") {
    showSummary();
    return;
  }

  const stepMap = {
    age: "gender-card",
    gender: "weight-card",
    weight: "height-card",
    height: "goal-card",
    goal: "activityStyle-card",
    activityStyle:
      userData.activityStyle === "Light Activity"
        ? "diet-card"
        : "activityFrequency-card",
    activityFrequency: "activityIntensity-card",
    activityIntensity:
      userData.activityStyle === "Dedicated Routine"
        ? "workoutTiming-card"
        : "diet-card",
    workoutTiming: "diet-card",
  };
  if (stepName === "activityStyle") handleActivityStyleChange();
  navigateTo(stepMap[stepName]);
}

function goBack(currentStepName) {
  // Added 'landing-card' to the backMap for the age screen
  const backMap = {
    age: "landing-card",
    gender: "age-card",
    weight: "gender-card",
    height: "weight-card",
    goal: "height-card",
    activityStyle: "goal-card",
    activityFrequency: "activityStyle-card",
    activityIntensity: "activityIntensity-card",
    workoutTiming: "activityIntensity-card",
    diet:
      userData.activityStyle === "Dedicated Routine"
        ? "workoutTiming-card"
        : userData.activityStyle === "Light Activity"
        ? "activityStyle-card"
        : "activityIntensity-card",
    summary: "diet-card",
  };
  navigateTo(backMap[currentStepName]);
}

function editStep(stepNameToEdit) {
  isEditing = true;
  if (stepNameToEdit === "activityFrequency") {
    handleActivityStyleChange();
  }
  navigateTo(`${stepNameToEdit}-card`);
}

function showSummary() {
  document.getElementById("summary-age").textContent = userData.age;
  document.getElementById("summary-gender").textContent = userData.gender;
  document.getElementById("summary-weight").textContent = userData.weight;
  document.getElementById("summary-height").textContent = userData.height;
  document.getElementById("summary-goal").textContent = userData.goal;
  document.getElementById("summary-activityStyle").textContent =
    userData.activityStyle;
  document.getElementById("summary-diet").textContent = userData.diet;

  const freqContainer = document.getElementById(
    "summary-activityFrequency-container"
  );
  const intensityContainer = document.getElementById(
    "summary-activityIntensity-container"
  );
  const timingContainer = document.getElementById(
    "summary-workoutTiming-container"
  );

  if (userData.activityStyle === "Light Activity") {
    [freqContainer, intensityContainer, timingContainer].forEach(
      (el) => (el.style.display = "none")
    );
  } else if (userData.activityStyle === "Casual Activity") {
    freqContainer.style.display = "flex";
    intensityContainer.style.display = "flex";
    timingContainer.style.display = "none";
    document.getElementById(
      "summary-activityFrequency"
    ).textContent = `${userData.activityFrequency} sessions`;
    document.getElementById("summary-activityIntensity").textContent =
      userData.activityIntensity;
  } else {
    // Dedicated
    [freqContainer, intensityContainer, timingContainer].forEach(
      (el) => (el.style.display = "flex")
    );
    document.getElementById(
      "summary-activityFrequency"
    ).textContent = `${userData.activityDays.length} active days`;
    document.getElementById("summary-activityIntensity").textContent =
      userData.activityIntensity;
    document.getElementById("summary-workoutTiming").textContent =
      userData.workoutTiming;
  }
  navigateTo("summary-card");
}

function updateStepIndicators() {
  const step1 = document.getElementById("step-indicator-1");
  const step2 = document.getElementById("step-indicator-2");
  const currentStepIndex = cardSequence.indexOf(
    currentScreenId.replace("-card", "")
  );
  const goalIndex = cardSequence.indexOf("goal");
  const summaryIndex = cardSequence.indexOf("summary");

  [step1, step2].forEach((s) => s.classList.remove("active", "complete"));
  // Hide header and step indicators on landing and final screens
  document.getElementById("header").style.display =
    currentScreenId.includes("landing") ||
    currentScreenId.includes("meal-plan") ||
    currentScreenId.includes("loading")
      ? "none"
      : "block";

  if (currentStepIndex < goalIndex) {
    step1.classList.add("active");
  } else if (currentStepIndex >= goalIndex && currentStepIndex < summaryIndex) {
    step1.classList.add("complete");
    step2.classList.add("active");
  } else if (currentStepIndex >= summaryIndex) {
    step1.classList.add("complete");
    step2.classList.add("complete");
  }
  document.querySelectorAll(".step-indicator").forEach((indicator) => {
    const number = indicator.querySelector(".step-number");
    const check = indicator.querySelector(".step-check");
    if (indicator.classList.contains("complete")) {
      number.classList.add("hidden");
      check.classList.remove("hidden");
    } else {
      number.classList.remove("hidden");
      check.classList.add("hidden");
    }
  });
}

function calculateDailyTargets() {
  navigateTo("loading-card");

  const {
    age,
    gender,
    weight,
    height,
    goal,
    activityStyle,
    activityDays,
    activityFrequency,
    activityIntensity,
  } = userData;

  let bmr;
  if (gender === "Male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }
  calculationResults.bmr = Math.round(bmr);

  const tdeeMultipliers = {
    "High Intensity": 1.9,
    "Moderate Intensity": 1.7,
    "Low Intensity": 1.5,
  };
  const dailyTDEEs = [];

  if (activityStyle === "Dedicated Routine") {
    const intensityMultiplier = tdeeMultipliers[activityIntensity];
    calculationResults.tdeeMultiplier = `Active: ${intensityMultiplier}x, Rest: 1.3x`;
    for (let i = 1; i <= 14; i++) {
      const multiplier = activityDays.includes(i) ? intensityMultiplier : 1.3;
      dailyTDEEs.push(bmr * multiplier);
    }
  } else {
    let avgMultiplier = 1.3;
    if (activityStyle === "Casual Activity") {
      const activeDaysCount = parseInt(activityFrequency);
      const restDaysCount = 14 - activeDaysCount;
      const intensityMultiplier = {
        "High Intensity": 1.8,
        "Moderate Intensity": 1.6,
        "Low Intensity": 1.4,
      }[activityIntensity];
      avgMultiplier =
        (intensityMultiplier * activeDaysCount + 1.3 * restDaysCount) / 14;
    }
    calculationResults.tdeeMultiplier = `~${avgMultiplier.toFixed(2)}x (Avg)`;
    for (let i = 0; i < 14; i++) {
      dailyTDEEs.push(bmr * avgMultiplier);
    }
  }

  const goalAdjustments = {
    "Weight Loss": -700,
    "Weight Gain": 700,
    Maintenance: 0,
  };
  const calorieAdjustment = goalAdjustments[goal];
  calculationResults.calorieAdjustment = calorieAdjustment;
  const dailyCalories = dailyTDEEs.map((tdee) => tdee + calorieAdjustment);

  // Updated Macro Ratios. Carbs/Fats were adjusted to make room for 5% "Other" nutrients.
  const macroRatios = {
    "Weight Loss": { p: 0.3, c: 0.4, f: 0.25, o: 0.05 }, // Renamed from Fat Loss
    "Weight Gain": { p: 0.2, c: 0.5, f: 0.25, o: 0.05 }, // Renamed from Muscle Gain, adjusted C from 0.55
    Maintenance: { p: 0.25, c: 0.4, f: 0.3, o: 0.05 }, // Adjusted C from 0.45
  };
  const goalKey =
    goal === "Weight Loss"
      ? "Weight Loss"
      : goal === "Weight Gain"
      ? "Weight Gain"
      : "Maintenance";
  const ratios = macroRatios[goalKey];
  calculationResults.macroRatio = ratios;

  calculationResults.dailyPlan = dailyCalories.map((calories) => ({
    calories: Math.round(calories),
    protein: Math.round((calories * ratios.p) / 4),
    carbs: Math.round((calories * ratios.c) / 4),
    fat: Math.round((calories * ratios.f) / 9),
    other: Math.round((calories * ratios.o) / 4), // Assuming 4 kcal/g for "Other" like fiber
  }));

  // Initialize mealPlan with basic structure, meal names will be loaded async
  calculationResults.mealPlan = calculationResults.dailyPlan.map(
    (day, dayIndex) => {
      const currentDayIndex = dayIndex + 1;
      let dayType = "rest";
      if (
        activityStyle === "Dedicated Routine" &&
        userData.activityDays.includes(currentDayIndex)
      ) {
        dayType =
          userData.workoutTiming === "Morning"
            ? "morningWorkout"
            : "eveningWorkout";
      }
      const goalKey =
        userData.goal === "Weight Loss"
          ? "Weight Loss"
          : userData.goal === "Weight Gain"
          ? "Weight Gain"
          : "Maintenance";
      const mealDistribution = getMealDistribution(dayType, goalKey);

      const meals = Object.keys(mealDistribution).map((mealSlotName) => {
        const mealCalories = day.calories * mealDistribution[mealSlotName];
        const mealTargets = {
          calories: Math.round(mealCalories),
          protein: Math.round(
            (mealCalories * calculationResults.macroRatio.p) / 4
          ),
          carbs: Math.round(
            (mealCalories * calculationResults.macroRatio.c) / 4
          ),
          fat: Math.round((mealCalories * calculationResults.macroRatio.f) / 9),
          other: Math.round(
            (mealCalories * calculationResults.macroRatio.o) / 4
          ),
        };
        return {
          mealSlot: mealSlotName,
          actuals: mealTargets,
          mealName: null, // Placeholder for AI-generated meal name
          ingredients: [], // Placeholder for AI-generated ingredients (will be empty)
        };
      });
      return { ...day, meals: meals };
    }
  );

  displayMealPlan(calculationResults.mealPlan); // Display the plan immediately with placeholders
  startMealNameGeneration(); // Start AI generation in background
}

function getMealDistribution(dayType, goalKey) {
  const mealDistributions = {
    morningWorkout: {
      "Weight Loss": {
        "Pre-Workout": 0.08,
        "Post-Workout": 0.22,
        Breakfast: 0.2,
        Lunch: 0.25,
        "Evening Snack": 0.1,
        Dinner: 0.15,
      },
      "Weight Gain": {
        "Pre-Workout": 0.1,
        "Post-Workout": 0.25,
        Breakfast: 0.2,
        Lunch: 0.25,
        "Evening Snack": 0.1,
        Dinner: 0.1,
      },
      Maintenance: {
        "Pre-Workout": 0.1,
        "Post-Workout": 0.2,
        Breakfast: 0.2,
        Lunch: 0.25,
        "Evening Snack": 0.1,
        Dinner: 0.15,
      },
    },
    eveningWorkout: {
      "Weight Loss": {
        Breakfast: 0.25,
        "Morning Snack": 0.1,
        Lunch: 0.25,
        "Pre-Workout": 0.08,
        "Post-Workout": 0.2,
        Dinner: 0.12,
      },
      "Weight Gain": {
        Breakfast: 0.2,
        "Morning Snack": 0.1,
        Lunch: 0.25,
        "Pre-Workout": 0.1,
        "Post-Workout": 0.25,
        Dinner: 0.1,
      },
      Maintenance: {
        Breakfast: 0.2,
        "Morning Snack": 0.1,
        Lunch: 0.25,
        "Pre-Workout": 0.1,
        "Post-Workout": 0.2,
        Dinner: 0.15,
      },
    },
    rest: {
      "Weight Loss": {
        Breakfast: 0.28,
        "Snack 1": 0.1,
        Lunch: 0.32,
        "Snack 2": 0.1,
        Dinner: 0.2,
      },
      "Weight Gain": {
        Breakfast: 0.24,
        "Snack 1": 0.12,
        Lunch: 0.26,
        "Snack 2": 0.14,
        Dinner: 0.24,
      },
      Maintenance: {
        Breakfast: 0.22,
        "Snack 1": 0.1,
        Lunch: 0.3,
        "Snack 2": 0.12,
        Dinner: 0.26,
      },
    },
  };
  return mealDistributions[dayType][goalKey];
}

async function startMealNameGeneration() {
  isLoadingMeals = true;
  abortController = new AbortController(); // Initialize AbortController
  const { signal } = abortController;

  const loadingBar = document.getElementById("floating-loading-bar");
  const loadingMessage = document.getElementById("loading-message");
  const floatingButtons = document.getElementById("floating-buttons");

  // Hide floating buttons and show loading bar
  floatingButtons.classList.add("hidden");
  loadingBar.classList.remove("hidden"); // CRITICAL: Ensure display is not 'none'
  loadingBar.classList.add("visible");

  try {
    // Generate meals for the first 7 days
    let allUsedMealNames = []; // Keep track of all meals used so far across days
    for (let i = 0; i < 7; i++) {
      if (signal.aborted) {
        // Check if cancelled
        console.log("Meal generation cancelled.");
        break;
      }
      loadingMessage.textContent = `Loading meals for Day ${i + 1}...`;
      console.log(`Starting meal generation for Day ${i + 1}`);
      const newlyGeneratedMeals = await fetchMealNamesForDay(
        i,
        signal,
        allUsedMealNames
      ); // Pass used meals
      newlyGeneratedMeals.forEach((meal) =>
        allUsedMealNames.push(meal.mealName)
      ); // Add new meals to the used list
      mealNamesLoaded[i] = true;
      console.log(`Finished meal generation for Day ${i + 1}`);
      updateMealPlanDisplayForDay(i); // Update UI for the loaded day
    }

    // Reuse meals for days 8-14
    for (let i = 7; i < 14; i++) {
      if (signal.aborted) {
        // Check if cancelled
        console.log("Meal generation cancelled.");
        break;
      }
      loadingMessage.textContent = `Reusing meals from Day ${
        i - 7 + 1
      } for Day ${i + 1}...`;
      console.log(`Reusing meal plan from Day ${i - 7 + 1} for Day ${i + 1}`);
      calculationResults.mealPlan[i].meals.forEach((meal, mealIndex) => {
        meal.mealName =
          calculationResults.mealPlan[i - 7].meals[mealIndex].mealName;
        // No need to copy ingredients as they are no longer generated/displayed
        meal.ingredients = []; // Ensure it's empty
      });
      mealNamesLoaded[i] = true;
      updateMealPlanDisplayForDay(i); // Update UI for the reused day
    }
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("Fetch aborted by user.");
    } else {
      console.error("Error during meal generation:", error);
    }
  } finally {
    isLoadingMeals = false;
    // Hide loading bar and show floating buttons, unless cancelled and already reset
    if (!signal.aborted) {
      loadingBar.classList.add("hidden"); // Hide it again when done
      loadingBar.classList.remove("visible");
      loadingMessage.textContent = "";
      floatingButtons.classList.remove("hidden");
      console.log("All meal names loaded!");
    } else {
      // If aborted, resetForm would have already handled UI, just ensure loading bar is hidden
      loadingBar.classList.add("hidden");
      loadingBar.classList.remove("visible");
    }
    abortController = null; // Clear controller
  }
}

async function fetchMealNamesForDay(dayIndex, signal, mealsAlreadyUsed) {
  // Added mealsAlreadyUsed parameter
  const dayData = calculationResults.mealPlan[dayIndex];
  const dietPreference = userData.diet === "No Preference" ? "" : userData.diet;
  const activityLevel = userData.activityStyle;
  const goal = userData.goal;

  // Get available premium meal names for the current slot and diet
  const availablePremiumMeals = {};
  for (const mealSlot in premiumIndianMeals) {
    if (premiumIndianMeals[mealSlot][dietPreference]) {
      availablePremiumMeals[mealSlot] = premiumIndianMeals[mealSlot][
        dietPreference
      ].map((m) => m.name);
    }
  }

  const mealDetailsForPrompt = dayData.meals
    .map((meal) => {
      // Get a list of typical ingredients for the meal slot and diet preference
      // This is still useful for the AI to understand the *type* of meal, even if quantities aren't returned.
      const typicalIngredients =
        premiumIndianMeals[meal.mealSlot]?.[dietPreference]?.find(
          (m) => m.name === meal.mealName
        )?.ingredients || [];

      return `{
                    "mealSlot": "${meal.mealSlot}",
                    "mealName": "${meal.mealName || "Not yet selected"}",
                    "targetCalories": ${meal.actuals.calories},
                    "targetProtein": ${meal.actuals.protein},
                    "targetCarbs": ${meal.actuals.carbs},
                    "targetFat": ${meal.actuals.fat},
                    "typicalIngredients": [${typicalIngredients
                      .map((ing) => `"${ing}"`)
                      .join(", ")}]
                }`;
    })
    .join(",\n");

  // MODIFIED PROMPT: Removed instructions for generating ingredient quantities
  const prompt = `Generate a list of unique, premium, healthy, and well-known Indian meal names for the following meal slots and their nutritional targets for a person with a ${dietPreference} diet, ${activityLevel} activity style, and a ${goal} goal.

            For each meal slot, first, try to select a meal name directly from the following list of premium Indian meals available for that slot and dietary preference. If a suitable unique meal from the list cannot be found or if more variety is needed, you may generate a *similar type* of premium, healthy Indian meal that aligns with the style and ingredients of the provided examples.

            Crucially, ensure that the selected meal names are **distinct and not repeated** across any meal slot within the current day, and also **not repeated** from the list of previously used meal names provided below. Aim for maximum variety across the entire 7-day plan.

            Available Premium Indian Meals by Slot (${dietPreference}):
            ${JSON.stringify(availablePremiumMeals, null, 2)}

            Previously Used Meal Names (avoid these for new selections):
            ${JSON.stringify(mealsAlreadyUsed, null, 2)}

            Meal Slots and Targets:
            [${mealDetailsForPrompt}]

            Output Format:
            [
                {
                    "mealSlot": "Breakfast",
                    "mealName": "Protein-Packed Oatmeal Bowl"
                },
                {
                    "mealSlot": "Lunch",
                    "mealName": "Grilled Chicken with Quinoa & Veggies"
                }
            ]
            `;

  let chatHistory = [];
  chatHistory.push({ role: "user", parts: [{ text: prompt }] });
  const payload = {
    contents: chatHistory,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            mealSlot: { type: "STRING" },
            mealName: { type: "STRING" },
          },
          propertyOrdering: ["mealSlot", "mealName"],
        },
      },
    },
  };
  const apiKey = "AIzaSyB87ocU01RKnCfI_DlGcL_jjfSZLxik19E"; // Canvas will automatically provide this
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: signal, // Pass the signal here
    });
    const result = await response.json();

    if (
      result.candidates &&
      result.candidates.length > 0 &&
      result.candidates[0].content &&
      result.candidates[0].content.parts &&
      result.candidates[0].content.parts.length > 0
    ) {
      const jsonString = result.candidates[0].content.parts[0].text;
      const parsedMeals = JSON.parse(jsonString);

      // Update the meal names in calculationResults.mealPlan
      parsedMeals.forEach((aiMeal) => {
        const mealToUpdate = dayData.meals.find(
          (m) => m.mealSlot === aiMeal.mealSlot
        );
        if (mealToUpdate) {
          mealToUpdate.mealName = aiMeal.mealName;
          mealToUpdate.ingredients = []; // Explicitly ensure ingredients array is empty
        }
      });
      return parsedMeals; // Return newly generated meals for tracking
    } else {
      console.error(
        "AI response structure unexpected or content missing:",
        result
      );
      // Fallback to generic names if AI fails
      dayData.meals.forEach((meal) => {
        meal.mealName = `${meal.mealSlot} (AI Failed)`;
        meal.ingredients = []; // Ensure it's empty
      });
      return []; // Return empty array on failure
    }
  } catch (error) {
    if (error.name === "AbortError") {
      console.warn(`Fetch for Day ${dayIndex + 1} aborted.`);
      // Do not mark as error, just let the process stop
    } else {
      console.error(
        `Error fetching meal names for Day ${dayIndex + 1}:`,
        error
      );
      // Fallback to generic names on error
      dayData.meals.forEach((meal) => {
        meal.mealName = `${meal.mealSlot} (Error)`;
        meal.ingredients = []; // Ensure it's empty
      });
    }
    throw error; // Re-throw to be caught by startMealNameGeneration's try/catch
  }
}

function displayMealPlan(plan) {
  navigateTo("meal-plan-card");
  const profilePanel = document.getElementById("profile-summary-panel");
  let activityDetails = "";
  if (userData.activityStyle === "Dedicated Routine") {
    activityDetails = `(${userData.activityDays.length} active days, ${userData.activityIntensity}, ${userData.workoutTiming} workouts)`;
  } else if (userData.activityStyle === "Casual Activity") {
    activityDetails = `(${userData.activityFrequency} sessions, ${userData.activityIntensity})`;
  }

  const ratios = calculationResults.macroRatio;

  const profileHTML = `
                <div class="space-y-3 text-sm text-gray-700">
                    <div class="p-3 bg-gray-50 rounded-lg">
                        <p class="font-semibold text-gray-500">Physical</p>
                        <p>${userData.gender}, ${userData.age} years, ${userData.weight}kg, ${userData.height}cm</p>
                    </div>
                    <div class="p-3 bg-gray-50 rounded-lg">
                        <p class="font-semibold text-gray-500">Goal</p>
                        <p>${userData.goal}</p>
                    </div>
                    <div class="p-3 bg-gray-50 rounded-lg">
                        <p class="font-semibold text-gray-500">Activity</p>
                        <p>${userData.activityStyle}</p>
                        <p class="text-xs text-gray-500">${activityDetails}</p>
                    </div>
                    <div class="p-3 bg-gray-50 rounded-lg">
                        <p class="font-semibold text-gray-500">Diet</p>
                        <p>${userData.diet}</p>
                    </div>
                </div>
            `;

  const calculationBreakdownHTML = `
                 <div class="space-y-3 text-sm text-gray-700">
                    <div class="p-3 bg-gray-50 rounded-lg">
                       <p class="font-semibold text-gray-500">BMR (Basal Metabolic Rate)</p>
                       <p>${calculationResults.bmr} kcal</p>
                    </div>
                    <div class="p-3 bg-gray-50 rounded-lg">
                       <p class="font-semibold text-gray-500">TDEE Multiplier</p>
                       <p>${calculationResults.tdeeMultiplier}</p>
                    </div>
                    <div class="p-3 bg-gray-50 rounded-lg">
                       <p class="font-semibold text-gray-500">Goal Adjustment</p>
                       <p>${
                         calculationResults.calorieAdjustment > 0 ? "+" : ""
                       }${calculationResults.calorieAdjustment} kcal/day</p>
                    </div>
                    <div class="p-3 bg-gray-50 rounded-lg">
                       <p class="font-semibold text-gray-500">Macro Ratio (P/C/F/O)</p>
                       <p>${ratios.p * 100}% / ${ratios.c * 100}% / ${
    ratios.f * 100
  }% / ${ratios.o * 100}%</p>
                    </div>
                </div>
            `;

  profilePanel.innerHTML = `
                <div class="accordion-item">
                    <button class="accordion-header flex justify-between items-center w-full text-left py-2">
                        <h3 class="text-xl font-bold text-gray-800">Your Profile</h3>
                        <svg class="w-5 h-5 transition-transform transform lg:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                    <div class="accordion-content hidden lg:block overflow-hidden">
                        <div class="pt-2">${profileHTML}</div>
                    </div>
                </div>
                <div class="accordion-item mt-4 pt-4 border-t">
                    <button class="accordion-header flex justify-between items-center w-full text-left py-2">
                        <h3 class="text-lg font-bold text-gray-800">How We Calculated</h3>
                        <svg class="w-5 h-5 transition-transform transform lg:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                    <div class="accordion-content hidden lg:block overflow-hidden">
                        <div class="pt-2">${calculationBreakdownHTML}</div>
                    </div>
                </div>
            `;

  profilePanel.querySelectorAll(".accordion-header").forEach((button) => {
    button.addEventListener("click", () => {
      if (window.innerWidth < 1024) {
        const content = button.nextElementSibling;
        const icon = button.querySelector("svg");
        content.classList.toggle("hidden");
        icon.classList.toggle("rotate-180");
      }
    });
  });

  const planHeader = document.getElementById("plan-header");
  const goal = userData.goal;
  const planTitle = `Here is your 2 Week Personalized ${goal} Plan`;
  const futureDate = new Date();
  futureDate.setDate(new Date().getDate() + 14);
  const formattedFutureDate = futureDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  let predictionMessage = "";
  if (goal === "Maintenance") {
    predictionMessage = "You'll not face any significant weight change.";
  } else {
    const action = goal === "Weight Loss" ? "Lose" : "Gain";
    predictionMessage = `You'll ${action} 1-2 kg by ${formattedFutureDate}.`;
  }

  const { activityStyle, activityFrequency, activityDays, activityIntensity } =
    userData;
  let workoutDescription = "";
  if (activityStyle === "Light Activity") {
    workoutDescription = `You selected <strong>Light Activity</strong>. Following this routine helps gradually improve overall health and mobility while managing a busy lifestyle. Consistency is key!`;
  } else if (activityStyle === "Casual Activity") {
    workoutDescription = `You selected <strong>Casual Activity</strong>, with <strong>${activityFrequency} sessions</strong> over 14 days at a <strong>${activityIntensity}</strong>. This approach is great for gradually growing in your fitness journey while managing a stressful lifestyle.`;
  } else if (activityStyle === "Dedicated Routine") {
    workoutDescription = `You selected a <strong>Dedicated Routine</strong> with <strong>${activityDays.length} active days</strong> at a <strong>${activityIntensity}</strong>. This structured plan is the most effective way to build muscle, increase strength, and lose fat.`;
  }

  planHeader.innerHTML = `
                <h2 class="text-2xl md:text-3xl font-bold text-gray-800">${planTitle}</h2>
                <p class="mt-2 text-md text-green-700 font-semibold">${predictionMessage}</p>
                <p class="mt-1 text-sm text-gray-500">Please generate a new plan every 2 weeks with your new physical info for best results.</p>
                
                <div class="accordion-item mt-6 py-2 border-y border-gray-200">
                    <button class="accordion-header flex justify-between items-center w-full text-left py-2">
                        <h3 class="text-lg font-semibold text-gray-800">Tips to Achieve Your Target</h3>
                        <svg class="w-5 h-5 transition-transform transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                    <div class="accordion-content hidden overflow-hidden">
                        <div class="pt-2 space-y-4 text-sm text-gray-600">
                            <div class="flex items-start">
                                <span class="text-2xl mr-3">🏋️‍♂️</span>
                                <div>
                                    <p class="font-semibold text-gray-700">Stick to the workout plan you chose:</p>
                                    <p class="mt-1">${workoutDescription}</p>
                                </div>
                            </div>
                            <div class="flex items-start">
                                <span class="text-2xl mr-3">💧</span>
                                <div>
                                    <p class="font-semibold text-gray-700">Drink 2.5–3L of water daily:</p>
                                    <p class="mt-1">Proper hydration helps keep energy levels stable, supports digestion, and maintains a healthy metabolism.</p>
                                </div>
                            </div>
                            <div class="flex items-start">
                                <span class="text-2xl mr-3">😴</span>
                                <div>
                                    <p class="font-semibold text-gray-700">Sleep 7–8 hours regularly:</p>
                                    <p class="mt-1">Consistent sleep keeps hunger, energy, and stress in check — crucial for long-term body weight and health stability.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

  planHeader
    .querySelector(".accordion-header")
    .addEventListener("click", () => {
      const content = planHeader.querySelector(".accordion-content");
      const icon = planHeader.querySelector(".accordion-header svg");
      content.classList.toggle("hidden");
      icon.classList.toggle("rotate-180");
    });

  // Initial rendering of day cards with placeholders
  const container = document.getElementById("meal-plan-list");
  container.innerHTML = "";
  plan.forEach((day, index) => {
    const futureDate = new Date();
    futureDate.setDate(new Date().getDate() + index);
    const dateString = `Day ${index + 1}: ${futureDate.toLocaleDateString(
      "en-US",
      { weekday: "short", month: "long", day: "numeric" }
    )}`;

    let dayTypeBadge = "";
    if (userData.activityStyle === "Dedicated Routine") {
      const isActivityDay = userData.activityDays.includes(index + 1);
      if (isActivityDay) {
        dayTypeBadge = `<span class="text-xs font-semibold bg-green-100 text-green-800 px-2 py-1 rounded-full">Active Day</span>`;
      } else {
        dayTypeBadge = `<span class="text-xs font-semibold bg-gray-200 text-gray-700 px-2 py-1 rounded-full">Rest Day</span>`;
      }
    }

    const dayCard = document.createElement("div");
    dayCard.id = `day-card-${index}`; // Add ID for easy update
    dayCard.className =
      "day-card bg-white p-4 rounded-lg shadow-md cursor-pointer";
    dayCard.innerHTML = `
                    <div class="flex justify-between items-start mb-3">
                        <h4 class="font-bold text-lg">${dateString}</h4>
                        <div class="flex flex-col items-end space-y-1">
                             <p class="text-sm text-gray-500">${day.meals.length} meals</p>
                             ${dayTypeBadge}
                        </div>
                    </div>
                    <div class="flex justify-between items-center bg-primary-light p-3 rounded-lg">
                         <div>
                            <p class="text-xs text-primary-dark">Total Calories</p>
                            <p class="font-bold text-xl text-primary">${day.calories} kcal</p>
                         </div>
                         <div class="text-xs text-right">
                            <p>P: <span class="font-semibold">${day.protein}g</span> | C: <span class="font-semibold">${day.carbs}g</span></p>
                            <p>F: <span class="font-semibold">${day.fat}g</span> | O: <span class="font-semibold">${day.other}g</span></p>
                         </div>
                    </div>
                `;
    dayCard.onclick = () => showMealModal(day, futureDate, index); // Pass day index
    container.appendChild(dayCard);
  });
}

// Function to update a single day's display after meals are loaded
function updateMealPlanDisplayForDay(dayIndex) {
  const dayCard = document.getElementById(`day-card-${dayIndex}`);
  if (dayCard) {
    // If the modal for this day is open, refresh its content to show loaded meal names
    const modal = document.getElementById("meal-modal");
    if (
      modal.classList.contains("visible") &&
      modal.dataset.dayIndex === String(dayIndex)
    ) {
      const currentDayData = calculationResults.mealPlan[dayIndex];
      const futureDate = new Date();
      futureDate.setDate(new Date().getDate() + dayIndex);
      showMealModal(currentDayData, futureDate, dayIndex);
    }
  }
}

function showMealModal(dayData, date, dayIndex) {
  const modal = document.getElementById("meal-modal");
  const title = document.getElementById("modal-title");
  const body = document.getElementById("modal-body");
  modal.dataset.dayIndex = dayIndex; // Store current day index in modal for updates

  title.textContent = `Nutritional Targets for ${date.toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric" }
  )}`;

  let content = `<div class="space-y-4 pt-3 border-t">`;
  dayData.meals.forEach((meal) => {
    const mealNamePart =
      mealNamesLoaded[dayIndex] && meal.mealName
        ? `<span class="ml-2 font-normal text-gray-700">- ${meal.mealName}</span>`
        : `<span class="small-loader"></span>`;

    // Removed ingredientsList generation and inclusion
    content += `<div class="p-3 bg-gray-50 rounded-lg">
                                <p class="font-bold text-lg text-primary-color flex items-center">
                                    ${meal.mealSlot} ${mealNamePart}
                                </p>
                                <div class="grid grid-cols-5 text-center text-sm my-2 gap-1">
                                    <div><p class="font-semibold">${meal.actuals.calories}</p><p class="text-xs text-muted-color">kcal</p></div>
                                    <div><p class="font-semibold">${meal.actuals.protein}g</p><p class="text-xs text-muted-color">Protein</p></div>
                                    <div><p class="font-semibold">${meal.actuals.carbs}g</p><p class="text-xs text-muted-color">Carbs</p></div>
                                    <div><p class="font-semibold">${meal.actuals.fat}g</p><p class="text-xs text-muted-color">Fat</p></div>
                                    <div><p class="font-semibold">${meal.actuals.other}g</p><p class="text-xs text-muted-color">Other</p></div>
                                </div>
                            </div>`;
  });
  content += `</div>`;
  body.innerHTML = content;
  modal.classList.add("visible");
}

function closeMealModal() {
  document.getElementById("meal-modal").classList.remove("visible");
}
function openSavePlanModal() {
  document.getElementById("save-plan-modal").classList.add("visible");
}
function closeSavePlanModal() {
  document.getElementById("save-plan-modal").classList.remove("visible");
}

function checkSaveFormValidity() {
  const name = document.getElementById("user-name").value;
  const email = document.getElementById("user-email").value;
  const interest = document.querySelector(
    'input[name="delivery-interest"]:checked'
  );
  const downloadBtn = document.getElementById("download-pdf-btn");
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  downloadBtn.disabled = !(name && isEmailValid && interest);
}

function downloadMealPlanPDF() {
  const doc = new jsPDF();
  const plan = calculationResults.mealPlan;
  const today = new Date();
  const userName = document.getElementById("user-name").value;

  // --- Header Function ---
  const addHeader = (doc) => {
    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.text(
      `14-Day Nutritional Plan for ${userName}`,
      doc.internal.pageSize.getWidth() / 2,
      15,
      { align: "center" }
    );
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(
      `Generated on: ${today.toLocaleDateString()}`,
      doc.internal.pageSize.getWidth() / 2,
      22,
      { align: "center" }
    );
  };

  // --- Footer Function ---
  const addFooter = (doc, pageNum, pageCount) => {
    doc.setFontSize(8);
    doc.setFont(undefined, "italic");
    const footerText =
      "Nutritional Scale – Eat like it’s designed for you — because it is";
    const textWidth =
      (doc.getStringUnitWidth(footerText) * doc.internal.getFontSize()) /
      doc.internal.scaleFactor;
    const x = (doc.internal.pageSize.getWidth() - textWidth) / 2;
    doc.text(footerText, x, doc.internal.pageSize.getHeight() - 10);
    doc.text(
      `Page ${pageNum} of ${pageCount}`,
      doc.internal.pageSize.getWidth() - 25,
      doc.internal.pageSize.getHeight() - 10
    );
  };

  addHeader(doc);

  // --- Profile Summary ---
  let yPos = 30;
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("Your Profile & Choices:", 14, yPos);
  yPos += 6;

  let activityDetails = "";
  if (userData.activityStyle === "Dedicated Routine") {
    activityDetails = `(${userData.activityDays.length} active days, ${userData.activityIntensity}, ${userData.workoutTiming} workouts)`;
  } else if (userData.activityStyle === "Casual Activity") {
    activityDetails = `(${userData.activityFrequency} sessions, ${userData.activityIntensity})`;
  }

  const profileText = [
    `Physical: ${userData.gender}, ${userData.age} years, ${userData.weight}kg, ${userData.height}cm`,
    `Goal: ${userData.goal}`,
    `Diet: ${userData.diet}`,
    `Activity: ${userData.activityStyle} ${activityDetails}`,
  ];
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text(profileText, 14, yPos);
  yPos += profileText.length * 5 + 10;

  // --- Tips Section ---
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.text("Tips to Achieve Your Target:", 14, yPos);
  yPos += 6;

  let workoutDescription = "";
  if (userData.activityStyle === "Light Activity") {
    workoutDescription = `You selected Light Activity. Following this routine helps gradually improve overall health and mobility while managing a busy lifestyle. Consistency is key!`;
  } else if (userData.activityStyle === "Casual Activity") {
    workoutDescription = `You selected Casual Activity, with ${userData.activityFrequency} sessions over 14 days at a ${userData.activityIntensity}. This approach is great for gradually growing in your fitness journey.`;
  } else if (userData.activityStyle === "Dedicated Routine") {
    workoutDescription = `You selected a Dedicated Routine with ${userData.activityDays.length} active days at a ${userData.activityIntensity}. This structured plan is the most effective way to build muscle, increase strength, and lose fat.`;
  }

  const tips = [
    {
      title: "Stick to the workout plan you chose:",
      content: workoutDescription,
    },
    {
      title: "Drink 2.5–3L of water daily:",
      content:
        "Proper hydration helps keep energy levels stable, supports digestion, and maintains a healthy metabolism.",
    },
    {
      title: "Sleep 7–8 hours regularly:",
      content:
        "Consistent sleep keeps hunger, energy, and stress in check — crucial for long-term body weight and health stability.",
    },
  ];

  const maxWidth = doc.internal.pageSize.getWidth() - 28; // max width with margins
  doc.setFontSize(10);
  tips.forEach((tip) => {
    doc.setFont(undefined, "bold");
    doc.text(tip.title, 14, yPos);
    yPos += 5;
    doc.setFont(undefined, "normal");
    const splitContent = doc.splitTextToSize(tip.content, maxWidth);
    doc.text(splitContent, 14, yPos);
    yPos += splitContent.length * 5 + 3;
  });
  yPos += 5;

  // --- Meal Plan Table ---
  const tableData = [];
  plan.forEach((day, index) => {
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + index);
    const dateString = `Day ${index + 1}: ${futureDate.toLocaleDateString(
      "en-US",
      { weekday: "long", month: "short", day: "numeric" }
    )}`;

    tableData.push([
      {
        content: `${dateString} | Total: ${day.calories} kcal`,
        colSpan: 6,
        styles: {
          fontStyle: "bold",
          fillColor: "#e6f2e6",
          textColor: "#006400",
        },
      },
    ]);

    day.meals.forEach((meal) => {
      // Display both meal slot and AI-generated name if available
      const mealName =
        mealNamesLoaded[index] && meal.mealName
          ? `${meal.mealSlot} - ${meal.mealName}`
          : meal.mealSlot;
      tableData.push([
        { content: mealName, styles: { fontStyle: "bold" } },
        `${meal.actuals.calories} kcal`,
        `${meal.actuals.protein}g`,
        `${meal.actuals.carbs}g`,
        `${meal.actuals.fat}g`,
        `${meal.actuals.other}g`,
      ]);
      // Removed ingredient rows from PDF generation
    });
  });

  doc.autoTable({
    head: [["Meal", "Calories", "Protein", "Carbs", "Fat", "Other"]],
    body: tableData,
    startY: yPos,
    didDrawPage: function (data) {
      if (data.pageNumber > 1) {
        addHeader(doc);
      }
      addFooter(doc, data.pageNumber, doc.internal.getNumberOfPages());
    },
    margin: { top: 30, bottom: 15 },
    styles: { fontSize: 9, cellPadding: 2, valign: "middle" },
    headStyles: {
      fillColor: [0, 100, 0],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 },
    },
  });

  // Add footer to the first page if there's only one page
  if (doc.internal.getNumberOfPages() === 1) {
    addFooter(doc, 1, 1);
  }

  doc.save(`${userName}-Nutritional-Plan.pdf`);
  closeSavePlanModal();
}

function resetForm() {
  // Signal to abort any ongoing fetches
  if (abortController) {
    abortController.abort();
  }

  // Clear all user data
  Object.keys(userData).forEach((key) => {
    if (Array.isArray(userData[key])) userData[key] = [];
    else userData[key] = null;
  });
  isEditing = false;
  mealNamesLoaded.fill(false); // Reset meal loading state
  isLoadingMeals = false; // Reset global loading flag

  // Clear input fields
  cardSequence.slice(0, 10).forEach((stepName) => {
    const input = document.getElementById(stepName);
    if (input) input.value = "";
  });

  // Deselect all custom options
  document
    .querySelectorAll(".selection-card, .custom-select-option")
    .forEach((el) => {
      el.classList.remove("selected");
    });

  // Clear save plan modal fields
  document.getElementById("user-name").value = "";
  document.getElementById("user-email").value = "";
  document
    .querySelectorAll('input[name="delivery-interest"]')
    .forEach((radio) => (radio.checked = false));
  document
    .querySelectorAll(".delivery-option-card")
    .forEach((card) => card.classList.remove("selected"));
  checkSaveFormValidity();

  // Hide loading bar and show floating buttons (if they were hidden)
  document.getElementById("floating-loading-bar").classList.add("hidden");
  document.getElementById("floating-buttons").classList.remove("hidden"); // Ensure buttons are visible if they should be

  // Navigate back to the landing screen using navigateTo for consistent transitions
  navigateTo("landing-card");
  closeConfirmationModal(); // Ensure confirmation modal is closed
}

// Custom Confirmation Modal Functions
let currentConfirmCallback = null;

function openConfirmationModal(message, onConfirm) {
  const modal = document.getElementById("confirmation-modal");
  const messageElement = document.getElementById("confirmation-message");
  const confirmButton = document.getElementById("confirm-action-btn");

  messageElement.textContent = message;
  currentConfirmCallback = onConfirm; // Store the callback

  // Remove any old event listener
  confirmButton.removeEventListener("click", handleConfirmClick);
  // Add new event listener
  confirmButton.addEventListener("click", handleConfirmClick);

  modal.classList.add("visible");
}

function handleConfirmClick() {
  if (currentConfirmCallback) {
    currentConfirmCallback(); // Execute the stored callback
  }
  closeConfirmationModal(); // Close modal after action
}

function closeConfirmationModal() {
  document.getElementById("confirmation-modal").classList.remove("visible");
  currentConfirmCallback = null; // Clear the callback
}

window.onload = () => {
  createCustomSelect("gender", "gender-options");
  createCustomSelect("goal", "goal-options");
  createCustomSelect("activityStyle", "activityStyle-options");
  createCustomSelect("activityIntensity", "activityIntensity-options");
  createCustomSelect("workoutTiming", "workoutTiming-options");
  // Modified: Only Vegetarian and Non-Vegetarian options
  options.diet = ["Vegetarian", "Non-Vegetarian"];
  createCustomSelect("diet", "diet-options");

  document
    .getElementById("user-name")
    .addEventListener("input", checkSaveFormValidity);
  document
    .getElementById("user-email")
    .addEventListener("input", checkSaveFormValidity);

  document.querySelectorAll(".delivery-option-card").forEach((card) => {
    card.addEventListener("click", () => {
      document
        .querySelectorAll(".delivery-option-card")
        .forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      document.getElementById(
        card.dataset.value === "Yes" ? "delivery-yes" : "delivery-no"
      ).checked = true;
      checkSaveFormValidity();
    });
  });

  // Call resetForm to ensure initial state is clean and landing page is displayed correctly
  resetForm();
};
