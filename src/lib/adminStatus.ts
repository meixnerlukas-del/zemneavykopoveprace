export type ProfileStatus =
  | "FREE"
  | "PENDING_PAYMENT"
  | "PENDING_CONTENT"
  | "PUBLISHED"
  | "EXPIRED"
  | "SUSPENDED";

export const STATUS_ORDER: ProfileStatus[] = [
  "FREE",
  "PENDING_PAYMENT",
  "PENDING_CONTENT",
  "PUBLISHED",
  "EXPIRED",
  "SUSPENDED",
];

export const STATUS_LABEL: Record<ProfileStatus, string> = {
  FREE: "Voľný",
  PENDING_PAYMENT: "Čaká na platbu",
  PENDING_CONTENT: "Čaká na podklady",
  PUBLISHED: "Publikovaný",
  EXPIRED: "Expirovaný",
  SUSPENDED: "Pozastavený",
};

export const STATUS_COLOR: Record<ProfileStatus, string> = {
  FREE: "#C4C2BC",
  PENDING_PAYMENT: "#F2B01E",
  PENDING_CONTENT: "#F2B01E",
  PUBLISHED: "#2E7D32",
  EXPIRED: "#9E9E9E",
  SUSPENDED: "#C62828",
};
