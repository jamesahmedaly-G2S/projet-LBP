// LBP-CLIENT-10/11 : vocabulaire des notifications.
//
// Deux jeux de libellés pour un même "kind", pour deux écrans différents :
// - `NOTIFICATION_KIND_LABEL` (court, "Actu") -- badge au-dessus de chaque
//   notification reçue (app/(client)/notifications/NotificationsList.tsx).
// - Le libellé long ci-dessous ("Nouvelle actualité RH & Paie (Décrypt)")
//   -- phrase descriptive de l'écran "Mes notifications" (Mon compte),
//   porté 1:1 depuis `NOTIF_TYPES` (LBP_V9.9_Studio.html, identique dans
//   les 3 versions du prototype disponibles -- LBP_V2-20.html,
//   LBP_V6_Studio.html -- une donnée stable, pas un artefact obsolète).
//
// `CAHIER_NOTIFICATION_KINDS` : les 7 types réels du cahier [§1.11, p.12-13].
// Seul "actu" a un déclencheur réel aujourd'hui (`notifyAllClients()` dans
// app/(studio)/administration/actu/actions.ts) ; les 6 autres sont de
// vraies préférences enregistrables, mais rien ne les déclenche encore
// (référentiel/quiz/assistance non branchés sur STU-WORKFLOW-07, relance/
// récapitulatif jamais construits) -- honnête plutôt que simulé, même
// principe que `BREVO_API_KEY` absente pour la veille
// (lib/studio/monitoring-notifications.ts).
//
// `EXTRA_NOTIFICATION_KINDS` : les 4 types réels supplémentaires que ce
// projet a effectivement câblés (chiffres-paie/dictionnaire/offres/
// calendrier-rh, STU-WORKFLOW-07), absents de `NOTIF_TYPES` -- ces modules
// eux-mêmes sont postérieurs et hors des 13 modules écrits du cahier,
// jamais ajoutés à cet écran dans le prototype. Ajoutés ici pour qu'un
// client puisse réellement régler la préférence de tout ce qui lui
// parvient, pas seulement ce que couvre la liste d'origine.
export const CAHIER_NOTIFICATION_KINDS = [
  { key: "actu", label: "Nouvelle actualité RH & Paie (Décrypt)", wired: true },
  { key: "referentiel", label: "Nouveau thème ou nouvelle fiche ajoutés", wired: false },
  {
    key: "maj-legale-fiche",
    label: "Mise à jour légale d'une fiche que je consulte",
    wired: false,
  },
  { key: "quiz", label: "Nouveau quizz disponible", wired: false },
  { key: "assistance", label: "Réponse de l'assistance LBP", wired: false },
  { key: "relance-formation", label: "Relance formation selon mes scores de quizz", wired: false },
  { key: "recap-mensuel", label: "Récapitulatif mensuel des évolutions", wired: false },
] as const;

export const EXTRA_NOTIFICATION_KINDS = [
  { key: "chiffres-paie", label: "Chiffres Paie", wired: true },
  { key: "dictionnaire", label: "Dictionnaire", wired: true },
  { key: "offres", label: "Offres", wired: true },
  { key: "calendrier-rh", label: "Calendrier RH", wired: true },
] as const;

export const NOTIFICATION_PREFERENCE_GROUPS = [
  { title: "Types du cahier des charges", items: CAHIER_NOTIFICATION_KINDS },
  { title: "Autres modules du LBP Client", items: EXTRA_NOTIFICATION_KINDS },
];

export const ALL_NOTIFICATION_KINDS = [...CAHIER_NOTIFICATION_KINDS, ...EXTRA_NOTIFICATION_KINDS];

// Badge court de l'historique des notifications (NotificationsList.tsx) --
// une seule source, jamais une deuxième copie de cette table.
export const NOTIFICATION_KIND_LABEL: Record<string, string> = {
  "chiffres-paie": "Chiffres Paie",
  dictionnaire: "Dictionnaire",
  offres: "Offres",
  actu: "Actu",
  "calendrier-rh": "Calendrier RH",
};

export type NotificationChannel = "none" | "lbp" | "mail" | "both";

// Porté 1:1 depuis chan() (LBP_V9.9_Studio.html) -- ordre des options
// compris.
export const NOTIFICATION_CHANNEL_LABEL: Record<NotificationChannel, string> = {
  none: "Ne pas recevoir",
  lbp: "Dans le LBP",
  mail: "Par e-mail",
  both: "LBP + e-mail",
};

export const NOTIFICATION_CHANNELS: NotificationChannel[] = ["none", "lbp", "mail", "both"];

export const DEFAULT_NOTIFICATION_CHANNEL: NotificationChannel = "lbp";
