"use client";

import { useActionState, useState, useTransition, type ReactNode } from "react";
import { saveTeamMember, deleteTeamMember } from "./actions";
import { TextField, SelectField } from "@/ui-kit/Field";
import { Button } from "@/ui-kit/Button";
import { Modal } from "@/ui-kit/Modal";
import { fnv1aIndex } from "@/lib/hash";
import { AVATAR_COUNT, avatarSrc } from "@/lib/client/avatars";
import { Plus, SquarePen, Trash2 } from "lucide-react";
import styles from "./org-tree.module.css";

export interface TeamMember {
  id: string;
  name: string;
  job_title: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  manager_id: string | null;
  avatar_index: number;
}

// LBP-CLIENT-02 : organigramme réel.
//
// Correctif fidélité (04/10/2026), suite à un retour de l'utilisateur
// ("compare mot pour mot") : libellés et placeholders réels du modal
// `personEditor` (`LBP_V9.9_Studio.html` ~L12249-12258) -- "Nom &
// prénom" (pas "Nom"), "Service / équipe" (pas "Service"), "E-mail" (pas
// "Email"), "Rattaché(e) à (responsable)" (pas "Rattaché à"), plus les
// placeholders d'exemple ("Ex. Camille Moreau", etc.), jamais portés.
// État vide complété avec sa deuxième phrase ("Cliquez sur « + Ajouter
// une personne ».") -- tronquée avant ce correctif.
//
// Correctif (04/10/2026 bis), suite à un retour de l'utilisateur ("le
// contenu et la longueur à l'intérieur ça ne match pas avec la v9") :
// le vrai `openPersonEditor()` (~L10195-10208) ouvre le modal
// `#personEditor`, jamais un formulaire déployé en permanence dans la
// carte -- `MemberForm` déplacé dans un `Modal` (`ui-kit/Modal.tsx`), la
// carte "Organisation" reste donc de hauteur constante, éditée ou non.
//
// Correctif (04/10/2026 ter), suite à un nouveau retour de l'utilisateur
// ("ajouter une personne est bien entourée par un bandeau aussi, et il y
// a Camille Moreau avec un avatar") : les personnes étaient rendues en
// ligne plate (`flex` nu), jamais le vrai `.org-card` (~L690,
// `renderEquipe()` ~L10188) -- une carte avec un fond pastel
// (`orgTint(id)`, hash déterministe par personne, ~L10180-10181, palette
// `ORG_TINTS` portée 1:1) et un avatar rond 58px (`avatarHTML(p.avatar,
// 58)`). Reconstruit en carte centrée avec teinte + avatar ; les lignes
// de connexion du vrai arbre horizontal (`.org-tree`, pseudo-éléments
// CSS ~L679-689) restent en revanche une simplification assumée --
// hiérarchie rendue par imbrication/indentation verticale, jamais
// tentée en CSS pur.
//
// Correctif (04/10/2026 quinquies), suite au retour de l'utilisateur
// ("vraiment je suis dessus (...) regarde bien sur la v9 et sois fidèle
// à ce qui y figure") : rendu le prototype réel directement dans un
// navigateur (`file://`, le fichier est autonome) pour comparer
// pixel-perfect plutôt que de recomposer depuis le seul code source --
// deux erreurs trouvées :
// 1) "+ Ajouter une personne" avait été transformé en tuile pointillée
//    dans la même rangée que les personnes lors du correctif précédent
//    -- une mauvaise lecture. `getBoundingClientRect()` sur le vrai
//    prototype confirme que ce bouton est bien un enfant du même
//    `.dash-card` que la liste (`margin-top:16px`, EN DESSOUS, pas à
//    côté), en `.btn-primary` (fond framboise plein), jamais une tuile
//    pointillée à côté des cartes. Remis à sa place réelle.
// 2) "Aucune source réelle de 124 images" (décision d'origine de ce
//    fichier) était une erreur : les 124 avatars (`var AVATARS`,
//    ~L10175) sont des images réelles, encodées en base64 inline dans
//    le même fichier HTML -- jamais remarqué jusqu'ici. Extraits en
//    fichiers statiques (`public/avatars/0.jpg`..`123.jpg`,
//    `lib/client/avatars.ts`), `avatar_index` ajouté à `team_members`
//    (migration 20261004160000). Sélecteur d'avatar ajouté au modal
//    (`.av-grid`/`.av-pick`, ~L697-706, grille scrollable 52px/cercle),
//    le cercle à l'initiale du nom est retiré -- il n'était qu'un pis-
//    aller pour une "absence de source" qui n'en était pas une.
const ORG_TINTS = [
  "#EDF2E6",
  "#E7EEF4",
  "#EFEAF3",
  "#FBEFE4",
  "#FBF3D9",
  "#E9F1F0",
  "#F3ECE6",
  "#E8EFEA",
  "#F1ECF5",
  "#EAF0F5",
];

