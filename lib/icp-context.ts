export interface ICPDocument {
  id?: string;
  user_id?: string;
  company_name?: string | null;
  industry?: string | null;
  product_description?: string | null;
  target_job_titles?: string[] | null;
  target_company_size?: string | null;
  target_industries?: string[] | null;
  geographies?: string[] | null;
  pain_points?: string[] | null;
  value_propositions?: string[] | null;
  objections?: string[] | null;
  buying_triggers?: string[] | null;
  competitors?: string[] | null;
  tone_of_voice?: string | null;
  existing_channels?: string[] | null;
  monthly_budget?: string | null;
  completion_pct?: number;
  ai_summary?: string | null;
}

export function buildICPContextString(doc: ICPDocument | null): string {
  if (!doc || (doc.completion_pct ?? 0) === 0) return "";

  const lines: string[] = [];
  if (doc.company_name) lines.push(`Företag: ${doc.company_name}`);
  if (doc.industry) lines.push(`Bransch: ${doc.industry}`);
  if (doc.product_description) lines.push(`Produkt/tjänst: ${doc.product_description}`);
  if (doc.target_job_titles?.length) lines.push(`Målpersona jobbtitlar: ${doc.target_job_titles.join(", ")}`);
  if (doc.target_company_size) lines.push(`Målföretagens storlek: ${doc.target_company_size}`);
  if (doc.geographies?.length) lines.push(`Geografi: ${doc.geographies.join(", ")}`);
  if (doc.pain_points?.length) lines.push(`Pain points: ${doc.pain_points.join("; ")}`);
  if (doc.value_propositions?.length) lines.push(`Värdepropositioner: ${doc.value_propositions.join("; ")}`);
  if (doc.objections?.length) lines.push(`Vanliga invändningar: ${doc.objections.join("; ")}`);
  if (doc.buying_triggers?.length) lines.push(`Köputlösare: ${doc.buying_triggers.join("; ")}`);
  if (doc.competitors?.length) lines.push(`Konkurrenter: ${doc.competitors.join(", ")}`);
  if (doc.tone_of_voice) lines.push(`Tone of voice: ${doc.tone_of_voice}`);
  if (doc.monthly_budget) lines.push(`Marknadsföringsbudget: ${doc.monthly_budget}`);

  if (lines.length === 0) return "";

  return `─────────────────────────────────────────────────
KONTEXT OM ANVÄNDAREN (ICP-DOKUMENT, ${doc.completion_pct ?? 0}% komplett):
${lines.join("\n")}
─────────────────────────────────────────────────

Använd ovanstående kontext om användaren för att anpassa alla svar, texter och strategier till deras specifika situation. Referera till deras bransch, målgrupp och pain points när det är relevant.`;
}

export function computeCompletionPct(doc: Partial<ICPDocument>): number {
  const fields = [
    doc.company_name,
    doc.industry,
    doc.product_description,
    doc.target_job_titles?.length,
    doc.target_company_size,
    doc.geographies?.length,
    doc.pain_points?.length,
    doc.value_propositions?.length,
    doc.tone_of_voice,
    doc.competitors?.length,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}
