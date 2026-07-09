/**
 * CRM contact lookups. CRM is the source of truth for guest identity
 * (name, email, phone, country, passport) — Master Trips only has flat
 * lookup fields for a subset of these, missing Country entirely.
 */
import { asString, getRecordsByIds, type AirtableRecord } from "./airtable";
import { CRM, TABLES } from "./schema";

export type CrmContact = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  country: string;
  passport: string;
  notes: string;
};

const FIELDS = [
  CRM.fullName,
  CRM.firstName,
  CRM.lastName,
  CRM.phone,
  CRM.email,
  CRM.country,
  CRM.passport,
  CRM.notes,
];

function toContact(r: AirtableRecord): CrmContact {
  return {
    id: r.id,
    fullName: asString(r.fields[CRM.fullName]),
    firstName: asString(r.fields[CRM.firstName]),
    lastName: asString(r.fields[CRM.lastName]),
    phone: asString(r.fields[CRM.phone]),
    email: asString(r.fields[CRM.email]),
    country: asString(r.fields[CRM.country]),
    passport: asString(r.fields[CRM.passport]),
    notes: asString(r.fields[CRM.notes]),
  };
}

export async function getCrmContacts(ids: string[]): Promise<CrmContact[]> {
  const records = await getRecordsByIds(TABLES.CRM, ids, FIELDS);
  return records.map(toContact);
}

export async function getCrmContact(id: string): Promise<CrmContact | null> {
  if (!id) return null;
  const [contact] = await getCrmContacts([id]);
  return contact ?? null;
}
