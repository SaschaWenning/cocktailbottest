// lib/cocktail-machine.ts
// Diese Datei enthält clientseitige Funktionen, die mit dem Backend interagieren oder Operationen simulieren.

import type { Cocktail } from "@/types/cocktail"
import { ingredients } from "@/data/ingredients" // Annahme: Zutaten-Daten sind clientseitig verfügbar
import type { PumpConfig } from "@/types/pump"

// Simuliert die Zubereitung eines Cocktails, indem Pumpen für automatische Zutaten "aktiviert" werden.
// In einer echten Anwendung würde dies eine Server-API-Route aufrufen.
export async function makeCocktail(cocktail: Cocktail, pumpConfig: PumpConfig[], selectedSize: number): Promise<void> {
  const currentTotalVolume = cocktail.recipe.reduce((total, item) => total + item.amount, 0);
  const scaleFactor = selectedSize / currentTotalVolume;

  for (const item of cocktail.recipe) {
    if (item.type === 'automatic') {
      const amountToDispense = Math.round(item.amount * scaleFactor);
      console.log(`Bereite vor, ${amountToDispense}ml von ${item.ingredientId} (automatisch) auszugeben`);

      const pumpInfo = pumpConfig.find(pc => pc.ingredientId === item.ingredientId);
      if (!pumpInfo) {
        console.warn(`Keine Pumpenkonfiguration für automatische Zutat gefunden: ${item.ingredientId}. Überspringe.`);
        continue;
      }

      const ingredientData = ingredients.find(ing => ing.id === item.ingredientId);
      if (!ingredientData || ingredientData.flowRate === undefined) {
        console.warn(`Durchflussrate für Zutat nicht gefunden: ${item.ingredientId}. Kann nicht ausgeben.`);
        continue;
      }

      const dispenseTimeMs = amountToDispense * ingredientData.flowRate;
      console.log(`Simuliere Pumpenaktivierung für ${item.ingredientId} an GPIO Pin ${pumpInfo.gpioPin} für ${dispenseTimeMs}ms`);

      // Simuliere API-Aufruf zur Pumpenaktivierung
      // In einer echten App: await fetch('/api/gpio/activate-pump', { method: 'POST', body: JSON.stringify({ pin: pumpInfo.gpioPin, duration: dispenseTimeMs }) });
      await new Promise((resolve) => setTimeout(resolve, dispenseTimeMs));
    } else {
      console.log(`Manuelle Zutat: ${item.amount}ml ${item.ingredientId}. Benutzer wird hinzufügen.`);
      if (item.instruction) {
        console.log(`Anleitung für manuelle Zutat: ${item.instruction}`);
      }
    }
  }
}

// Simuliert das Speichern eines Rezepts. In einer echten App würde dies eine Server-API-Route aufrufen.
export async function saveRecipe(cocktail: Cocktail): Promise<void> {
  console.log("Speichere Rezept (simuliert):", cocktail);
  // In einer echten App: await fetch('/api/recipes', { method: 'POST', body: JSON.stringify(cocktail) });
  return new Promise((resolve) => setTimeout(resolve, 500));
}

// Simuliert das Löschen eines Rezepts. In einer echten App würde dies eine Server-API-Route aufrufen.
export async function deleteRecipe(cocktailId: string): Promise<void> {
  console.log("Lösche Rezept (simuliert):", cocktailId);
  // In einer echten App: await fetch(`/api/recipes/${cocktailId}`, { method: 'DELETE' });
  return new Promise((resolve) => setTimeout(resolve, 500));
}

// Simuliert das Abrufen aller Cocktails. In einer echten App würde dies eine Server-API-Route aufrufen.
// Für v0 geben wir ein Mock-Cocktail zurück, der dem neuen Typ entspricht.
export async function getAllCocktails(): Promise<Cocktail[]> {
  console.log("Hole alle Cocktails (simuliert)");
  return new Promise((resolve) => setTimeout(() => resolve([
    {
      id: "mock-cocktail-1",
      name: "Mocktail mit Anleitung",
      description: "Ein Test-Cocktail mit automatischen und manuellen Zutaten.",
      image: "/placeholder.svg?height=200&width=400",
      alcoholic: false,
      ingredients: ["100ml Wasser (automatisch)", "50ml Sirup (automatisch)", "200ml Cola (manuell)"],
      recipe: [
        { ingredientId: "water", amount: 100, type: 'automatic', instruction: '' },
        { ingredientId: "simple_syrup", amount: 50, type: 'automatic', instruction: '' },
        { ingredientId: "cola", amount: 200, type: 'manual', instruction: 'Mit Cola auffüllen' },
      ],
    },
  ]), 500));
}

// Simuliert das Abrufen der Pumpenkonfiguration. In einer echten App würde dies eine Server-API-Route aufrufen.
// Für v0 geben wir eine Mock-Konfiguration zurück.
export async function getPumpConfig(): Promise<PumpConfig[]> {
  console.log("Hole Pumpenkonfiguration (simuliert)");
  return new Promise((resolve) => setTimeout(() => resolve([
    { ingredientId: "water", gpioPin: 17, flowRate: 100 },
    { ingredientId: "simple_syrup", gpioPin: 27, flowRate: 50 },
    // Weitere simulierte Pumpenkonfigurationen hier
  ]), 500));
}
