// TheMealDB devuelve categorías y países en inglés. El valor original se usa para consultar la API;
// estos diccionarios solo cambian lo que se muestra en pantalla.
const categories: Record<string, string> = {
  Beef: "Res", Breakfast: "Desayunos", Chicken: "Pollo", Dessert: "Postres", Goat: "Cabra",
  Lamb: "Cordero", Miscellaneous: "Variadas", Pasta: "Pasta", Pork: "Cerdo", Seafood: "Mariscos",
  Side: "Guarniciones", Starter: "Entradas", Vegan: "Vegano", Vegetarian: "Vegetariano",
};

const areas: Record<string, string> = {
  American: "Estados Unidos", British: "Reino Unido", Canadian: "Canadá", Chinese: "China",
  Croatian: "Croacia", Dutch: "Países Bajos", Egyptian: "Egipto", Filipino: "Filipinas",
  French: "Francia", Greek: "Grecia", Indian: "India", Irish: "Irlanda", Italian: "Italia",
  Jamaican: "Jamaica", Japanese: "Japón", Kenyan: "Kenia", Malaysian: "Malasia", Mexican: "México",
  Moroccan: "Marruecos", Polish: "Polonia", Portuguese: "Portugal", Russian: "Rusia", Spanish: "España",
  Thai: "Tailandia", Tunisian: "Túnez", Turkish: "Turquía", Ukrainian: "Ucrania", Uruguayan: "Uruguay",
  Vietnamese: "Vietnam", Algerian: "Argelia", Argentinian: "Argentina", Norwegian: "Noruega",
  "Saudi Arabian": "Arabia Saudita", Slovakian: "Eslovaquia", Syrian: "Siria", Venezulan: "Venezuela",
  Venezuelan: "Venezuela", Libyan: "Libia", Lebanese: "Líbano",
};

export const tCategory = (name: string) => categories[name] ?? name;
export const tArea = (name: string) => areas[name] ?? name;

// Las recetas están en inglés; con esto, buscar "pollo" o "pastel" también encuentra resultados.
const words: Record<string, string> = {
  pollo: "chicken", res: "beef", carne: "beef", cerdo: "pork", cordero: "lamb", pescado: "fish",
  salmon: "salmon", camaron: "shrimp", camarones: "shrimp", atun: "tuna", pasta: "pasta",
  pastel: "cake", tarta: "pie", ensalada: "salad", sopa: "soup", arroz: "rice", huevo: "egg",
  huevos: "egg", papa: "potato", papas: "potato", queso: "cheese", chocolate: "chocolate",
  pan: "bread", galletas: "cookies", pizza: "pizza", hamburguesa: "burger", curry: "curry",
  frijoles: "beans", verduras: "vegetable", tomate: "tomato", cebolla: "onion", ajo: "garlic",
  limon: "lemon", manzana: "apple", platano: "banana", coco: "coconut", champinones: "mushroom",
};

const strip = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function toEnglishQuery(query: string) {
  return query
    .trim()
    .split(/\s+/)
    .map((word) => words[strip(word.toLowerCase())] ?? word)
    .join(" ");
}