function orgTint(id: string): string {
  return ORG_TINTS[fnv1aIndex(id, ORG_TINTS.length)];
}

// Passe fidélité mesurée (06/10/2026, `renderEquipe()` ~L10182 +
// `.org-tree`/`.org-card` ~L679-696) : arbre centré avec connecteurs
// (org-tree.module.css) au lieu d'une liste indentée ; `.org-card` rayon
// 14px, padding 12px 16px 10px, ombre --shadow-sm ; `.org-p` (poste)
// 12px 800 carbone (pas framboise) ; actions = 3 icônes 13px
// (modifier / ajouter un collaborateur / supprimer) révélées au survol,
// pas des liens texte ; état vide 13.5px --ink-soft ; bouton `.btn
// .btn-primary` avec icône `plus` 15px, mt 16px.
type Editing = { member: TeamMember | null; managerId: string | null } | null;

const orgActClass =
  "inline-flex items-center rounded-[6px] p-1 leading-none text-[#6B656B] hover:bg-[#F5F0EC] hover:text-ink";

export default function TeamSection({ members }: { members: TeamMember[] }) {
  const [editing, setEditing] = useState<Editing>(null);
  const [, startTransition] = useTransition();

  const roots = members.filter((m) => !m.manager_id);

  function renderNode(member: TeamMember): ReactNode {
    const children = members.filter((m) => m.manager_id === member.id);
    const info = [member.department, member.email, member.phone].filter(Boolean).join(" · ");
    return (
      <li key={member.id}>
        <div
          className={`${styles.card} inline-block max-w-[200px] min-w-[150px] rounded-[14px] border border-[#DED9DB] px-4 pt-3 pb-2.5 text-center shadow-[0_10px_26px_-20px_rgba(68,80,104,0.22)]`}
          style={{ background: orgTint(member.id) }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- asset statique hors /public/next, taille fixe connue */}
          <img
            src={avatarSrc(member.avatar_index)}
            alt=""
            className="mx-auto h-[58px] w-[58px] rounded-full object-cover"
          />
          <div className="mt-1.5 text-[13.5px] leading-[1.2] font-extrabold text-ink">
            {member.name}
          </div>
          <div className="mt-0.5 text-xs font-extrabold text-[#445068]">
            {member.job_title ?? ""}
          </div>
          {info && (
            <div className="mt-1 text-[10.5px] leading-[1.35] break-words text-[#6B656B]">
              {info}
            </div>
          )}
          <div className={`${styles.acts} mt-2 flex justify-center gap-3`}>
            <button
              type="button"
              aria-label="Modifier"
              className={orgActClass}
              onClick={() => setEditing({ member, managerId: member.manager_id })}
            >
              <SquarePen className="h-[13px] w-[13px]" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Ajouter un collaborateur"
              className={orgActClass}
              onClick={() => setEditing({ member: null, managerId: member.id })}
            >
              <Plus className="h-[13px] w-[13px]" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Supprimer"
              className={orgActClass}
              onClick={() => {
                if (!confirm("Supprimer cette personne de l'organigramme ?")) return;
                startTransition(() => deleteTeamMember(member.id));
              }}
            >
              <Trash2 className="h-[13px] w-[13px]" aria-hidden="true" />
            </button>
          </div>
        </div>
        {children.length > 0 && <ul>{children.map(renderNode)}</ul>}
      </li>
    );
  }

  return (
    <div>
      {roots.length === 0 ? (
        <p className="text-[13.5px] text-[#6B656B]">
          Aucune personne pour le moment. Cliquez sur « + Ajouter une personne ».
        </p>
      ) : (
        <div className={styles.tree}>
          <ul>{roots.map(renderNode)}</ul>
        </div>
      )}

      <button
        type="button"
        onClick={() => setEditing({ member: null, managerId: null })}
        className="mt-4 inline-flex items-center gap-[7px] rounded-full bg-primary px-[18px] py-[9px] text-[12.5px] leading-none font-bold whitespace-nowrap text-white transition duration-150 hover:-translate-y-px hover:bg-primary-hover"
      >
        <Plus className="h-[15px] w-[15px]" aria-hidden="true" /> Ajouter une personne
      </button>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.member ? "Modifier la personne" : "Ajouter une personne"}
      >
        {editing && (
          <MemberForm
            member={editing.member}
            defaultManagerId={editing.managerId}
            members={members}
            onDone={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}

function MemberForm({
  member,
  defaultManagerId,
  members,
  onDone,
}: {
  member: TeamMember | null;
  defaultManagerId: string | null;
  members: TeamMember[];
  onDone: () => void;
}) {
  const [avatarIndex, setAvatarIndex] = useState(member?.avatar_index ?? 0);
  const [error, formAction, pending] = useActionState(async (prev: string | null, fd: FormData) => {
    const result = await saveTeamMember(prev, fd);
    if (!result) onDone();
    return result;
  }, null);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {member && <input type="hidden" name="id" value={member.id} />}
      <input type="hidden" name="avatar_index" value={avatarIndex} />

      <label className="text-sm font-medium text-muted">Choisir un avatar</label>
      <div className="mb-1 grid max-h-[180px] grid-cols-8 gap-2 overflow-y-auto p-0.5">
        {Array.from({ length: AVATAR_COUNT }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setAvatarIndex(i)}
            aria-label={`Avatar ${i + 1}`}
            className={`h-[46px] w-[46px] overflow-hidden rounded-full border-2 transition-transform hover:-translate-y-0.5 ${
              avatarIndex === i ? "border-primary ring-2 ring-primary-soft" : "border-transparent"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- grille de 124 miniatures, un <Image> par vignette serait disproportionné */}
            <img src={avatarSrc(i)} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      <TextField
        label="Nom & prénom"
        name="name"
        defaultValue={member?.name}
        placeholder="Ex. Camille Moreau"
        required
      />
      <div className="flex flex-wrap gap-2">
        <TextField
          label="Poste"
          name="job_title"
          defaultValue={member?.job_title ?? ""}
          placeholder="Ex. Directrice RH"
          className="w-40"
        />
        <TextField
          label="Service / équipe"
          name="department"
          defaultValue={member?.department ?? ""}
          placeholder="Ex. Direction"
          className="w-40"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <TextField
          label="E-mail"
          name="email"
          type="email"
          defaultValue={member?.email ?? ""}
          placeholder="prenom.nom@…"
          className="w-48"
        />
        <TextField
          label="Téléphone"
          name="phone"
          defaultValue={member?.phone ?? ""}
          placeholder="01 …"
          className="w-32"
        />
      </div>
      <SelectField
        label="Rattaché(e) à (responsable)"
        name="manager_id"
        defaultValue={defaultManagerId ?? ""}
      >
        <option value="">— Aucun (haut de l&apos;organigramme)</option>
        {members
          .filter((m) => m.id !== member?.id)
          .map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
      </SelectField>
      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "..." : "Enregistrer"}
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Annuler
        </Button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </form>
  );
}
