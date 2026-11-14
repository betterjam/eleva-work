/**
 * The free trial lives in the app, not here: the landing only leads to it. The person proves their email there
 * (a code, or Google), names their organization and enters it at once.
 */
export const TRIAL_URL = (process.env.NEXT_PUBLIC_ELEVA_TRIAL ?? 'https://app.eleva.school/prueba-gratis?sitio=works').replace(/\/+$/, '');
