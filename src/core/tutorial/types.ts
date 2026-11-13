// Tutorial: la guía de primeros pasos (las notas del maestro) y los consejos de una sola vez.

export interface TutorialReward {
  gold?: number;
  materials?: { id: string; qty: number }[];
}

/** Un paso de la guía: se cumple solo cuando el jugador lo hace (en cualquier orden). */
export interface TutorialStepDef {
  id: string;
  title: string;
  /** Lo que dice el maestro para explicar el paso. */
  text: string;
  /** Lo que dice al cumplirlo. */
  done: string;
  reward: TutorialReward;
}

/** Un consejo que aparece la primera vez que se entra a un sistema. */
export interface TipDef {
  id: string;
  title: string;
  text: string;
}

export interface TutorialState {
  /** La guía de primeros pasos está activa. */
  guide: boolean;
  /** Pasos cumplidos. */
  done: string[];
  /** Consejos ya vistos. */
  tips: string[];
}
