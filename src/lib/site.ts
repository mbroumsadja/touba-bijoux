/**
 * Adresse publique du site (domaine validé dans Google Search Console), sans « / » final.
 * NEXT_PUBLIC_SITE_URL a la priorité ; à défaut, le domaine de production en production, localhost en développement.
 */
const fallback = process.env.NODE_ENV === 'production' ? 'https://touba-bijoux.com' : 'http://localhost:3000';
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || fallback).replace(/\/+$/, '');
