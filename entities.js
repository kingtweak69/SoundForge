/* Compatibility shim — entities now come from the local store. */
export { db as default, db } from '@/lib/localdb';
export { User } from '@/lib/localdb';
