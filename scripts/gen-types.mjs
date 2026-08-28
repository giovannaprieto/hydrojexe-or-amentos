/**
 * Gera types/database.ts (formato Supabase) a partir do schema OpenAPI do PostgREST.
 *
 * Uso:  node --env-file=.env.local scripts/gen-types.mjs
 *        (ou: npm run gen:types)
 *
 * Não precisa de `supabase login`: usa SUPABASE_SERVICE_ROLE_KEY do .env.local.
 * Alternativa oficial (requer login):
 *   npx supabase gen types typescript --project-id <ID> --schema public > types/database.ts
 */
import fs from "node:fs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !service) {
  console.error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (use --env-file=.env.local).");
  process.exit(1);
}

const res = await fetch(`${url}/rest/v1/`, {
  headers: { apikey: service, Authorization: `Bearer ${service}` },
});
if (!res.ok) {
  console.error("Falha ao ler o schema:", res.status, res.statusText);
  process.exit(1);
}
const spec = await res.json();
const defs = spec.definitions ?? {};
const paths = spec.paths ?? {};

const unmapped = new Set();
function escalar(f) {
  if (f.includes("int") || f === "numeric" || f === "double precision" || f === "real" || f === "money") return "number";
  if (f === "boolean") return "boolean";
  if (f === "json" || f === "jsonb") return "Json";
  if (
    f === "uuid" || f === "text" || f.startsWith("character") || f.startsWith("varchar") ||
    f.startsWith("timestamp") || f === "date" || f.startsWith("time") || f === "bytea" ||
    f === "bpchar" || f.startsWith("bit") || f === "inet" || f === "cidr" || f === "citext" ||
    f === "name" || f === "interval"
  ) return "string";
  unmapped.add(f);
  return "string";
}
function tsType(prop) {
  const f = (prop.format ?? "").toLowerCase();
  if (f.endsWith("[]")) return `${escalar(f.slice(0, -2))}[]`;
  return escalar(f);
}

function fkOf(prop) {
  const m = (prop.description ?? "").match(/<fk table='([^']+)' column='([^']+)'\/>/);
  return m ? { table: m[1], column: m[2] } : null;
}

const tableNames = Object.keys(defs).sort();
const tableBlocks = tableNames.map((name) => {
  const props = defs[name].properties ?? {};
  const required = new Set(defs[name].required ?? []);
  const row = [];
  const ins = [];
  const upd = [];
  const rels = [];

  for (const col of Object.keys(props)) {
    const p = props[col];
    const base = tsType(p);
    const nullable = !required.has(col);
    const t = nullable ? `${base} | null` : base;
    row.push(`          ${col}: ${t}`);
    const insOptional = Object.prototype.hasOwnProperty.call(p, "default") || nullable;
    ins.push(`          ${col}${insOptional ? "?" : ""}: ${t}`);
    upd.push(`          ${col}?: ${t}`);
    const fk = fkOf(p);
    if (fk) {
      rels.push(
        `        {\n` +
        `          foreignKeyName: "${name}_${col}_fkey"\n` +
        `          columns: ["${col}"]\n` +
        `          isOneToOne: false\n` +
        `          referencedRelation: "${fk.table}"\n` +
        `          referencedColumns: ["${fk.column}"]\n` +
        `        }`,
      );
    }
  }

  return (
    `      ${name}: {\n` +
    `        Row: {\n${row.join("\n")}\n        }\n` +
    `        Insert: {\n${ins.join("\n")}\n        }\n` +
    `        Update: {\n${upd.join("\n")}\n        }\n` +
    `        Relationships: [\n${rels.join(",\n")}${rels.length ? "\n" : ""}        ]\n` +
    `      }`
  );
});

const fnNames = Object.keys(paths).filter((p) => p.startsWith("/rpc/")).map((p) => p.slice(5)).sort();
const fnBlocks = fnNames.map((fn) => {
  const returns = fn === "is_admin" ? "boolean" : "unknown";

  // PostgREST expõe os argumentos da função em definitions["(rpc) <fn>"].
  const argsDef = defs[`(rpc) ${fn}`];
  let args = "Record<PropertyKey, never>";
  if (argsDef && argsDef.properties && Object.keys(argsDef.properties).length) {
    const required = new Set(argsDef.required ?? []);
    const linhas = Object.entries(argsDef.properties).map(([nome, p]) => {
      const opcional = required.has(nome) ? "" : "?";
      return `          ${nome}${opcional}: ${tsType(p)}`;
    });
    args = `{\n${linhas.join("\n")}\n        }`;
  } else if (fn !== "is_admin") {
    // função com args não descritos: não travar a chamada
    args = "Record<string, unknown>";
  }

  return `      ${fn}: {\n        Args: ${args}\n        Returns: ${returns}\n      }`;
});

const out = `/**
 * Tipos do banco Supabase — schema \`public\`.
 * GERADO por scripts/gen-types.mjs a partir do OpenAPI do PostgREST. Não editar à mão.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
${tableBlocks.join("\n")}
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
${fnBlocks.join("\n")}
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"]
`;

fs.writeFileSync("types/database.ts", out);
console.log(`OK: types/database.ts — ${tableNames.length} tabelas, ${fnNames.length} funcoes`);
if (unmapped.size) console.log("AVISO formatos nao mapeados (assumidos como string):", [...unmapped]);
